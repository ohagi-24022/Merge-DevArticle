import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Save, Loader2, ArrowLeft, LogIn } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";

export default function EditPost() {
  const params = useParams<{ id: string }>();
  const postId = Number(params.id);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loaded, setLoaded] = useState(false);

  const { data: post, isLoading } = trpc.post.getById.useQuery({ id: postId }, { enabled: !isNaN(postId) });
  const utils = trpc.useUtils();
  const updatePost = trpc.post.update.useMutation({
    onSuccess: () => { toast.success("投稿を更新しました"); utils.post.getById.invalidate({ id: postId }); setLocation(`/posts/${postId}`); },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => { if (post && !loaded) { setTitle(post.title); setBody(post.body); setLoaded(true); } }, [post, loaded]);

  if (!authLoading && !isAuthenticated) {
    return (<div className="min-h-screen flex flex-col"><Header /><main className="flex-1 flex items-center justify-center"><div className="text-center max-w-md px-4"><LogIn className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" /><h2 className="text-xl font-semibold mb-2">ログインが必要です</h2><p className="text-muted-foreground mb-6">投稿を編集するにはログインしてください</p><Button onClick={() => (window.location.href = getLoginUrl())} className="gap-2"><LogIn className="h-4 w-4" />ログインする</Button></div></main><Footer /></div>);
  }
  if (isLoading) {
    return (<div className="min-h-screen flex flex-col"><Header /><main className="flex-1 py-8 md:py-12"><div className="container max-w-3xl space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div></main><Footer /></div>);
  }
  if (!post) {
    return (<div className="min-h-screen flex flex-col"><Header /><main className="flex-1 flex items-center justify-center"><div className="text-center"><p className="text-muted-foreground mb-4">投稿が見つかりませんでした</p><Link href="/posts"><Button variant="outline" className="bg-transparent">投稿一覧に戻る</Button></Link></div></main><Footer /></div>);
  }
  if (user && post.userId !== user.id && user.role !== "admin") {
    return (<div className="min-h-screen flex flex-col"><Header /><main className="flex-1 flex items-center justify-center"><div className="text-center"><p className="text-muted-foreground mb-4">この投稿を編集する権限がありません</p><Link href={`/posts/${postId}`}><Button variant="outline" className="bg-transparent">投稿に戻る</Button></Link></div></main><Footer /></div>);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { toast.error("タイトルと本文を入力してください"); return; }
    updatePost.mutate({ id: postId, title: title.trim(), body: body.trim() });
  };

  return (
    <div className="min-h-screen flex flex-col"><Header /><main className="flex-1 py-8 md:py-12"><div className="container max-w-3xl">
      <Link href={`/posts/${postId}`}><Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground mb-6 -ml-2"><ArrowLeft className="h-4 w-4" />投稿に戻る</Button></Link>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif mb-8">投稿を編集</h1>
      <Card className="border-border/50"><CardHeader className="pb-3"><CardTitle className="text-base">記事を編集</CardTitle></CardHeader><CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="title">タイトル</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} /></div>
          <div className="space-y-2"><Label htmlFor="body">本文</Label><Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={16} className="resize-y text-sm font-mono" /></div>
          <Separator />
          <div className="flex justify-end"><Button type="submit" disabled={updatePost.isPending || !title.trim() || !body.trim()} className="gap-2">{updatePost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}更新する</Button></div>
        </form>
      </CardContent></Card>
    </div></main><Footer /></div>
  );
}
