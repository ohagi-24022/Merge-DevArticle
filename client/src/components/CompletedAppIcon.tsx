import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type CompletedAppIconProps = {
  appUrl: string | null | undefined;
  title?: string | null;
  size?: number;
  className?: string;
  imageClassName?: string;
};

const FALLBACK_ICON_URL = "/merge-logo.png";

export default function CompletedAppIcon({
  appUrl,
  title,
  className,
  imageClassName,
}: CompletedAppIconProps) {
  const normalizedUrl = appUrl?.trim() || null;
  const { data } = trpc.completedApp.resolveIcon.useQuery(
    { appUrl: normalizedUrl },
    {
      enabled: Boolean(normalizedUrl),
      staleTime: 1000 * 60 * 60,
    }
  );
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedIconUrl = data?.iconUrl ?? FALLBACK_ICON_URL;
  const iconUrl =
    failedSrc === resolvedIconUrl ? FALLBACK_ICON_URL : resolvedIconUrl;

  useEffect(() => {
    setFailedSrc(null);
  }, [resolvedIconUrl]);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted text-muted-foreground",
        className
      )}
    >
      <img
        src={iconUrl}
        alt={title ? `${title} icon` : ""}
        className={cn("size-full object-cover", imageClassName)}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(iconUrl)}
      />
    </div>
  );
}
