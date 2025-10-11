import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { ChartLine, BookOpen, User, Crown, Menu, LogOut, Settings, Trophy, Award, Coins, BarChart3, Building2, CreditCard, Mail, Stethoscope } from "lucide-react";
const logoImageSmall = "/images/ciry-main-logo.png";
const logoImageFull = "/images/ciry-main-logo.png";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isPremium: boolean;
  isAdmin: boolean;
  aiOnlyAccess?: boolean;
  credits?: number;
  corporateAgreementId?: string;
}

interface ContentPage {
  id: string;
  slug: string;
  title: string;
  placement: string;
  isPublished: boolean;
}

interface NavigationProps {
  useLandingLogo?: boolean;
}

export default function Navigation({ useLandingLogo = false }: NavigationProps = {}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const typedUser = user as User;
  const logoImage = logoImageFull;
  const [location, setLocation] = useLocation();

  const { data: headerPages = [] } = useQuery<ContentPage[]>({
    queryKey: ["/api/content-pages"],
    select: (pages) => pages.filter(page => page.placement === 'header' && page.isPublished && page.slug !== 'chi-siamo'),
  });

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const getUserName = () => {
    if (typedUser?.firstName || typedUser?.lastName) {
      return `${typedUser.firstName || ''} ${typedUser.lastName || ''}`.trim();
    }
    return typedUser?.email?.split('@')[0] || 'Utente';
  };

  const getUserInitials = () => {
    const name = getUserName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handlePlansClick = () => {
    // If not on landing page, navigate to it first
    if (location !== '/') {
      setLocation('/');
      // Wait for navigation and DOM update, then scroll
      setTimeout(() => {
        const subscriptionsSection = document.getElementById('subscriptions');
        if (subscriptionsSection) {
          subscriptionsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // Already on landing, just scroll
      const subscriptionsSection = document.getElementById('subscriptions');
      if (subscriptionsSection) {
        subscriptionsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24 py-2">
          {/* Logo */}
          <Link href={typedUser?.aiOnlyAccess ? "/prevention" : "/"}>
            <div className="flex items-center cursor-pointer" data-testid="logo">
              <img 
                src={logoImage} 
                alt="CIRY" 
                className="h-20 w-auto object-contain my-2 bg-white rounded-lg px-2"
              />
            </div>
          </Link>
          
          {/* Center Navigation Menu - Always Visible */}
          <div className="hidden md:flex items-center space-x-6 flex-1 justify-center">
            {isAuthenticated ? (
              <>
                {!typedUser?.aiOnlyAccess && (
                  <>
                    <Link href="/dashboard">
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-dashboard">
                        <ChartLine className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    <Link href="/">
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-quizzes">
                        <BookOpen className="w-4 h-4 mr-2" />
                        I miei Quiz
                      </Button>
                    </Link>
                  </>
                )}
                <Link href="/prevention">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-prevention">
                    <Award className="w-4 h-4 mr-2" />
                    AI Prevenzione
                  </Button>
                </Link>
                {!typedUser?.aiOnlyAccess && (
                  <>
                    <Link href="/leaderboard">
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-leaderboard">
                        <Trophy className="w-4 h-4 mr-2" />
                        Classifica
                      </Button>
                    </Link>
                    <Link href="/certificates">
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-certificates">
                        <Award className="w-4 h-4 mr-2" />
                        Certificati
                      </Button>
                    </Link>
                    <Link href="/analytics">
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-analytics">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </Button>
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={handlePlansClick} className="text-muted-foreground hover:text-foreground" data-testid="nav-plans">
                  <CreditCard className="w-4 h-4 mr-2" />
                  I Nostri Piani
                </Button>
                <Link href="/contatti">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-contact">
                    <Mail className="w-4 h-4 mr-2" />
                    Contatti
                  </Button>
                </Link>
              </>
            )}
            {headerPages.map((page) => (
              <Link key={page.id} href={`/page/${page.slug}`}>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid={`nav-${page.slug}`}>
                  {page.title}
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 animate-pulse bg-muted rounded-full" />
            ) : !isAuthenticated ? (
              /* Not Authenticated State */
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button 
                    variant="ghost" 
                    data-testid="button-login"
                  >
                    Accedi
                  </Button>
                </Link>
                <Link href="/register">
                  <Button 
                    data-testid="button-register"
                  >
                    Registrati
                  </Button>
                </Link>
              </div>
            ) : (
              /* Authenticated State */
              <div className="flex items-center space-x-4">
                {/* Credits Badge - Hide for AI-only users */}
                {!typedUser?.aiOnlyAccess && (
                  <Badge className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800" data-testid="badge-credits">
                    <Coins className="w-3 h-3 mr-1" />
                    {typedUser?.credits || 0}
                  </Badge>
                )}
                
                {/* Premium Badge - Hide for AI-only users */}
                {!typedUser?.aiOnlyAccess && typedUser?.isPremium && (
                  <Badge className="bg-accent/10 text-accent border-accent/20" data-testid="badge-premium">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-3 h-auto p-2" data-testid="user-menu-trigger">
                      <Avatar className="w-10 h-10 border-2 border-primary">
                        <AvatarImage 
                          src={typedUser?.profileImageUrl} 
                          alt="User Avatar"
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium" data-testid="user-name">
                          {getUserName()}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid="user-email">
                          {typedUser?.email}
                        </p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{getUserName()}</p>
                      <p className="text-xs text-muted-foreground">{typedUser?.email}</p>
                      {!typedUser?.aiOnlyAccess && (
                        <div className="flex items-center gap-1 mt-2">
                          <Badge className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 text-xs py-0.5">
                            <Coins className="w-3 h-3 mr-1" />
                            {typedUser?.credits || 0} Crediti
                          </Badge>
                          {typedUser?.isPremium && (
                            <Badge className="bg-accent/10 text-accent border-accent/20 text-xs py-0.5">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    {!typedUser?.aiOnlyAccess && (
                      <>
                        <Link href="/dashboard">
                          <DropdownMenuItem data-testid="menu-dashboard">
                            <ChartLine className="w-4 h-4 mr-2" />
                            Dashboard
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/">
                          <DropdownMenuItem data-testid="menu-quizzes">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Quiz
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/leaderboard">
                          <DropdownMenuItem data-testid="menu-leaderboard">
                            <Trophy className="w-4 h-4 mr-2" />
                            Classifica
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/certificates">
                          <DropdownMenuItem data-testid="menu-certificates">
                            <Award className="w-4 h-4 mr-2" />
                            Certificati
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/analytics">
                          <DropdownMenuItem data-testid="menu-analytics">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    {typedUser?.corporateAgreementId && (
                      <>
                        <DropdownMenuSeparator />
                        <Link href="/corporate">
                          <DropdownMenuItem className="text-blue-600" data-testid="menu-corporate">
                            <Building2 className="w-4 h-4 mr-2" />
                            Portale Aziendale
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    {typedUser?.isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <Link href="/admin">
                          <DropdownMenuItem className="text-destructive" data-testid="menu-admin">
                            <Settings className="w-4 h-4 mr-2" />
                            Pannello Admin
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    {!typedUser?.isPremium && !typedUser?.aiOnlyAccess && (
                      <>
                        <DropdownMenuSeparator />
                        <Link href="/subscribe">
                          <DropdownMenuItem className="text-primary" data-testid="menu-upgrade">
                            <Crown className="w-4 h-4 mr-2" />
                            Upgrade to Premium
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    {typedUser?.aiOnlyAccess && (
                      <>
                        <DropdownMenuSeparator />
                        <Link href="/pacchetto-prohmed">
                          <DropdownMenuItem className="text-green-600 dark:text-green-400 font-semibold" data-testid="menu-prohmed-package">
                            <Stethoscope className="w-4 h-4 mr-2" />
                            Pacchetto Prohmed 14,90€
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Button */}
                <Button variant="ghost" size="sm" className="md:hidden" data-testid="mobile-menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
