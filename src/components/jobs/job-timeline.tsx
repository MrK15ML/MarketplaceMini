import { cn } from "@/lib/utils";
import { Check, XCircle } from "lucide-react";
import type { TimelineStep } from "@/lib/utils/job-timeline";

interface JobTimelineProps {
  steps: TimelineStep[];
}

export function JobTimeline({ steps }: JobTimelineProps) {
  // Terminal state (cancelled/declined)
  if (steps.length === 1 && steps[0].status === "terminal") {
    return (
      <div className="flex justify-center py-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-full text-sm font-medium">
          <XCircle className="h-4 w-4" />
          {steps[0].label}
        </div>
      </div>
    );
  }

  return (
    <div className="py-3 overflow-x-auto">
      <div className="flex items-center min-w-0">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center flex-1 min-w-0">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium transition-all",
                  step.status === "completed" &&
                    "border-primary bg-primary text-primary-foreground",
                  step.status === "current" &&
                    "border-primary bg-primary/10 text-primary ring-2 ring-primary/20",
                  step.status === "upcoming" &&
                    "border-muted-foreground/30 bg-background text-muted-foreground/50"
                )}
              >
                {step.status === "completed" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-[10px] text-center whitespace-nowrap hidden sm:block",
                  step.status === "current" && "font-semibold text-foreground",
                  step.status === "completed" && "text-muted-foreground",
                  step.status === "upcoming" && "text-muted-foreground/50"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-1",
                  steps[idx + 1].status === "completed" || steps[idx + 1].status === "current"
                    ? "bg-primary"
                    : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
