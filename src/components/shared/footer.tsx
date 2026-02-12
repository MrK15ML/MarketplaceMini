import Link from "next/link";
import { Handshake } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Handshake className="h-5 w-5" />
            <span>Handshake</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            A communication and discovery platform for independent service
            agreements.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/listings" className="hover:text-foreground">
              Browse
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
