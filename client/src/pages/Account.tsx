import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompletedAppCard from "@/components/CompletedAppCard";
import CompletedAppIcon from "@/components/CompletedAppIcon";
import PostManageCard from "@/components/PostManageCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  GitBranch,
  Plus,
  Trash2,
  Loader2,
  LogIn,
  Save,
  Shield,
  Eye,
  Sparkles,
  Rocket,
} from "lucide-react";
import { MergeLogo } from "@/components/MergeLogo";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Account() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [repoInput, setRepoInput] = useState("");
  const [appTitle, setAppTitle] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [appNotes, setAppNotes] = useState("");
  const [selectedAppRepo, setSelectedAppRepo] = useState("none");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [deletingAppId, setDeletingAppId] = useState<number | null>(null);

  const isAdmin = user?.role === "admin";

  const { data: profile } = trpc.user.getProfile.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );
  const { data: myPosts } = trpc.post.getByUser.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );
  const { data: myApps } = trpc.completedApp.listByUser.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );
  const { data: repos } = trpc.github.listRepos.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: allUsers, isLoading: usersLoading } =
    trpc.user.listAll.useQuery(undefined, { enabled: isAdmin });

  const utils = trpc.useUtils();
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("プロフィールを更新しました");
      utils.user.getProfile.invalidate();
    },
    onError: err => toast.error(err.message),
  });
  const addRepo = trpc.github.addRepo.useMutation({
    onSuccess: () => {
      toast.success("リポジトリを追加しました");
      setRepoInput("");
      utils.github.listRepos.invalidate();
    },
    onError: err => toast.error(err.message),
  });
  const removeRepo = trpc.github.removeRepo.useMutation({
    onSuccess: () => {
      toast.success("リポジトリを削除しました");
      utils.github.listRepos.invalidate();
    },
    onError: err => toast.error(err.message),
  });
  const generateAppDescription = trpc.ai.generateAppDescription.useMutation({
    onSuccess: data => {
      const lines = data.description.split("\n");
      if (lines[0]?.startsWith("# ")) {
        setAppTitle(lines[0].replace("# ", "").trim());
        setAppDescription(lines.slice(1).join("\n").trim());
      } else {
        setAppDescription(data.description);
      }
      toast.success("AI紹介文を生成しました");
    },
    onError: err => toast.error(err.message),
  });
  const createApp = trpc.completedApp.create.useMutation({
    onSuccess: () => {
      toast.success("完成アプリを追加しました");
      setAppTitle("");
      setAppUrl("");
      setAppDescription("");
      setAppNotes("");
      setSelectedAppRepo("none");
      utils.completedApp.listByUser.invalidate({ userId: user?.id ?? 0 });
    },
    onError: err => toast.error(err.message),
  });
  const deleteApp = trpc.completedApp.delete.useMutation({
    onSuccess: () => {
      toast.success("完成アプリを削除しました");
      utils.completedApp.listByUser.invalidate({ userId: user?.id ?? 0 });
      setDeletingAppId(null);
    },
    onError: err => {
      toast.error(err.message);
      setDeletingAppId(null);
    },
  });
  const deletePost = trpc.post.delete.useMutation({
    onSuccess: () => {
      toast.success("投稿を削除しました");
      utils.post.getByUser.invalidate({ userId: user?.id ?? 0 });
      utils.post.list.invalidate();
      utils.post.latest.invalidate();
      setDeletingPostId(null);
    },
    onError: err => {
      toast.error(err.message);
      setDeletingPostId(null);
    },
  });

  useEffect(() => {
    if (profile && !profileLoaded) {
      setName(profile.name || "");
      setBio(profile.bio || "");
      setProfileLoaded(true);
    }
  }, [profile, profileLoaded]);

  const handleProfileSave = () => {
    updateProfile.mutate({
      name: name.trim() || undefined,
      bio: bio.trim() || undefined,
    });
  };

  const handleAddRepo = () => {
    const parts = repoInput.trim().split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      toast.error(
        "owner/repo 形式で入力してください（例: octocat/Hello-World）"
      );
      return;
    }
    addRepo.mutate({ repoOwner: parts[0], repoName: parts[1] });
  };

  const handleDeletePost = (postId: number) => {
    setDeletingPostId(postId);
    deletePost.mutate({ id: postId });
  };

  const selectedRepo = repos?.find(
    repo => repo.id.toString() === selectedAppRepo
  );

  const handleGenerateAppFromGithub = () => {
    if (!selectedRepo) {
      toast.error("リポジトリを選択してください");
      return;
    }
    generateAppDescription.mutate({
      source: "github",
      repoOwner: selectedRepo.repoOwner,
      repoName: selectedRepo.repoName,
      notes: appNotes.trim() || undefined,
    });
  };

  const handleGenerateAppFromNotes = () => {
    if (!appNotes.trim()) {
      toast.error("アプリの説明メモを入力してください");
      return;
    }
    generateAppDescription.mutate({
      source: "manual",
      notes: appNotes.trim(),
    });
  };

  const handleCreateApp = () => {
    if (!appTitle.trim() || !appDescription.trim()) {
      toast.error("アプリ名と紹介文を入力してください");
      return;
    }
    createApp.mutate({
      title: appTitle.trim(),
      description: appDescription.trim(),
      repoOwner: selectedRepo?.repoOwner ?? null,
      repoName: selectedRepo?.repoName ?? null,
      appUrl: appUrl.trim() || null,
    });
  };

  const handleDeleteApp = (appId: number) => {
    setDeletingAppId(appId);
    deleteApp.mutate({ id: appId });
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <LogIn className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="text-xl font-semibold mb-2">ログインが必要です</h2>
            <p className="text-muted-foreground mb-6">
              アカウントページにアクセスするにはログインしてください
            </p>
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              className="gap-2"
            >
              <LogIn className="h-4 w-4" />
              ログインする
            </Button>
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
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif">
              アカウント
            </h1>
            {isAdmin && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                管理者
              </Badge>
            )}
            {user?.id != null && (
              <span className="text-sm text-muted-foreground">
                ID: {user.id}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  プロフィール
                </CardTitle>
                <CardDescription>
                  表示名と自己紹介を設定できます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">表示名</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="表示名"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">自己紹介</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="自己紹介を書いてください..."
                    rows={4}
                    className="resize-none text-sm"
                    maxLength={500}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleProfileSave}
                    disabled={updateProfile.isPending}
                    size="sm"
                    className="gap-2"
                  >
                    {updateProfile.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    保存
                  </Button>
                  {user?.id && (
                    <Link href={`/users/${user.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                      >
                        <Eye className="h-4 w-4" />
                        公開プロフィールを確認
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-primary" />
                  GitHubリポジトリ
                </CardTitle>
                <CardDescription>
                  リポジトリを登録してAI差分分析を使えます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={repoInput}
                    onChange={e => setRepoInput(e.target.value)}
                    placeholder="owner/repo"
                    className="flex-1"
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddRepo();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddRepo}
                    disabled={addRepo.isPending || !repoInput.trim()}
                    size="sm"
                    className="gap-1 shrink-0"
                  >
                    {addRepo.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    追加
                  </Button>
                </div>
                {repos && repos.length > 0 ? (
                  <div className="space-y-2">
                    {repos.map(repo => (
                      <div
                        key={repo.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border/30"
                      >
                        <span className="text-sm font-medium truncate">
                          {repo.repoOwner}/{repo.repoName}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRepo.mutate({ id: repo.id })}
                          disabled={removeRepo.isPending}
                          className="text-destructive hover:text-destructive h-7 w-7 p-0 shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    登録されたリポジトリはありません
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator className="mb-8" />
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight font-serif mb-1 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              完成アプリ
            </h2>
            <p className="text-sm text-muted-foreground">
              公開プロフィールに載せるアプリ紹介を登録できます
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">
            <Card className="border-border/50 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI紹介文生成
                </CardTitle>
                <CardDescription>
                  GitHub情報またはメモからアプリ紹介文を作ります
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>GitHubリポジトリ（任意）</Label>
                  <Select
                    value={selectedAppRepo}
                    onValueChange={setSelectedAppRepo}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="リポジトリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">使わない</SelectItem>
                      {repos?.map(repo => (
                        <SelectItem key={repo.id} value={repo.id.toString()}>
                          {repo.repoOwner}/{repo.repoName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appNotes">補足メモ</Label>
                  <Textarea
                    id="appNotes"
                    value={appNotes}
                    onChange={e => setAppNotes(e.target.value)}
                    placeholder={
                      "どんなアプリか、できること、工夫した点など\nGitHub未登録のアプリはここに詳しく書いてください"
                    }
                    rows={7}
                    className="resize-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    type="button"
                    onClick={handleGenerateAppFromGithub}
                    disabled={generateAppDescription.isPending || !selectedRepo}
                    size="sm"
                    className="gap-2"
                  >
                    {generateAppDescription.isPending && selectedRepo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <GitBranch className="h-4 w-4" />
                    )}
                    GitHubから生成
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateAppFromNotes}
                    disabled={
                      generateAppDescription.isPending || !appNotes.trim()
                    }
                    size="sm"
                    className="gap-2 bg-transparent"
                  >
                    {generateAppDescription.isPending && !selectedRepo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    メモから生成
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">アプリ紹介を登録</CardTitle>
                <CardDescription>
                  AI生成後に手直ししてから保存できます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appTitle">アプリ名</Label>
                  <Input
                    id="appTitle"
                    value={appTitle}
                    onChange={e => setAppTitle(e.target.value)}
                    placeholder="アプリ名"
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appUrl">公開URL（任意）</Label>
                  <Input
                    id="appUrl"
                    value={appUrl}
                    onChange={e => setAppUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                  {appUrl.trim() && (
                    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                      <CompletedAppIcon
                        appUrl={appUrl.trim()}
                        title={appTitle || "Application"}
                        size={64}
                        className="size-10 rounded-lg"
                      />
                      <span className="text-sm text-muted-foreground">
                        URL icon preview
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appDescription">紹介文</Label>
                  <Textarea
                    id="appDescription"
                    value={appDescription}
                    onChange={e => setAppDescription(e.target.value)}
                    placeholder="アプリ紹介文を書いてください..."
                    rows={10}
                    className="resize-y text-sm"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleCreateApp}
                    disabled={
                      createApp.isPending ||
                      !appTitle.trim() ||
                      !appDescription.trim()
                    }
                    className="gap-2"
                  >
                    {createApp.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    完成アプリを追加
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {myApps && myApps.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
              {myApps.map(app => (
                <CompletedAppCard
                  key={app.id}
                  id={app.id}
                  title={app.title}
                  description={app.description}
                  repoOwner={app.repoOwner}
                  repoName={app.repoName}
                  appUrl={app.appUrl}
                  createdAt={app.createdAt}
                  canDelete
                  onDelete={() => handleDeleteApp(app.id)}
                  isDeleting={deletingAppId === app.id && deleteApp.isPending}
                />
              ))}
            </div>
          )}

          <Separator className="mb-8" />
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight font-serif mb-1">
              自分の投稿
            </h2>
            <p className="text-sm text-muted-foreground">
              編集・削除はこちらから行えます
            </p>
          </div>

          {myPosts && myPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myPosts.map(post => (
                <PostManageCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  body={post.body}
                  isEdited={post.isEdited}
                  viewCount={post.viewCount}
                  createdAt={post.createdAt}
                  onDelete={() => handleDeletePost(post.id)}
                  isDeleting={
                    deletingPostId === post.id && deletePost.isPending
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed rounded-xl">
              <MergeLogo size="lg" className="mx-auto mb-3 opacity-60" />
              <p className="text-muted-foreground">まだ投稿がありません</p>
            </div>
          )}

          {isAdmin && (
            <>
              <Separator className="my-10" />
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight font-serif mb-1 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  利用者一覧（管理者のみ）
                </h2>
                <p className="text-sm text-muted-foreground">
                  登録ユーザーの確認。管理者 ID は{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    server/config/admins.ts
                  </code>{" "}
                  で管理します。
                </p>
              </div>
              <Card className="border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  {usersLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : allUsers && allUsers.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">ID</TableHead>
                          <TableHead>表示名</TableHead>
                          <TableHead className="w-24">権限</TableHead>
                          <TableHead>登録日</TableHead>
                          <TableHead>最終ログイン</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allUsers.map(u => (
                          <TableRow key={u.id}>
                            <TableCell className="font-mono text-sm">
                              {u.id}
                            </TableCell>
                            <TableCell>{u.name || "（未設定）"}</TableCell>
                            <TableCell>
                              {u.role === "admin" ? (
                                <Badge variant="secondary" className="text-xs">
                                  管理者
                                </Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  一般
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString(
                                "ja-JP"
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(u.lastSignedIn).toLocaleDateString(
                                "ja-JP"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-12">
                      利用者がいません
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
