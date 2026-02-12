import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/jobs/status-badge";
import { CategoryBadge } from "@/components/listings/category-badge";
import { JobRequestForm } from "@/components/jobs/job-request-form";
import { formatDistanceToNow } from "date-fns";
import type { Listing } from "@/lib/types";

type SearchParams = Promise<{
  new?: string;
  listing?: string;
}>;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // If creating a new job request
  if (params.new === "true" && params.listing) {
    const { data: listing } = await supabase
      .from("listings")
      .select("*")
      .eq("id", params.listing)
      .single();

    if (listing) {
      return (
        <div className="max-w-2xl mx-auto">
          <JobRequestForm
            listing={listing as unknown as Listing}
            customerId={user.id}
          />
        </div>
      );
    }
  }

  // Fetch job requests as customer and seller
  const [{ data: asCustomer }, { data: asSeller }] = await Promise.all([
    supabase
      .from("job_requests")
      .select("*, listing:listings(title, category), seller:profiles!seller_id(display_name)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("job_requests")
      .select("*, listing:listings(title, category), customer:profiles!customer_id(display_name)")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Jobs</h1>
      <p className="text-muted-foreground mb-6">
        Manage your job requests and active deals
      </p>

      <Tabs defaultValue="customer">
        <TabsList>
          <TabsTrigger value="customer">
            My Requests ({asCustomer?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="seller">
            Incoming ({asSeller?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="mt-4">
          <JobList
            jobs={asCustomer ?? []}
            nameField="seller"
            emptyMessage="You haven't sent any job requests yet. Browse listings to get started."
          />
        </TabsContent>

        <TabsContent value="seller" className="mt-4">
          <JobList
            jobs={asSeller ?? []}
            nameField="customer"
            emptyMessage="No incoming job requests yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JobList({
  jobs,
  nameField,
  emptyMessage,
}: {
  jobs: Array<Record<string, unknown>>;
  nameField: string;
  emptyMessage: string;
}) {
  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground py-8">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const listing = job.listing as { title: string; category: string } | null;
        const person = job[nameField] as { display_name: string } | null;

        return (
          <Link key={job.id as string} href={`/jobs/${job.id}`}>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">
                        {listing?.title ?? "Unknown listing"}
                      </h3>
                      <StatusBadge status={job.status as string} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {job.description as string}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {listing?.category && (
                        <CategoryBadge category={listing.category} />
                      )}
                      <span>
                        with {person?.display_name ?? "Unknown"}
                      </span>
                      <span>
                        {formatDistanceToNow(
                          new Date(job.created_at as string),
                          { addSuffix: true }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
