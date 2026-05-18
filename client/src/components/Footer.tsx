import { BookOpen, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-base font-semibold font-serif">Dev Diary</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              サークルメンバーの開発記録を共有する掲示板です。
              日々の開発の進捗や学びを記録し、チームで共有しましょう。
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">ナビゲーション</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ホーム
              </Link>
              <Link href="/posts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                投稿一覧
              </Link>
              <Link href="/new" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                新規投稿
              </Link>
            </nav>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">リンク</h4>
            <nav className="flex flex-col gap-2">
              <a
                href="https://x.com/merge628216?s=21"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              >
                公式 X (Twitter)
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                サークルHP（準備中）
              </span>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40">
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Dev Diary. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
