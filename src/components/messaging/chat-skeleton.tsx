import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ChatSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {[false, true, false, true, false].map((isOwn, i) => (
        <div
          key={i}
          className={cn("flex gap-2", isOwn ? "flex-row-reverse" : "")}
        >
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <Skeleton
            className={cn(
              "h-12 rounded-lg",
              isOwn ? "w-48" : "w-56"
            )}
          />
        </div>
      ))}
    </div>
  );
}
