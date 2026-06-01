import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}

function isLocalRequest(req: Request) {
  const host = req.hostname;
  return LOCAL_HOSTS.has(host);
}

export function getSessionCookieOptions(
  req: Request,
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req) && !isLocalRequest(req);

  // Same-origin app (HTML + /api/trpc): lax is reliable; "none" breaks if secure is false.
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure,
  };
}
