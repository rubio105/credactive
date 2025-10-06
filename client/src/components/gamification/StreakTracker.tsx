import { Card, CardContent } from "@/components/ui/card";
import { Flame, Calendar } from "lucide-react";

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

export function StreakTracker({ currentStreak, longestStreak, className }: StreakTrackerProps) {
  const streakDays = 7;
  const filledDays = Math.min(currentStreak, streakDays);

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-warning/10 rounded-lg">
            <Flame className="text-warning text-2xl" />
          </div>
          <div>
            <h3 className="text-2xl font-bold" data-testid="current-streak">
              {currentStreak} giorni
            </h3>
            <p className="text-sm text-muted-foreground">Streak attuale</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {Array.from({ length: streakDays }).map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded-full transition-colors ${
                index < filledDays ? 'bg-warning' : 'bg-muted'
              }`}
              data-testid={`streak-day-${index}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Record personale</span>
          </div>
          <span className="font-semibold text-warning" data-testid="longest-streak">
            {longestStreak} giorni
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
