import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarDays, Eye, PenLine, Pencil, Trash2 } from "lucide-react";

type PostManageCardProps = {
  id: number;
  title: string;
  body: string;
  isEdited: boolean;
  viewCount: number;
  createdAt: number;
  onDelete: () => void;
  isDeleting?: boolean;
};

export default function PostManageCard({
  id,
  title,
  body,
  isEdited,
  viewCount,
  createdAt,
  onDelete,
  isDeleting,
}: PostManageCardProps) {
  const excerpt =
    body.length > 120
      ? body.replace(/[#*`>\-]/g, "").slice(0, 120) + "..."
      : body.replace(/[#*`>\-]/g, "");

  return (
    <Card className="border-border/50 h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/posts/${id}`}>
            <h3 className="text-base font-semibold leading-snug line-clamp-2 hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>
          {isEdited && (
            <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
              <PenLine className="h-2.5 w-2.5 mr-0.5" />
              編集済み
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col">
        <Link href={`/posts/${id}`} className="block flex-1">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
            {excerpt}
          </p>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            {new Date(createdAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="ml-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            {viewCount.toLocaleString("ja-JP")}
          </span>
        </Link>
        <div className="flex gap-2 mt-4 pt-4 border-t border-border/40">
          <Link href={`/edit/${id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1.5 bg-transparent">
              <Pencil className="h-3.5 w-3.5" />
              編集
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                disabled={isDeleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
                削除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>投稿を削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  「{title}」を削除します。この操作は取り消せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  削除する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
