import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Wifi, BadgeCheck, Clock, Sparkles, Zap } from "lucide-react";
import { CategoryBadge } from "@/components/listings/category-badge";
import { PriceDisplay } from "@/components/listings/price-display";
import { ListingTags } from "@/components/listings/listing-tags";
import { TrustTierBadge } from "@/components/profiles/trust-tier-badge";
import { getCategoryConfig } from "@/lib/constants/categories";
import type { ListingWithSeller } from "@/lib/types";

function formatResponseTime(hours: number): string {
  if (hours < 1) return "< 1h response";
  if (hours < 24) return `~${Math.round(hours)}h response`;
  const days = Math.round(hours / 24);
  return `~${days}d response`;
}

export function ListingCard({ listing }: { listing: ListingWithSeller }) {
  const seller = listing.profiles;
  const initials = seller.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const catConfig = getCategoryConfig(listing.category);
  const CatIcon = catConfig?.icon;

  // "New" if created within last 7 days
  const isNew = Date.now() - new Date(listing.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <Link href={`/listing/${listing.id}`}>
      <Card className="hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full overflow-hidden">
        {/* Image or placeholder */}
        {listing.cover_image_url ? (
          <div className="relative h-40 w-full">
            <Image
              src={listing.cover_image_url}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
            <div className="absolute top-3 left-3">
              <CategoryBadge category={listing.category} />
            </div>
            {listing.tags && listing.tags.length > 0 && (
              <div className="absolute top-3 right-3">
                <ListingTags tags={listing.tags} />
              </div>
            )}
          </div>
        ) : (
          <div className="h-32 bg-muted/50 flex items-center justify-center relative">
            {CatIcon && <CatIcon className="h-10 w-10 text-muted-foreground/30" />}
            <div className="absolute top-3 left-3">
              <CategoryBadge category={listing.category} />
            </div>
            {listing.tags && listing.tags.length > 0 && (
              <div className="absolute top-3 right-3">
                <ListingTags tags={listing.tags} />
              </div>
            )}
          </div>
        )}

        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold line-clamp-1 flex-1">{listing.title}</h3>
            <PriceDisplay
              pricingType={listing.pricing_type}
              priceFixed={listing.price_fixed}
              priceMin={listing.price_min}
              priceMax={listing.price_max}
              currency={listing.currency}
            />
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {listing.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={seller.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{seller.display_name}</span>
              {seller.is_verified && (
                <BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              )}
              {seller.avg_rating > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {Number(seller.avg_rating).toFixed(1)}
                  {seller.total_reviews > 0 && (
                    <span className="ml-0.5">({seller.total_reviews})</span>
                  )}
                </span>
              )}
              <TrustTierBadge
                score={seller.handshake_score}
                completedDeals={seller.total_completed_deals}
                showLabel={false}
              />
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {listing.is_remote ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Remote
                </>
              ) : seller.location_city ? (
                <>
                  <MapPin className="h-3 w-3" />
                  {seller.location_city}
                </>
              ) : null}
            </div>
          </div>

          {/* Trust signals row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {listing.instant_book && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <Zap className="h-3 w-3" />
                Instant Book
              </span>
            )}
            {isNew && !listing.instant_book && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Sparkles className="h-3 w-3" />
                New
              </span>
            )}
            {seller.avg_response_hours != null && seller.avg_response_hours > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatResponseTime(seller.avg_response_hours)}
              </span>
            )}
            {listing.requires_license && (
              <Badge variant="outline" className="text-xs py-0 h-5">
                Licensed — {listing.license_type}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
