import Link from "next/link";
import { Handshake } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-muted/30">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-8">
        <Handshake className="h-6 w-6" />
        <span>Handshake</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
