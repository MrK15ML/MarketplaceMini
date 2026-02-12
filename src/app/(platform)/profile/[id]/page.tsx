import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ProfileHeader } from "@/components/profiles/profile-header";
import { ListingCard } from "@/components/listings/listing-card";
import { ReviewList } from "@/components/profiles/review-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReportDialog } from "@/components/shared/report-dialog";
import type { Profile, ListingWithSeller, ReviewWithReviewer, Qualification } from "@/lib/types";

type Params = Promise<{ id: string }>;

export default async function ProfilePage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profileData) notFound();

  const profile = profileData as Profile;

  const [listingsRes, reviewsRes, qualificationsRes] =
    await Promise.all([
      supabase
        .from("listings")
        .select("*, profiles(*)")
        .eq("seller_id", id)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("reviews")
        .select("*, reviewer:profiles!reviewer_id(*)")
        .eq("reviewee_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("qualifications")
        .select("*")
        .eq("user_id", id)
        .is("listing_id", null),
    ]);

  const listings = (listingsRes.data ?? []) as unknown as ListingWithSeller[];
  const reviews = (reviewsRes.data ?? []) as unknown as ReviewWithReviewer[];
  const qualifications = (qualificationsRes.data ?? []) as unknown as Qualification[];

  // Check if viewer is authenticated (for report button)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <ProfileHeader profile={profile as Profile} />
        {user && !isOwnProfile && (
          <ReportDialog reportedUserId={id} />
        )}
      </div>
      <Separator className="my-6" />

      {qualifications && qualifications.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-3">Qualifications</h2>
          <div className="flex flex-wrap gap-2">
            {qualifications.map((q) => (
              <Card key={q.id}>
                <CardContent className="p-3 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {q.type}
                  </Badge>
                  <span className="text-sm font-medium">{q.title}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings">
            Listings ({listings.length})
          </TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews ({reviews.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="listings" className="mt-4">
          {listings.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {listings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              No listings yet.
            </p>
          )}
        </TabsContent>
        <TabsContent value="reviews" className="mt-4">
          <ReviewList reviews={reviews} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
