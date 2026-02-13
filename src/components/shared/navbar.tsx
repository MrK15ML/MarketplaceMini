import Link from "next/link";
import { Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/shared/user-menu";
import { UnreadBadge } from "@/components/shared/unread-badge";
import type { Profile } from "@/lib/types";

export async function Navbar() {
  let user = null;
  let profile: Profile | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;

    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      profile = profileData as Profile | null;
    }
  } catch {
    // Supabase not configured yet — show logged-out navbar
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Handshake className="h-6 w-6" />
          <span>Handshake</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/listings"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse Services
          </Link>
          {user && (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/jobs"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Jobs
              </Link>
              <Link
                href="/messages"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                Messages
                <UnreadBadge userId={user.id} />
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user && profile ? (
            <UserMenu profile={profile} />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
