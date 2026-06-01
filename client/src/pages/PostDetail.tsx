import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, CalendarDays, User, PenLine, Clock, Trash2 } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function PostDetail() {
  const params = useParams<{ id: string }>();
  const postId = Number(params.id);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const deletePost = trpc.post.delete.useMutation({
    onSuccess: () => {
      toast.success("投稿を削除しました");
      utils.post.list.invalidate();
      utils.post.latest.invalidate();
      setLocation("/posts");
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: post, isLoading } = trpc.post.getById.useQuery(
    { id: postId },
    { enabled: !isNaN(postId) }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8 md:py-12">
          <div className="container max-w-3xl">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-48 mb-8" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">投稿が見つかりませんでした</p>
            <Link href="/posts">
              <Button variant="outline" className="bg-transparent">投稿一覧に戻る</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = user && user.id === post.userId;
  const canManage = isOwner || user?.role === "admin";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-3xl">
          <Link href="/posts">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground mb-6 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              投稿一覧に戻る
            </Button>
          </Link>

          <article>
            <header className="mb-8 pb-6 border-b border-border/40">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif leading-tight">
                  {post.title}
                </h1>
                {canManage && (
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/edit/${post.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 bg-transparent"
                      >
                        <PenLine className="h-3.5 w-3.5" />
                        編集
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-destructive hover:text-destructive border-destructive/30"
                          disabled={deletePost.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          削除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>投稿を削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            この操作は取り消せません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePost.mutate({ id: postId })}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            削除する
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {post.authorName || "匿名"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(post.createdAt).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                {post.isEdited && (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      更新:{" "}
                      {new Date(post.updatedAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <PenLine className="h-3 w-3 mr-1" />
                      編集済み
                    </Badge>
                  </>
                )}
              </div>
            </header>

            <div className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-primary prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
              <Streamdown>{post.body}</Streamdown>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
