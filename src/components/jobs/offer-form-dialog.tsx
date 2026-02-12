"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { offerSchema, type OfferFormValues } from "@/lib/validations/offer";
import { createOffer } from "@/lib/supabase/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Send } from "lucide-react";
import type { Offer } from "@/lib/types";

interface OfferFormDialogProps {
  jobRequestId: string;
  previousOffer?: Offer | null;
  children: React.ReactNode;
}

export function OfferFormDialog({
  jobRequestId,
  previousOffer,
  children,
}: OfferFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema) as any,
    defaultValues: {
      price: previousOffer?.price ?? 0,
      pricing_type: (previousOffer?.pricing_type as "fixed" | "hourly") ?? "fixed",
      estimated_duration: previousOffer?.estimated_duration ?? "",
      scope_description: previousOffer?.scope_description ?? "",
      valid_until: "",
    },
  });

  async function onSubmit(values: OfferFormValues) {
    setSubmitting(true);
    const result = await createOffer({
      jobRequestId,
      price: values.price,
      pricingType: values.pricing_type,
      estimatedDuration: values.estimated_duration || undefined,
      scopeDescription: values.scope_description,
      validUntil: values.valid_until || undefined,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(previousOffer ? "Offer revised!" : "Offer sent!");
      setOpen(false);
      form.reset();
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {previousOffer ? "Revise Offer" : "Send an Offer"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (NZD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pricing_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pricing Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                        <SelectItem value="hourly">Hourly Rate</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="scope_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scope of Work</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe what's included in this offer..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimated_duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Duration (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., 2-3 hours" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valid_until"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offer Valid Until (optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={submitting} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              {submitting
                ? "Sending..."
                : previousOffer
                  ? "Send Revised Offer"
                  : "Send Offer"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
