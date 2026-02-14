import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  CheckCircle,
  Star,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ActivityFeedItem } from "@/lib/types";

const TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string }> = {
  new_listing: { icon: Plus, color: "text-blue-500" },
  deal_completed: { icon: CheckCircle, color: "text-green-500" },
  review_received: { icon: Star, color: "text-yellow-500" },
  score_milestone: { icon: TrendingUp, color: "text-purple-500" },
};

export function ActivityFeed({
  activities,
}: {
  activities: ActivityFeedItem[];
}) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No activity yet. Start by creating a listing or browsing services.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const config = TYPE_CONFIG[activity.type] ?? {
              icon: Plus,
              color: "text-muted-foreground",
            };
            const Icon = config.icon;

            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted ${config.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
