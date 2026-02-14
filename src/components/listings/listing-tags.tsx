import { Badge } from "@/components/ui/badge";
import { Zap, Flame, Sparkles, Star, type LucideIcon } from "lucide-react";

const TAG_CONFIG: Record<string, { label: string; className: string; icon: LucideIcon }> = {
  urgent: { label: "Urgent", className: "bg-red-100 text-red-700 border-red-200", icon: Zap },
  popular: { label: "Popular", className: "bg-amber-100 text-amber-700 border-amber-200", icon: Flame },
  new: { label: "New", className: "bg-green-100 text-green-700 border-green-200", icon: Sparkles },
  featured: { label: "Featured", className: "bg-blue-100 text-blue-700 border-blue-200", icon: Star },
};

export function ListingTags({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex gap-1">
      {tags.map((tag) => {
        const config = TAG_CONFIG[tag];
        if (!config) return null;
        const Icon = config.icon;
        return (
          <Badge key={tag} variant="outline" className={`text-xs gap-0.5 ${config.className}`}>
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      })}
    </div>
  );
}
