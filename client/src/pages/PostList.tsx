import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PostCard from "@/components/PostCard";
import { MergeLogo } from "@/components/MergeLogo";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function PostList() {
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [authorId, setAuthorId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const queryInput = useMemo(
    () => ({
      sortOrder,
      authorId,
      search: search || undefined,
      page,
      pageSize,
    }),
    [sortOrder, authorId, search, page]
  );

  const { data, isLoading } = trpc.post.list.useQuery(queryInput);
  const { data: allUsers } = trpc.user.listAll.useQuery();

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif mb-1">
              投稿一覧
            </h1>
            <p className="text-sm text-muted-foreground">
              メンバーの開発記録を閲覧できます
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="キーワードで検索..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={authorId?.toString() || "all"}
              onValueChange={(val) => {
                setAuthorId(val === "all" ? undefined : Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="投稿者で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての投稿者</SelectItem>
                {allUsers?.map((u) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.name || `User #${u.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="default"
              className="gap-2 bg-transparent shrink-0"
              onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === "desc" ? "新しい順" : "古い順"}
            </Button>
          </div>

          {/* Posts Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3 p-5 border rounded-xl">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-3 pt-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : data && data.posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.posts.map((post) => (
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="bg-transparent"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 border border-dashed rounded-xl">
              <MergeLogo size="lg" className="mx-auto mb-3 opacity-60" />
              <p className="text-muted-foreground">
                {search || authorId
                  ? "条件に一致する投稿が見つかりませんでした"
                  : "まだ投稿がありません"}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
