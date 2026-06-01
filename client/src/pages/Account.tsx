import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PostManageCard from "@/components/PostManageCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User, GitBranch, Plus, Trash2, Loader2, LogIn, Save, Shield } from "lucide-react";
import { MergeLogo } from "@/components/MergeLogo";
import { toast } from "sonner";

export default function Account() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [repoInput, setRepoInput] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

  const isAdmin = user?.role === "admin";

  const { data: profile } = trpc.user.getProfile.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );
  const { data: myPosts } = trpc.post.getByUser.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );
  const { data: repos } = trpc.github.listRepos.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: allUsers, isLoading: usersLoading } = trpc.user.listAll.useQuery(
    undefined,
    { enabled: isAdmin }
  );

  const utils = trpc.useUtils();
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("プロフィールを更新しました");
      utils.user.getProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const addRepo = trpc.github.addRepo.useMutation({
    onSuccess: () => {
      toast.success("リポジトリを追加しました");
      setRepoInput("");
      utils.github.listRepos.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const removeRepo = trpc.github.removeRepo.useMutation({
    onSuccess: () => {
      toast.success("リポジトリを削除しました");
      utils.github.listRepos.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const deletePost = trpc.post.delete.useMutation({
    onSuccess: () => {
      toast.success("投稿を削除しました");
      utils.post.getByUser.invalidate({ userId: user?.id ?? 0 });
      utils.post.list.invalidate();
      utils.post.latest.invalidate();
      setDeletingPostId(null);
    },
    onError: (err) => {
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
      toast.error("owner/repo 形式で入力してください（例: octocat/Hello-World）");
      return;
    }
    addRepo.mutate({ repoOwner: parts[0], repoName: parts[1] });
  };

  const handleDeletePost = (postId: number) => {
    setDeletingPostId(postId);
    deletePost.mutate({ id: postId });
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
              <span className="text-sm text-muted-foreground">ID: {user.id}</span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  プロフィール
                </CardTitle>
                <CardDescription>表示名と自己紹介を設定できます</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">表示名</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="表示名"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">自己紹介</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="自己紹介を書いてください..."
                    rows={4}
                    className="resize-none text-sm"
                    maxLength={500}
                  />
                </div>
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
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder="owner/repo"
                    className="flex-1"
                    onKeyDown={(e) => {
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
                    {repos.map((repo) => (
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
            <h2 className="text-xl font-bold tracking-tight font-serif mb-1">
              自分の投稿
            </h2>
            <p className="text-sm text-muted-foreground">
              編集・削除はこちらから行えます
            </p>
          </div>

          {myPosts && myPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myPosts.map((post) => (
                <PostManageCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  body={post.body}
                  isEdited={post.isEdited}
                  createdAt={post.createdAt}
                  onDelete={() => handleDeletePost(post.id)}
                  isDeleting={deletingPostId === post.id && deletePost.isPending}
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
                        {allUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-mono text-sm">{u.id}</TableCell>
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
                              {new Date(u.createdAt).toLocaleDateString("ja-JP")}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(u.lastSignedIn).toLocaleDateString("ja-JP")}
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
