import { Badge } from "@/components/ui/badge";
import { getCategoryConfig } from "@/lib/constants";

export function CategoryBadge({ category }: { category: string }) {
  const config = getCategoryConfig(category);
  if (!config) return <Badge variant="outline">{category}</Badge>;

  return (
    <Badge variant="secondary" className="gap-1">
      <config.icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
