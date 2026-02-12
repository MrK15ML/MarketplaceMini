"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Store, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NZ_CITIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

type Role = "buyer" | "seller" | "both";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleComplete() {
    if (!role || !city) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Please sign in first");
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        is_seller: role === "seller" || role === "both",
        bio: bio || null,
        location_city: city,
      })
      .eq("id", user.id);

    setIsSubmitting(false);

    if (error) {
      toast.error("Failed to update profile. Please try again.");
      return;
    }

    toast.success("Profile set up! Welcome to Handshake.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to Handshake</CardTitle>
        <CardDescription>
          {step === 1
            ? "How will you use the platform?"
            : "Tell us a bit about yourself"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-3">
              {(
                [
                  {
                    value: "buyer",
                    label: "I want to hire",
                    desc: "Find people to help with tasks and services",
                    icon: ShoppingBag,
                  },
                  {
                    value: "seller",
                    label: "I want to offer services",
                    desc: "List your skills and get hired",
                    icon: Store,
                  },
                  {
                    value: "both",
                    label: "Both",
                    desc: "Hire people and offer your own services",
                    icon: ArrowRight,
                  },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRole(option.value)}
                  className={cn(
                    "flex items-center gap-4 rounded-lg border p-4 text-left transition-colors",
                    role === option.value
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  )}
                >
                  <option.icon className="h-6 w-6 shrink-0" />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {option.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <Button
              className="w-full"
              disabled={!role}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent>
                  {NZ_CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                placeholder="Tell people a bit about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/500 characters
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleComplete}
                disabled={!city || isSubmitting}
              >
                {isSubmitting ? "Setting up..." : "Get Started"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
