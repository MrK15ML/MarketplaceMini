import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/jobs/status-badge";
import { CategoryBadge } from "@/components/listings/category-badge";
import { PriceDisplay } from "@/components/listings/price-display";
import { JobDetailTabs } from "@/components/jobs/job-detail-tabs";
import { JobActionBar } from "@/components/jobs/job-action-bar";
import { JobTimeline } from "@/components/jobs/job-timeline";
import { SellerTrustCard } from "@/components/jobs/seller-trust-card";
import { getTimelineSteps } from "@/lib/utils/job-timeline";
import { Calendar, MapPin, DollarSign } from "lucide-react";
import { format } from "date-fns";
import type {
  Profile,
  Listing,
  JobRequest,
  JobRequestStatus,
  Offer,
  Deal,
  MessageWithSender,
} from "@/lib/types";
import type { Role } from "@/lib/utils/state-machine";

type Params = Promise<{ id: string }>;

export default async function JobDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: jobData, error: jobError } = await supabase
    .from("job_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (jobError || !jobData) {
    console.error("[JobDetail] Failed to load job request:", { id, error: jobError?.message });
    notFound();
  }

  const job = jobData as JobRequest;

  // Only participants can view
  if (job.customer_id !== user.id && job.seller_id !== user.id) {
    redirect("/jobs");
  }

  const isCustomer = user.id === job.customer_id;
  const isSeller = user.id === job.seller_id;
  const role: Role = isCustomer ? "customer" : "seller";

  // Fetch all related data in parallel
  const [
    { data: customerData },
    { data: sellerData },
    { data: listingData },
    { data: offersData },
    { data: dealData },
    { data: messagesData },
    { count: sellerCompletedDeals },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", job.customer_id).single(),
    supabase.from("profiles").select("*").eq("id", job.seller_id).single(),
    supabase.from("listings").select("*").eq("id", job.listing_id).single(),
    supabase
      .from("offers")
      .select("*")
      .eq("job_request_id", id)
      .order("version", { ascending: false }),
    supabase
      .from("deals")
      .select("*")
      .eq("job_request_id", id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("*, sender:profiles!sender_id(*)")
      .eq("job_request_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", job.seller_id)
      .eq("status", "completed"),
  ]);

  const customer = customerData as Profile | null;
  const seller = sellerData as Profile | null;
  const listing = listingData as Listing | null;
  const offers = (offersData ?? []) as Offer[];
  const deal = dealData as Deal | null;
  const messages = (messagesData ?? []) as MessageWithSender[];

  // Check if current user has already reviewed this deal
  let hasReviewed = false;
  if (deal) {
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("deal_id", deal.id)
      .eq("reviewer_id", user.id)
      .maybeSingle();
    hasReviewed = !!existingReview;
  }

  const otherParty = isCustomer ? seller : customer;
  const otherInitials = otherParty
    ? otherParty.display_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">
              {listing?.title ?? "Job Request"}
            </h1>
            <StatusBadge status={job.status} />
          </div>
          {listing && <CategoryBadge category={listing.category} />}
        </div>
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur md:static md:bg-transparent md:backdrop-blur-none">
          <JobActionBar
            jobRequestId={id}
            jobStatus={job.status}
            role={role}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6">
        <JobTimeline steps={getTimelineSteps(job.status as JobRequestStatus)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {job.description}
              </p>

              <Separator />

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {(job.budget_min || job.budget_max) && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Budget:{" "}
                      {job.budget_min && job.budget_max
                        ? `$${job.budget_min} – $${job.budget_max}`
                        : job.budget_min
                          ? `From $${job.budget_min}`
                          : `Up to $${job.budget_max}`}
                    </span>
                  </div>
                )}

                {job.preferred_time && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(
                        new Date(job.preferred_time),
                        "PPP 'at' p"
                      )}
                    </span>
                  </div>
                )}

                {job.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{job.location}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabbed area: Chat / Offers / Deal */}
          {customer && seller && (
            <JobDetailTabs
              jobRequestId={id}
              initialStatus={job.status}
              currentUserId={user.id}
              currentUserName={isCustomer ? customer.display_name : seller.display_name}
              isCustomer={isCustomer}
              isSeller={isSeller}
              initialMessages={messages}
              offers={offers}
              deal={deal}
              customer={customer}
              seller={seller}
              hasReviewed={hasReviewed}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isCustomer ? "Seller" : "Customer"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {otherParty && (
                <Link
                  href={`/profile/${otherParty.id}`}
                  className="flex items-center gap-3"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={otherParty.avatar_url ?? undefined}
                    />
                    <AvatarFallback>{otherInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{otherParty.display_name}</p>
                    {otherParty.location_city && (
                      <p className="text-xs text-muted-foreground">
                        {otherParty.location_city}
                      </p>
                    )}
                    {otherParty.avg_rating > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {"★".repeat(Math.round(otherParty.avg_rating))}{" "}
                        ({otherParty.total_reviews} reviews)
                      </p>
                    )}
                  </div>
                </Link>
              )}
            </CardContent>
          </Card>

          {listing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Listing</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/listing/${listing.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {listing.title}
                </Link>
                <div className="mt-1">
                  <PriceDisplay
                    pricingType={listing.pricing_type}
                    priceFixed={listing.price_fixed}
                    priceMin={listing.price_min}
                    priceMax={listing.price_max}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {isCustomer && seller && (
            <SellerTrustCard
              seller={seller}
              completedDealsCount={sellerCompletedDeals ?? 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}
