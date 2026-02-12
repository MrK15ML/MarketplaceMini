"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitReport } from "@/lib/supabase/actions";
import { REPORT_REASONS } from "@/lib/constants";
import { toast } from "sonner";
import { Flag } from "lucide-react";

interface ReportDialogProps {
  reportedUserId?: string;
  reportedListingId?: string;
  children?: React.ReactNode;
}

export function ReportDialog({
  reportedUserId,
  reportedListingId,
  children,
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }

    setSubmitting(true);
    const result = await submitReport({
      reportedUserId,
      reportedListingId,
      reason,
      description: description.trim() || undefined,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Report submitted. We'll review it shortly.");
      setOpen(false);
      setReason("");
      setDescription("");
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Flag className="h-4 w-4 mr-1" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Reason</p>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Details (optional)
            </p>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context about the issue..."
              rows={4}
              maxLength={2000}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            className="w-full"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
