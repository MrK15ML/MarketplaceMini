"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  jobRequestSchema,
  type JobRequestFormValues,
} from "@/lib/validations/job-request";
import { createClient } from "@/lib/supabase/client";
import type { Listing } from "@/lib/types";

type JobRequestFormProps = {
  listing: Listing;
  customerId: string;
};

export function JobRequestForm({ listing, customerId }: JobRequestFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<JobRequestFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(jobRequestSchema) as any,
    defaultValues: {
      description: "",
      budget_min: undefined,
      budget_max: undefined,
      preferred_time: "",
      location: "",
      is_remote: listing.is_remote,
    },
  });

  async function onSubmit(values: JobRequestFormValues) {
    const { error } = await supabase.from("job_requests").insert({
      listing_id: listing.id,
      customer_id: customerId,
      seller_id: listing.seller_id,
      description: values.description,
      budget_min: values.budget_min ?? null,
      budget_max: values.budget_max ?? null,
      preferred_time: values.preferred_time || null,
      location: values.is_remote ? null : values.location || null,
      category: listing.category,
    });

    if (error) {
      toast.error("Failed to submit request. Please try again.");
      return;
    }

    toast.success("Job request sent! The seller will be notified.");
    router.push("/jobs");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request: {listing.title}</CardTitle>
        <CardDescription>
          Describe what you need and your budget. The seller will review your
          request.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What do you need?</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Describe the job in detail — what, where, any specific requirements..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budget_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Min (NZD)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="50"
                        value={field.value != null ? String(field.value) : ""}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, "");
                          if (raw === "") {
                            field.onChange(undefined);
                          } else {
                            field.onChange(parseInt(raw));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Max (NZD)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="150"
                        value={field.value != null ? String(field.value) : ""}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, "");
                          if (raw === "") {
                            field.onChange(undefined);
                          } else {
                            field.onChange(parseInt(raw));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferred_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Date/Time (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      min={(() => {
                        const now = new Date();
                        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                        return now.toISOString().slice(0, 16);
                      })()}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    When would you like the service?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!listing.is_remote && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 123 Lambton Quay, Wellington"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Sending..."
                  : "Send Job Request"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
