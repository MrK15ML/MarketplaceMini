import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Handshake } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Handshake className="h-12 w-12 mx-auto mb-6 text-muted-foreground" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <h2 className="text-lg font-medium mb-4">Page not found</h2>
        <p className="text-sm text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/listings">Browse services</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
