import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrustTierBadge } from "@/components/profiles/trust-tier-badge";
import { formatResponseTime, formatCompletionRate } from "@/lib/utils/seller-score";
import {
  Star,
  MapPin,
  ShieldCheck,
  Clock,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import type { Profile } from "@/lib/types";

type TrustProfileCardProps = {
  seller: Profile;
  variant?: "compact" | "full";
  linkToProfile?: boolean;
};

export function TrustProfileCard({
  seller,
  variant = "full",
  linkToProfile = true,
}: TrustProfileCardProps) {
  const initials = seller.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = format(new Date(seller.created_at), "MMM yyyy");

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={seller.avatar_url ?? undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm truncate">
              {seller.display_name}
            </span>
            {seller.is_verified && (
              <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {seller.avg_rating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {Number(seller.avg_rating).toFixed(1)}
              </span>
            )}
            <TrustTierBadge
              score={seller.handshake_score}
              completedDeals={seller.total_completed_deals}
              showLabel={false}
            />
          </div>
        </div>
      </div>
    );
  }

  const profileContent = (
    <>
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={seller.avatar_url ?? undefined} />
          <AvatarFallback className="text-sm">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-semibold">{seller.display_name}</p>
            {seller.is_verified && (
              <ShieldCheck className="h-4 w-4 text-blue-500" />
            )}
          </div>
          <TrustTierBadge
            score={seller.handshake_score}
            completedDeals={seller.total_completed_deals}
          />
        </div>
      </div>

      {seller.bio && (
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {seller.bio}
        </p>
      )}

      <div className="space-y-2.5 text-sm">
        {seller.avg_rating > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
            <span>
              {Number(seller.avg_rating).toFixed(1)} ({seller.total_reviews}{" "}
              {seller.total_reviews === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}

        {seller.completion_rate !== null && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{formatCompletionRate(seller.completion_rate)} completion</span>
          </div>
        )}

        {seller.avg_response_hours !== null && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>Responds in {formatResponseTime(seller.avg_response_hours)}</span>
          </div>
        )}

        {seller.location_city && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{seller.location_city}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Member since {memberSince}</span>
        </div>
      </div>
    </>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">About the seller</CardTitle>
      </CardHeader>
      <CardContent>
        {linkToProfile ? (
          <Link href={`/profile/${seller.id}`} className="block hover:opacity-80 transition-opacity">
            {profileContent}
          </Link>
        ) : (
          profileContent
        )}
      </CardContent>
    </Card>
  );
}
