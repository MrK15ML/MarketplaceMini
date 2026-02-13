import type { JobRequestStatus } from "@/lib/types";

export type TimelineStepStatus = "completed" | "current" | "upcoming" | "terminal";

export interface TimelineStep {
  label: string;
  status: TimelineStepStatus;
}

const HAPPY_PATH_STEPS: Array<{ key: string; label: string }> = [
  { key: "pending", label: "Requested" },
  { key: "clarifying", label: "Discussing" },
  { key: "offered", label: "Offered" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "reviewed", label: "Reviewed" },
];

export function getTimelineSteps(currentStatus: JobRequestStatus): TimelineStep[] {
  if (currentStatus === "cancelled") {
    return [{ label: "Cancelled", status: "terminal" }];
  }
  if (currentStatus === "declined") {
    return [{ label: "Declined", status: "terminal" }];
  }

  const currentIndex = HAPPY_PATH_STEPS.findIndex((s) => s.key === currentStatus);

  return HAPPY_PATH_STEPS.map((step, idx) => ({
    label: step.label,
    status:
      idx < currentIndex
        ? "completed"
        : idx === currentIndex
          ? "current"
          : "upcoming",
  }));
}
