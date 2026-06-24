import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Eye, User, PenLine } from "lucide-react";
import { Link } from "wouter";

interface PostCardProps {
  id: number;
  title: string;
  body: string;
  authorName: string | null;
  authorAvatarUrl?: string | null;
  isEdited: boolean;
  viewCount: number;
  createdAt: number;
  updatedAt: number;
}

export default function PostCard({
  id,
  title,
  body,
  authorName,
  authorAvatarUrl,
  isEdited,
  viewCount,
  createdAt,
}: PostCardProps) {
  const excerpt =
    body.length > 120
      ? body.replace(/[#*`>\-]/g, "").slice(0, 120) + "..."
      : body.replace(/[#*`>\-]/g, "");

  return (
    <Link href={`/posts/${id}`}>
      <Card className="group border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            {isEdited && (
              <Badge
                variant="outline"
                className="shrink-0 text-[10px] px-1.5 py-0"
              >
                <PenLine className="h-2.5 w-2.5 mr-0.5" />
                編集済み
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
            {excerpt}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              {authorAvatarUrl ? (
                <Avatar className="h-4 w-4">
                  <AvatarImage src={authorAvatarUrl} alt="" />
                  <AvatarFallback>
                    <User className="h-2.5 w-2.5" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User className="h-3 w-3" />
              )}
              {authorName || "匿名"}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {new Date(createdAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span
              className="inline-flex items-center gap-1"
              aria-label={`${viewCount} 閲覧`}
            >
              <Eye className="h-3 w-3" />
              {viewCount.toLocaleString("ja-JP")}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
