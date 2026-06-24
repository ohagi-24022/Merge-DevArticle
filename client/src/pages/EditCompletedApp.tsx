import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, LogIn, Save } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function EditCompletedApp() {
  const params = useParams<{ id: string }>();
  const appId = Number(params.id);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [loaded, setLoaded] = useState(false);

  const { data: app, isLoading } = trpc.completedApp.getById.useQuery(
    { id: appId },
    { enabled: !isNaN(appId) }
  );
  const utils = trpc.useUtils();
  const updateApp = trpc.completedApp.update.useMutation({
    onSuccess: () => {
      toast.success("完成アプリを更新しました");
      utils.completedApp.getById.invalidate({ id: appId });
      utils.completedApp.list.invalidate();
      if (user?.id) {
        utils.completedApp.listByUser.invalidate({ userId: user.id });
      }
      setLocation(`/apps/${appId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (app && !loaded) {
      setTitle(app.title);
      setDescription(app.description);
      setAppUrl(app.appUrl || "");
      setRepoOwner(app.repoOwner || "");
      setRepoName(app.repoName || "");
      setLoaded(true);
    }
  }, [app, loaded]);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <LogIn className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="text-xl font-semibold mb-2">ログインが必要です</h2>
            <p className="text-muted-foreground mb-6">
              完成アプリを編集するにはログインしてください
            </p>
            <Button onClick={() => (window.location.href = getLoginUrl())} className="gap-2">
              <LogIn className="h-4 w-4" />
              ログインする
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8 md:py-12">
          <div className="container max-w-3xl space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">完成アプリが見つかりませんでした</p>
            <Link href="/apps">
              <Button variant="outline" className="bg-transparent">完成アプリ一覧に戻る</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (user && app.userId !== user.id && user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">この完成アプリを編集する権限がありません</p>
            <Link href={`/apps/${appId}`}>
              <Button variant="outline" className="bg-transparent">完成アプリに戻る</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("アプリ名と紹介文を入力してください");
      return;
    }
    updateApp.mutate({
      id: appId,
      title: title.trim(),
      description: description.trim(),
      repoOwner: repoOwner.trim() || null,
      repoName: repoName.trim() || null,
      appUrl: appUrl.trim() || null,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-3xl">
          <Link href={`/apps/${appId}`}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground mb-6 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              完成アプリに戻る
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif mb-8">
            完成アプリを編集
          </h1>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">アプリ紹介を編集</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">アプリ名</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={255}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="repoOwner">GitHub owner（任意）</Label>
                    <Input
                      id="repoOwner"
                      value={repoOwner}
                      onChange={(e) => setRepoOwner(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repoName">GitHub repo（任意）</Label>
                    <Input
                      id="repoName"
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appUrl">公開URL（任意）</Label>
                  <Input
                    id="appUrl"
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">紹介文</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={16}
                    className="resize-y text-sm"
                  />
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateApp.isPending || !title.trim() || !description.trim()}
                    className="gap-2"
                  >
                    {updateApp.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    更新する
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
