import { Badge } from "@/components/ui/badge";
import { getStatusConfig } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const config = getStatusConfig(status);
  if (!config) return <Badge variant="outline">{status}</Badge>;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}
