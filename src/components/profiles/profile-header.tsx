import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, ShieldCheck } from "lucide-react";
import { TrustTierBadge } from "@/components/profiles/trust-tier-badge";
import type { Profile } from "@/lib/types";

export function ProfileHeader({ profile }: { profile: Profile }) {
  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-16 w-16">
        <AvatarImage src={profile.avatar_url ?? undefined} />
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold">{profile.display_name}</h1>
          {profile.is_verified && (
            <ShieldCheck className="h-5 w-5 text-blue-500" />
          )}
          {profile.is_seller && (
            <TrustTierBadge
              score={profile.handshake_score}
              completedDeals={profile.total_completed_deals}
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {profile.is_seller && <Badge variant="secondary">Seller</Badge>}
          {profile.avg_rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {Number(profile.avg_rating).toFixed(1)} ({profile.total_reviews}{" "}
              reviews)
            </span>
          )}
          {profile.location_city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {profile.location_city}
            </span>
          )}
        </div>
        {profile.bio && (
          <p className="mt-3 text-muted-foreground max-w-xl">{profile.bio}</p>
        )}
      </div>
    </div>
  );
}
