"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";
import { SortSelect } from "@/components/listings/sort-select";
import { Search, X } from "lucide-react";

export function ListingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") ?? "";
  const currentSearch = searchParams.get("q") ?? "";
  const currentRemote = searchParams.get("remote") ?? "";
  const currentSort = searchParams.get("sort") ?? "";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/listings?${params.toString()}`);
    },
    [router, searchParams]
  );

  function clearFilters() {
    router.push("/listings");
  }

  const hasFilters = currentCategory || currentSearch || currentRemote || currentSort;

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          className="pl-9"
          defaultValue={currentSearch}
          onChange={(e) => {
            const timeout = setTimeout(() => {
              updateParams("q", e.target.value);
            }, 300);
            return () => clearTimeout(timeout);
          }}
        />
      </div>

      <Select
        value={currentCategory}
        onValueChange={(v) => updateParams("category", v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentRemote}
        onValueChange={(v) => updateParams("remote", v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="All locations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All locations</SelectItem>
          <SelectItem value="true">Remote only</SelectItem>
          <SelectItem value="false">Local only</SelectItem>
        </SelectContent>
      </Select>

      <SortSelect />

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
