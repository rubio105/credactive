import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Lock } from "lucide-react";

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  earnedAt?: string;
}

interface BadgeGridProps {
  badges: BadgeItem[];
  className?: string;
}

export function BadgeGrid({ badges, className }: BadgeGridProps) {
  const earnedBadges = badges.filter(b => b.earnedAt);
  const lockedBadges = badges.filter(b => !b.earnedAt);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Badge Sbloccati</CardTitle>
          <Badge variant="secondary" data-testid="badge-count">
            {earnedBadges.length}/{badges.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {earnedBadges.map((badge, index) => (
            <div
              key={badge.id}
              className="text-center p-3 rounded-lg bg-primary/10 border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer group"
              data-testid={`badge-earned-${index}`}
              title={badge.description}
            >
              <div className="relative">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-warning" />
              </div>
              <p className="text-xs font-medium line-clamp-2">{badge.name}</p>
            </div>
          ))}
          {lockedBadges.slice(0, 5).map((badge, index) => (
            <div
              key={badge.id}
              className="text-center p-3 rounded-lg bg-muted/20 border-2 border-muted opacity-50"
              data-testid={`badge-locked-${index}`}
              title={badge.description}
            >
              <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground line-clamp-2">{badge.name}</p>
            </div>
          ))}
        </div>
        {lockedBadges.length > 5 && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            +{lockedBadges.length - 5} altri badge da sbloccare
          </p>
        )}
      </CardContent>
    </Card>
  );
}
