import { cn } from "@/shared/utils/cn";

/**
 * Props für die Skeleton-Komponente
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Skeleton-Komponente für Ladezustände
 * 
 * Wird verwendet, um Platzhalter für Inhalte zu zeigen,
 * während Daten geladen werden.
 */
function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
