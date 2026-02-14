import { Skeleton } from "@/components/ui/skeleton";

export function ListingCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      {/* Cover image placeholder */}
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-5 space-y-3">
        {/* Title + Price */}
        <div className="flex justify-between">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-5 w-16" />
        </div>
        {/* Description */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        {/* Seller row */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
    </div>
  );
}
