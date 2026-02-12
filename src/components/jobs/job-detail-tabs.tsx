"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ChatMessages } from "@/components/messaging/chat-messages";
import { ChatInput } from "@/components/messaging/chat-input";
import { OfferList } from "./offer-list";
import { DealSummary } from "./deal-summary";
import { ReviewForm } from "@/components/reviews/review-form";
import { useRealtimeMessages } from "@/lib/hooks/use-realtime-messages";
import { useRealtimeJobStatus } from "@/lib/hooks/use-realtime-job-status";
import type {
  MessageWithSender,
  Offer,
  Deal,
  Profile,
} from "@/lib/types";

interface JobDetailTabsProps {
  jobRequestId: string;
  initialStatus: string;
  currentUserId: string;
  isCustomer: boolean;
  isSeller: boolean;
  initialMessages: MessageWithSender[];
  offers: Offer[];
  deal: Deal | null;
  customer: Profile;
  seller: Profile;
  hasReviewed: boolean;
}

export function JobDetailTabs({
  jobRequestId,
  initialStatus,
  currentUserId,
  isCustomer,
  isSeller,
  initialMessages,
  offers,
  deal,
  customer,
  seller,
  hasReviewed,
}: JobDetailTabsProps) {
  const messages = useRealtimeMessages(jobRequestId, initialMessages);
  const status = useRealtimeJobStatus(jobRequestId, initialStatus);

  const isTerminal = ["completed", "reviewed", "cancelled", "declined"].includes(status);
  const chatDisabled = ["reviewed", "cancelled", "declined"].includes(status);

  const hasDeal = !!deal;
  const defaultTab = hasDeal ? "deal" : offers.length > 0 ? "offers" : "chat";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="chat">
          Chat
          {messages.filter((m) => m.message_type === "text").length > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({messages.filter((m) => m.message_type === "text").length})
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="offers">
          Offers
          {offers.length > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({offers.length})
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="deal" disabled={!hasDeal}>
          Deal
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chat">
        <Card className="flex flex-col h-[450px]">
          <ChatMessages messages={messages} currentUserId={currentUserId} />
          <ChatInput
            jobRequestId={jobRequestId}
            disabled={chatDisabled}
          />
        </Card>
      </TabsContent>

      <TabsContent value="offers">
        <OfferList
          offers={offers}
          jobRequestId={jobRequestId}
          isCustomer={isCustomer}
          isSeller={isSeller}
          jobStatus={status}
        />
      </TabsContent>

      <TabsContent value="deal">
        <div className="space-y-4">
          {deal && (
            <DealSummary
              deal={deal}
              customer={customer}
              seller={seller}
              jobRequestId={jobRequestId}
              jobStatus={status}
              isCustomer={isCustomer}
              isSeller={isSeller}
            />
          )}
          {deal &&
            (status === "completed" || status === "reviewed") &&
            !hasReviewed && (
              <ReviewForm
                dealId={deal.id}
                revieweeName={
                  isCustomer ? seller.display_name : customer.display_name
                }
              />
            )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
