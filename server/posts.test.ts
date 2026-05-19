import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-1",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "github",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("post router", () => {
  it("post.latest returns an array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.post.latest({ limit: 3 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("post.list returns posts and total", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.post.list({
      sortOrder: "desc",
      page: 1,
      pageSize: 10,
    });
    expect(result).toHaveProperty("posts");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.posts)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("post.create requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.post.create({ title: "Test", body: "Test body" })
    ).rejects.toThrow();
  });

  it("post.create succeeds for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.post.create({
      title: "Test Post",
      body: "This is a test post body",
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("createdAt");
    expect(typeof result.id).toBe("number");
    expect(typeof result.createdAt).toBe("number");
  });

  it("post.getById returns the created post", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.post.create({
      title: "Detail Test",
      body: "Detail body content",
    });

    const publicCaller = appRouter.createCaller(createPublicContext());
    const post = await publicCaller.post.getById({ id: created.id });
    expect(post.title).toBe("Detail Test");
    expect(post.body).toBe("Detail body content");
    expect(post.isEdited).toBe(false);
  });

  it("post.update marks post as edited and preserves createdAt", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.post.create({
      title: "Original Title",
      body: "Original body",
    });

    await caller.post.update({
      id: created.id,
      title: "Updated Title",
      body: "Updated body",
    });

    const publicCaller = appRouter.createCaller(createPublicContext());
    const updated = await publicCaller.post.getById({ id: created.id });
    expect(updated.title).toBe("Updated Title");
    expect(updated.body).toBe("Updated body");
    expect(updated.isEdited).toBe(true);
    expect(updated.createdAt).toBe(created.createdAt);
  });

  it("post.update rejects editing other user's post", async () => {
    const ctx1 = createAuthContext({ id: 1, openId: "user-1" });
    const caller1 = appRouter.createCaller(ctx1);
    const created = await caller1.post.create({
      title: "User 1 Post",
      body: "User 1 body",
    });

    const ctx2 = createAuthContext({ id: 2, openId: "user-2" });
    const caller2 = appRouter.createCaller(ctx2);
    await expect(
      caller2.post.update({
        id: created.id,
        title: "Hacked",
        body: "Hacked body",
      })
    ).rejects.toThrow();
  });

  it("post.list supports search", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const uniqueKey = `UniqueSearch_${Date.now()}`;
    await caller.post.create({
      title: uniqueKey,
      body: "Some body content",
    });

    const publicCaller = appRouter.createCaller(createPublicContext());
    const result = await publicCaller.post.list({
      search: uniqueKey,
      page: 1,
      pageSize: 10,
    });
    expect(result.posts.length).toBeGreaterThanOrEqual(1);
    expect(result.posts.some((p) => p.title.includes(uniqueKey))).toBe(true);
  });
});

describe("user router", () => {
  it("user.listAll returns an array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.user.listAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it("user.updateProfile requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.user.updateProfile({ name: "New Name" })
    ).rejects.toThrow();
  });
});

describe("github router", () => {
  it("github.listRepos requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.github.listRepos()).rejects.toThrow();
  });

  it("github.addRepo and listRepos work for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.github.addRepo({
      repoOwner: "testowner",
      repoName: `testrepo_${Date.now()}`,
    });
    expect(result).toHaveProperty("id");

    const repos = await caller.github.listRepos();
    expect(repos.length).toBeGreaterThanOrEqual(1);
  });
});

describe("ai router", () => {
  it("ai.generateArticle requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ai.generateArticle({ bulletPoints: "- test" })
    ).rejects.toThrow();
  });
});
