import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingFilters } from "@/components/listings/listing-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCardSkeleton } from "@/components/listings/listing-card-skeleton";
import type { ListingWithSeller } from "@/lib/types";

type SearchParams = Promise<{
  category?: string;
  q?: string;
  remote?: string;
  sort?: string;
}>;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Browse Services</h1>
        <p className="text-muted-foreground">
          Find the right person for any task
        </p>
      </div>

      <Suspense fallback={<FiltersSkeleton />}>
        <ListingFilters />
      </Suspense>

      <Suspense fallback={<GridSkeleton />}>
        <ListingGrid
          category={params.category}
          search={params.q}
          remote={params.remote}
          sort={params.sort}
        />
      </Suspense>
    </div>
  );
}

async function ListingGrid({
  category,
  search,
  remote,
  sort,
}: {
  category?: string;
  search?: string;
  remote?: string;
  sort?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select("*, profiles(*)")
    .eq("is_active", true);

  if (category) {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (remote === "true") {
    query = query.eq("is_remote", true);
  } else if (remote === "false") {
    query = query.eq("is_remote", false);
  }

  // Apply sorting
  switch (sort) {
    case "top_rated":
      query = query.order("avg_rating", { referencedTable: "profiles", ascending: false });
      break;
    case "most_reviews":
      query = query.order("total_reviews", { referencedTable: "profiles", ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "price_low":
      query = query.order("price_fixed", { ascending: true, nullsFirst: false });
      break;
    case "price_high":
      query = query.order("price_fixed", { ascending: false, nullsFirst: false });
      break;
    case "best_match":
    default:
      query = query.order("handshake_score", { referencedTable: "profiles", ascending: false });
      break;
  }

  const { data, error } = await query.limit(50);

  if (error) {
    return (
      <p className="text-center text-muted-foreground py-12">
        Failed to load listings. Please try again.
      </p>
    );
  }

  const listings = (data ?? []) as unknown as ListingWithSeller[];

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-2">No listings found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or check back later
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
        />
      ))}
    </div>
  );
}

function FiltersSkeleton() {
  return <div className="flex gap-3 mb-6"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 w-48" /><Skeleton className="h-10 w-40" /></div>;
}

function GridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
