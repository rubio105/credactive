import { Link } from "wouter";
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
import { ShieldCheck, ChartLine, BookOpen, User, Crown, Menu, LogOut } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isPremium: boolean;
}

export default function Navigation() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const typedUser = user as User;

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const handleLogin = () => {
    window.location.href = '/api/login';
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

  return (
    <nav className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer" data-testid="logo">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <ShieldCheck className="text-primary-foreground text-xl" />
              </div>
              <span className="text-xl font-bold text-secondary">
                CyberQuiz<span className="text-primary">Pro</span>
              </span>
            </div>
          </Link>
          
          {/* Desktop Navigation - Authenticated */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-6">
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
            </div>
          )}

          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 animate-pulse bg-muted rounded-full" />
            ) : !isAuthenticated ? (
              /* Not Authenticated State */
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={handleLogin}
                  data-testid="button-login"
                >
                  Accedi
                </Button>
                <Button 
                  onClick={handleLogin}
                  data-testid="button-register"
                >
                  Registrati
                </Button>
              </div>
            ) : (
              /* Authenticated State */
              <div className="flex items-center space-x-4">
                {/* Premium Badge */}
                {typedUser?.isPremium && (
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
                      {typedUser?.isPremium && (
                        <Badge className="mt-1 bg-accent/10 text-accent border-accent/20 text-xs py-0.5">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <DropdownMenuSeparator />
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
                    {!typedUser?.isPremium && (
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
