import { ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { MergeLogo } from "@/components/MergeLogo";
import {
  APP_NAME,
  APP_TAGLINE,
  MERGE_HOMEPAGE_URL,
  MERGE_TWITTER_URL,
} from "@/lib/brand";

export default function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="h-1 merge-split-bar" aria-hidden />
      <div className="bg-muted/30">
        <div className="container py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <MergeLogo size="sm" />
                <span className="text-base font-bold italic tracking-tight">
                  Merge
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {APP_TAGLINE}
                日々の開発の進捗や学びを記録し、チームで共有しましょう。
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">ナビゲーション</h4>
              <nav className="flex flex-col gap-2">
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ホーム
                </Link>
                <Link
                  href="/posts"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  投稿一覧
                </Link>
                <Link
                  href="/new"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  新規投稿
                </Link>
              </nav>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">リンク</h4>
              <nav className="flex flex-col gap-2">
                <a
                  href={MERGE_HOMEPAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  サークル公式HP
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={MERGE_TWITTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  公式 X (Twitter)
                  <ExternalLink className="h-3 w-3" />
                </a>
              </nav>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/40">
            <p className="text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
