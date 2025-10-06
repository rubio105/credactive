import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star } from "lucide-react";

interface LevelProgressProps {
  level: number;
  totalPoints: number;
  className?: string;
}

const POINTS_PER_LEVEL = 1000;

export function LevelProgress({ level, totalPoints, className }: LevelProgressProps) {
  const pointsForNextLevel = level * POINTS_PER_LEVEL;
  const pointsInCurrentLevel = totalPoints % POINTS_PER_LEVEL;
  const progressPercentage = (pointsInCurrentLevel / POINTS_PER_LEVEL) * 100;
  const pointsNeeded = POINTS_PER_LEVEL - pointsInCurrentLevel;

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Trophy className="text-primary text-2xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold" data-testid="user-level">
                Livello {level}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="user-total-points">
                {totalPoints.toLocaleString()} punti totali
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-warning mb-1">
              <Star className="w-4 h-4 fill-warning" />
              <Star className="w-4 h-4 fill-warning" />
              <Star className="w-4 h-4 fill-warning" />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso al livello {level + 1}</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" data-testid="level-progress-bar" />
          <p className="text-xs text-muted-foreground text-right">
            {pointsNeeded} punti per il prossimo livello
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
