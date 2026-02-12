"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  profileUpdateSchema,
  type ProfileUpdateValues,
} from "@/lib/validations/profile";
import { NZ_CITIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      display_name: "",
      bio: "",
      location_city: "",
    },
  });

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const p = data as Profile;
        setProfile(p);
        form.reset({
          display_name: p.display_name,
          bio: p.bio ?? "",
          location_city: p.location_city ?? "",
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase, form]);

  async function onSubmit(values: ProfileUpdateValues) {
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: values.display_name,
        bio: values.bio || null,
        location_city: values.location_city || null,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to update profile");
      return;
    }

    toast.success("Profile updated");
    router.refresh();
  }

  async function toggleSellerMode() {
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_seller: !profile.is_seller })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to update seller status");
      return;
    }

    setProfile({ ...profile, is_seller: !profile.is_seller });
    toast.success(
      profile.is_seller
        ? "Seller mode disabled"
        : "Seller mode enabled — you can now create listings!"
    );
    router.refresh();
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your public profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Tell people about yourself..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your city" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NZ_CITIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seller Mode</CardTitle>
            <CardDescription>
              {profile?.is_seller
                ? "You're currently registered as a seller. You can create and manage listings."
                : "Enable seller mode to create service listings."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant={profile?.is_seller ? "outline" : "default"}
              onClick={toggleSellerMode}
            >
              {profile?.is_seller
                ? "Disable Seller Mode"
                : "Enable Seller Mode"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
