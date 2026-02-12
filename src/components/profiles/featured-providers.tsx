import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, ShieldCheck } from "lucide-react";
import { TrustTierBadge } from "@/components/profiles/trust-tier-badge";

type FeaturedProvider = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  location_city: string | null;
  is_verified: boolean;
  avg_rating: number;
  total_reviews: number;
  handshake_score: number;
  total_completed_deals: number;
};

export function FeaturedProviders({
  providers,
}: {
  providers: FeaturedProvider[];
}) {
  if (providers.length === 0) return null;

  return (
    <section className="px-4 py-20">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
          Featured Providers
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Our highest-rated service providers, trusted by the community.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => {
            const initials = provider.display_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <Link key={provider.id} href={`/profile/${provider.id}`}>
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="p-6 text-center">
                    <Avatar className="h-14 w-14 mx-auto mb-3">
                      <AvatarImage src={provider.avatar_url ?? undefined} />
                      <AvatarFallback className="text-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <h3 className="font-semibold mb-1">
                      {provider.display_name}
                    </h3>

                    <div className="flex items-center justify-center gap-2 mb-2">
                      {provider.is_verified && (
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                      )}
                      <TrustTierBadge
                        score={provider.handshake_score}
                        completedDeals={provider.total_completed_deals}
                      />
                    </div>

                    <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                      {provider.avg_rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          {Number(provider.avg_rating).toFixed(1)}
                          <span className="text-xs">
                            ({provider.total_reviews})
                          </span>
                        </span>
                      )}
                      {provider.location_city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {provider.location_city}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
