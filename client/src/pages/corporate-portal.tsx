import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, 
  Mail, 
  TrendingUp, 
  Award, 
  UserPlus, 
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Trash2,
  Trophy,
  LogOut,
  Home
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  points: number;
  isVerified: boolean;
  createdAt: string;
  quizCount: number;
  lastActivity: string | null;
}

interface Invite {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

interface DashboardData {
  agreement: {
    id: string;
    companyName: string;
    tier: string;
    isActive: boolean;
    licensesOwned: number;
    licensesUsed: number;
    currentUsers: number;
  };
  team: {
    members: TeamMember[];
    total: number;
    verified: number;
    active: number;
    avgPoints: number;
  };
  invites: {
    all: Invite[];
    pending: number;
    accepted: number;
  };
  metrics: {
    totalPoints: number;
    totalAttempts: number;
    utilizationRate: number;
  };
}

export default function CorporatePortal() {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteType, setInviteType] = useState<'general' | 'course'>('general');
  const [courseType, setCourseType] = useState<'live' | 'on_demand'>('live');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  
  // Company-wide courses state
  const [isCompanyCourseDialogOpen, setIsCompanyCourseDialogOpen] = useState(false);
  const [companyCourseType, setCompanyCourseType] = useState<'live' | 'on_demand'>('live');
  const [selectedCompanyCourseId, setSelectedCompanyCourseId] = useState<string>('');
  
  // Bulk invite state
  const [bulkEmails, setBulkEmails] = useState("");

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/corporate/dashboard"],
  });

  // Load live courses for course selection
  const { data: liveCourses } = useQuery<any[]>({
    queryKey: ["/api/live-courses"],
    enabled: inviteType === 'course' && courseType === 'live',
  });

  // Load categories (on-demand courses) for course selection
  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    enabled: inviteType === 'course' && courseType === 'on_demand',
  });
  
  // Load company-wide live courses
  const { data: companyLiveCourses } = useQuery<any[]>({
    queryKey: ["/api/live-courses"],
    enabled: isCompanyCourseDialogOpen && companyCourseType === 'live',
  });
  
  // Load company-wide categories
  const { data: companyCategories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    enabled: isCompanyCourseDialogOpen && companyCourseType === 'on_demand',
  });
  
  // Load company course assignments
  const { data: courseAssignments } = useQuery<any[]>({
    queryKey: ["/api/corporate/course-assignments"],
  });

  const createInviteMutation = useMutation({
    mutationFn: async (data: { 
      email: string; 
      targetCourseId?: string; 
      targetCourseType?: 'live' | 'on_demand';
      targetCourseName?: string;
    }) => {
      const res = await apiRequest("/api/corporate/invites", "POST", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Invito Inviato",
        description: "L'invito è stato inviato via email con successo.",
      });
      setInviteEmail("");
      setInviteType('general');
      setSelectedCourseId('');
      setIsInviteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/corporate/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile inviare l'invito.",
        variant: "destructive",
      });
    },
  });

  const deleteInviteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/api/corporate/invites/${id}`, "DELETE");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Invito Eliminato",
        description: "L'invito è stato cancellato.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/corporate/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare l'invito.",
        variant: "destructive",
      });
    },
  });
  
  // Company course assignment mutations
  const assignCourseMutation = useMutation({
    mutationFn: async (data: { courseType: string; courseId: string; courseName: string }) => {
      const res = await apiRequest("/api/corporate/course-assignments", "POST", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Corso Assegnato",
        description: "Il corso è ora disponibile per tutti i dipendenti.",
      });
      setSelectedCompanyCourseId('');
      setIsCompanyCourseDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/corporate/course-assignments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile assegnare il corso.",
        variant: "destructive",
      });
    },
  });
  
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/api/corporate/course-assignments/${id}`, "DELETE");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Assegnazione Rimossa",
        description: "Il corso non è più assegnato all'azienda.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/corporate/course-assignments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile rimuovere l'assegnazione.",
        variant: "destructive",
      });
    },
  });
  
  // Bulk invite mutation
  const bulkInviteMutation = useMutation({
    mutationFn: async (data: { emails: string[]; courseType?: string; courseId?: string; courseName?: string }) => {
      const res = await apiRequest("/api/corporate/invites/bulk-csv", "POST", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Inviti Inviati",
        description: `${data.results?.length || 0} inviti inviati con successo. ${data.errors?.length || 0} falliti.`,
      });
      setBulkEmails("");
      queryClient.invalidateQueries({ queryKey: ["/api/corporate/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile inviare gli inviti multipli.",
        variant: "destructive",
      });
    },
  });

  const handleSendInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast({
        title: "Errore",
        description: "Inserisci un indirizzo email valido.",
        variant: "destructive",
      });
      return;
    }

    // Validate course-specific invite
    if (inviteType === 'course' && !selectedCourseId) {
      toast({
        title: "Errore",
        description: "Seleziona un corso per l'invito corso-specifico.",
        variant: "destructive",
      });
      return;
    }

    const inviteData: { 
      email: string; 
      targetCourseId?: string; 
      targetCourseType?: 'live' | 'on_demand';
      targetCourseName?: string;
    } = {
      email: inviteEmail.toLowerCase().trim(),
    };

    if (inviteType === 'course' && selectedCourseId) {
      inviteData.targetCourseId = selectedCourseId;
      inviteData.targetCourseType = courseType;
      
      // Find course name
      if (courseType === 'live') {
        const course = liveCourses?.find(c => c.id === selectedCourseId);
        inviteData.targetCourseName = course?.title;
      } else {
        const category = categories?.find(c => c.id === selectedCourseId);
        inviteData.targetCourseName = category?.name;
      }
    }

    createInviteMutation.mutate(inviteData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400">Caricamento dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Accesso Negato</CardTitle>
              <CardDescription>
                Non hai un account aziendale. Contatta il supporto per maggiori informazioni.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const utilizationPercentage = dashboard.metrics.utilizationRate;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {dashboard.agreement.companyName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Dashboard Aziendale • Piano {dashboard.agreement.tier}
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '/'}
              data-testid="button-home"
            >
              <Home className="mr-2 h-5 w-5" />
              Home
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '/leaderboard'}
              data-testid="button-view-leaderboard"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Classifica Team
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Esci
            </Button>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                data-testid="button-invite-user"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Invita Dipendente
              </Button>
            </DialogTrigger>
<DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Invita un Nuovo Dipendente</DialogTitle>
                <DialogDescription>
                  Invia un invito via email. Il dipendente riceverà un link per registrarsi.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Dipendente</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="dipendente@azienda.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                    data-testid="input-invite-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-type">Tipo di Invito</Label>
                  <Select 
                    value={inviteType} 
                    onValueChange={(value: 'general' | 'course') => {
                      setInviteType(value);
                      setSelectedCourseId('');
                    }}
                  >
                    <SelectTrigger id="invite-type" data-testid="select-invite-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Invito Generale (Accesso a tutti i contenuti)</SelectItem>
                      <SelectItem value="course">Invito a Corso Specifico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {inviteType === 'course' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="course-type">Tipo di Corso</Label>
                      <Select 
                        value={courseType} 
                        onValueChange={(value: 'live' | 'on_demand') => {
                          setCourseType(value);
                          setSelectedCourseId('');
                        }}
                      >
                        <SelectTrigger id="course-type" data-testid="select-course-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="live">Corso Live</SelectItem>
                          <SelectItem value="on_demand">Corso On-Demand</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="course-select">Seleziona Corso</Label>
                      <Select 
                        value={selectedCourseId} 
                        onValueChange={setSelectedCourseId}
                      >
                        <SelectTrigger id="course-select" data-testid="select-course">
                          <SelectValue placeholder="Scegli un corso..." />
                        </SelectTrigger>
                        <SelectContent>
                          {courseType === 'live' && liveCourses?.map(course => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                          {courseType === 'on_demand' && categories?.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Licenze disponibili: {dashboard.agreement.licensesOwned - dashboard.agreement.licensesUsed} / {dashboard.agreement.licensesOwned}
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSendInvite}
                  disabled={createInviteMutation.isPending || (inviteType === 'course' && !selectedCourseId)}
                  data-testid="button-send-invite"
                >
                  {createInviteMutation.isPending ? "Invio..." : "Invia Invito"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membri Team</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-team-total">{dashboard.team.total}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {dashboard.team.active} attivi
              </p>
              <Progress value={utilizationPercentage} className="mt-2" />
              <p className="text-xs text-gray-500 mt-1">
                Utilizzo licenze: {utilizationPercentage}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Punti Medi</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-avg-points">{dashboard.team.avgPoints}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Totale: {dashboard.metrics.totalPoints} punti
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quiz Completati</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-total-attempts">{dashboard.metrics.totalAttempts}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Dal team completo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inviti Pendenti</CardTitle>
              <Mail className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-pending-invites">{dashboard.invites.pending}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {dashboard.invites.accepted} accettati
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="team" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="team" data-testid="tab-team">
              <Users className="mr-2 h-4 w-4" />
              Team ({dashboard.team.total})
            </TabsTrigger>
            <TabsTrigger value="invites" data-testid="tab-invites">
              <Mail className="mr-2 h-4 w-4" />
              Inviti ({dashboard.invites.all.length})
            </TabsTrigger>
            <TabsTrigger value="courses" data-testid="tab-courses">
              <Award className="mr-2 h-4 w-4" />
              Corsi Aziendali ({courseAssignments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="bulk-invites" data-testid="tab-bulk-invites">
              <UserPlus className="mr-2 h-4 w-4" />
              Inviti Multipli
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Membri del Team</CardTitle>
                <CardDescription>
                  Visualizza tutti i dipendenti registrati e le loro performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dipendente</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Punti</TableHead>
                      <TableHead className="text-center">Quiz</TableHead>
                      <TableHead className="text-center">Ultima Attività</TableHead>
                      <TableHead className="text-center">Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.team.members.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          Nessun membro nel team. Inizia invitando i tuoi dipendenti!
                        </TableCell>
                      </TableRow>
                    ) : (
                      dashboard.team.members.map((member) => (
                        <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                          <TableCell className="font-medium">
                            {member.firstName} {member.lastName}
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">
                              {member.points || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{member.quizCount}</TableCell>
                          <TableCell className="text-center text-sm text-gray-600">
                            {member.lastActivity 
                              ? format(new Date(member.lastActivity), "dd MMM yyyy", { locale: it })
                              : "Mai"}
                          </TableCell>
                          <TableCell className="text-center">
                            {member.isVerified ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Verificato
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="mr-1 h-3 w-3" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inviti Inviati</CardTitle>
                <CardDescription>
                  Gestisci tutti gli inviti ai dipendenti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Stato</TableHead>
                      <TableHead className="text-center">Inviato</TableHead>
                      <TableHead className="text-center">Scadenza</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.invites.all.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          Nessun invito inviato. Clicca "Invita Dipendente" per iniziare.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dashboard.invites.all.map((invite) => (
                        <TableRow key={invite.id} data-testid={`row-invite-${invite.id}`}>
                          <TableCell className="font-medium">{invite.email}</TableCell>
                          <TableCell className="text-center">
                            {invite.status === "pending" && (
                              <Badge variant="secondary">
                                <Clock className="mr-1 h-3 w-3" />
                                In Attesa
                              </Badge>
                            )}
                            {invite.status === "accepted" && (
                              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Accettato
                              </Badge>
                            )}
                            {invite.status === "expired" && (
                              <Badge variant="destructive">
                                <XCircle className="mr-1 h-3 w-3" />
                                Scaduto
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm text-gray-600">
                            {format(new Date(invite.createdAt), "dd MMM yyyy", { locale: it })}
                          </TableCell>
                          <TableCell className="text-center text-sm text-gray-600">
                            {format(new Date(invite.expiresAt), "dd MMM yyyy", { locale: it })}
                          </TableCell>
                          <TableCell className="text-right">
                            {invite.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteInviteMutation.mutate(invite.id)}
                                disabled={deleteInviteMutation.isPending}
                                data-testid={`button-delete-invite-${invite.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Corsi Aziendali</CardTitle>
                  <CardDescription>
                    Gestisci i corsi disponibili per tutti i dipendenti
                  </CardDescription>
                </div>
                <Dialog open={isCompanyCourseDialogOpen} onOpenChange={setIsCompanyCourseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-assign-course">
                      <Award className="mr-2 h-4 w-4" />
                      Assegna Corso
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Assegna Corso all'Azienda</DialogTitle>
                      <DialogDescription>
                        Tutti i dipendenti attuali e futuri avranno accesso automatico
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-course-type">Tipo di Corso</Label>
                        <Select 
                          value={companyCourseType} 
                          onValueChange={(value: 'live' | 'on_demand') => {
                            setCompanyCourseType(value);
                            setSelectedCompanyCourseId('');
                          }}
                        >
                          <SelectTrigger id="company-course-type" data-testid="select-company-course-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="live">Corso Live</SelectItem>
                            <SelectItem value="on_demand">Corso On-Demand</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company-course-select">Seleziona Corso</Label>
                        <Select 
                          value={selectedCompanyCourseId} 
                          onValueChange={setSelectedCompanyCourseId}
                        >
                          <SelectTrigger id="company-course-select" data-testid="select-company-course">
                            <SelectValue placeholder="Scegli un corso..." />
                          </SelectTrigger>
                          <SelectContent>
                            {companyCourseType === 'live' && companyLiveCourses?.map(course => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.title}
                              </SelectItem>
                            ))}
                            {companyCourseType === 'on_demand' && companyCategories?.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={() => {
                          if (!selectedCompanyCourseId) {
                            toast({
                              title: "Errore",
                              description: "Seleziona un corso.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          const courseName = companyCourseType === 'live'
                            ? companyLiveCourses?.find(c => c.id === selectedCompanyCourseId)?.title
                            : companyCategories?.find(c => c.id === selectedCompanyCourseId)?.name;
                          
                          assignCourseMutation.mutate({
                            courseType: companyCourseType,
                            courseId: selectedCompanyCourseId,
                            courseName: courseName || ''
                          });
                        }}
                        disabled={assignCourseMutation.isPending || !selectedCompanyCourseId}
                        data-testid="button-submit-assign-course"
                      >
                        {assignCourseMutation.isPending ? "Assegnazione..." : "Assegna Corso"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Corso</TableHead>
                      <TableHead className="text-center">Tipo</TableHead>
                      <TableHead className="text-center">Data Assegnazione</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!courseAssignments || courseAssignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                          Nessun corso assegnato. Clicca "Assegna Corso" per iniziare.
                        </TableCell>
                      </TableRow>
                    ) : (
                      courseAssignments.map((assignment: any) => (
                        <TableRow key={assignment.id} data-testid={`row-course-assignment-${assignment.id}`}>
                          <TableCell className="font-medium">{assignment.courseName}</TableCell>
                          <TableCell className="text-center">
                            {assignment.courseType === 'live' ? (
                              <Badge variant="default" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                Live
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                On-Demand
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm text-gray-600">
                            {format(new Date(assignment.createdAt), "dd MMM yyyy", { locale: it })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                              disabled={deleteAssignmentMutation.isPending}
                              data-testid={`button-delete-assignment-${assignment.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-invites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inviti Multipli</CardTitle>
                <CardDescription>
                  Invia inviti a più dipendenti contemporaneamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-emails">Email Dipendenti (una per riga)</Label>
                  <Textarea
                    id="bulk-emails"
                    placeholder="dipendente1@azienda.com&#10;dipendente2@azienda.com&#10;dipendente3@azienda.com"
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                    rows={8}
                    data-testid="textarea-bulk-emails"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Inserisci un indirizzo email per riga. Gli inviti verranno inviati a tutti gli indirizzi validi.
                  </p>
                </div>

                <Button 
                  onClick={() => {
                    const emailList = bulkEmails
                      .split('\n')
                      .map(e => e.trim().toLowerCase())
                      .filter(e => e && e.includes('@'));
                    
                    if (emailList.length === 0) {
                      toast({
                        title: "Errore",
                        description: "Inserisci almeno un indirizzo email valido.",
                        variant: "destructive",
                      });
                      return;
                    }

                    bulkInviteMutation.mutate({ emails: emailList });
                  }}
                  disabled={bulkInviteMutation.isPending}
                  data-testid="button-send-bulk-invites"
                >
                  {bulkInviteMutation.isPending ? "Invio in corso..." : `Invia Inviti (${bulkEmails.split('\n').filter(e => e.trim() && e.includes('@')).length})`}
                </Button>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Formato CSV
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Puoi anche copiare una colonna di email da un foglio Excel o CSV e incollarla direttamente. 
                    Il sistema processerà automaticamente gli indirizzi validi.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
