import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Zap, CheckCircle, Trophy, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface DailyChallenge {
  id: string;
  quizId: string;
  quizTitle: string;
  challengeDate: string;
  pointsReward: number;
  isActive: boolean;
  userStatus?: {
    status: 'not_started' | 'completed';
    completedAt?: string;
    pointsEarned?: number;
  };
}

export function DailyChallenge() {
  const { data: challenge, isLoading } = useQuery<DailyChallenge | null>({
    queryKey: ["/api/daily-challenge"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!challenge) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Sfida Giornaliera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nessuna sfida disponibile oggi
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isCompleted = challenge.userStatus?.status === 'completed';

  return (
    <Card className={`border-2 ${isCompleted ? 'bg-success/5 border-success/20' : 'border-primary/20'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Sfida Giornaliera
          </CardTitle>
          {isCompleted ? (
            <Badge className="bg-success text-success-foreground" data-testid="daily-challenge-completed">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completata
            </Badge>
          ) : (
            <Badge variant="secondary" data-testid="daily-challenge-available">
              <Zap className="w-3 h-3 mr-1 fill-warning text-warning" />
              Disponibile
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2" data-testid="daily-challenge-title">
              {challenge.quizTitle}
            </h4>
            <p className="text-sm text-muted-foreground">
              Completa questo quiz oggi per guadagnare punti bonus!
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              <span className="font-semibold">Ricompensa</span>
            </div>
            <span className="text-lg font-bold text-primary" data-testid="daily-challenge-points">
              +{challenge.pointsReward} punti
            </span>
          </div>

          {isCompleted ? (
            <div className="text-center py-4 space-y-2">
              <CheckCircle className="w-12 h-12 text-success mx-auto" />
              <div>
                <p className="font-semibold text-success">Sfida completata!</p>
                <p className="text-sm text-muted-foreground">
                  Hai guadagnato {challenge.userStatus?.pointsEarned} punti
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Torna domani per una nuova sfida
              </p>
            </div>
          ) : (
            <Link href={`/quiz/${challenge.quizId}`}>
              <Button className="w-full" size="lg" data-testid="button-start-daily-challenge">
                <Zap className="w-4 h-4 mr-2" />
                Inizia Sfida
              </Button>
            </Link>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Scade alla mezzanotte</span>
            </div>
            <span>{new Date(challenge.challengeDate).toLocaleDateString('it-IT')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
