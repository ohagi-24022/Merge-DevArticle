import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompletedAppIcon from "@/components/CompletedAppIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  GitBranch,
  PenLine,
  User,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { Streamdown } from "streamdown";

export default function CompletedAppDetail() {
  const params = useParams<{ id: string }>();
  const appId = Number(params.id);
  const { user } = useAuth();
  const { data: app, isLoading } = trpc.completedApp.getById.useQuery(
    { id: appId },
    { enabled: !isNaN(appId) }
  );

  const repoUrl =
    app?.repoOwner && app.repoName
      ? `https://github.com/${app.repoOwner}/${app.repoName}`
      : null;
  const canManage =
    app && user && (app.userId === user.id || user.role === "admin");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-3xl">
          <Link href="/apps">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground mb-6 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              完成アプリ一覧に戻る
            </Button>
          </Link>

          {isLoading ? (
            <div>
              <Skeleton className="h-9 w-3/4 mb-4" />
              <Skeleton className="h-4 w-56 mb-8" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ) : app ? (
            <article>
              <header className="mb-8 pb-6 border-b border-border/40">
                <div className="mb-4 flex items-start gap-4">
                  {app.appUrl && (
                    <CompletedAppIcon
                      appUrl={app.appUrl}
                      title={app.title}
                      size={96}
                      className="size-16 rounded-2xl"
                    />
                  )}
                  <div className="min-w-0">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif leading-tight mb-4">
                      {app.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <Link
                        href={`/users/${app.userId}`}
                        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        <User className="h-3.5 w-3.5" />
                        {app.authorName || "匿名"}
                      </Link>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(app.createdAt).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      {app.repoOwner && app.repoName && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <GitBranch className="h-3 w-3" />
                          {app.repoOwner}/{app.repoName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {(app.appUrl || repoUrl || canManage) && (
                  <div className="flex flex-wrap gap-2 mt-5">
                    {canManage && (
                      <Link href={`/apps/${app.id}/edit`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 bg-transparent"
                        >
                          <PenLine className="h-3.5 w-3.5" />
                          編集
                        </Button>
                      </Link>
                    )}
                    {app.appUrl && (
                      <a
                        href={app.appUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" className="gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" />
                          アプリを見る
                        </Button>
                      </a>
                    )}
                    {repoUrl && (
                      <a
                        href={repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 bg-transparent"
                        >
                          <GitBranch className="h-3.5 w-3.5" />
                          GitHub
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </header>

              <div className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-primary">
                <Streamdown>{app.description}</Streamdown>
              </div>
            </article>
          ) : (
            <p className="py-20 text-center text-muted-foreground">
              完成アプリが見つかりませんでした。
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
