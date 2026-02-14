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
import type { Listing, Profile, Qualification } from "@/lib/types";

type Params = Promise<{ id: string }>;

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
  ]);

  const seller = sellerData as Profile | null;

  // Fire-and-forget view count increment (atomic)
  supabase
    .from("listings")
    .update({ view_count: (listing.view_count || 0) + 1 })
    .eq("id", id)
    .then(() => {});
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
            <CardContent className="p-4">
              {isOwner ? (
                <div className="space-y-2">
                  <Button className="w-full" variant="outline" asChild>
                    <Link href={`/listing/${listing.id}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Listing
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button className="w-full" asChild>
                  <Link href={`/jobs?new=true&listing=${listing.id}`}>
                    <Send className="mr-2 h-4 w-4" />
                    Request This Service
                  </Link>
                </Button>
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
    </div>
  );
}
