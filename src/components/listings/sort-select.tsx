"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LISTING_SORT_OPTIONS } from "@/lib/constants";

export function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "best_match";

  function handleSortChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "best_match") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <Select value={currentSort} onValueChange={handleSortChange}>
      <SelectTrigger className="w-full sm:w-44">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {LISTING_SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
