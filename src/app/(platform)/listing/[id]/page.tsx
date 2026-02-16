import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CategoryBadge } from "@/components/listings/category-badge";
import { PriceDisplay } from "@/components/listings/price-display";
import {
  MapPin,
  Wifi,
  Shield,
  Pencil,
  Send,
} from "lucide-react";
import { ReportDialog } from "@/components/shared/report-dialog";
import { TrustProfileCard } from "@/components/profiles/trust-profile-card";
import { SaveSellerButton } from "@/components/shared/save-seller-button";
import { InstantBookButton } from "@/components/listings/instant-book-button";
import type { Listing, Profile, Qualification } from "@/lib/types";
import type { Metadata } from "next";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("listings")
    .select("title, description, category, cover_image_url, profiles(display_name, location_city)")
    .eq("id", id)
    .single();

  if (!data) {
    return { title: "Listing Not Found | Handshake" };
  }

  const listing = data as { title: string; description: string; category: string; cover_image_url: string | null; profiles: { display_name: string; location_city: string | null } | null };
  const sellerName = listing.profiles?.display_name ?? "Provider";
  const location = listing.profiles?.location_city ?? "New Zealand";
  const description = `${listing.title} by ${sellerName} in ${location}. ${listing.description.slice(0, 140)}`;

  return {
    title: `${listing.title} | Handshake`,
    description,
    openGraph: {
      title: listing.title,
      description,
      type: "website",
      ...(listing.cover_image_url ? { images: [{ url: listing.cover_image_url, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: listing.cover_image_url ? "summary_large_image" : "summary",
      title: listing.title,
      description,
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listingData } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!listingData) notFound();

  const listing = listingData as Listing;

  const [
    { data: sellerData },
    { data: qualificationsData },
    { data: { user } },
    { data: moreListingsData },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", listing.seller_id)
      .single(),
    supabase
      .from("qualifications")
      .select("*")
      .or(`user_id.eq.${listing.seller_id},listing_id.eq.${listing.id}`),
    supabase.auth.getUser(),
    supabase
      .from("listings")
      .select("id, title, category, pricing_type, price_fixed, price_min, price_max, currency, cover_image_url")
      .eq("seller_id", listing.seller_id)
      .eq("is_active", true)
      .neq("id", listing.id)
      .limit(3),
  ]);

  // Check if user has saved this seller
  let isSaved = false;
  if (user) {
    const { data: savedData } = await supabase
      .from("saved_sellers")
      .select("id")
      .eq("user_id", user.id)
      .eq("seller_id", listing.seller_id)
      .single();
    isSaved = !!savedData;
  }

  const seller = sellerData as Profile | null;

  // Fire-and-forget atomic view count increment
  supabase.rpc("increment_listing_view_count", { p_listing_id: id }).then(() => {});
  const qualifications = (qualificationsData ?? []) as Qualification[];

  if (!seller) notFound();

  const isOwner = user?.id === listing.seller_id;

  return (
    <div className="max-w-4xl mx-auto">
      {listing.cover_image_url && (
        <div className="relative h-64 md:h-80 w-full rounded-xl overflow-hidden mb-6">
          <Image
            src={listing.cover_image_url}
            alt={listing.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CategoryBadge category={listing.category} />
              {listing.is_remote && (
                <Badge variant="outline" className="gap-1">
                  <Wifi className="h-3 w-3" />
                  Remote
                </Badge>
              )}
              {listing.requires_license && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Licensed — {listing.license_type}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {listing.title}
            </h1>

            <div className="flex items-center gap-4 text-muted-foreground mb-4">
              <PriceDisplay
                pricingType={listing.pricing_type}
                priceFixed={listing.price_fixed}
                priceMin={listing.price_min}
                priceMax={listing.price_max}
                currency={listing.currency}
              />
              {!listing.is_remote && listing.location_radius_km && (
                <span className="flex items-center gap-1 text-sm">
                  <MapPin className="h-4 w-4" />
                  Within {listing.location_radius_km}km
                </span>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="font-semibold mb-3">About this service</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>

          {qualifications && qualifications.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="font-semibold mb-3">Qualifications</h2>
                <div className="grid gap-3">
                  {qualifications.map((q: Qualification) => (
                    <Card key={q.id}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <Badge variant="secondary">{q.type}</Badge>
                        <div>
                          <p className="font-medium">{q.title}</p>
                          {q.description && (
                            <p className="text-sm text-muted-foreground">
                              {q.description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Seller card */}
          <TrustProfileCard seller={seller} variant="full" />

          {/* Action buttons */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {isOwner ? (
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`/listing/${listing.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Listing
                  </Link>
                </Button>
              ) : (
                <>
                  {listing.instant_book && listing.instant_book_price ? (
                    <InstantBookButton
                      listingId={listing.id}
                      listingTitle={listing.title}
                      price={listing.instant_book_price}
                      currency={listing.currency}
                    />
                  ) : null}
                  <Button className="w-full" variant={listing.instant_book ? "outline" : "default"} asChild>
                    <Link href={`/jobs?new=true&listing=${listing.id}`}>
                      <Send className="mr-2 h-4 w-4" />
                      {listing.instant_book ? "Custom Request" : "Request This Service"}
                    </Link>
                  </Button>
                  {user && (
                    <SaveSellerButton
                      sellerId={listing.seller_id}
                      initialSaved={isSaved}
                      variant="full"
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Report button */}
          {user && !isOwner && (
            <div className="flex justify-center">
              <ReportDialog reportedListingId={listing.id} />
            </div>
          )}
        </div>
      </div>

      {/* More from this seller */}
      {moreListingsData && moreListingsData.length > 0 && (
        <div className="mt-10">
          <Separator className="mb-8" />
          <h2 className="font-semibold text-lg mb-4">
            More from {seller.display_name}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {moreListingsData.map((item) => {
              const ml = item as { id: string; title: string; category: string; pricing_type: string; price_fixed: number | null; price_min: number | null; price_max: number | null; currency: string; cover_image_url: string | null };
              return (
                <Link key={ml.id} href={`/listing/${ml.id}`}>
                  <Card className="hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full overflow-hidden">
                    {ml.cover_image_url ? (
                      <div className="relative h-32 w-full">
                        <Image src={ml.cover_image_url} alt={ml.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                      </div>
                    ) : (
                      <div className="h-24 bg-muted/50 flex items-center justify-center">
                        <CategoryBadge category={ml.category} />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-medium text-sm line-clamp-1 mb-1">{ml.title}</h3>
                      <PriceDisplay pricingType={ml.pricing_type} priceFixed={ml.price_fixed} priceMin={ml.price_min} priceMax={ml.price_max} currency={ml.currency} />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
