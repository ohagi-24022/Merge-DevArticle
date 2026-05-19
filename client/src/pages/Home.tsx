import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PostCard from "@/components/PostCard";
import { MergeLogo } from "@/components/MergeLogo";
import { MERGE_HOMEPAGE_URL } from "@/lib/brand";
import {
  ArrowRight,
  ExternalLink,
  GitBranch,
  PenLine,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: latestPosts, isLoading } = trpc.post.latest.useQuery({
    limit: 3,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden merge-hero-bg text-white">
          <div className="absolute inset-0 merge-split-bar opacity-[0.12]" aria-hidden />
          <div className="container relative py-16 md:py-24">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-8">
                <MergeLogo size="hero" className="rounded-xl shadow-lg" />
                <div>
                  <p className="text-sm font-medium text-white/80 tracking-wide uppercase">
                    Programming Circle
                  </p>
                  <h1 className="text-4xl md:text-5xl font-bold italic tracking-tight">
                    Merge
                  </h1>
                </div>
              </div>
              <p className="text-lg text-white/90 leading-relaxed mb-2 max-w-lg">
                それぞれの専門領域を持ち寄って「得意」を掛け合わせる場所。
              </p>
              <p className="text-base text-white/75 leading-relaxed mb-8 max-w-lg">
                日々の開発進捗をAIの力で簡単に記事化。
                GitHub連携でコード変更も自動で文章化できます。
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/posts">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="gap-2 font-medium bg-white text-[var(--merge-teal)] hover:bg-white/90 transition-transform duration-150 active:scale-[0.97]"
                  >
                    投稿を読む
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/new">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 font-medium border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white transition-transform duration-150 active:scale-[0.97]"
                  >
                    <PenLine className="h-4 w-4" />
                    記事を書く
                  </Button>
                </Link>
                <a
                  href={MERGE_HOMEPAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    variant="ghost"
                    className="gap-2 font-medium text-white/90 hover:text-white hover:bg-white/10"
                  >
                    サークルHP
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-1">
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
                <MergeLogo size="lg" className="mx-auto mb-4 opacity-60" />
                <p className="text-muted-foreground">まだ投稿がありません</p>
                <Link href="/new">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 bg-transparent"
                  >
                    最初の記事を投稿する
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="py-16 bg-muted/30 border-t border-border/40">
          <div className="container">
            <h2 className="text-2xl font-bold tracking-tight text-center mb-10">
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
                  icon: GitBranch,
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
