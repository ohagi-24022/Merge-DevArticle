import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CompletedAppIcon from "@/components/CompletedAppIcon";
import {
  CalendarDays,
  ExternalLink,
  GitBranch,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import { Link } from "wouter";

type CompletedAppCardProps = {
  id: number;
  title: string;
  description: string;
  repoOwner: string | null;
  repoName: string | null;
  appUrl: string | null;
  authorName?: string | null;
  userId?: number;
  createdAt?: number;
  canDelete?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
};

export default function CompletedAppCard({
  id,
  title,
  description,
  repoOwner,
  repoName,
  appUrl,
  authorName,
  userId,
  createdAt,
  canDelete,
  onDelete,
  isDeleting,
}: CompletedAppCardProps) {
  const repoUrl =
    repoOwner && repoName
      ? `https://github.com/${repoOwner}/${repoName}`
      : null;
  const excerptSource = description
    .replace(/^# .+$/gm, "")
    .replace(/[#*`>\-[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const excerpt =
    excerptSource.length > 140
      ? `${excerptSource.slice(0, 140)}...`
      : excerptSource;

  return (
    <Card className="group border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {appUrl && (
              <Link href={`/apps/${id}`} className="shrink-0">
                <CompletedAppIcon
                  appUrl={appUrl}
                  title={title}
                  size={64}
                  className="size-12 rounded-xl"
                />
              </Link>
            )}
            <div className="min-w-0">
              <Link href={`/apps/${id}`}>
                <h3 className="text-base font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {title}
                </h3>
              </Link>
              {repoOwner && repoName && (
                <Badge
                  variant="outline"
                  className="mt-2 gap-1 text-xs max-w-full"
                >
                  <GitBranch className="h-3 w-3" />
                  <span className="truncate">
                    {repoOwner}/{repoName}
                  </span>
                </Badge>
              )}
            </div>
          </div>
          {canDelete && onDelete && (
            <div className="flex shrink-0 gap-1">
              <Link href={`/apps/${id}/edit`}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <Link href={`/apps/${id}`} className="block">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
            {excerpt || "紹介文はまだありません。"}
          </p>
        </Link>
        {(authorName || createdAt) && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {authorName && userId && (
              <Link
                href={`/users/${userId}`}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <User className="h-3 w-3" />
                {authorName}
              </Link>
            )}
            {createdAt && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {new Date(createdAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        )}
        {(appUrl || repoUrl) && (
          <div className="mt-auto flex flex-wrap gap-2 pt-3 border-t border-border/40">
            {appUrl && (
              <a href={appUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-transparent"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  アプリを見る
                </Button>
              </a>
            )}
            {repoUrl && (
              <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <GitBranch className="h-3.5 w-3.5" />
                  GitHub
                </Button>
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
