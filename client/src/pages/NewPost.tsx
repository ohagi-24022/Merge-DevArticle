import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Send, Sparkles, GitBranch, Loader2, LogIn, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function NewPost() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [bulletPoints, setBulletPoints] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");

  const createPost = trpc.post.create.useMutation({
    onSuccess: (data) => { toast.success("投稿が完了しました"); setLocation(`/posts/${data.id}`); },
    onError: (err) => toast.error(err.message),
  });
  const generateArticle = trpc.ai.generateArticle.useMutation({
    onSuccess: (data) => {
      const lines = data.article.split("\n");
      if (lines[0]?.startsWith("# ")) { setTitle(lines[0].replace("# ", "").trim()); setBody(lines.slice(1).join("\n").trim()); }
      else { setBody(data.article); }
      toast.success("AI記事を生成しました");
    },
    onError: (err) => toast.error(err.message),
  });
  const analyzeGithub = trpc.ai.analyzeGithubDiff.useMutation({
    onSuccess: (data) => { setBulletPoints(data.analysis); toast.success("GitHub差分を分析しました。AI生成ボタンで記事化できます。"); },
    onError: (err) => toast.error(err.message),
  });
  const { data: repos } = trpc.github.listRepos.useQuery(undefined, { enabled: isAuthenticated });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { toast.error("タイトルと本文を入力してください"); return; }
    createPost.mutate({ title: title.trim(), body: body.trim() });
  };
  const handleAIGenerate = () => {
    if (!bulletPoints.trim()) { toast.error("AI生成用のメモを入力してください"); return; }
    generateArticle.mutate({ bulletPoints: bulletPoints.trim() });
  };
  const handleGithubAnalyze = () => {
    if (!selectedRepo) { toast.error("リポジトリを選択してください"); return; }
    const repo = repos?.find((r) => r.id.toString() === selectedRepo);
    if (!repo) return;
    analyzeGithub.mutate({ repoOwner: repo.repoOwner, repoName: repo.repoName });
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <LogIn className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="text-xl font-semibold mb-2">ログインが必要です</h2>
            <p className="text-muted-foreground mb-6">記事を投稿するにはログインしてください</p>
            <Button onClick={() => (window.location.href = getLoginUrl())} className="gap-2"><LogIn className="h-4 w-4" />ログインする</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-4xl">
          <Link href="/posts"><Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground mb-6 -ml-2"><ArrowLeft className="h-4 w-4" />投稿一覧に戻る</Button></Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif mb-8">新規投稿</h1>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* AI Panel */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-border/50">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI記事生成</CardTitle><CardDescription>箇条書きのメモからAIが記事を生成します</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  <Textarea placeholder={"- React Hooksの学習を進めた\n- useEffectの使い方を理解\n- カスタムフックを作成した"} value={bulletPoints} onChange={(e) => setBulletPoints(e.target.value)} rows={8} className="resize-none text-sm" />
                  <Button onClick={handleAIGenerate} disabled={generateArticle.isPending || !bulletPoints.trim()} className="w-full gap-2" size="sm">
                    {generateArticle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}AI記事を生成
                  </Button>
                </CardContent>
              </Card>
              {repos && repos.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><GitBranch className="h-4 w-4 text-primary" />GitHub差分分析</CardTitle><CardDescription>過去24時間のコミットをAIが分析します</CardDescription></CardHeader>
                  <CardContent className="space-y-3">
                    <Select value={selectedRepo} onValueChange={setSelectedRepo}><SelectTrigger><SelectValue placeholder="リポジトリを選択" /></SelectTrigger><SelectContent>{repos.map((repo) => (<SelectItem key={repo.id} value={repo.id.toString()}>{repo.repoOwner}/{repo.repoName}</SelectItem>))}</SelectContent></Select>
                    <Button onClick={handleGithubAnalyze} disabled={analyzeGithub.isPending || !selectedRepo} variant="outline" className="w-full gap-2 bg-transparent" size="sm">
                      {analyzeGithub.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}差分を分析
                    </Button>
                  </CardContent>
                </Card>
              )}
              {!repos?.length && isAuthenticated && (
                <p className="text-xs text-muted-foreground text-center"><Link href="/account" className="text-primary hover:underline">アカウントページ</Link>でGitHubリポジトリを登録すると、差分分析が使えます</p>
              )}
            </div>
            {/* Post Form */}
            <div className="lg:col-span-3">
              <Card className="border-border/50">
                <CardHeader className="pb-3"><CardTitle className="text-base">記事を書く</CardTitle><CardDescription>Markdown記法に対応しています</CardDescription></CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="title">タイトル</Label><Input id="title" placeholder="記事のタイトル" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} /></div>
                    <div className="space-y-2"><Label htmlFor="body">本文</Label><Textarea id="body" placeholder="開発日記の内容を書いてください..." value={body} onChange={(e) => setBody(e.target.value)} rows={16} className="resize-y text-sm font-mono" /></div>
                    <Separator />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={createPost.isPending || !title.trim() || !body.trim()} className="gap-2">
                        {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}投稿する
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
