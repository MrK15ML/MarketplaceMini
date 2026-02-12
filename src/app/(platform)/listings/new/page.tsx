import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingForm } from "@/components/listings/listing-form";

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_seller")
    .eq("id", user.id)
    .single();

  const isSeller = (profile as { is_seller: boolean } | null)?.is_seller;
  if (!isSeller) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Seller account required</h1>
        <p className="text-muted-foreground">
          You need to set up your profile as a seller before creating listings.
          Update your role in Settings.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create a New Listing</h1>
      <ListingForm userId={user.id} />
    </div>
  );
}
