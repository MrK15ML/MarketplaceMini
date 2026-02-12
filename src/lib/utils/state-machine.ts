import type { JobRequestStatus } from "@/lib/types";

export type Role = "customer" | "seller";

type TransitionRule = {
  to: JobRequestStatus;
  allowedBy: Role;
  label: string;
};

export const JOB_STATUS_TRANSITIONS: Record<JobRequestStatus, TransitionRule[]> = {
  pending: [
    { to: "clarifying", allowedBy: "seller", label: "Start Discussion" },
    { to: "offered", allowedBy: "seller", label: "Send Offer" },
    { to: "declined", allowedBy: "seller", label: "Decline Request" },
    { to: "cancelled", allowedBy: "customer", label: "Cancel Request" },
  ],
  clarifying: [
    { to: "offered", allowedBy: "seller", label: "Send Offer" },
    { to: "declined", allowedBy: "seller", label: "Decline Request" },
    { to: "cancelled", allowedBy: "customer", label: "Cancel Request" },
  ],
  offered: [
    { to: "accepted", allowedBy: "customer", label: "Accept Offer" },
    { to: "clarifying", allowedBy: "customer", label: "Ask Questions" },
    { to: "declined", allowedBy: "customer", label: "Decline Offer" },
    { to: "cancelled", allowedBy: "customer", label: "Cancel Request" },
    { to: "offered", allowedBy: "seller", label: "Revise Offer" },
  ],
  accepted: [
    { to: "in_progress", allowedBy: "seller", label: "Start Work" },
    { to: "cancelled", allowedBy: "customer", label: "Cancel" },
    { to: "cancelled", allowedBy: "seller", label: "Cancel" },
  ],
  in_progress: [
    { to: "completed", allowedBy: "seller", label: "Mark Complete" },
  ],
  completed: [
    { to: "reviewed", allowedBy: "customer", label: "Submit Review" },
    { to: "reviewed", allowedBy: "seller", label: "Submit Review" },
  ],
  reviewed: [],
  cancelled: [],
  declined: [],
};

export function canTransition(
  currentStatus: JobRequestStatus,
  targetStatus: JobRequestStatus,
  role: Role
): boolean {
  const rules = JOB_STATUS_TRANSITIONS[currentStatus];
  return rules.some((r) => r.to === targetStatus && r.allowedBy === role);
}

export function getAvailableTransitions(
  currentStatus: JobRequestStatus,
  role: Role
): TransitionRule[] {
  return JOB_STATUS_TRANSITIONS[currentStatus].filter(
    (r) => r.allowedBy === role
  );
}
