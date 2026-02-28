"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/shared/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIES, PRICING_TYPES, LICENSED_TRADE_TYPES } from "@/lib/constants";
import { listingSchema, type ListingFormValues } from "@/lib/validations/listing";
import { createListing, updateListing } from "@/lib/supabase/actions";
import type { Listing } from "@/lib/types";

type ListingFormProps = {
  listing?: Listing;
  userId: string;
};

export function ListingForm({ listing, userId }: ListingFormProps) {
  const router = useRouter();
  const isEditing = !!listing;
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    listing?.cover_image_url ?? null
  );
  const [instantBook, setInstantBook] = useState(listing?.instant_book ?? false);
  const [instantBookPrice, setInstantBookPrice] = useState<string>(
    listing?.instant_book_price != null ? String(listing.instant_book_price) : ""
  );

  const form = useForm<ListingFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(listingSchema) as any,
    defaultValues: {
      title: listing?.title ?? "",
      description: listing?.description ?? "",
      category: (listing?.category ?? "odd_jobs") as ListingFormValues["category"],
      subcategory: listing?.subcategory ?? "",
      pricing_type: (listing?.pricing_type ?? "fixed") as ListingFormValues["pricing_type"],
      price_fixed: listing?.price_fixed ?? undefined,
      price_min: listing?.price_min ?? undefined,
      price_max: listing?.price_max ?? undefined,
      is_remote: listing?.is_remote ?? false,
      location_radius_km: listing?.location_radius_km ?? undefined,
      requires_license: listing?.requires_license ?? false,
      license_type: listing?.license_type ?? "",
    },
  });

  const pricingType = form.watch("pricing_type");
  const category = form.watch("category");
  const isRemote = form.watch("is_remote");
  const requiresLicense = form.watch("requires_license");

  const selectedCategory = CATEGORIES.find((c) => c.value === category);

  async function onSubmit(values: ListingFormValues) {
    const payload = {
      title: values.title,
      description: values.description,
      category: values.category,
      subcategory: values.subcategory || null,
      pricing_type: values.pricing_type,
      price_fixed: values.pricing_type === "fixed" || values.pricing_type === "hourly" ? values.price_fixed ?? null : null,
      price_min: values.pricing_type === "range" ? values.price_min ?? null : null,
      price_max: values.pricing_type === "range" ? values.price_max ?? null : null,
      is_remote: values.is_remote,
      location_radius_km: values.is_remote ? null : values.location_radius_km ?? null,
      requires_license: values.requires_license,
      license_type: values.requires_license ? values.license_type || null : null,
      cover_image_url: coverImageUrl,
      instant_book: instantBook,
      instant_book_price: instantBook ? parseFloat(instantBookPrice) || null : null,
    };

    if (isEditing) {
      const { error } = await updateListing(listing.id, payload);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Listing updated");
      router.push(`/listing/${listing.id}`);
    } else {
      const { listingId, error } = await createListing(payload);
      if (error || !listingId) {
        toast.error(error ?? "Failed to create listing");
        return;
      }
      toast.success("Listing created!");
      router.push(`/listing/${listingId}`);
    }

    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Cover Image */}
        <Card>
          <CardHeader>
            <CardTitle>Cover Image</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              bucket="listing-images"
              folder={userId}
              currentUrl={coverImageUrl}
              onUpload={(url) => setCoverImageUrl(url)}
              onRemove={() => setCoverImageUrl(null)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Professional House Cleaning" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your service in detail..."
                      rows={4}
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedCategory && (
                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subcategory" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedCategory.subcategories.map((sub) => (
                            <SelectItem key={sub} value={sub}>
                              {sub}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="pricing_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pricing Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRICING_TYPES.map((pt) => (
                        <SelectItem key={pt.value} value={pt.value}>
                          {pt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(pricingType === "fixed" || pricingType === "hourly") && (
              <FormField
                control={form.control}
                name="price_fixed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {pricingType === "hourly" ? "Hourly Rate (NZD)" : "Price (NZD)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={field.value != null ? String(field.value) : ""}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9.]/g, "");
                          if (raw === "") {
                            field.onChange(undefined);
                          } else {
                            const num = parseFloat(raw);
                            if (!isNaN(num)) field.onChange(num);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {pricingType === "range" && (
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price_min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Price (NZD)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={field.value != null ? String(field.value) : ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9.]/g, "");
                            if (raw === "") {
                              field.onChange(undefined);
                            } else {
                              const num = parseFloat(raw);
                              if (!isNaN(num)) field.onChange(num);
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
                  name="price_max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Price (NZD)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={field.value != null ? String(field.value) : ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9.]/g, "");
                            if (raw === "") {
                              field.onChange(undefined);
                            } else {
                              const num = parseFloat(raw);
                              if (!isNaN(num)) field.onChange(num);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location & Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="is_remote"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>Remote Service</FormLabel>
                    <FormDescription>This service can be done remotely</FormDescription>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-5 w-5 rounded border-gray-300"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!isRemote && (
              <FormField
                control={form.control}
                name="location_radius_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Radius (km)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="25"
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
                    <FormDescription>How far you&apos;re willing to travel</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {category === "trades" && (
              <>
                <FormField
                  control={form.control}
                  name="requires_license"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Licensed Trade</FormLabel>
                        <FormDescription>
                          This service requires a professional license
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-5 w-5 rounded border-gray-300"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {requiresLicense && (
                  <FormField
                    control={form.control}
                    name="license_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select license type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LICENSED_TRADE_TYPES.map((lt) => (
                              <SelectItem key={lt} value={lt}>
                                {lt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Instant Book */}
        <Card>
          <CardHeader>
            <CardTitle>Instant Book</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Enable Instant Book</p>
                <p className="text-sm text-muted-foreground">
                  Customers can book immediately at a set price
                </p>
              </div>
              <input
                type="checkbox"
                checked={instantBook}
                onChange={(e) => setInstantBook(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300"
              />
            </div>

            {instantBook && (
              <div>
                <label className="text-sm font-medium">
                  Instant Book Price (NZD)
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="mt-1.5"
                  value={instantBookPrice}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, "");
                    setInstantBookPrice(raw);
                  }}
                />
                <p className="text-sm text-muted-foreground mt-1.5">
                  The fixed price customers pay when using Instant Book
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
                ? "Update Listing"
                : "Create Listing"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
