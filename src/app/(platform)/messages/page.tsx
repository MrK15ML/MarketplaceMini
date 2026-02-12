import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/jobs/status-badge";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Profile, JobRequest, Message, Listing } from "@/lib/types";

export default async function MessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get all job requests where user is a participant
  const { data: jobsData } = await supabase
    .from("job_requests")
    .select("*")
    .or(`customer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .not("status", "in", '("cancelled","declined")')
    .order("updated_at", { ascending: false });

  const jobs = (jobsData ?? []) as JobRequest[];

  // For each job, get the other party's profile, listing title, and latest message
  const conversations = await Promise.all(
    jobs.map(async (job) => {
      const otherPartyId =
        job.customer_id === user.id ? job.seller_id : job.customer_id;

      const [{ data: profileData }, { data: listingData }, { data: lastMsgData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", otherPartyId)
            .single(),
          supabase
            .from("listings")
            .select("title")
            .eq("id", job.listing_id)
            .single(),
          supabase
            .from("messages")
            .select("*")
            .eq("job_request_id", job.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single(),
        ]);

      const otherParty = profileData as Profile | null;
      const listing = listingData as { title: string } | null;
      const lastMessage = lastMsgData as Message | null;

      // Count unread messages
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("job_request_id", job.id)
        .neq("sender_id", user.id)
        .is("read_at", null);

      return {
        job,
        otherParty,
        listingTitle: listing?.title ?? "Unknown Listing",
        lastMessage,
        unreadCount: count ?? 0,
      };
    })
  );

  // Sort by last message time, then by job updated_at
  const sorted = conversations.sort((a, b) => {
    const aTime = a.lastMessage?.created_at ?? a.job.updated_at;
    const bTime = b.lastMessage?.created_at ?? b.job.updated_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

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
                          {lastMessage.message_type === "text"
                            ? lastMessage.content
                            : lastMessage.content}
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
