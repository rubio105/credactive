import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/navigation";
import { Trophy, Medal, Crown, Users, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface LeaderboardEntry {
  rank: number;
  id: string;
  displayName: string;
  totalPoints: number;
  level: number;
  credits: number;
  isPremium: boolean;
  corporateAgreementId?: string;
  isCurrentUser?: boolean;
}

export default function Leaderboard() {
  const { user } = useAuth();

  const { data: globalLeaderboard, isLoading: isGlobalLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const { data: teamLeaderboard, isLoading: isTeamLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard/team"],
    enabled: !!user?.corporateAgreementId,
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400 fill-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600 fill-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getUserInitials = (displayName: string) => {
    const parts = displayName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  const renderLeaderboard = (leaderboard: LeaderboardEntry[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento classifica...</p>
        </div>
      );
    }

    if (!leaderboard || leaderboard.length === 0) {
      return (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nessun dato disponibile</h3>
          <p className="text-muted-foreground">
            La classifica verrà popolata quando gli utenti completeranno i quiz
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.id}
            className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
              entry.isCurrentUser || (user && entry.id === user.id)
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
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getUserInitials(entry.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold" data-testid={`entry-name-${index}`}>
                    {entry.displayName}
                  </p>
                  {(entry.isCurrentUser || (user && entry.id === user.id)) && (
                    <Badge variant="secondary" className="text-xs">Tu</Badge>
                  )}
                  {entry.isPremium && (
                    <Badge variant="default" className="text-xs">Premium</Badge>
                  )}
                  {entry.corporateAgreementId && (
                    <Badge variant="outline" className="text-xs">Corporate</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Livello {entry.level} • {entry.credits} crediti
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary" data-testid={`entry-points-${index}`}>
                {entry.totalPoints.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">punti</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="leaderboard-title">
            <Trophy className="inline-block mr-3 text-yellow-500" />
            Classifiche
          </h1>
          <p className="text-muted-foreground">Compete con altri studenti e scala le classifiche!</p>
        </div>

        {/* User Position Card */}
        {user && globalLeaderboard && (
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full">
                    <Trophy className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">La tua posizione globale</p>
                    <p className="text-2xl font-bold" data-testid="user-rank">
                      #{globalLeaderboard.find(e => e.id === user.id)?.rank || '-'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Punti totali</p>
                  <p className="text-2xl font-bold text-primary" data-testid="user-points">
                    {user.totalPoints?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs: Global vs Team */}
        <Tabs defaultValue={user?.corporateAgreementId ? "team" : "global"}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="global" data-testid="tab-global">
              <Globe className="w-4 h-4 mr-2" />
              Globale
            </TabsTrigger>
            <TabsTrigger 
              value="team" 
              data-testid="tab-team"
              disabled={!user?.corporateAgreementId}
            >
              <Users className="w-4 h-4 mr-2" />
              Team
            </TabsTrigger>
          </TabsList>

          {/* Global Leaderboard */}
          <TabsContent value="global">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Globe className="inline-block mr-2" />
                  Classifica Globale
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboard(globalLeaderboard, isGlobalLoading)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Leaderboard */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Users className="inline-block mr-2" />
                  Classifica del Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!user?.corporateAgreementId ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Non fai parte di un team</h3>
                    <p className="text-muted-foreground">
                      La classifica team è disponibile solo per utenti corporate
                    </p>
                  </div>
                ) : (
                  renderLeaderboard(teamLeaderboard, isTeamLoading)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
