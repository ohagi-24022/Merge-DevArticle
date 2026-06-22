import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { MergeLogo } from "@/components/MergeLogo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, PenLine, User, LogOut, Menu, X, List, Rocket } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "ホーム", icon: Home },
    { href: "/posts", label: "投稿一覧", icon: List },
    { href: "/apps", label: "完成アプリ", icon: Rocket },
    ...(isAuthenticated
      ? [
          { href: "/new", label: "新規投稿", icon: PenLine },
          { href: "/account", label: "アカウント", icon: User },
        ]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="h-0.5 merge-split-bar" aria-hidden />
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <MergeLogo
            size="md"
            className="transition-transform duration-150 group-hover:scale-[0.97] group-active:scale-95"
          />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-base font-bold italic tracking-tight">Merge</span>
            <span className="text-[11px] text-muted-foreground font-medium">
              開発記録
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={isActive(link.href) ? "secondary" : "ghost"}
                size="sm"
                className="gap-2 font-medium transition-all duration-150"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 font-medium">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {user.name || "ユーザー"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    アカウント
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="font-medium transition-transform duration-150 active:scale-[0.97]"
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
            >
              ログイン
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
          <nav className="container py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive(link.href) ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start gap-2 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
