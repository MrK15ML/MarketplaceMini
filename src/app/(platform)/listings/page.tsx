import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingFilters } from "@/components/listings/listing-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCardSkeleton } from "@/components/listings/listing-card-skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ListingWithSeller } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Services | Handshake",
  description: "Find trusted service providers in Wellington. Browse odd jobs, skilled trades, tutoring, remote services, and more on Handshake.",
  openGraph: {
    title: "Browse Services | Handshake",
    description: "Find trusted service providers in Wellington. Browse odd jobs, skilled trades, tutoring, remote services, and more.",
    type: "website",
  },
};

const PAGE_SIZE = 12;

type SearchParams = Promise<{
  category?: string;
  q?: string;
  remote?: string;
  sort?: string;
  page?: string;
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
          page={params.page}
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
  page,
}: {
  category?: string;
  search?: string;
  remote?: string;
  sort?: string;
  page?: string;
}) {
  const supabase = await createClient();
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  let query = supabase
    .from("listings")
    .select("*, profiles(*)", { count: "exact" })
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

  const { data, error, count } = await query.range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    return (
      <p className="text-center text-muted-foreground py-12">
        Failed to load listings. Please try again.
      </p>
    );
  }

  const listings = (data ?? []) as unknown as ListingWithSeller[];
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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

  // Build pagination URLs preserving current filters
  function buildPageUrl(p: number) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("q", search);
    if (remote) params.set("remote", remote);
    if (sort) params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/listings${qs ? `?${qs}` : ""}`;
  }

  return (
    <>
      {/* Results count */}
      <div className="text-sm text-muted-foreground mb-4">
        Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, totalCount)} of {totalCount} services
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {currentPage > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildPageUrl(currentPage - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
          )}

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, idx, arr) => {
                const elements = [];
                if (idx > 0 && arr[idx - 1] !== p - 1) {
                  elements.push(
                    <span key={`ellipsis-${p}`} className="px-2 text-muted-foreground text-sm">...</span>
                  );
                }
                elements.push(
                  <Button
                    key={p}
                    variant={p === currentPage ? "default" : "outline"}
                    size="sm"
                    className="w-9 h-9 p-0"
                    asChild={p !== currentPage}
                  >
                    {p === currentPage ? (
                      <span>{p}</span>
                    ) : (
                      <Link href={buildPageUrl(p)}>{p}</Link>
                    )}
                  </Button>
                );
                return elements;
              })
              .flat()}
          </div>

          {currentPage < totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildPageUrl(currentPage + 1)}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </>
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
