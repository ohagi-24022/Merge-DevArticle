import { COOKIE_NAME } from "@shared/const";

import { getSessionCookieOptions } from "./_core/cookies";

import { systemRouter } from "./_core/systemRouter";

import {
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  router,
} from "./_core/trpc";

import { z } from "zod";

import {

  createPost,

  getPostById,

  getLatestPosts,

  listPosts,

  getPostsByUserId,

  updatePost,

  deletePost,

  incrementPostViewCount,

  getUserById,

  updateUserProfile,

  listUsersForAdmin,

  getGithubReposByUserId,

  addGithubRepo,

  removeGithubRepo,

  getCompletedAppsByUserId,

  createCompletedApp,

  deleteCompletedApp,

} from "./db";

import { invokeLLM } from "./_core/llm";

import { TRPCError } from "@trpc/server";



export const appRouter = router({

  system: systemRouter,



  auth: router({
    me: publicProcedure.query((opts) => {
      const user = opts.ctx.user;
      if (!user) return null;
      // Return only non-sensitive fields to prevent email exposure in network requests
      return {
        id: user.id,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt.getTime(),
        updatedAt: user.updatedAt.getTime(),
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {

      const cookieOptions = getSessionCookieOptions(ctx.req);

      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

      return { success: true } as const;

    }),

  }),



  // ─── User profile ──────────────────────────────────────

  user: router({

    getProfile: publicProcedure

      .input(z.object({ userId: z.number() }))

      .query(async ({ input }) => {

        const user = await getUserById(input.userId);

        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

        return {

          id: user.id,

          name: user.name,

          bio: user.bio,

          avatarUrl: user.avatarUrl,

          createdAt: user.createdAt.getTime(),

        };

      }),



    updateProfile: protectedProcedure

      .input(z.object({

        name: z.string().min(1).max(50).optional(),

        bio: z.string().max(500).optional(),

      }))

      .mutation(async ({ ctx, input }) => {

        await updateUserProfile(ctx.user.id, input);

        return { success: true };

      }),



    listAll: adminProcedure.query(async () => {
      const rows = await listUsersForAdmin();
      return rows.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt.getTime(),
        lastSignedIn: u.lastSignedIn.getTime(),
      }));
    }),

  }),



  // ─── Posts ─────────────────────────────────────────────

  post: router({

    latest: publicProcedure

      .input(z.object({ limit: z.number().min(1).max(10).optional() }).optional())

      .query(async ({ input }) => {

        return getLatestPosts(input?.limit ?? 3);

      }),



    list: publicProcedure

      .input(z.object({

        sortOrder: z.enum(["asc", "desc"]).optional(),

        authorId: z.number().optional(),

        search: z.string().optional(),

        page: z.number().min(1).optional(),

        pageSize: z.number().min(1).max(50).optional(),

      }).optional())

      .query(async ({ input }) => {

        return listPosts({

          sortOrder: input?.sortOrder,

          authorId: input?.authorId,

          search: input?.search,

          page: input?.page,

          pageSize: input?.pageSize,

        });

      }),



    getById: publicProcedure

      .input(z.object({ id: z.number() }))

      .query(async ({ input }) => {

        const post = await getPostById(input.id);

        if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });

        return post;

      }),

    recordView: publicProcedure

      .input(z.object({ id: z.number() }))

      .mutation(async ({ input }) => {

        const viewCount = await incrementPostViewCount(input.id);

        if (viewCount === undefined) {

          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });

        }

        return { viewCount };

      }),



    getByUser: publicProcedure

      .input(z.object({ userId: z.number() }))

      .query(async ({ input }) => {

        return getPostsByUserId(input.userId);

      }),



    create: protectedProcedure

      .input(z.object({

        title: z.string().min(1).max(255),

        body: z.string().min(1),

      }))

      .mutation(async ({ ctx, input }) => {

        return createPost({

          userId: ctx.user.id,

          title: input.title,

          body: input.body,

        });

      }),



    update: protectedProcedure

      .input(z.object({

        id: z.number(),

        title: z.string().min(1).max(255),

        body: z.string().min(1),

      }))

      .mutation(async ({ ctx, input }) => {

        const post = await getPostById(input.id);

        if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });

        if (post.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only edit your own posts",
          });
        }

        return updatePost(input.id, ctx.user.id, {

          title: input.title,

          body: input.body,

        });

      }),



    delete: protectedProcedure

      .input(z.object({ id: z.number() }))

      .mutation(async ({ ctx, input }) => {

        const post = await getPostById(input.id);

        if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });

        if (post.userId !== ctx.user.id && ctx.user.role !== "admin") {

          throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own posts" });

        }

        await deletePost(input.id);

        return { success: true };

      }),

  }),



  // ─── AI article generation ─────────────────────────────

  ai: router({

    generateArticle: protectedProcedure

      .input(z.object({

        bulletPoints: z.string().min(1),

      }))

      .mutation(async ({ input }) => {

        const response = await invokeLLM({

          messages: [

            {

              role: "system",

              content: `あなたは開発日記の執筆アシスタントです。ユーザーが箇条書きで入力した開発内容をもとに、読みやすく整った開発日記の記事を生成してください。

以下のルールに従ってください：

- 文体は「です・ます調」で統一

- 見出しや段落を適切に使い、読みやすい構成にする

- 技術的な内容は正確に記述する

- 記事のタイトルも提案する（1行目に「# タイトル」の形式で）

- Markdown形式で出力する`,

            },

            {

              role: "user",

              content: `以下の開発内容をもとに、開発日記の記事を生成してください：\n\n${input.bulletPoints}`,

            },

          ],

        });

        const content = response.choices[0]?.message?.content;

        const text = typeof content === "string" ? content : "";

        return { article: text };

      }),



    analyzeGithubDiff: protectedProcedure

      .input(z.object({

        repoOwner: z.string(),

        repoName: z.string(),

      }))

      .mutation(async ({ input }) => {

        // Fetch recent commits from GitHub API (public repos, no auth needed)

        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const commitsUrl = `https://api.github.com/repos/${input.repoOwner}/${input.repoName}/commits?since=${since}&per_page=20`;



        const commitsRes = await fetch(commitsUrl, {

          headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "CircleBulletinBoard" },

        });



        if (!commitsRes.ok) {

          throw new TRPCError({

            code: "BAD_REQUEST",

            message: `GitHub APIエラー: ${commitsRes.status} - リポジトリが見つからないか、アクセスできません`,

          });

        }



        const commits = await commitsRes.json() as Array<{

          sha: string;

          commit: { message: string; author: { name: string; date: string } };

        }>;



        if (commits.length === 0) {

          return { analysis: "過去24時間以内のコミットは見つかりませんでした。" };

        }



        // Fetch diff for each commit (limited to first 5)

        const diffs: string[] = [];

        for (const commit of commits.slice(0, 5)) {

          const diffUrl = `https://api.github.com/repos/${input.repoOwner}/${input.repoName}/commits/${commit.sha}`;

          const diffRes = await fetch(diffUrl, {

            headers: {

              "Accept": "application/vnd.github.v3.diff",

              "User-Agent": "CircleBulletinBoard",

            },

          });

          if (diffRes.ok) {

            const diffText = await diffRes.text();

            diffs.push(`### Commit: ${commit.commit.message}\n${diffText.slice(0, 3000)}`);

          }

        }



        const commitSummary = commits

          .map((c) => `- ${c.commit.message} (by ${c.commit.author.name}, ${c.commit.author.date})`)

          .join("\n");



        const response = await invokeLLM({

          messages: [

            {

              role: "system",

              content: `あなたは開発日記の執筆アシスタントです。GitHubリポジトリの過去24時間のコミット履歴とコード差分を分析し、開発日記の箇条書きメモを生成してください。

以下のルールに従ってください：

- 変更内容を分かりやすく要約する

- 技術的な変更点を具体的に記述する

- 箇条書き形式で出力する

- 日本語で出力する`,

            },

            {

              role: "user",

              content: `リポジトリ: ${input.repoOwner}/${input.repoName}\n\n## コミット履歴\n${commitSummary}\n\n## コード差分\n${diffs.join("\n\n")}`,

            },

          ],

        });



        const content = response.choices[0]?.message?.content;

        const text = typeof content === "string" ? content : "";

        return { analysis: text };

      }),

    generateAppDescription: protectedProcedure

      .input(z.discriminatedUnion("source", [

        z.object({

          source: z.literal("manual"),

          notes: z.string().min(1),

        }),

        z.object({

          source: z.literal("github"),

          repoOwner: z.string().min(1),

          repoName: z.string().min(1),

          notes: z.string().optional(),

        }),

      ]))

      .mutation(async ({ input }) => {

        let prompt = "";

        if (input.source === "github") {

          const headers = {

            "Accept": "application/vnd.github.v3+json",

            "User-Agent": "CircleBulletinBoard",

          };

          const repoUrl = `https://api.github.com/repos/${input.repoOwner}/${input.repoName}`;

          const [repoRes, languagesRes, readmeRes] = await Promise.all([

            fetch(repoUrl, { headers }),

            fetch(`${repoUrl}/languages`, { headers }),

            fetch(`${repoUrl}/readme`, { headers: { ...headers, "Accept": "application/vnd.github.raw" } }),

          ]);

          if (!repoRes.ok) {

            throw new TRPCError({

              code: "BAD_REQUEST",

              message: `GitHub APIエラー: ${repoRes.status} - リポジトリが見つからないか、アクセスできません`,

            });

          }

          const repo = await repoRes.json() as {

            full_name: string;

            name: string;

            description: string | null;

            html_url: string;

            homepage: string | null;

            topics?: string[];

          };

          const languages = languagesRes.ok ? await languagesRes.json() : {};

          const readme = readmeRes.ok ? (await readmeRes.text()).slice(0, 8000) : "";

          prompt = `以下のGitHubリポジトリ情報をもとに、完成アプリ紹介文を作成してください。

リポジトリ: ${repo.full_name}
説明: ${repo.description ?? "なし"}
URL: ${repo.html_url}
公開URL: ${repo.homepage ?? "なし"}
トピック: ${(repo.topics ?? []).join(", ") || "なし"}
使用言語: ${JSON.stringify(languages)}
補足メモ: ${input.notes || "なし"}

README:
${readme}`;

        } else {

          prompt = `以下のメモをもとに、完成アプリ紹介文を作成してください。

${input.notes}`;

        }

        const response = await invokeLLM({

          messages: [

            {

              role: "system",

              content: `あなたはポートフォリオ用のアプリ紹介文を書くアシスタントです。

以下のルールに従ってください：

- 1行目に「# アプリ名」の形式でタイトルを書く
- 2行目以降にMarkdownで紹介文を書く
- 何ができるアプリか、誰に向けたものか、主な機能、工夫した点を自然にまとめる
- 技術情報が分かる場合は簡潔に触れる
- 誇張しすぎず、読みやすい日本語のです・ます調にする`,

            },

            {

              role: "user",

              content: prompt,

            },

          ],

        });

        const content = response.choices[0]?.message?.content;

        const text = typeof content === "string" ? content : "";

        return { description: text };

      }),

  }),



  // ─── GitHub repos ──────────────────────────────────────

  github: router({

    listRepos: protectedProcedure.query(async ({ ctx }) => {

      return getGithubReposByUserId(ctx.user.id);

    }),



    addRepo: protectedProcedure

      .input(z.object({

        repoOwner: z.string().min(1),

        repoName: z.string().min(1),

      }))

      .mutation(async ({ ctx, input }) => {

        return addGithubRepo({

          userId: ctx.user.id,

          repoOwner: input.repoOwner,

          repoName: input.repoName,

        });

      }),



    removeRepo: protectedProcedure

      .input(z.object({ id: z.number() }))

      .mutation(async ({ ctx, input }) => {

        await removeGithubRepo(input.id, ctx.user.id);

        return { success: true };

      }),

  }),

  completedApp: router({

    listByUser: publicProcedure

      .input(z.object({ userId: z.number() }))

      .query(async ({ input }) => {

        return getCompletedAppsByUserId(input.userId);

      }),

    create: protectedProcedure

      .input(z.object({

        title: z.string().min(1).max(255),

        description: z.string().min(1),

        repoOwner: z.string().min(1).max(255).nullable().optional(),

        repoName: z.string().min(1).max(255).nullable().optional(),

        appUrl: z.string().url().nullable().optional(),

      }))

      .mutation(async ({ ctx, input }) => {

        return createCompletedApp({

          userId: ctx.user.id,

          title: input.title,

          description: input.description,

          repoOwner: input.repoOwner,

          repoName: input.repoName,

          appUrl: input.appUrl,

        });

      }),

    delete: protectedProcedure

      .input(z.object({ id: z.number() }))

      .mutation(async ({ ctx, input }) => {

        await deleteCompletedApp(input.id, ctx.user.id);

        return { success: true };

      }),

  }),

});



export type AppRouter = typeof appRouter;

