import { eq, desc, asc, like, or, sql, and } from "drizzle-orm";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, posts, githubRepos, completedApps } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { isAdminUserId } from "./config/admins";

let _db: MySql2Database | null = null;
let _pool: mysql.Pool | null = null;

function isConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("protocol_connection_lost") ||
    msg.includes("connection lost") ||
    msg.includes("can't add new command") ||
    msg.includes("pool is closed") ||
    msg.includes("connection expired") ||
    msg.includes("gone away") ||
    msg.includes("etimedout")
  );
}

export function resetDbConnection() {
  _db = null;
  if (_pool) {
    void _pool.end().catch(() => {});
    _pool = null;
  }
}

function isTiDbServerless(url: string): boolean {
  return url.includes("tidbcloud.com") || ENV.databaseSsl;
}

function createDatabasePool(): mysql.Pool {
  const url = ENV.databaseUrl;
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }

  const useSsl = isTiDbServerless(url);

  return mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 10,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ...(useSsl
      ? {
          ssl: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true,
          },
        }
      : {}),
  });
}

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _pool = createDatabasePool();
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      resetDbConnection();
    }
  }
  return _db;
}

async function withDbRetry<T>(operation: (db: MySql2Database) => Promise<T>): Promise<T> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  try {
    return await operation(db);
  } catch (error) {
    if (!isConnectionError(error)) {
      throw error;
    }
    console.warn("[Database] Connection error, resetting pool and retrying once");
    resetDbConnection();
    const retryDb = await getDb();
    if (!retryDb) {
      throw error;
    }
    return await operation(retryDb);
  }
}

// ─── User helpers ────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  try {
    await withDbRetry(async (db) => {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "avatarUrl", "bio"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (
      ENV.ownerGithubId &&
      user.openId === `github:${ENV.ownerGithubId}`
    ) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
    });

    try {
      await syncUserRoleFromConfig(user.openId);
    } catch (error) {
      console.warn("[Database] Failed to sync admin role (non-fatal):", error);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  try {
    const result = await withDbRetry((db) =>
      db.select().from(users).where(eq(users.openId, openId)).limit(1),
    );
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.warn("[Database] Cannot get user:", error);
    return undefined;
  }
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(
  userId: number,
  data: { name?: string; bio?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (Object.keys(updateData).length > 0) {
    await db.update(users).set(updateData).where(eq(users.id, userId));
  }
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: users.id, name: users.name, openId: users.openId })
    .from(users);
}

/** Sync admin role from server/config/admins.ts and OWNER_GITHUB_ID after login. */
export async function syncUserRoleFromConfig(openId: string) {
  const db = await getDb();
  if (!db) return;
  const row = await getUserByOpenId(openId);
  if (!row) return;

  const shouldBeAdmin =
    isAdminUserId(row.id) ||
    Boolean(
      ENV.ownerGithubId && row.openId === `github:${ENV.ownerGithubId}`,
    );

  if (shouldBeAdmin && row.role !== "admin") {
    await db.update(users).set({ role: "admin" }).where(eq(users.id, row.id));
  }
}

export async function listUsersForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}

// ─── Post helpers ────────────────────────────────────────────

export async function createPost(data: {
  userId: number;
  title: string;
  body: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = Date.now();
  const result = await db.insert(posts).values({
    userId: data.userId,
    title: data.title,
    body: data.body,
    isEdited: false,
    createdAt: now,
    updatedAt: now,
  });
  return { id: result[0].insertId, createdAt: now };
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      id: posts.id,
      userId: posts.userId,
      title: posts.title,
      body: posts.body,
      isEdited: posts.isEdited,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorName: users.name,
    })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLatestPosts(limit: number = 3) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: posts.id,
      userId: posts.userId,
      title: posts.title,
      body: posts.body,
      isEdited: posts.isEdited,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorName: users.name,
    })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}

export async function listPosts(opts?: {
  sortOrder?: "asc" | "desc";
  authorId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };

  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 10;
  const offset = (page - 1) * pageSize;
  const order = opts?.sortOrder === "asc" ? asc(posts.updatedAt) : desc(posts.updatedAt);

  const conditions = [];
  if (opts?.authorId) {
    conditions.push(eq(posts.userId, opts.authorId));
  }
  if (opts?.search) {
    const searchPattern = `%${opts.search}%`;
    conditions.push(
      or(like(posts.title, searchPattern), like(posts.body, searchPattern))!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: posts.id,
        userId: posts.userId,
        title: posts.title,
        body: posts.body,
        isEdited: posts.isEdited,
        viewCount: posts.viewCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        authorName: users.name,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(whereClause)
      .orderBy(order)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(whereClause),
  ]);

  return { posts: rows, total: countResult[0]?.count ?? 0 };
}

export async function getPostsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: posts.id,
      userId: posts.userId,
      title: posts.title,
      body: posts.body,
      isEdited: posts.isEdited,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorName: users.name,
    })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt));
}

export async function incrementPostViewCount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(eq(posts.id, id));

  const result = await db
    .select({ viewCount: posts.viewCount })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);
  return result[0]?.viewCount;
}

export async function updatePost(
  id: number,
  userId: number,
  data: { title: string; body: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(posts)
    .set({
      title: data.title,
      body: data.body,
      isEdited: true,
      updatedAt: Date.now(),
    })
    .where(eq(posts.id, id));
  return { success: true };
}

export async function deletePost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(posts).where(eq(posts.id, id));
}

// ─── GitHub repo helpers ─────────────────────────────────────

export async function getGithubReposByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(githubRepos)
    .where(eq(githubRepos.userId, userId));
}

export async function addGithubRepo(data: {
  userId: number;
  repoOwner: string;
  repoName: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(githubRepos).values({
    userId: data.userId,
    repoOwner: data.repoOwner,
    repoName: data.repoName,
    createdAt: Date.now(),
  });
  return { id: result[0].insertId };
}

export async function removeGithubRepo(repoId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const repo = await db
    .select()
    .from(githubRepos)
    .where(eq(githubRepos.id, repoId))
    .limit(1);
  if (repo.length === 0) throw new Error("Repository not found");
  if (repo[0].userId !== userId)
    throw new Error("You can only remove your own repositories");
  await db.delete(githubRepos).where(eq(githubRepos.id, repoId));
}

// ─── Completed app helpers ──────────────────────────────────

export async function getCompletedAppsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(completedApps)
    .where(eq(completedApps.userId, userId))
    .orderBy(desc(completedApps.updatedAt));
}

export async function listCompletedApps(opts?: {
  authorId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const db = await getDb();
  if (!db) return { apps: [], total: 0 };

  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 12;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (opts?.authorId) {
    conditions.push(eq(completedApps.userId, opts.authorId));
  }
  if (opts?.search) {
    const searchPattern = `%${opts.search}%`;
    conditions.push(
      or(
        like(completedApps.title, searchPattern),
        like(completedApps.description, searchPattern),
        like(completedApps.repoOwner, searchPattern),
        like(completedApps.repoName, searchPattern),
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: completedApps.id,
        userId: completedApps.userId,
        title: completedApps.title,
        description: completedApps.description,
        repoOwner: completedApps.repoOwner,
        repoName: completedApps.repoName,
        appUrl: completedApps.appUrl,
        createdAt: completedApps.createdAt,
        updatedAt: completedApps.updatedAt,
        authorName: users.name,
      })
      .from(completedApps)
      .leftJoin(users, eq(completedApps.userId, users.id))
      .where(whereClause)
      .orderBy(desc(completedApps.updatedAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(completedApps)
      .where(whereClause),
  ]);

  return { apps: rows, total: countResult[0]?.count ?? 0 };
}

export async function getCompletedAppById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      id: completedApps.id,
      userId: completedApps.userId,
      title: completedApps.title,
      description: completedApps.description,
      repoOwner: completedApps.repoOwner,
      repoName: completedApps.repoName,
      appUrl: completedApps.appUrl,
      createdAt: completedApps.createdAt,
      updatedAt: completedApps.updatedAt,
      authorName: users.name,
    })
    .from(completedApps)
    .leftJoin(users, eq(completedApps.userId, users.id))
    .where(eq(completedApps.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCompletedApp(data: {
  userId: number;
  title: string;
  description: string;
  repoOwner?: string | null;
  repoName?: string | null;
  appUrl?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = Date.now();
  const result = await db.insert(completedApps).values({
    userId: data.userId,
    title: data.title,
    description: data.description,
    repoOwner: data.repoOwner ?? null,
    repoName: data.repoName ?? null,
    appUrl: data.appUrl ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return { id: result[0].insertId, createdAt: now };
}

export async function updateCompletedApp(
  id: number,
  userId: number,
  data: {
    title: string;
    description: string;
    repoOwner?: string | null;
    repoName?: string | null;
    appUrl?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(completedApps)
    .set({
      title: data.title,
      description: data.description,
      repoOwner: data.repoOwner ?? null,
      repoName: data.repoName ?? null,
      appUrl: data.appUrl ?? null,
      updatedAt: Date.now(),
    })
    .where(eq(completedApps.id, id));
  return { success: true };
}

export async function deleteCompletedApp(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const app = await db
    .select({ userId: completedApps.userId })
    .from(completedApps)
    .where(eq(completedApps.id, id))
    .limit(1);
  if (app.length === 0) throw new Error("Application not found");
  if (app[0].userId !== userId) {
    throw new Error("You can only delete your own applications");
  }
  await db.delete(completedApps).where(eq(completedApps.id, id));
}
