"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { instantBook } from "@/lib/supabase/actions";
import { toast } from "sonner";

export function InstantBookButton({
  listingId,
  listingTitle,
  price,
  currency = "NZD",
}: {
  listingId: string;
  listingTitle: string;
  price: number;
  currency?: string;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleBook = () => {
    startTransition(async () => {
      const result = await instantBook({
        listingId,
        description: description || `Instant booking for: ${listingTitle}`,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Booking confirmed! Deal created.");
        setOpen(false);
        router.push("/jobs");
        router.refresh();
      }
    });
  };

  const formattedPrice = new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency,
  }).format(price);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:opacity-90 transition-opacity border-0">
          <Zap className="mr-2 h-4 w-4" />
          Instant Book — {formattedPrice}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Instant Booking</DialogTitle>
          <DialogDescription>
            You&apos;re booking &quot;{listingTitle}&quot; at {formattedPrice}. A deal will be
            created immediately — no negotiation needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="booking-notes">Notes for the seller (optional)</Label>
          <Textarea
            id="booking-notes"
            placeholder="Any specific requirements or preferred timing..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleBook}
            disabled={isPending}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:opacity-90 border-0"
          >
            {isPending ? "Booking..." : `Confirm — ${formattedPrice}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
