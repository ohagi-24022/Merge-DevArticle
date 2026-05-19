import { cn } from "@/lib/utils";

const sizeClasses = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
  hero: "h-20 w-20 md:h-24 md:w-24",
} as const;

type MergeLogoProps = {
  size?: keyof typeof sizeClasses;
  className?: string;
};

export function MergeLogo({ size = "md", className }: MergeLogoProps) {
  return (
    <img
      src="/merge-logo.png"
      alt="Merge"
      className={cn("object-contain shrink-0", sizeClasses[size], className)}
    />
  );
}
