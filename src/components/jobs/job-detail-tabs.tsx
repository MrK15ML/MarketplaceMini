"use client";

import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ChatMessages } from "@/components/messaging/chat-messages";
import { ChatInput } from "@/components/messaging/chat-input";
import { OfferList } from "./offer-list";
import { DealSummary } from "./deal-summary";
import { ReviewForm } from "@/components/reviews/review-form";
import { useRealtimeMessages } from "@/lib/hooks/use-realtime-messages";
import { useRealtimeJobStatus } from "@/lib/hooks/use-realtime-job-status";
import { markMessagesAsRead } from "@/lib/supabase/actions";
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
  currentUserName: string;
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
  currentUserName,
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
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Count unread messages (from other party, not yet read)
  const unreadCount = messages.filter(
    (m) => m.sender_id !== currentUserId && !m.read_at
  ).length;

  // Mark messages as read when chat tab is active
  const markAsRead = useCallback(() => {
    if (activeTab === "chat" && unreadCount > 0) {
      markMessagesAsRead({ jobRequestId });
    }
  }, [activeTab, unreadCount, jobRequestId]);

  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  // Also mark as read when new messages arrive while chat tab is open
  useEffect(() => {
    if (activeTab === "chat") {
      const hasUnread = messages.some(
        (m) => m.sender_id !== currentUserId && !m.read_at
      );
      if (hasUnread) {
        markMessagesAsRead({ jobRequestId });
      }
    }
  }, [messages, activeTab, currentUserId, jobRequestId]);

  const otherPartyName = isCustomer ? seller.display_name : customer.display_name;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="chat" className="relative">
          Chat
          {unreadCount > 0 && activeTab !== "chat" && (
            <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          {unreadCount === 0 && messages.filter((m) => m.message_type === "text").length > 0 && (
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
          <ChatMessages
            messages={messages}
            currentUserId={currentUserId}
            isCustomer={isCustomer}
            otherPartyName={otherPartyName}
          />
          <ChatInput
            jobRequestId={jobRequestId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
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
