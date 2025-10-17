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
import { ChartLine, BookOpen, User, Crown, Menu, LogOut, Settings, Trophy, Award, Coins, BarChart3, Building2, CreditCard, Mail, Stethoscope, Shield, Users, Database, Send, AlertTriangle, MessageSquare, FileText, HelpCircle, Video, Phone, FileCheck, HeartPulse } from "lucide-react";
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
  const typedUser = user as User;
  const logoImage = logoImageFull;
  const [location, setLocation] = useLocation();

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
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
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
                {/* Doctor Navigation - ONLY Prevention/Clinical tools (SEPARATE from quiz) */}
                {typedUser?.isDoctor && !typedUser?.isAdmin && (
                  <>
                    <Link href="/doctor/patients">
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-patients">
                        <User className="w-4 h-4 mr-2" />
                        I Miei Pazienti
                      </Button>
                    </Link>
                    <Link href="/doctor/reports">
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-reporting">
                        <FileCheck className="w-4 h-4 mr-2" />
                        Refertazione
                      </Button>
                    </Link>
                    <Link href="/prevention">
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-prevention">
                        <Stethoscope className="w-4 h-4 mr-2" />
                        AI Prevenzione
                      </Button>
                    </Link>
                  </>
                )}
                {/* AI-Only Prevention Patients - ONLY Prevention (SEPARATE from quiz) */}
                {typedUser?.aiOnlyAccess && !typedUser?.isDoctor && !typedUser?.isAdmin && (
                  <>
                    <Link href="/prevention">
                      <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-prevention">
                        <Stethoscope className="w-4 h-4 mr-2" />
                        AI Prevenzione
                      </Button>
                    </Link>
                  </>
                )}
                {/* Patients - All links moved to dropdown menu */}
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
                  <Link href="/prevention">
                    <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" data-testid="badge-documents">
                      <FileText className="w-3 h-3 mr-1" />
                      Documenti ({patientNotes.length})
                    </Badge>
                  </Link>
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
                    </div>
                    <DropdownMenuSeparator />
                    {/* Admin Menu Items - Only Admin Panel */}
                    {typedUser?.isAdmin && (
                      <>
                        <Link href="/admin">
                          <DropdownMenuItem data-testid="menu-admin-main">
                            <Settings className="w-4 h-4 mr-2" />
                            Pannello Admin
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    {/* Doctor Menu Items - ONLY Prevention/Clinical (SEPARATE from quiz) */}
                    {typedUser?.isDoctor && !typedUser?.isAdmin && (
                      <>
                        <Link href="/">
                          <DropdownMenuItem data-testid="menu-patients">
                            <User className="w-4 h-4 mr-2" />
                            I Miei Pazienti
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/prevention">
                          <DropdownMenuItem data-testid="menu-prevention">
                            <Stethoscope className="w-4 h-4 mr-2" />
                            AI Prevenzione
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    {/* AI-Only Prevention Patients - ONLY Prevention (SEPARATE from quiz) */}
                    {typedUser?.aiOnlyAccess && !typedUser?.isDoctor && !typedUser?.isAdmin && (
                      <>
                        <Link href="/prevention">
                          <DropdownMenuItem data-testid="menu-prevention">
                            <Stethoscope className="w-4 h-4 mr-2" />
                            AI Prevenzione
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <Link href="/subscribe">
                          <DropdownMenuItem className="text-emerald-600 dark:text-emerald-400 font-semibold" data-testid="menu-healthcare-plan">
                            <HeartPulse className="w-4 h-4 mr-2" />
                            Piano Sanitario
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    {/* Patient Menu Items - Only Prevention related */}
                    {!typedUser?.aiOnlyAccess && !typedUser?.isDoctor && !typedUser?.isAdmin && (
                      <>
                        <Link href="/prevention">
                          <DropdownMenuItem data-testid="menu-prevention">
                            <Stethoscope className="w-4 h-4 mr-2" />
                            AI Prevenzione
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <Link href="/subscribe">
                          <DropdownMenuItem className="text-emerald-600 dark:text-emerald-400 font-semibold" data-testid="menu-healthcare-plan">
                            <HeartPulse className="w-4 h-4 mr-2" />
                            Piano Sanitario
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/security">
                          <DropdownMenuItem data-testid="menu-security">
                            <Shield className="w-4 h-4 mr-2" />
                            Sicurezza
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/documenti">
                          <DropdownMenuItem data-testid="menu-documents">
                            <FileText className="w-4 h-4 mr-2" />
                            Documenti
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/webinar-health">
                          <DropdownMenuItem data-testid="menu-webinars">
                            <Video className="w-4 h-4 mr-2" />
                            Webinari
                          </DropdownMenuItem>
                        </Link>
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
                        {!typedUser?.isPremium && (
                          <>
                            <DropdownMenuSeparator />
                            <Link href="/subscribe">
                              <DropdownMenuItem className="text-primary" data-testid="menu-upgrade">
                                <Crown className="w-4 h-4 mr-2" />
                                Passa a Premium
                              </DropdownMenuItem>
                            </Link>
                          </>
                        )}
                      </>
                    )}
                    {typedUser?.aiOnlyAccess && !typedUser?.isDoctor && !typedUser?.isAdmin && (
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
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
