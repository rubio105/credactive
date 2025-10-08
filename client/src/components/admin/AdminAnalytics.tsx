import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Tag, 
  CheckCircle, 
  Activity, 
  Mail,
  UserPlus,
  CreditCard
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
  revenue: {
    estimatedAnnualRevenue: number;
    estimatedMonthlyRevenue: string;
    premiumUsers: number;
    freeUsers: number;
    conversionRate: string;
    tierBreakdown: Record<string, number>;
  };
  coupons: {
    usersWithCoupon: number;
    totalUsers: number;
    couponUsageRate: string;
    couponBreakdown: Record<string, number>;
  };
  verification: {
    verifiedUsers: number;
    unverifiedUsers: number;
    verificationRate: string;
  };
  authProviders: Record<string, number>;
  engagement: {
    totalPoints: number;
    avgPoints: string;
    activeUsers: number;
    activityRate: string;
  };
  newsletter: {
    subscribers: number;
    subscriptionRate: string;
  };
}

export function AdminAnalytics() {
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
        <h2 className="text-2xl font-bold mb-1">Dashboard Analytics</h2>
        <p className="text-muted-foreground">Panoramica completa di onboarding, fatturato e metriche chiave</p>
      </div>

      {/* Onboarding Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Onboarding & Crescita Utenti
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-total-users">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Totale Utenti
              </CardDescription>
              <CardTitle className="text-3xl" data-testid="text-total-users">
                {analytics.onboarding.totalUsers.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card data-testid="card-new-users-7days">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Nuovi (7 giorni)
              </CardDescription>
              <CardTitle className="text-3xl" data-testid="text-new-users-7days">
                {analytics.onboarding.newUsersLast7Days}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card data-testid="card-new-users-30days">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Nuovi (30 giorni)
              </CardDescription>
              <CardTitle className="text-3xl" data-testid="text-new-users-30days">
                {analytics.onboarding.newUsersLast30Days}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card data-testid="card-month-growth">
            <CardHeader className="pb-3">
              <CardDescription>Crescita Mensile</CardDescription>
              <CardTitle className="text-2xl" data-testid="text-month-growth">
                {analytics.onboarding.growth}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Questo mese: {analytics.onboarding.newUsersThisMonth} | 
                Scorso: {analytics.onboarding.newUsersLastMonth}
              </p>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Revenue Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Fatturato & Abbonamenti
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-annual-revenue">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Fatturato Annuo Stimato
              </CardDescription>
              <CardTitle className="text-3xl" data-testid="text-annual-revenue">
                €{analytics.revenue.estimatedAnnualRevenue.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card data-testid="card-monthly-revenue">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Fatturato Mensile Stimato
              </CardDescription>
              <CardTitle className="text-3xl" data-testid="text-monthly-revenue">
                €{parseFloat(analytics.revenue.estimatedMonthlyRevenue).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card data-testid="card-premium-users">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Utenti Premium
              </CardDescription>
              <CardTitle className="text-3xl" data-testid="text-premium-users">
                {analytics.revenue.premiumUsers}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Free: {analytics.revenue.freeUsers}
              </p>
            </CardHeader>
          </Card>

          <Card data-testid="card-conversion-rate">
            <CardHeader className="pb-3">
              <CardDescription>Tasso di Conversione</CardDescription>
              <CardTitle className="text-3xl" data-testid="text-conversion-rate">
                {analytics.revenue.conversionRate}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Subscription Tier Breakdown */}
        {Object.keys(analytics.revenue.tierBreakdown).length > 0 && (
          <Card className="mt-4" data-testid="card-tier-breakdown">
            <CardHeader>
              <CardTitle className="text-base">Distribuzione Piani Abbonamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analytics.revenue.tierBreakdown).map(([tier, count]) => (
                  <div key={tier} className="flex flex-col">
                    <span className="text-sm text-muted-foreground capitalize">{tier}</span>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Coupon Usage Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Utilizzo Coupon
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card data-testid="card-coupon-users">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Utenti con Coupon
              </CardDescription>
              <CardTitle className="text-3xl" data-testid="text-coupon-users">
                {analytics.coupons.usersWithCoupon}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card data-testid="card-coupon-rate">
            <CardHeader className="pb-3">
              <CardDescription>Tasso Utilizzo Coupon</CardDescription>
              <CardTitle className="text-3xl" data-testid="text-coupon-rate">
                {analytics.coupons.couponUsageRate}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card data-testid="card-coupon-breakdown">
            <CardHeader className="pb-3">
              <CardDescription>Codici Attivi</CardDescription>
              <CardTitle className="text-3xl">
                {Object.keys(analytics.coupons.couponBreakdown).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Coupon Breakdown */}
        {Object.keys(analytics.coupons.couponBreakdown).length > 0 && (
          <Card className="mt-4" data-testid="card-coupon-details">
            <CardHeader>
              <CardTitle className="text-base">Dettaglio Utilizzo per Codice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analytics.coupons.couponBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([code, count]) => (
                    <div key={code} className="flex flex-col">
                      <span className="text-sm text-muted-foreground font-mono">{code}</span>
                      <span className="text-2xl font-bold">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Verification & Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Verification */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Verifica Email
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Card data-testid="card-verified-users">
              <CardHeader className="pb-3">
                <CardDescription>Verificati</CardDescription>
                <CardTitle className="text-3xl" data-testid="text-verified-users">
                  {analytics.verification.verifiedUsers}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card data-testid="card-verification-rate">
              <CardHeader className="pb-3">
                <CardDescription>Tasso Verifica</CardDescription>
                <CardTitle className="text-3xl" data-testid="text-verification-rate">
                  {analytics.verification.verificationRate}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* User Engagement */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Engagement Utenti
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Card data-testid="card-active-users">
              <CardHeader className="pb-3">
                <CardDescription>Utenti Attivi</CardDescription>
                <CardTitle className="text-3xl" data-testid="text-active-users">
                  {analytics.engagement.activeUsers}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {analytics.engagement.activityRate}
                </p>
              </CardHeader>
            </Card>

            <Card data-testid="card-avg-points">
              <CardHeader className="pb-3">
                <CardDescription>Punti Medi</CardDescription>
                <CardTitle className="text-3xl" data-testid="text-avg-points">
                  {analytics.engagement.avgPoints}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Newsletter & Auth Providers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Newsletter */}
        <Card data-testid="card-newsletter">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Newsletter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Iscritti</span>
                <span className="font-bold text-xl" data-testid="text-newsletter-subscribers">
                  {analytics.newsletter.subscribers}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tasso Iscrizione</span>
                <span className="font-bold" data-testid="text-newsletter-rate">
                  {analytics.newsletter.subscriptionRate}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auth Providers */}
        <Card data-testid="card-auth-providers">
          <CardHeader>
            <CardTitle className="text-base">Metodi di Autenticazione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(analytics.authProviders).map(([provider, count]) => (
                <div key={provider} className="flex flex-col">
                  <span className="text-sm text-muted-foreground capitalize">{provider}</span>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
