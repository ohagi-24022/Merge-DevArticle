import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, GitBranch, Trash2 } from "lucide-react";
import { Streamdown } from "streamdown";

type CompletedAppCardProps = {
  title: string;
  description: string;
  repoOwner: string | null;
  repoName: string | null;
  appUrl: string | null;
  canDelete?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
};

export default function CompletedAppCard({
  title,
  description,
  repoOwner,
  repoName,
  appUrl,
  canDelete,
  onDelete,
  isDeleting,
}: CompletedAppCardProps) {
  const repoUrl =
    repoOwner && repoName ? `https://github.com/${repoOwner}/${repoName}` : null;

  return (
    <Card className="border-border/50 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold leading-snug">{title}</h3>
            {repoOwner && repoName && (
              <Badge variant="outline" className="mt-2 gap-1 text-xs">
                <GitBranch className="h-3 w-3" />
                {repoOwner}/{repoName}
              </Badge>
            )}
          </div>
          {canDelete && onDelete && (
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
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-a:text-primary">
          <Streamdown>{description}</Streamdown>
        </div>
        {(appUrl || repoUrl) && (
          <div className="mt-auto flex flex-wrap gap-2 pt-3 border-t border-border/40">
            {appUrl && (
              <a href={appUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 bg-transparent">
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
