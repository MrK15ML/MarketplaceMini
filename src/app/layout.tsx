import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Handshake — Wellington's Trusted Service Marketplace",
    template: "%s | Handshake",
  },
  description:
    "Find trusted service providers in Wellington. Browse, negotiate directly, and seal the deal with a structured handshake. No middleman fees, no surprises.",
  keywords: ["services", "marketplace", "Wellington", "New Zealand", "handyman", "tutoring", "freelancer"],
  openGraph: {
    type: "website",
    locale: "en_NZ",
    siteName: "Handshake",
    title: "Handshake — Wellington's Trusted Service Marketplace",
    description: "Find trusted service providers in Wellington. Browse, negotiate directly, and seal the deal.",
  },
  twitter: {
    card: "summary",
    title: "Handshake — Wellington's Trusted Service Marketplace",
    description: "Find trusted service providers in Wellington.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
