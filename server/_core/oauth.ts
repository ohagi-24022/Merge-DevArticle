import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";
import type { OAuthUserInfo } from "./types/oauthTypes";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getRequestOrigin(req: Request): string {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto =
    (typeof forwardedProto === "string"
      ? forwardedProto.split(",")[0]?.trim()
      : req.protocol) || "https";
  const host = req.get("host");
  return `${proto}://${host}`;
}

function decodeState(state: string): string {
  return Buffer.from(state, "base64").toString("utf-8");
}

function githubOpenId(id: number | string): string {
  return `github:${id}`;
}

async function exchangeGitHubCode(
  code: string,
  redirectUri: string
): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      client_id: ENV.githubClientId,
      client_secret: ENV.githubClientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed (${response.status})`);
  }

  const data = (await response.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(data.error ?? "GitHub token exchange returned no access_token");
  }

  return data.access_token;
}

async function fetchGitHubUser(accessToken: string): Promise<OAuthUserInfo> {
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "CircleBulletinBoard",
    },
  });

  if (!userRes.ok) {
    throw new Error(`GitHub user fetch failed (${userRes.status})`);
  }

  const profile = (await userRes.json()) as {
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };

  let email = profile.email;
  if (!email) {
    const emailRes = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "CircleBulletinBoard",
      },
    });
    if (emailRes.ok) {
      const emails = (await emailRes.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      const primary =
        emails.find((entry) => entry.primary && entry.verified) ??
        emails.find((entry) => entry.verified);
      email = primary?.email ?? null;
    }
  }

  return {
    openId: githubOpenId(profile.id),
    name: profile.name || profile.login,
    email,
    loginMethod: "github",
    avatarUrl: profile.avatar_url,
  };
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/login", (req: Request, res: Response) => {
    if (!ENV.githubClientId || !ENV.githubClientSecret) {
      res.status(500).json({ error: "GitHub OAuth is not configured" });
      return;
    }

    const redirectUri = `${getRequestOrigin(req)}/api/oauth/callback`;
    const state = Buffer.from(redirectUri, "utf-8").toString("base64");
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", ENV.githubClientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "read:user user:email");
    url.searchParams.set("state", state);
    // Encourage GitHub to re-prompt for the account on re-login (may be ignored depending on GitHub behavior).
    url.searchParams.set("prompt", "select_account");

    res.redirect(302, url.toString());
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    if (!ENV.githubClientId || !ENV.githubClientSecret) {
      res.status(500).json({ error: "GitHub OAuth is not configured" });
      return;
    }

    try {
      const redirectUri = decodeState(state);
      const accessToken = await exchangeGitHubCode(code, redirectUri);
      const userInfo = await fetchGitHubUser(accessToken);

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod,
        avatarUrl: userInfo.avatarUrl ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
