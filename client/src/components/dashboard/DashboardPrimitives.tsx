import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LucideIcon, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardHeroProps {
  displayName: string;
  initials: string;
  profileImageUrl?: string | null;
  isPremium?: boolean;
  subtitle: string;
  showPremiumUpgrade?: boolean;
  rolePrefix?: string;
  testIdPrefix?: string;
  showAvatar?: boolean;
}

export function DashboardHero({
  displayName,
  initials,
  profileImageUrl,
  isPremium = false,
  subtitle,
  showPremiumUpgrade = false,
  rolePrefix = "",
  testIdPrefix = "greeting",
  showAvatar = true,
}: DashboardHeroProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {showAvatar && (
        <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
          <AvatarImage src={profileImageUrl || undefined} alt={displayName} />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900" data-testid={`${testIdPrefix}-title`}>
            Ciao{rolePrefix && `, ${rolePrefix}`} {displayName}
          </h1>
          {isPremium ? (
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0" data-testid="badge-premium">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          ) : showPremiumUpgrade ? (
            <Link href="/subscribe">
              <Badge 
                variant="outline" 
                className="border-amber-400 text-amber-700 hover:bg-amber-50 cursor-pointer transition-colors"
                data-testid="button-upgrade-premium"
              >
                <Crown className="w-3 h-3 mr-1" />
                Passa a Premium
              </Badge>
            </Link>
          ) : null}
        </div>
        <p className="text-gray-600 text-sm" data-testid={`${testIdPrefix}-subtitle`}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  stats: Array<{
    value: number | string;
    label: string;
    testId?: string;
  }>;
  icon?: LucideIcon;
  className?: string;
  testId?: string;
}

export function StatCard({ title, stats, icon: Icon, className, testId }: StatCardProps) {
  const gridColsClass = stats.length === 1 ? "grid-cols-1" : stats.length === 2 ? "grid-cols-2" : stats.length === 3 ? "grid-cols-3" : "grid-cols-4";
  
  return (
    <Card className={cn("bg-gradient-to-r border-0 shadow-md", className)} data-testid={testId}>
      <CardContent className="p-4">
        {Icon && (
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-4 h-4 text-white" />
            <p className="text-white text-xs font-medium">{title}</p>
          </div>
        )}
        <div className={cn("grid gap-4 text-white", gridColsClass)}>
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center" data-testid={stat.testId}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs opacity-90">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ServiceGridItem {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
  badgeCount?: number;
  badgeText?: string | null;
  color: string;
  bgColor: string;
}

interface ServiceGridProps {
  services: ServiceGridItem[];
  columns?: 2 | 3;
  cardHeight?: string;
  showGradient?: boolean;
}

export function ServiceGrid({ 
  services, 
  columns = 3, 
  cardHeight = "120px",
  showGradient = false,
}: ServiceGridProps) {
  return (
    <div className={cn("grid gap-4", columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
      {services.map((service) => {
        const Icon = service.icon;
        return (
          <Link key={service.id} href={service.route}>
            <Card 
              className={cn(
                "relative hover:shadow-lg transition-all cursor-pointer border-gray-200",
                showGradient ? "hover:scale-105 border-0 shadow-md" : "hover:shadow-md"
              )}
              style={{ height: cardHeight }}
              data-testid={`service-${service.id}`}
            >
              <CardContent className={cn(
                "p-4 h-full flex flex-col items-center justify-center text-center space-y-2",
                showGradient && service.bgColor
              )}>
                {service.badgeCount !== undefined && service.badgeCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs shadow-md"
                    data-testid={`badge-${service.id}`}
                  >
                    {service.badgeCount}
                  </Badge>
                )}
                <div className={cn(
                  "rounded-full p-3 flex-shrink-0",
                  showGradient ? "p-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm" : service.bgColor
                )}>
                  <Icon className={cn(
                    showGradient ? "w-8 h-8" : "h-6 w-6", 
                    service.color
                  )} />
                </div>
                <div className="w-full">
                  <span className={cn(
                    "font-medium text-gray-700 leading-tight line-clamp-2",
                    showGradient ? "font-bold text-sm text-gray-900" : "text-xs"
                  )}>
                    {service.label}
                  </span>
                  {service.badgeText && (
                    <p className="text-xs text-gray-600 mt-1" data-testid={`text-${service.id}`}>
                      {service.badgeText}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
