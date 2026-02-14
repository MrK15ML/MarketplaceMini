import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/jobs/status-badge";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages | Handshake",
  description: "Your conversations from job requests on Handshake.",
};

type ConversationRow = {
  id: string;
  status: string;
  customer_id: string;
  seller_id: string;
  updated_at: string;
  listing: { title: string } | null;
  customer: { id: string; display_name: string; avatar_url: string | null } | null;
  seller: { id: string; display_name: string; avatar_url: string | null } | null;
};

export default async function MessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Single query with joins — replaces N+1 pattern
  const { data: jobsData } = await supabase
    .from("job_requests")
    .select(`
      id, status, customer_id, seller_id, updated_at,
      listing:listings(title),
      customer:profiles!customer_id(id, display_name, avatar_url),
      seller:profiles!seller_id(id, display_name, avatar_url)
    `)
    .or(`customer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  const jobs = (jobsData ?? []) as unknown as ConversationRow[];

  // Batch fetch latest messages and unread counts for all jobs in 2 queries
  const jobIds = jobs.map((j) => j.id);

  // Get latest message per job — use a single query ordered by created_at desc
  // and then pick the first per job_request_id client-side
  const [{ data: messagesData }, { data: unreadData }] = await Promise.all([
    jobIds.length > 0
      ? supabase
          .from("messages")
          .select("job_request_id, content, message_type, created_at")
          .in("job_request_id", jobIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    jobIds.length > 0
      ? supabase
          .from("messages")
          .select("job_request_id")
          .in("job_request_id", jobIds)
          .neq("sender_id", user.id)
          .is("read_at", null)
      : Promise.resolve({ data: [] }),
  ]);

  // Build lookup maps
  const latestMessageMap = new Map<string, { content: string; message_type: string; created_at: string }>();
  for (const msg of messagesData ?? []) {
    if (!latestMessageMap.has(msg.job_request_id)) {
      latestMessageMap.set(msg.job_request_id, msg);
    }
  }

  const unreadCountMap = new Map<string, number>();
  for (const msg of unreadData ?? []) {
    unreadCountMap.set(msg.job_request_id, (unreadCountMap.get(msg.job_request_id) ?? 0) + 1);
  }

  // Sort by latest message time, then job updated_at
  const sorted = jobs
    .map((job) => {
      const otherParty = job.customer_id === user.id ? job.seller : job.customer;
      const lastMessage = latestMessageMap.get(job.id);
      const unreadCount = unreadCountMap.get(job.id) ?? 0;
      const sortTime = lastMessage?.created_at ?? job.updated_at;
      return { job, otherParty, listingTitle: job.listing?.title ?? "Unknown Listing", lastMessage, unreadCount, sortTime };
    })
    .sort((a, b) => new Date(b.sortTime).getTime() - new Date(a.sortTime).getTime());

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Messages</h1>
      <p className="text-muted-foreground mb-6">
        Conversations from your job requests
      </p>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No conversations yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              When you submit a job request or receive one, conversations will
              appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map(({ job, otherParty, listingTitle, lastMessage, unreadCount }) => {
            const initials = otherParty
              ? otherParty.display_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "??";

            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={otherParty?.avatar_url ?? undefined}
                        />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm truncate">
                          {otherParty?.display_name ?? "Unknown"}
                        </span>
                        <StatusBadge status={job.status} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {listingTitle}
                      </p>
                      {lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {lastMessage.content}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground shrink-0">
                      {lastMessage
                        ? formatDistanceToNow(
                            new Date(lastMessage.created_at),
                            { addSuffix: true }
                          )
                        : formatDistanceToNow(new Date(job.updated_at), {
                            addSuffix: true,
                          })}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
