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
import { queryClient } from "@/lib/queryClient";
import { ChartLine, BookOpen, User, Crown, Menu, LogOut, Settings, Trophy, Award, Coins, BarChart3, Building2, CreditCard, Mail, Stethoscope, Shield, Users, Database, Send, AlertTriangle, MessageSquare, FileText, HelpCircle, Video, Phone, FileCheck, HeartPulse, Activity } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuthenticatedImage } from "@/hooks/useAuthenticatedImage";
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
  isDoctor?: boolean;
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

interface DoctorNote {
  id: string;
  doctorId: string;
  patientId: string;
  title: string;
  content: string;
  isReport: boolean;
  createdAt: string;
}

interface NavigationProps {
  useLandingLogo?: boolean;
}

export default function Navigation({ useLandingLogo = false }: NavigationProps = {}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const typedUser = user as unknown as User;
  const logoImage = logoImageFull;
  const [location, setLocation] = useLocation();
  const authenticatedProfileImage = useAuthenticatedImage(typedUser?.profileImageUrl);

  const { data: headerPages = [] } = useQuery<ContentPage[]>({
    queryKey: ["/api/content-pages"],
    select: (pages) => pages.filter(page => page.placement === 'header' && page.isPublished && page.slug !== 'chi-siamo'),
  });

  // Get patient notes count (for aiOnlyAccess patients only)
  const { data: patientNotes = [] } = useQuery<DoctorNote[]>({
    queryKey: ["/api/patient/notes"],
    enabled: !!typedUser?.aiOnlyAccess && !typedUser?.isDoctor,
  });

  const handleLogout = async () => {
    console.log('[LOGOUT] Starting logout process...');
    try {
      console.log('[LOGOUT] Calling /api/auth/logout...');
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      console.log('[LOGOUT] Server logout successful, clearing client state...');
      
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('[LOGOUT] Redirecting to /login with window.location.href...');
      // Use href instead of assign for more aggressive redirect
      window.location.href = '/login';
    } catch (error) {
      console.error('[LOGOUT] Logout error:', error);
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
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
          <Link href={
            typedUser?.isAdmin ? "/admin" : 
            typedUser?.isDoctor ? "/doctor/patients" : 
            "/dashboard"
          }>
            <div className="flex items-center cursor-pointer" data-testid="logo">
              <img 
                src={logoImage} 
                alt="CIRY" 
                className="h-20 w-auto object-contain my-2 bg-white rounded-lg px-2"
              />
            </div>
          </Link>
          
          {/* Center Navigation Menu - Always Visible */}
          <div className="hidden md:flex items-center space-x-4 flex-1 justify-center">
            {isAuthenticated ? (
              <>
                {/* Doctor Navigation - 5 voci orizzontali con icone */}
                {typedUser?.isDoctor && !typedUser?.isAdmin && (
                  <>
                    <Link href="/doctor/alerts">
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-alerts">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Alert Pazienti
                      </Button>
                    </Link>
                    <Link href="/doctor/reports">
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-reports">
                        <FileCheck className="w-4 h-4 mr-2" />
                        Note e Referti
                      </Button>
                    </Link>
                    <Link href="/prevention">
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-prevention">
                        <Stethoscope className="w-4 h-4 mr-2" />
                        AI Prevenzione
                      </Button>
                    </Link>
                    <Link href="/settings">
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-settings">
                        <Settings className="w-4 h-4 mr-2" />
                        Impostazioni
                      </Button>
                    </Link>
                    <Link href="/security">
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-security">
                        <Shield className="w-4 h-4 mr-2" />
                        Sicurezza
                      </Button>
                    </Link>
                  </>
                )}
                {/* Regular Patients - Only Prenotazioni */}
                {!typedUser?.isDoctor && !typedUser?.isAdmin && (
                  <>
                    <Link href="/teleconsulto">
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-teleconsulto">
                        <Video className="w-4 h-4 mr-2" />
                        Prenotazioni
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
                <Link href="/guida">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-guide">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Guida
                  </Button>
                </Link>
                {/* Show CMS pages only for non-authenticated users */}
                {headerPages.map((page) => (
                  <Link key={page.id} href={`/page/${page.slug}`}>
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid={`nav-${page.slug}`}>
                      {page.title}
                    </Button>
                  </Link>
                ))}
              </>
            )}
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
                {/* Registrazione disabilitata - solo admin può censire */}
              </div>
            ) : (
              /* Authenticated State */
              <div className="flex items-center space-x-4">
                {/* Documents Badge - For AI-only patients (show medical notes from doctor) */}
                {typedUser?.aiOnlyAccess && !typedUser?.isDoctor && patientNotes && patientNotes.length > 0 && (
                  <Link href="/documenti">
                    <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" data-testid="badge-documents">
                      <FileText className="w-3 h-3 mr-1" />
                      Documenti ({patientNotes.length})
                    </Badge>
                  </Link>
                )}

                {/* In-App Notifications Bell */}
                <NotificationBell />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-3 h-auto p-2" data-testid="user-menu-trigger">
                      <Avatar className="w-10 h-10 border-2 border-primary">
                        <AvatarImage 
                          src={authenticatedProfileImage || undefined} 
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
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
