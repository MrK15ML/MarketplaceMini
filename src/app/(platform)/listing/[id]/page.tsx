import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CategoryBadge } from "@/components/listings/category-badge";
import { PriceDisplay } from "@/components/listings/price-display";
import {
  Star,
  MapPin,
  Wifi,
  Clock,
  Shield,
  Pencil,
  Send,
} from "lucide-react";
import { ReportDialog } from "@/components/shared/report-dialog";
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
  const qualifications = (qualificationsData ?? []) as Qualification[];

  if (!seller) notFound();

  const isOwner = user?.id === listing.seller_id;
  const initials = seller.display_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About the seller</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/profile/${seller.id}`}
                className="flex items-center gap-3 mb-3"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={seller.avatar_url ?? undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{seller.display_name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {seller.avg_rating > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {Number(seller.avg_rating).toFixed(1)} ({seller.total_reviews})
                      </span>
                    )}
                    {seller.location_city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {seller.location_city}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              {seller.bio && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {seller.bio}
                </p>
              )}
            </CardContent>
          </Card>

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
