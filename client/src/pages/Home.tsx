import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PostCard from "@/components/PostCard";
import { ArrowRight, BookOpen, PenLine, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: latestPosts, isLoading } = trpc.post.latest.useQuery({
    limit: 3,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
          <div className="container relative py-20 md:py-28">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                AI搭載の開発日記プラットフォーム
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-serif leading-[1.15] mb-4">
                開発の記録を、
                <br />
                <span className="text-primary">チームで共有</span>しよう
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                日々の開発進捗をAIの力で簡単に記事化。
                GitHub連携でコード変更も自動で文章化できます。
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/posts">
                  <Button size="lg" className="gap-2 font-medium transition-transform duration-150 active:scale-[0.97]">
                    <BookOpen className="h-4 w-4" />
                    投稿を読む
                  </Button>
                </Link>
                <Link href="/new">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 font-medium bg-transparent transition-transform duration-150 active:scale-[0.97]"
                  >
                    <PenLine className="h-4 w-4" />
                    記事を書く
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Latest Posts */}
        <section className="py-16 md:py-20">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight font-serif mb-1">
                  最新の投稿
                </h2>
                <p className="text-sm text-muted-foreground">
                  メンバーの最新の開発記録をチェック
                </p>
              </div>
              <Link href="/posts">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  すべてを見る
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
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
            ) : latestPosts && latestPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {latestPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    title={post.title}
                    body={post.body}
                    authorName={post.authorName}
                    isEdited={post.isEdited}
                    createdAt={post.createdAt}
                    updatedAt={post.updatedAt}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed rounded-xl">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">
                  まだ投稿がありません
                </p>
                <Link href="/new">
                  <Button variant="outline" size="sm" className="mt-4 bg-transparent">
                    最初の記事を投稿する
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-muted/30 border-t border-border/40">
          <div className="container">
            <h2 className="text-2xl font-bold tracking-tight font-serif text-center mb-10">
              主な機能
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: PenLine,
                  title: "簡単投稿",
                  desc: "Markdown対応のエディタで、開発日記を手軽に記録できます。",
                },
                {
                  icon: Sparkles,
                  title: "AI記事生成",
                  desc: "箇条書きのメモからAIが読みやすい記事を自動生成します。",
                },
                {
                  icon: BookOpen,
                  title: "GitHub連携",
                  desc: "リポジトリの変更差分をAIが分析し、開発日記に変換します。",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl bg-card border border-border/50 hover:shadow-sm transition-shadow"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
