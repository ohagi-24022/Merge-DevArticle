import { useEffect, useMemo, useState } from "react";
import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

type CompletedAppIconProps = {
  appUrl: string | null | undefined;
  title?: string | null;
  size?: number;
  className?: string;
  imageClassName?: string;
};

function getIconCandidates(appUrl: string | null | undefined, size: number) {
  if (!appUrl) return [];

  try {
    const url = new URL(appUrl);
    const origin = url.origin;
    const domainUrl = encodeURIComponent(origin);

    return [
      `${origin}/favicon.ico`,
      `${origin}/apple-touch-icon.png`,
      `${origin}/apple-touch-icon-precomposed.png`,
      `https://www.google.com/s2/favicons?domain_url=${domainUrl}&sz=${size}`,
    ];
  } catch {
    return [];
  }
}

export default function CompletedAppIcon({
  appUrl,
  title,
  size = 64,
  className,
  imageClassName,
}: CompletedAppIconProps) {
  const candidates = useMemo(
    () => getIconCandidates(appUrl, size),
    [appUrl, size]
  );
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [appUrl, size]);

  const iconUrl = candidates[candidateIndex];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted text-muted-foreground",
        className
      )}
    >
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={title ? `${title} icon` : ""}
          className={cn("size-full object-cover", imageClassName)}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setCandidateIndex(index => index + 1)}
        />
      ) : (
        <Rocket className="h-1/2 w-1/2" aria-hidden="true" />
      )}
    </div>
  );
}
