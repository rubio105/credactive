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
  Trophy
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
              onClick={() => window.location.href = '/leaderboard'}
              data-testid="button-view-leaderboard"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Classifica Team
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="team" data-testid="tab-team">
              <Users className="mr-2 h-4 w-4" />
              Team ({dashboard.team.total})
            </TabsTrigger>
            <TabsTrigger value="invites" data-testid="tab-invites">
              <Mail className="mr-2 h-4 w-4" />
              Inviti ({dashboard.invites.all.length})
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
        </Tabs>
      </div>
    </div>
  );
}
