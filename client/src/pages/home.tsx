import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/navigation";
import QuizCard from "@/components/quiz-card";
import LanguageSelector from "@/components/language-selector";
import { LiveCourseModal } from "@/components/LiveCourseModal";
import { MedicalReportCard } from "@/components/MedicalReportCard";
import { DoctorDashboard } from "@/components/DoctorDashboard";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { mapCategoriesToQuizCards } from "@/lib/quizUtils";
import type { Category, QuizWithCount, User as UserType } from "@shared/schema";
import { Crown, ChartLine, BookOpen, Play, Video, Calendar, ChevronLeft, ChevronRight, Shield, Upload, FileText, ArrowRight, Sparkles, Stethoscope, Users, Activity } from "lucide-react";
import { getTranslation } from "@/lib/translations";
const prohmedLogo = "/images/ciry-logo.png";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isPremium: boolean;
}

interface DashboardData {
  stats: {
    quizzesCompleted: number;
    averageScore: number;
    totalTime: number;
    currentStreak: number;
  };
  recentAttempts: Array<{
    id: string;
    quizId: string;
    score: number;
    completedAt: string;
  }>;
  progress: Array<{
    categoryId: string;
    quizzesCompleted: number;
    averageScore: number;
  }>;
}

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [selectedLiveCourseQuiz, setSelectedLiveCourseQuiz] = useState<{ id: string; title: string } | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [categoryPage, setCategoryPage] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userConsent, setUserConsent] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingPromptShown, setOnboardingPromptShown] = useState(false); // Track if prompt was already shown this session
  const CATEGORIES_PER_PAGE = 12;
  
  const userLanguage = (user as UserType)?.language;
  const t = getTranslation(userLanguage).home;
  
  // Generate user-friendly title for medical reports
  const generateReportTitle = (report: HealthReport): string => {
    const reportTypeMap: Record<string, string> = {
      'blood_test': 'Esami del Sangue',
      'radiology': 'Radiografia',
      'cardiology': 'Esame Cardiologico',
      'general': 'Referto Medico',
      'imaging': 'Diagnostica per Immagini',
      'laboratory': 'Analisi di Laboratorio',
      'xray': 'Radiografia',
      'mri': 'Risonanza Magnetica',
      'ct': 'TAC',
      'ultrasound': 'Ecografia',
    };

    const reportTypeLower = report.reportType?.toLowerCase() || '';
    const typeLabel = reportTypeMap[reportTypeLower] || 'Referto Medico';
    const date = report.reportDate 
      ? new Date(report.reportDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
      : new Date(report.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
    
    return `${typeLabel} - ${date}`;
  };
  
  // Only fetch dashboard data for aiOnlyAccess users (quiz/cybersecurity users)
  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ["/api/user/dashboard"],
    enabled: !!(user as UserType)?.aiOnlyAccess,
  });

  const { data: preventionIndex } = useQuery<{ score: number; tier: string }>({
    queryKey: ["/api/prevention/index"],
  });

  interface HealthReport {
    id: string;
    fileName: string;
    reportType: string;
    fileType: string;
    aiSummary: string;
    createdAt: string;
    reportDate: string | null;
    issuer: string | null;
    extractedValues: Record<string, any>;
    radiologicalAnalysis: any;
  }

  const { data: healthReports = [] } = useQuery<HealthReport[]>({
    queryKey: ["/api/health-score/reports"],
    enabled: !!user,
  });

  // Fetch prevention documents to get doctor notes
  interface PreventionDocument {
    id: string;
    title: string;
    summary: string;
    uploadDate: string;
    fileType: string;
    reportType?: string;
    medicalValues?: any[];
    radiologicalAnalysis?: any;
  }

  const { data: documents } = useQuery<PreventionDocument[]>({
    queryKey: ["/api/prevention/documents"],
    enabled: !!user,
  });

  // Get doctor notes from prevention documents (fileType: 'doctor_note')
  const doctorNotes = (documents || []).filter((doc: any) => doc.fileType === 'doctor_note');
  
  // Transform doctor notes to match HealthReport interface
  const doctorNotesAsReports: HealthReport[] = doctorNotes.map((note: any) => ({
    id: note.id,
    fileName: note.title,
    reportType: note.reportType || 'doctor_note',
    fileType: 'doctor_note',
    aiSummary: note.summary,
    createdAt: note.uploadDate,
    reportDate: note.uploadDate,
    issuer: 'Medico',
    extractedValues: note.medicalValues || {},
    radiologicalAnalysis: note.radiologicalAnalysis,
  }));

  // Combine health reports and doctor notes
  const allReports = [...healthReports, ...doctorNotesAsReports];

  // Get all reports sorted by date (clone to avoid mutating cache)
  const sortedReports = [...allReports]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Pagination for recent reports (2 per page)
  const [reportPage, setReportPage] = useState(0);
  const REPORTS_PER_PAGE = 2;
  const totalReportPages = Math.ceil(sortedReports.length / REPORTS_PER_PAGE);
  const recentReports = sortedReports.slice(
    reportPage * REPORTS_PER_PAGE,
    (reportPage + 1) * REPORTS_PER_PAGE
  );

  // Reset to first page when reports change (new uploads or deletions)
  useEffect(() => {
    if (sortedReports.length > 0) {
      setReportPage(0);
    }
  }, [sortedReports.length, sortedReports[0]?.id]);

  // Only fetch categories/quizzes for aiOnlyAccess users (quiz/cybersecurity users)
  const { data: categoriesWithQuizzes = [] } = useQuery<Array<Category & { quizzes: QuizWithCount[] }>>({
    queryKey: ["/api/categories-with-quizzes"],
    enabled: !!(user as UserType)?.aiOnlyAccess,
  });

  // Upload medical report mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('report', file);
      formData.append('userConsent', userConsent.toString());
      
      const response = await fetch('/api/health-score/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload fallito');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Referto caricato!",
        description: "Il tuo referto è stato analizzato con successo.",
      });
      setShowUploadDialog(false);
      setSelectedFile(null);
      setUserConsent(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "Nessun file selezionato",
        description: "Seleziona un referto da caricare",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate(selectedFile);
  };

  // Check if user needs to select a language
  useEffect(() => {
    const userWithLanguage = user as UserType;
    if (userWithLanguage && !userWithLanguage.language) {
      setShowLanguageSelector(true);
    }
  }, [user]);

  // Redirect admin users to admin dashboard
  useEffect(() => {
    const typedUser = user as UserType;
    if (typedUser?.isAdmin) {
      setLocation('/admin');
    }
  }, [user, setLocation]);

  // REMOVED: Redirect doctor users - show homepage with tabs instead
  // Doctors now see role-based tabs (Pazienti + Shortcuts)

  // Redirect aiOnlyAccess to Prevention page (but not doctors or admins)
  // Exception: allow access to /subscribe so users can purchase Premium
  useEffect(() => {
    const typedUser = user as UserType;
    const isOnSubscribePage = location === '/subscribe' || location === '/payment-success';
    if (typedUser?.aiOnlyAccess && !typedUser?.isDoctor && !typedUser?.isAdmin && !isOnSubscribePage) {
      setLocation('/prevention');
    }
  }, [user, location, setLocation]);

  // Check if user needs onboarding (only for patients, not doctors)
  // Show popup max 4 times if not completed, but only once per session
  useEffect(() => {
    const userWithOnboarding = user as UserType;
    const promptCount = userWithOnboarding?.onboardingPromptCount || 0;
    
    if (userWithOnboarding && !userWithOnboarding.isDoctor && !userWithOnboarding.onboardingCompleted && promptCount < 4 && !onboardingPromptShown) {
      // Small delay to let the user settle in before showing the dialog
      const timer = setTimeout(async () => {
        setShowOnboarding(true);
        setOnboardingPromptShown(true); // Mark as shown for this session
        
        // Increment the prompt count in background (don't block UI)
        try {
          await fetch("/api/user/increment-onboarding-prompt", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          // Silently refresh user data in background
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        } catch (error) {
          console.error("Failed to increment onboarding prompt:", error);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, onboardingPromptShown]);

  // Sort categories: pinned first, then by sortOrder
  const sortedCategories = [...categoriesWithQuizzes].sort((a, b) => {
    // Pinned categories always come first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // Then sort by sortOrder
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  // Paginate categories (12 per page)
  const totalPages = Math.ceil(sortedCategories.length / CATEGORIES_PER_PAGE);
  const paginatedCategories = sortedCategories.slice(
    categoryPage * CATEGORIES_PER_PAGE,
    (categoryPage + 1) * CATEGORIES_PER_PAGE
  );

  const quizCategories = mapCategoriesToQuizCards(paginatedCategories);
  
  // Filter featured categories (those marked as "In Evidenza")
  const featuredCategories = categoriesWithQuizzes.filter(cat => cat.isFeatured);
  const featuredQuizzes = mapCategoriesToQuizCards(featuredCategories);

  // All other quizzes (not in featured categories)
  const nonFeaturedCategories = categoriesWithQuizzes.filter(cat => !cat.isFeatured);
  const nonFeaturedQuizzes = mapCategoriesToQuizCards(nonFeaturedCategories);

  // Apply filters to featured quizzes
  let filteredFeatured = (user as User)?.isPremium 
    ? featuredQuizzes 
    : featuredQuizzes.filter(quiz => !quiz.isPremium);
  
  if (activeFilter !== "all") {
    filteredFeatured = filteredFeatured.filter(quiz => quiz.category === activeFilter);
  }

  // Apply filters to non-featured quizzes
  let filteredQuizzes = (user as User)?.isPremium 
    ? nonFeaturedQuizzes 
    : nonFeaturedQuizzes.filter(quiz => !quiz.isPremium);
  
  if (activeFilter !== "all") {
    filteredQuizzes = filteredQuizzes.filter(quiz => quiz.category === activeFilter);
  }

  const availableFeaturedQuizzes = filteredFeatured;
  const availableQuizzes = filteredQuizzes;

  // Quiz with live courses
  const liveCourseQuizTitles = [
    'DORA - Digital Operational Resilience',
    'Data Protection & Privacy',
    'EU Privacy Law & ePrivacy',
    'GDPR - Fondamenti e Principi',
    'ISO 27001 - Information Security Management',
    'NIS2 Directive - Fondamenti e Requisiti'
  ];

  const hasLiveCourse = (quizTitle: string) => {
    return liveCourseQuizTitles.some(title => quizTitle.includes(title) || title.includes(quizTitle));
  };

  const handleStartQuiz = (quizId: string, isPremium: boolean) => {
    if (isPremium && !(user as User)?.isPremium) {
      // Redirect to subscription page
      window.location.href = '/subscribe';
    } else {
      // Search for quiz in ALL categories (featured + non-featured)
      const allQuizzes = mapCategoriesToQuizCards(categoriesWithQuizzes);
      const quiz = allQuizzes.find(q => q.id === quizId);
      if (quiz) {
        window.location.href = `/quiz/${quizId}?questions=${quiz.questionCount}`;
      } else {
        // Fallback: navigate to quiz without question count parameter
        window.location.href = `/quiz/${quizId}`;
      }
    }
  };

  const handleLiveCourse = (quizId: string, quizTitle: string) => {
    setSelectedLiveCourseQuiz({ id: quizId, title: quizTitle });
  };

  const handleCrossword = (crosswordId: string) => {
    setLocation(`/crossword/${crosswordId}`);
  };

  const handleLanguageSelected = () => {
    setShowLanguageSelector(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={
          (user as UserType)?.isDoctor 
            ? "Portale Medico - CIRY" 
            : (user as UserType)?.aiOnlyAccess
              ? "Dashboard Quiz - I Tuoi Corsi Cybersecurity"
              : "AI Prevenzione - CIRY"
        }
        description={
          (user as UserType)?.isDoctor 
            ? "Gestisci i tuoi pazienti, crea referti medici e monitora la loro salute sulla piattaforma CIRY."
            : (user as UserType)?.aiOnlyAccess
              ? "Accedi ai tuoi quiz personalizzati su CISSP, CISM, ISO 27001, GDPR e altre certificazioni cybersecurity. Monitora i progressi, visualizza statistiche e continua la tua preparazione."
              : "Assistente AI per la prevenzione salute. Carica referti medici, ricevi analisi personalizzate e monitora il tuo benessere con l'intelligenza artificiale."
        }
        keywords={(user as UserType)?.isDoctor 
          ? "portale medico, gestione pazienti, referti medici, prevenzione sanitaria"
          : "dashboard quiz, progressi cybersecurity, certificazioni online, CISSP preparazione, CISM quiz"
        }
      />
      <Navigation />
      
      <LanguageSelector 
        open={showLanguageSelector} 
        onLanguageSelected={handleLanguageSelected}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="welcome-title">
              {t.welcome}, {(user as User)?.firstName || 'User'}!
            </h1>
            {!(user as UserType)?.isDoctor && !(user as UserType)?.aiOnlyAccess && (
              <>
                <p className="text-muted-foreground text-lg">
                  Il tuo assistente AI per la prevenzione e il benessere
                </p>
                <div className="mt-4">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    💚 Carica referti, chatta con l'AI e monitora la tua salute
                  </p>
                </div>
              </>
            )}
            {!(user as UserType)?.isDoctor && (user as UserType)?.aiOnlyAccess && (
              <>
                <p className="text-muted-foreground">
                  {t.subtitle}
                </p>
                <div className="mt-4">
                  <p className="text-sm text-primary font-medium">
                    🏆 Completa quiz, guadagna punti, sblocca badge e scala la classifica!
                  </p>
                </div>
              </>
            )}
            {(user as UserType)?.isDoctor && (
              <p className="text-muted-foreground text-lg">
                Gestisci i tuoi pazienti e monitora la loro salute
              </p>
            )}
          </div>
          {!(user as UserType)?.isDoctor && (user as UserType)?.aiOnlyAccess && (
            <Link href="/dashboard">
              <Button variant="outline" data-testid="button-view-dashboard">
                {t.viewDashboard}
              </Button>
            </Link>
          )}
        </div>


        {/* Role-based Tabs - Patients get Prevenzione + Referti + Appuntamenti, Doctors get Pazienti + Shortcuts */}
        {!(user as UserType)?.aiOnlyAccess && !(user as UserType)?.isDoctor && (
          <Tabs defaultValue="prevention" className="mb-8">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
              <TabsTrigger value="prevention" className="text-base" data-testid="tab-prevention">
                <Shield className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Prevenzione</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="text-base" data-testid="tab-reports">
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">I Tuoi Referti</span>
                <span className="sm:hidden">Referti</span>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="text-base" data-testid="tab-appointments">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Appuntamenti</span>
                <span className="sm:hidden">Visite</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prevention" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                      <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-1">AI Prevenzione</h2>
                      <p className="text-muted-foreground">
                        Chatta con l'AI, carica referti e ricevi analisi personalizzate
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <Link href="/prevention">
                      <Button className="w-full h-auto py-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg" data-testid="button-go-prevention">
                        <div className="flex flex-col items-center gap-2">
                          <Shield className="w-8 h-8" />
                          <span className="font-semibold text-lg">Vai alla Prevenzione</span>
                        </div>
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="w-full h-auto py-6 border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600" 
                      onClick={() => setShowUploadDialog(true)}
                      data-testid="button-upload-report"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8" />
                        <span className="font-semibold text-lg">Carica Referto</span>
                      </div>
                    </Button>
                  </div>
                  {preventionIndex && (
                    <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Prevention Index</p>
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{preventionIndex.score}/100</p>
                        </div>
                        <Badge className={`${
                          preventionIndex.tier === 'high' ? 'bg-emerald-600' :
                          preventionIndex.tier === 'medium' ? 'bg-yellow-600' : 'bg-orange-600'
                        } text-white`}>
                          {preventionIndex.tier.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                      <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-1">Dispositivi Indossabili</h2>
                      <p className="text-muted-foreground">
                        Monitora la tua salute con dispositivi wearable e ricevi alert proattivi
                      </p>
                    </div>
                  </div>
                  <Link href="/wearable">
                    <Button className="w-full h-auto py-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg" data-testid="button-go-wearable">
                      <div className="flex flex-col items-center gap-2">
                        <Activity className="w-8 h-8" />
                        <span className="font-semibold text-lg">Gestisci Dispositivi</span>
                      </div>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              {sortedReports.length > 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-2xl font-bold">Documenti Recenti</h2>
                  {totalReportPages > 1 && (
                    <span className="text-sm text-muted-foreground">
                      Pagina {reportPage + 1} di {totalReportPages}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {totalReportPages > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setReportPage(Math.max(0, reportPage - 1))}
                        disabled={reportPage === 0}
                        data-testid="button-prev-reports"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setReportPage(Math.min(totalReportPages - 1, reportPage + 1))}
                        disabled={reportPage === totalReportPages - 1}
                        data-testid="button-next-reports"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentReports.map(report => (
                  <MedicalReportCard
                    key={report.id}
                    report={{
                      id: report.id,
                      title: generateReportTitle(report),
                      reportType: report.reportType,
                      uploadDate: report.createdAt,
                      ocrConfidence: undefined,
                      aiSummary: report.aiSummary,
                      medicalValues: report.extractedValues ? Object.entries(report.extractedValues).map(([name, value]) => ({
                        name,
                        value: String(value),
                        isAbnormal: false
                      })) : [],
                      language: 'it',
                      hospitalName: report.issuer || undefined,
                      fileType: report.fileType,
                      radiologicalAnalysis: report.radiologicalAnalysis
                    }}
                  />
                ))}
              </div>
              {/* Pagination Dots Indicator */}
              {totalReportPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {Array.from({ length: totalReportPages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setReportPage(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === reportPage 
                          ? 'bg-primary w-6' 
                          : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                      }`}
                      data-testid={`dot-report-page-${index}`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">Nessun Referto Caricato</h3>
              <p className="text-muted-foreground mb-6">
                Inizia caricando i tuoi referti medici per ricevere analisi AI personalizzate
              </p>
              <Button onClick={() => setShowUploadDialog(true)} data-testid="button-upload-first-report">
                <Upload className="w-4 h-4 mr-2" />
                Carica il Primo Referto
              </Button>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="appointments" className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">I Tuoi Appuntamenti</h2>
                <p className="text-muted-foreground">
                  Visualizza e gestisci i tuoi appuntamenti medici
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Button 
                asChild 
                className="w-full h-auto py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg" 
                data-testid="button-view-appointments"
              >
                <Link href="/appointments">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="w-8 h-8" />
                    <span className="font-semibold text-lg">Vedi Appuntamenti</span>
                  </div>
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline" 
                className="w-full h-auto py-6 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600" 
                data-testid="button-book-teleconsult"
              >
                <Link href="/teleconsulto">
                  <div className="flex flex-col items-center gap-2">
                    <Video className="w-8 h-8" />
                    <span className="font-semibold text-lg">Prenota Teleconsulto</span>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )}

  {/* Doctor Tabs - Pazienti + Shortcuts Rapidi */}
  {(user as UserType)?.isDoctor && (
    <Tabs defaultValue="patients" className="mb-8">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="patients" className="text-base" data-testid="tab-patients">
          <Stethoscope className="w-4 h-4 mr-2" />
          I Tuoi Pazienti
        </TabsTrigger>
        <TabsTrigger value="shortcuts" className="text-base" data-testid="tab-shortcuts">
          <ArrowRight className="w-4 h-4 mr-2" />
          Shortcuts Rapidi
        </TabsTrigger>
      </TabsList>

      <TabsContent value="patients">
        <DoctorDashboard />
      </TabsContent>

      <TabsContent value="shortcuts" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/doctor/patients">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-all-patients">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold mb-1">Lista Pazienti</h3>
                <p className="text-sm text-muted-foreground">Visualizza tutti i pazienti</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/prevention">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-ai-prevention">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold mb-1">AI Diagnostica</h3>
                <p className="text-sm text-muted-foreground">Chatta con l'AI medica</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/wearable">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-wearable">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold mb-1">Dispositivi Wearable</h3>
                <p className="text-sm text-muted-foreground">Monitora dati salute</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/knowledge-base">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-knowledge-base">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold mb-1">Knowledge Base</h3>
                <p className="text-sm text-muted-foreground">Documenti scientifici</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </TabsContent>
    </Tabs>
  )}

        {/* Quick Stats - HIDDEN for regular patients, only for aiOnlyAccess */}
        {dashboardData && !(user as UserType)?.isDoctor && (user as UserType)?.aiOnlyAccess && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.stats.completed}</p>
                    <p className="text-2xl font-bold" data-testid="stat-completed">
                      {dashboardData.stats.quizzesCompleted}
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.stats.averageScore}</p>
                    <p className="text-2xl font-bold text-success" data-testid="stat-average">
                      {dashboardData.stats.averageScore}%
                    </p>
                  </div>
                  <ChartLine className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.stats.timeSpent}</p>
                    <p className="text-2xl font-bold text-accent" data-testid="stat-time">
                      {dashboardData.stats.totalTime}h
                    </p>
                  </div>
                  <ChartLine className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.stats.streak}</p>
                    <p className="text-2xl font-bold text-warning" data-testid="stat-streak">
                      {dashboardData.stats.currentStreak}
                    </p>
                  </div>
                  <ChartLine className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Premium Status - HIDDEN for regular patients and doctors */}
        {!(user as User)?.isPremium && !(user as UserType)?.isDoctor && (user as UserType)?.aiOnlyAccess && (
          <Card className="gradient-primary text-white mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">{t.noPremium.title}</h3>
                  <p className="text-white/90 mb-2">
                    {t.noPremium.description}
                  </p>
                  <p className="text-white/80 text-sm">
                    Accedi a sfide quotidiane, classifica globale e sistema di punti gamificato
                  </p>
                </div>
                <Link href="/subscribe">
                  <Button 
                    className="bg-white text-primary hover:bg-white/90"
                    data-testid="button-upgrade"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {t.noPremium.upgrade}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Section - HIDDEN for regular patients and doctors */}
        {!(user as UserType)?.isDoctor && (user as UserType)?.aiOnlyAccess && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Filtra per Categoria</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                onClick={() => setActiveFilter("all")}
                size="sm"
                className="rounded-full"
                data-testid="filter-all-home"
              >
                Tutti
              </Button>
              <Button
                variant={activeFilter === "certifications" ? "default" : "outline"}
                onClick={() => setActiveFilter("certifications")}
                size="sm"
                className="rounded-full"
                data-testid="filter-certifications-home"
              >
                Certificazioni
              </Button>
              <Button
                variant={activeFilter === "compliance" ? "default" : "outline"}
                onClick={() => setActiveFilter("compliance")}
                size="sm"
                className="rounded-full"
                data-testid="filter-compliance-home"
              >
                Compliance
              </Button>
              <Button
                variant={activeFilter === "ai" ? "default" : "outline"}
                onClick={() => setActiveFilter("ai")}
                size="sm"
                className="rounded-full"
                data-testid="filter-ai-home"
              >
                AI & Security
              </Button>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Categories Carousel - HIDDEN for regular patients and doctors */}
        {quizCategories.length > 0 && !(user as UserType)?.isDoctor && (user as UserType)?.aiOnlyAccess && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Categorie Quiz</h2>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCategoryPage(prev => Math.max(0, prev - 1))}
                    disabled={categoryPage === 0}
                    data-testid="button-prev-categories"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {categoryPage + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCategoryPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={categoryPage === totalPages - 1}
                    data-testid="button-next-categories"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizCategories.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onStartQuiz={() => handleStartQuiz(quiz.id, quiz.isPremium)}
                  onLiveCourse={() => handleLiveCourse(quiz.id, quiz.title)}
                  onCrossword={quiz.crosswordId ? () => handleCrossword(quiz.crosswordId!) : undefined}
                  hasLiveCourse={hasLiveCourse(quiz.title)}
                  showPremiumBadge={!(user as User)?.isPremium}
                />
              ))}
            </div>
          </div>
        )}

        {/* Available Quizzes - HIDDEN for regular patients and doctors */}
        {!(user as UserType)?.isDoctor && (user as UserType)?.aiOnlyAccess && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t.categories.allQuizzes}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onStartQuiz={() => handleStartQuiz(quiz.id, quiz.isPremium)}
                onLiveCourse={() => handleLiveCourse(quiz.id, quiz.title)}
                onCrossword={quiz.crosswordId ? () => handleCrossword(quiz.crosswordId!) : undefined}
                hasLiveCourse={hasLiveCourse(quiz.title)}
                showPremiumBadge={!(user as User)?.isPremium}
              />
            ))}
          </div>

          {selectedLiveCourseQuiz && (
            <LiveCourseModal
              quizId={selectedLiveCourseQuiz.id}
              quizTitle={selectedLiveCourseQuiz.title}
              isOpen={!!selectedLiveCourseQuiz}
              onClose={() => setSelectedLiveCourseQuiz(null)}
            />
          )}

          {availableQuizzes.length === 0 && (
            <Card className="p-12 text-center">
              <CardContent>
                <Crown className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{t.emptyState.title}</h3>
                <p className="text-muted-foreground mb-4">
                  {t.emptyState.description}
                </p>
                <Link href="/subscribe">
                  <Button data-testid="button-get-premium">
                    {t.emptyState.button}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
        )}

      </div>

      <Footer />

      {/* Onboarding Dialog */}
      <OnboardingDialog 
        open={showOnboarding} 
        onOpenChange={setShowOnboarding}
      />

      {/* Medical Report Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Carica Referto Medico</DialogTitle>
            <DialogDescription>
              Carica un referto medico (PDF o immagine) per l'analisi AI. I tuoi dati personali verranno automaticamente anonimizzati.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-file">File Referto (PDF o Immagine)</Label>
              <input
                id="report-file"
                type="file"
                accept=".pdf,image/jpeg,image/jpg,image/png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                data-testid="input-report-file"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  File selezionato: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="consent"
                checked={userConsent}
                onCheckedChange={(checked) => setUserConsent(checked as boolean)}
                data-testid="checkbox-consent"
              />
              <Label
                htmlFor="consent"
                className="text-sm font-normal leading-normal cursor-pointer"
              >
                Acconsento al trattamento dei dati medici per l'analisi AI e il calcolo dello Health Score
              </Label>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">Privacy e Sicurezza</p>
                  <p className="text-xs">
                    I dati personali (nome, CF, telefono) vengono automaticamente rimossi prima dell'analisi AI. 
                    Il documento viene elaborato in modo sicuro e conforme al GDPR.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setSelectedFile(null);
                setUserConsent(false);
              }}
              data-testid="button-cancel-upload"
            >
              Annulla
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !userConsent || uploadMutation.isPending}
              data-testid="button-confirm-upload"
            >
              {uploadMutation.isPending ? "Caricamento..." : "Carica e Analizza"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
