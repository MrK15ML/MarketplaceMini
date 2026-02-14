import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { FeaturedProviders } from "@/components/profiles/featured-providers";
import { CATEGORIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import {
  Handshake,
  Search,
  FileCheck,
  Star,
  Shield,
  ArrowRight,
} from "lucide-react";

async function FeaturedProvidersSection() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, location_city, is_verified, avg_rating, total_reviews, handshake_score, total_completed_deals")
      .eq("is_seller", true)
      .gt("handshake_score", 40)
      .order("handshake_score", { ascending: false })
      .limit(6);

    if (!data || data.length === 0) return null;

    return <FeaturedProviders providers={data as {
      id: string;
      display_name: string;
      avatar_url: string | null;
      location_city: string | null;
      is_verified: boolean;
      avg_rating: number;
      total_reviews: number;
      handshake_score: number;
      total_completed_deals: number;
    }[]} />;
  } catch {
    return null;
  }
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 md:py-32 relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{background:'var(--brand-accent)', opacity:0.05}} />
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full blur-3xl" style={{background:'var(--brand-start)', opacity:0.04}} />
        </div>
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Handshake className="h-4 w-4" />
            Wellington&apos;s service marketplace
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Find trusted services.
            <br />
            <span className="text-gradient">Agree on your terms.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Browse qualified service providers, negotiate directly, and seal the
            deal with a structured handshake. No middleman fees, no surprises.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-[var(--brand-start)] to-[var(--brand-end)] text-white hover:opacity-90 transition-opacity border-0" asChild>
              <Link href="/signup">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/listings">Browse Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            How Handshake works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: "1. Find & Request",
                desc: "Browse services or post what you need. Send a structured request to any provider.",
              },
              {
                icon: FileCheck,
                title: "2. Negotiate & Agree",
                desc: "Chat to clarify details. The provider sends a formal offer. You accept or counter.",
              },
              {
                icon: Handshake,
                title: "3. Handshake",
                desc: "Once agreed, both parties have a clear deal summary. Complete the work and review.",
              },
            ].map((step) => (
              <div key={step.title} className="text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <Suspense fallback={null}>
        <FeaturedProvidersSection />
      </Suspense>

      {/* Categories */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Services for every need
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            From quick odd jobs to professional consultations — find the right
            person for any task.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link key={cat.value} href={`/listings?category=${cat.value}`}>
                <Card className="hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
                  <CardContent className="p-6">
                    <cat.icon className="h-8 w-8 mb-3 text-primary" />
                    <h3 className="font-semibold mb-1">{cat.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {cat.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Built on trust
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Verified Qualifications",
                desc: "Providers upload licenses, certificates, and portfolio evidence. Licensed trades are flagged and verified.",
              },
              {
                icon: Star,
                title: "Mutual Reviews",
                desc: "Both parties review each other after every job. Build your reputation over time.",
              },
              {
                icon: FileCheck,
                title: "Structured Agreements",
                desc: "Offers are formal objects with price, scope, and timeline — not vague chat messages.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join Handshake today and connect with trusted service providers in
            Wellington.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-[var(--brand-start)] to-[var(--brand-end)] text-white hover:opacity-90 transition-opacity border-0" asChild>
            <Link href="/signup">
              Create your free account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
