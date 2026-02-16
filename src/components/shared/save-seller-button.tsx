"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleSaveSeller } from "@/lib/supabase/actions";
import { cn } from "@/lib/utils";

export function SaveSellerButton({
  sellerId,
  initialSaved,
  variant = "icon",
}: {
  sellerId: string;
  initialSaved: boolean;
  variant?: "icon" | "full";
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleSaveSeller(sellerId);
      if (!result.error) {
        setSaved(result.saved);
      }
    });
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleToggle();
        }}
        disabled={isPending}
        aria-label={saved ? "Remove from saved" : "Save seller"}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            saved ? "fill-red-500 text-red-500" : "text-muted-foreground"
          )}
        />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      }}
      disabled={isPending}
      className={cn(saved && "border-red-200 bg-red-50 hover:bg-red-100 text-red-600")}
    >
      <Heart
        className={cn(
          "h-4 w-4 mr-1.5",
          saved ? "fill-red-500 text-red-500" : ""
        )}
      />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
