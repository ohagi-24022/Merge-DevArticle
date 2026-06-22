import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompletedAppCard from "@/components/CompletedAppCard";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, User } from "lucide-react";
import { useParams } from "wouter";

export default function UserProfile() {
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);
  const enabled = Number.isInteger(userId) && userId > 0;
  const { data: profile, isLoading: profileLoading } =
    trpc.user.getProfile.useQuery({ userId }, { enabled });
  const { data: posts, isLoading: postsLoading } =
    trpc.post.getByUser.useQuery({ userId }, { enabled });
  const { data: apps, isLoading: appsLoading } =
    trpc.completedApp.listByUser.useQuery({ userId }, { enabled });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-5xl">
          {profileLoading ? (
            <div className="flex items-center gap-5 mb-10">
              <Skeleton className="size-20 rounded-full" />
              <div className="space-y-3 flex-1">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-full max-w-xl" />
              </div>
            </div>
          ) : profile ? (
            <section className="flex flex-col sm:flex-row gap-5 mb-10 p-6 rounded-xl border border-border/50 bg-card">
              <Avatar className="size-20">
                <AvatarImage src={profile.avatarUrl || undefined} alt="" />
                <AvatarFallback className="text-2xl">
                  {profile.name?.charAt(0)?.toUpperCase() || <User />}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif">
                  {profile.name || `User #${profile.id}`}
                </h1>
                <p className="mt-3 whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {profile.bio || "自己紹介はまだありません。"}
                </p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(profile.createdAt).toLocaleDateString("ja-JP")} 参加
                </p>
              </div>
            </section>
          ) : (
            <p className="py-20 text-center text-muted-foreground">
              ユーザーが見つかりませんでした。
            </p>
          )}

          {profile && (
            <>
            <section className="mb-10">
              <h2 className="text-xl font-bold tracking-tight font-serif mb-5">
                完成アプリ
              </h2>
              {appsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[1, 2].map((item) => (
                    <Skeleton key={item} className="h-56 rounded-xl" />
                  ))}
                </div>
              ) : apps && apps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {apps.map((app) => (
                    <CompletedAppCard
                      key={app.id}
                      title={app.title}
                      description={app.description}
                      repoOwner={app.repoOwner}
                      repoName={app.repoName}
                      appUrl={app.appUrl}
                    />
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                  完成アプリはまだありません。
                </p>
              )}
            </section>

            <section>
              <h2 className="text-xl font-bold tracking-tight font-serif mb-5">
                投稿
              </h2>
              {postsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map((item) => (
                    <Skeleton key={item} className="h-48 rounded-xl" />
                  ))}
                </div>
              ) : posts && posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      body={post.body}
                      authorName={post.authorName}
                      isEdited={post.isEdited}
                      viewCount={post.viewCount}
                      createdAt={post.createdAt}
                      updatedAt={post.updatedAt}
                    />
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                  投稿はまだありません。
                </p>
              )}
            </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
