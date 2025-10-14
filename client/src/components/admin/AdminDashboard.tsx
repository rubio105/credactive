import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  User,
  CreditCard,
  TrendingUp,
  Activity
} from "lucide-react";

interface AnalyticsData {
  onboarding: {
    totalUsers: number;
    newUsersLast7Days: number;
    newUsersLast30Days: number;
    newUsersThisMonth: number;
    newUsersLastMonth: number;
    growth: string;
  };
  accessTypes: {
    professionalUsers: number;
    personalUsers: number;
    aiOnlyUsers: number;
    professionalPercentage: string;
    personalPercentage: string;
  };
  revenue: {
    estimatedAnnualRevenue: number;
    estimatedMonthlyRevenue: string;
    premiumUsers: number;
    freeUsers: number;
    conversionRate: string;
    tierBreakdown: Record<string, number>;
  };
}

export function AdminDashboard() {
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/analytics']
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Errore</CardTitle>
          <CardDescription>
            {error ? `Errore: ${(error as any).message}` : 'Impossibile caricare i dati analytics'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Dashboard Sanitaria</h2>
        <p className="text-muted-foreground">Panoramica utenti, tipologie accesso e abbonamenti</p>
      </div>

      {/* Utenti Overview */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Panoramica Utenti
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-total-users">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Totale Utenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.onboarding.totalUsers}</div>
              <p className="text-sm text-muted-foreground mt-1">Utenti registrati</p>
            </CardContent>
          </Card>

          <Card data-testid="card-new-users-7days">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Ultimi 7 Giorni
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.onboarding.newUsersLast7Days}</div>
              <p className="text-sm text-muted-foreground mt-1">Nuovi utenti</p>
            </CardContent>
          </Card>

          <Card data-testid="card-new-users-30days">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Ultimi 30 Giorni
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.onboarding.newUsersLast30Days}</div>
              <p className="text-sm text-muted-foreground mt-1">Nuovi utenti</p>
            </CardContent>
          </Card>

          <Card data-testid="card-growth-rate">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Crescita Mensile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.onboarding.growth}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {analytics.onboarding.newUsersThisMonth} questo mese vs {analytics.onboarding.newUsersLastMonth} mese scorso
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tipologia Accesso */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Tipologia Accesso
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card data-testid="card-professional-users" className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Accesso Professionale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {analytics.accessTypes.professionalUsers}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {analytics.accessTypes.professionalPercentage} del totale
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-personal-users" className="border-green-200 dark:border-green-900">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                Accesso Personale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {analytics.accessTypes.personalUsers}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {analytics.accessTypes.personalPercentage} del totale
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-ai-only-users" className="border-purple-200 dark:border-purple-900">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Solo AI Prohmed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {analytics.accessTypes.aiOnlyUsers}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Accesso dedicato AI
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Abbonamenti */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Abbonamenti & Revenue
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-premium-users">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Utenti Premium
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.revenue.premiumUsers}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Tasso conversione: {analytics.revenue.conversionRate}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-free-users">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Utenti Free
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.revenue.freeUsers}</div>
              <p className="text-sm text-muted-foreground mt-1">Account gratuiti</p>
            </CardContent>
          </Card>

          <Card data-testid="card-annual-revenue">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Revenue Annuale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">€{analytics.revenue.estimatedAnnualRevenue}</div>
              <p className="text-sm text-muted-foreground mt-1">Stima annuale</p>
            </CardContent>
          </Card>

          <Card data-testid="card-monthly-revenue">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Revenue Mensile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">€{analytics.revenue.estimatedMonthlyRevenue}</div>
              <p className="text-sm text-muted-foreground mt-1">Stima mensile</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Breakdown Tier */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Distribuzione Tier Abbonamenti</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analytics.revenue.tierBreakdown).map(([tier, count]) => (
                <div key={tier} className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize mt-1">
                    {tier === 'free' ? 'Gratuito' : tier.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
