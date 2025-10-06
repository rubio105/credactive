import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/navigation";
import { Trophy, Medal, Crown, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface LeaderboardEntry {
  userId: string;
  rank: number;
  points: number;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    profileImageUrl?: string;
    level?: number;
  };
}

interface UserPosition {
  rank: number;
  totalPoints: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<string>('all_time');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: globalLeaderboard, isLoading: isGlobalLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard/global", { limit: 50, period }],
  });

  const { data: userPosition } = useQuery<UserPosition>({
    queryKey: ["/api/user/leaderboard-position", { period }],
    enabled: !!user,
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-warning fill-warning" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400 fill-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600 fill-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number): "default" | "secondary" | "destructive" | "outline" => {
    if (rank === 1) return "default";
    if (rank === 2 || rank === 3) return "secondary";
    return "outline";
  };

  const getUserInitials = (entry: LeaderboardEntry) => {
    if (entry.user.firstName && entry.user.lastName) {
      return `${entry.user.firstName[0]}${entry.user.lastName[0]}`.toUpperCase();
    }
    if (entry.user.email) {
      return entry.user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = (entry: LeaderboardEntry) => {
    if (entry.user.firstName && entry.user.lastName) {
      return `${entry.user.firstName} ${entry.user.lastName}`;
    }
    if (entry.user.firstName) {
      return entry.user.firstName;
    }
    return entry.user.email.split('@')[0];
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="leaderboard-title">
            <Trophy className="inline-block mr-3 text-warning" />
            Classifica Globale
          </h1>
          <p className="text-muted-foreground">Compete con altri studenti e scala la classifica!</p>
        </div>

        {/* User Position Card */}
        {user && userPosition && (
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full">
                    <TrendingUp className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">La tua posizione</p>
                    <p className="text-2xl font-bold" data-testid="user-rank">
                      #{userPosition.rank}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Punti totali</p>
                  <p className="text-2xl font-bold text-primary" data-testid="user-points">
                    {userPosition.totalPoints.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Period Selector */}
        <div className="mb-6">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="all_time" data-testid="tab-all-time">
                Sempre
              </TabsTrigger>
              <TabsTrigger value="monthly" data-testid="tab-monthly">
                Mensile
              </TabsTrigger>
              <TabsTrigger value="weekly" data-testid="tab-weekly">
                Settimanale
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top 50 Studenti</CardTitle>
          </CardHeader>
          <CardContent>
            {isGlobalLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Caricamento classifica...</p>
              </div>
            ) : globalLeaderboard && globalLeaderboard.length > 0 ? (
              <div className="space-y-2">
                {globalLeaderboard.map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                      user && entry.userId === user.id
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                    data-testid={`leaderboard-entry-${index}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12">
                        {getRankIcon(entry.rank)}
                      </div>
                      <Avatar className="w-12 h-12 border-2 border-primary/20">
                        <AvatarImage 
                          src={entry.user.profileImageUrl || undefined} 
                          alt={getUserDisplayName(entry)}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getUserInitials(entry)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold" data-testid={`entry-name-${index}`}>
                            {getUserDisplayName(entry)}
                          </p>
                          {user && entry.userId === user.id && (
                            <Badge variant="secondary" className="text-xs">Tu</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Livello {entry.user.level || 1} • #{entry.rank}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary" data-testid={`entry-points-${index}`}>
                        {entry.points.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">punti</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nessun dato disponibile</h3>
                <p className="text-muted-foreground mb-4">
                  La classifica verrà popolata quando più utenti completeranno i quiz
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
