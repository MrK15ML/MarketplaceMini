"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { JobRequest, Offer } from "@/lib/types";

export async function signIn(formData: { email: string; password: string }) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(formData: {
  email: string;
  password: string;
  displayName: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        display_name: formData.displayName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// ============================================
// Messaging
// ============================================

export async function sendMessage(input: {
  jobRequestId: string;
  content: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify user is a participant
  const { data: jobData } = await supabase
    .from("job_requests")
    .select("*")
    .eq("id", input.jobRequestId)
    .single();

  if (!jobData) return { error: "Job request not found" };
  const job = jobData as JobRequest;
  if (job.customer_id !== user.id && job.seller_id !== user.id) {
    return { error: "Not authorized" };
  }

  const content = input.content.trim();
  if (!content || content.length > 2000) {
    return { error: "Message must be between 1 and 2000 characters" };
  }

  const { error } = await supabase.from("messages").insert({
    job_request_id: input.jobRequestId,
    sender_id: user.id,
    content,
    message_type: "text",
  });

  if (error) return { error: error.message };

  // Auto-transition pending → clarifying when first message is sent
  if (job.status === "pending") {
    await supabase
      .from("job_requests")
      .update({ status: "clarifying" })
      .eq("id", input.jobRequestId);

    await supabase.from("messages").insert({
      job_request_id: input.jobRequestId,
      sender_id: user.id,
      content: "Discussion started.",
      message_type: "status_change",
    });
  }

  revalidatePath(`/jobs/${input.jobRequestId}`);
  return {};
}

// ============================================
// Offers
// ============================================

export async function createOffer(input: {
  jobRequestId: string;
  price: number;
  pricingType: string;
  estimatedDuration?: string;
  scopeDescription: string;
  validUntil?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify user is the seller
  const { data: jobRaw } = await supabase
    .from("job_requests")
    .select("*")
    .eq("id", input.jobRequestId)
    .single();

  if (!jobRaw) return { error: "Job request not found" };
  const job = jobRaw as JobRequest;
  if (job.seller_id !== user.id) return { error: "Only the seller can create offers" };

  if (input.price <= 0) return { error: "Price must be positive" };
  if (!input.scopeDescription || input.scopeDescription.length < 10) {
    return { error: "Scope description must be at least 10 characters" };
  }

  // Get next version number
  const { data: existingOffers } = await supabase
    .from("offers")
    .select("version")
    .eq("job_request_id", input.jobRequestId)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = existingOffers && existingOffers.length > 0
    ? (existingOffers[0] as { version: number }).version + 1
    : 1;

  // Supersede any pending offers
  await supabase
    .from("offers")
    .update({ status: "superseded" })
    .eq("job_request_id", input.jobRequestId)
    .eq("status", "pending");

  // Insert new offer
  const { data: offer, error } = await supabase
    .from("offers")
    .insert({
      job_request_id: input.jobRequestId,
      version: nextVersion,
      seller_id: user.id,
      price: input.price,
      pricing_type: input.pricingType,
      estimated_duration: input.estimatedDuration || null,
      scope_description: input.scopeDescription,
      valid_until: input.validUntil || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Update job status to offered
  await supabase
    .from("job_requests")
    .update({ status: "offered" })
    .eq("id", input.jobRequestId);

  // Insert system message
  await supabase.from("messages").insert({
    job_request_id: input.jobRequestId,
    sender_id: user.id,
    content: `Offer v${nextVersion} sent. Review it in the Offers tab.`,
    message_type: "offer_notification",
  });

  revalidatePath(`/jobs/${input.jobRequestId}`);
  return { offerId: (offer as { id: string }).id };
}

export async function acceptOffer(input: { offerId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch offer to get job_request_id for revalidation and system message
  const { data: offerData } = await supabase
    .from("offers")
    .select("*")
    .eq("id", input.offerId)
    .single();

  if (!offerData) return { error: "Offer not found" };
  const offer = offerData as Offer;

  // Use the atomic DB function (SECURITY DEFINER bypasses RLS)
  const { data: dealId, error } = await supabase.rpc("accept_offer", {
    p_offer_id: input.offerId,
    p_customer_id: user.id,
  });

  if (error) return { error: error.message };

  // System message
  await supabase.from("messages").insert({
    job_request_id: offer.job_request_id,
    sender_id: user.id,
    content: `Offer v${offer.version} accepted — deal created!`,
    message_type: "status_change",
  });

  revalidatePath(`/jobs/${offer.job_request_id}`);
  return { dealId: dealId as string };
}

export async function declineOffer(input: { offerId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: offerData } = await supabase
    .from("offers")
    .select("*")
    .eq("id", input.offerId)
    .single();

  if (!offerData) return { error: "Offer not found" };
  const declineOfferRow = offerData as Offer;

  if (declineOfferRow.status !== "pending") return { error: "Offer is not pending" };

  // Fetch job to verify customer
  const { data: declineJobData } = await supabase
    .from("job_requests")
    .select("*")
    .eq("id", declineOfferRow.job_request_id)
    .single();

  if (!declineJobData || (declineJobData as JobRequest).customer_id !== user.id) {
    return { error: "Only the customer can decline offers" };
  }

  const { error } = await supabase
    .from("offers")
    .update({ status: "declined" })
    .eq("id", input.offerId);

  if (error) return { error: error.message };

  await supabase.from("messages").insert({
    job_request_id: declineOfferRow.job_request_id,
    sender_id: user.id,
    content: `Offer v${declineOfferRow.version} declined.`,
    message_type: "status_change",
  });

  revalidatePath(`/jobs/${declineOfferRow.job_request_id}`);
  return {};
}

// ============================================
// Job Status Transitions
// ============================================

export async function transitionJobStatus(input: {
  jobRequestId: string;
  targetStatus: string;
}) {
  const { canTransition } = await import("@/lib/utils/state-machine");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: transitionJobData } = await supabase
    .from("job_requests")
    .select("*")
    .eq("id", input.jobRequestId)
    .single();

  if (!transitionJobData) return { error: "Job request not found" };
  const transitionJob = transitionJobData as JobRequest;

  // Determine role
  let role: "customer" | "seller";
  if (transitionJob.customer_id === user.id) role = "customer";
  else if (transitionJob.seller_id === user.id) role = "seller";
  else return { error: "Not authorized" };

  const currentStatus = transitionJob.status as import("@/lib/types").JobRequestStatus;
  const targetStatus = input.targetStatus as import("@/lib/types").JobRequestStatus;

  if (!canTransition(currentStatus, targetStatus, role)) {
    return { error: `Cannot transition from ${currentStatus} to ${targetStatus}` };
  }

  const { error } = await supabase
    .from("job_requests")
    .update({ status: input.targetStatus })
    .eq("id", input.jobRequestId);

  if (error) return { error: error.message };

  // Update deal timestamps for relevant transitions
  if (input.targetStatus === "in_progress") {
    await supabase
      .from("deals")
      .update({ started_at: new Date().toISOString() })
      .eq("job_request_id", input.jobRequestId)
      .eq("status", "active");
  }

  if (input.targetStatus === "completed") {
    await supabase
      .from("deals")
      .update({
        completed_at: new Date().toISOString(),
        status: "completed",
      })
      .eq("job_request_id", input.jobRequestId)
      .eq("status", "active");
  }

  if (input.targetStatus === "cancelled") {
    // Cancel any active deals
    await supabase
      .from("deals")
      .update({ status: "cancelled" })
      .eq("job_request_id", input.jobRequestId)
      .eq("status", "active");

    // Supersede any pending offers
    await supabase
      .from("offers")
      .update({ status: "superseded" })
      .eq("job_request_id", input.jobRequestId)
      .eq("status", "pending");
  }

  // System message
  const statusLabels: Record<string, string> = {
    clarifying: "Discussion started",
    offered: "Offer sent",
    accepted: "Offer accepted",
    in_progress: "Work has started",
    completed: "Work marked as complete",
    reviewed: "Reviews submitted",
    cancelled: "Request cancelled",
    declined: "Request declined",
  };

  await supabase.from("messages").insert({
    job_request_id: input.jobRequestId,
    sender_id: user.id,
    content: statusLabels[input.targetStatus] || `Status changed to ${input.targetStatus}.`,
    message_type: "status_change",
  });

  revalidatePath(`/jobs/${input.jobRequestId}`);
  return {};
}

// ============================================
// Reviews
// ============================================

export async function submitReview(input: {
  dealId: string;
  rating: number;
  rating_communication?: number;
  rating_quality?: number;
  rating_reliability?: number;
  comment?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (input.rating < 1 || input.rating > 5) {
    return { error: "Rating must be between 1 and 5" };
  }

  const { data: dealRaw } = await supabase
    .from("deals")
    .select("*")
    .eq("id", input.dealId)
    .single();

  if (!dealRaw) return { error: "Deal not found" };
  const deal = dealRaw as import("@/lib/types").Deal;

  if (deal.customer_id !== user.id && deal.seller_id !== user.id) {
    return { error: "Not authorized" };
  }

  // Determine reviewee
  const revieweeId = user.id === deal.customer_id ? deal.seller_id : deal.customer_id;

  // Check for existing review
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("deal_id", input.dealId)
    .eq("reviewer_id", user.id)
    .single();

  if (existingReview) return { error: "You have already reviewed this deal" };

  const { error } = await supabase.from("reviews").insert({
    deal_id: input.dealId,
    reviewer_id: user.id,
    reviewee_id: revieweeId,
    rating: input.rating,
    rating_communication: input.rating_communication || null,
    rating_quality: input.rating_quality || null,
    rating_reliability: input.rating_reliability || null,
    comment: input.comment || null,
  });

  if (error) return { error: error.message };

  // Update reviewee's average rating using DB function (handles category averages)
  await supabase.rpc("update_profile_rating", { p_reviewee_id: revieweeId });

  // Check if both parties reviewed — transition to "reviewed"
  const { data: reviews } = await supabase
    .from("reviews")
    .select("reviewer_id")
    .eq("deal_id", input.dealId);

  const reviewerIds = (reviews || []).map((r: { reviewer_id: string }) => r.reviewer_id);
  const bothReviewed =
    reviewerIds.includes(deal.customer_id) && reviewerIds.includes(deal.seller_id);

  if (bothReviewed) {
    await supabase
      .from("job_requests")
      .update({ status: "reviewed" })
      .eq("id", deal.job_request_id);
  }

  // System message
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const name = profile ? (profile as { display_name: string }).display_name : "Someone";
  await supabase.from("messages").insert({
    job_request_id: deal.job_request_id,
    sender_id: user.id,
    content: `${name} left a review.`,
    message_type: "system",
  });

  revalidatePath(`/jobs/${deal.job_request_id}`);
  return {};
}

// ============================================
// Reports
// ============================================

export async function submitReport(input: {
  reportedUserId?: string;
  reportedListingId?: string;
  reason: string;
  description?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!input.reason || input.reason.length < 3) {
    return { error: "Please provide a reason" };
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_user_id: input.reportedUserId || null,
    reported_listing_id: input.reportedListingId || null,
    reason: input.reason,
    description: input.description || null,
  });

  if (error) return { error: error.message };
  return {};
}

// ============================================
// Message Read Tracking
// ============================================

export async function markMessagesAsRead(input: { jobRequestId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("job_request_id", input.jobRequestId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (error) return { error: error.message };
  return {};
}

// ============================================
// Seller Scoring
// ============================================

export async function recalculateSellerScore(sellerId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("recalculate_handshake_score", {
    p_seller_id: sellerId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/profile/${sellerId}`);
  return {};
}

export async function getSellerStats(sellerId: string): Promise<{
  stats: import("@/lib/types").SellerStats | null;
  averages: import("@/lib/types").PlatformAverages | null;
  error?: string;
}> {
  const { getTrustTier } = await import("@/lib/utils/seller-score");
  const supabase = await createClient();

  const [profileRes, avgRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("handshake_score, avg_rating, total_reviews, total_completed_deals, avg_response_hours, completion_rate")
      .eq("id", sellerId)
      .single(),
    supabase
      .from("platform_seller_averages")
      .select("*")
      .single(),
  ]);

  if (profileRes.error) return { stats: null, averages: null, error: profileRes.error.message };

  const profile = profileRes.data as {
    handshake_score: number;
    avg_rating: number;
    total_reviews: number;
    total_completed_deals: number;
    avg_response_hours: number | null;
    completion_rate: number | null;
  };

  const stats: import("@/lib/types").SellerStats = {
    ...profile,
    trust_tier: getTrustTier(profile.handshake_score, profile.total_completed_deals),
  };

  const averages = avgRes.data as import("@/lib/types").PlatformAverages | null;

  return { stats, averages };
}

export async function getFeaturedProviders(limit: number = 6) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, location_city, is_verified, avg_rating, total_reviews, handshake_score, total_completed_deals")
    .eq("is_seller", true)
    .gt("handshake_score", 0)
    .order("handshake_score", { ascending: false })
    .limit(limit);

  if (error) return { providers: [], error: error.message };
  return { providers: data ?? [] };
}
