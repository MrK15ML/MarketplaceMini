import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingForm } from "@/components/listings/listing-form";
import type { Listing } from "@/lib/types";

type Params = Promise<{ id: string }>;

export default async function EditListingPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listingData } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!listingData) notFound();

  const listing = listingData as Listing;
  if (listing.seller_id !== user.id) redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Listing</h1>
      <ListingForm listing={listing} userId={user.id} />
    </div>
  );
}
