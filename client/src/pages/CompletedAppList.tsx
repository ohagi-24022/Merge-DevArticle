import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompletedAppCard from "@/components/CompletedAppCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function CompletedAppList() {
  const [search, setSearch] = useState("");
  const [authorId, setAuthorId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const queryInput = useMemo(
    () => ({
      authorId,
      search: search || undefined,
      page,
      pageSize,
    }),
    [authorId, search, page]
  );

  const { data, isLoading } = trpc.completedApp.list.useQuery(queryInput);
  const { data: allUsers } = trpc.user.listAll.useQuery();
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif mb-1">
              完成アプリ一覧
            </h1>
            <p className="text-sm text-muted-foreground">
              メンバーが完成させたアプリを閲覧できます
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="アプリ名や説明で検索..."
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
                <SelectValue placeholder="作者で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての作者</SelectItem>
                {allUsers?.map((u) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.name || `User #${u.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : data && data.apps.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.apps.map((app) => (
                  <CompletedAppCard
                    key={app.id}
                    id={app.id}
                    title={app.title}
                    description={app.description}
                    repoOwner={app.repoOwner}
                    repoName={app.repoName}
                    appUrl={app.appUrl}
                    authorName={app.authorName}
                    userId={app.userId}
                    createdAt={app.createdAt}
                  />
                ))}
              </div>

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
              <p className="text-muted-foreground">
                {search || authorId
                  ? "条件に一致する完成アプリが見つかりませんでした"
                  : "まだ完成アプリがありません"}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
