import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/jobs/status-badge";
import { CategoryBadge } from "@/components/listings/category-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  Briefcase,
  ArrowRight,
  Heart,
  Star,
  BadgeCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getSellerStats } from "@/lib/supabase/actions";
import { SellerStatsCard } from "@/components/profiles/seller-stats-card";
import { ActivityFeed } from "@/components/shared/activity-feed";
import type { Profile, ActivityFeedItem } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profileData) redirect("/onboarding");

  const profile = profileData as Profile;

  // Fetch requests as customer
  const { data: myRequests } = await supabase
    .from("job_requests")
    .select("id, status, description, category, created_at, listing:listings(title)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch seller stats
  let sellerStats: import("@/lib/types").SellerStats | null = null;
  let platformAverages: import("@/lib/types").PlatformAverages | null = null;

  if (profile.is_seller) {
    const statsResult = await getSellerStats(user.id);
    sellerStats = statsResult.stats;
    platformAverages = statsResult.averages;
  }

  // Fetch seller-specific data
  let incomingRequests: Record<string, unknown>[] = [];
  let myListings: Record<string, unknown>[] = [];

  if (profile.is_seller) {
    const [incoming, listings] = await Promise.all([
      supabase
        .from("job_requests")
        .select("id, status, description, category, created_at, customer:profiles!customer_id(display_name)")
        .eq("seller_id", user.id)
        .in("status", ["pending", "clarifying", "offered"])
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("listings")
        .select("id, title, category, is_active, created_at")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    incomingRequests = (incoming.data ?? []) as Record<string, unknown>[];
    myListings = (listings.data ?? []) as Record<string, unknown>[];
  }

  // Fetch activity feed + saved sellers in parallel
  const [{ data: activityData }, { data: savedData }] = await Promise.all([
    supabase
      .from("activity_feed")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("saved_sellers")
      .select("seller_id, created_at, seller:profiles!seller_id(id, display_name, avatar_url, location_city, avg_rating, total_reviews, is_verified)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const activities = (activityData ?? []) as ActivityFeedItem[];
  const savedSellers = (savedData ?? []) as { seller_id: string; seller: { id: string; display_name: string; avatar_url: string | null; location_city: string | null; avg_rating: number; total_reviews: number; is_verified: boolean } | null }[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {profile.display_name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your account
          </p>
        </div>
      </div>

      {/* Seller Stats */}
      {profile.is_seller && sellerStats && (
        <div className="mb-8">
          <SellerStatsCard stats={sellerStats} averages={platformAverages} />
        </div>
      )}

      {/* Quick actions */}
      <Card className="mb-8 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button variant="outline" className="h-auto py-4 justify-start" asChild>
              <Link href="/listings">
                <Search className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Browse Services</p>
                  <p className="text-xs text-muted-foreground">
                    Find someone for a task
                  </p>
                </div>
              </Link>
            </Button>

            {profile.is_seller && (
              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                asChild
              >
                <Link href="/listings/new">
                  <Plus className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Create Listing</p>
                    <p className="text-xs text-muted-foreground">
                      Offer a new service
                    </p>
                  </div>
                </Link>
              </Button>
            )}

            <Button variant="outline" className="h-auto py-4 justify-start" asChild>
              <Link href="/jobs">
                <Briefcase className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">My Jobs</p>
                  <p className="text-xs text-muted-foreground">
                    View requests & deals
                  </p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">My Requests</CardTitle>
            <Link
              href="/jobs"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all <ArrowRight className="inline h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {myRequests && myRequests.length > 0 ? (
              <div className="space-y-3">
                {myRequests.map((job) => {
                  const listing = job.listing as { title: string } | null;
                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-md transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {listing?.title ?? "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(job.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <StatusBadge status={job.status} />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No requests yet.{" "}
                <Link href="/listings" className="text-primary hover:underline">
                  Browse services
                </Link>{" "}
                to get started.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Seller section */}
        {profile.is_seller && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Incoming Requests</CardTitle>
              <Link
                href="/jobs"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                View all <ArrowRight className="inline h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {incomingRequests.length > 0 ? (
                <div className="space-y-3">
                  {incomingRequests.map((job) => {
                    const customer = job.customer as { display_name: string } | null;
                    return (
                      <Link
                        key={job.id as string}
                        href={`/jobs/${job.id}`}
                        className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-md transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {customer?.display_name ?? "Unknown"} —{" "}
                            {(job.description as string).slice(0, 50)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(job.created_at as string),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                        <StatusBadge status={job.status as string} />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No incoming requests at the moment.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* My Listings */}
        {profile.is_seller && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">My Listings</CardTitle>
              <Link
                href="/listings/new"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Create new <Plus className="inline h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {myListings.length > 0 ? (
                <div className="space-y-3">
                  {myListings.map((listing) => (
                    <Link
                      key={listing.id as string}
                      href={`/listing/${listing.id}`}
                      className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-md transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {listing.title as string}
                        </p>
                        <CategoryBadge category={listing.category as string} />
                      </div>
                      <span
                        className={`text-xs ${(listing.is_active as boolean) ? "text-green-600" : "text-muted-foreground"}`}
                      >
                        {(listing.is_active as boolean) ? "Active" : "Inactive"}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No listings yet.{" "}
                  <Link
                    href="/listings/new"
                    className="text-primary hover:underline"
                  >
                    Create one
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Saved Providers */}
      {savedSellers.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              Saved Providers
            </CardTitle>
            <Link
              href="/listings"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Browse more <ArrowRight className="inline h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedSellers.map(({ seller }) => {
                if (!seller) return null;
                const initials = seller.display_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <Link key={seller.id} href={`/profile/${seller.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={seller.avatar_url ?? undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium truncate">{seller.display_name}</span>
                          {seller.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {seller.avg_rating > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {Number(seller.avg_rating).toFixed(1)}
                            </span>
                          )}
                          {seller.location_city && <span>{seller.location_city}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Feed */}
      <div className="mt-6">
        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
}
