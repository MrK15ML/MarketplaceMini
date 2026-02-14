import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Jobs",
  description: "View and manage your job requests and deals on Handshake.",
};
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/jobs/status-badge";
import { CategoryBadge } from "@/components/listings/category-badge";
import { JobRequestForm } from "@/components/jobs/job-request-form";
import { MessageSquare } from "lucide-react";
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

  // Fetch unread message counts per job
  const allJobs = [...(asCustomer ?? []), ...(asSeller ?? [])];
  const unreadByJob: Record<string, number> = {};

  if (allJobs.length > 0) {
    const { data: unreadData } = await supabase
      .from("messages")
      .select("job_request_id")
      .neq("sender_id", user.id)
      .is("read_at", null);

    if (unreadData) {
      for (const row of unreadData) {
        const jrId = (row as { job_request_id: string }).job_request_id;
        unreadByJob[jrId] = (unreadByJob[jrId] || 0) + 1;
      }
    }
  }

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
            unreadByJob={unreadByJob}
            emptyMessage="You haven't sent any job requests yet. Browse listings to get started."
          />
        </TabsContent>

        <TabsContent value="seller" className="mt-4">
          <JobList
            jobs={asSeller ?? []}
            nameField="customer"
            unreadByJob={unreadByJob}
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
  unreadByJob,
  emptyMessage,
}: {
  jobs: Array<Record<string, unknown>>;
  nameField: string;
  unreadByJob: Record<string, number>;
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
        const unread = unreadByJob[job.id as string] ?? 0;

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
                      {unread > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                          <MessageSquare className="h-3 w-3" />
                          {unread}
                        </span>
                      )}
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
