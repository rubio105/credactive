import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Crown, Search, Stethoscope, User, Shield, Plus, UserPlus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isDoctor: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  subscriptionTier: string;
  aiOnlyAccess: boolean;
}

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    userType: "patient", // patient, doctor, admin, ai_only
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!(user as any)?.isAdmin,
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const payload: any = {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
      };

      if (userData.userType === "doctor") {
        payload.isDoctor = true;
      } else if (userData.userType === "admin") {
        payload.isAdmin = true;
      } else if (userData.userType === "ai_only") {
        payload.aiOnlyAccess = true;
      }

      return apiRequest("/api/admin/users", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowCreateDialog(false);
      setNewUser({ email: "", password: "", firstName: "", lastName: "", userType: "patient" });
      toast({
        title: "Utente creato",
        description: "L'utente è stato creato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare l'utente",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      return apiRequest(`/api/admin/users/${userId}`, "PATCH", updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      // Use functional update to avoid stale state issues
      setEditingUser(prev => prev ? { ...prev, ...variables.updates } : prev);
      toast({
        title: "Aggiornato",
        description: "Modifiche salvate con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'utente",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest(`/api/admin/users/${userId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Utente eliminato",
        description: "L'utente è stato eliminato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'utente",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!(user as any)?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Accesso Negato</CardTitle>
            <CardDescription>
              Non hai i permessi necessari per accedere a questa sezione.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserType = (u: UserData) => {
    if (u.isAdmin) return "Admin";
    if (u.isDoctor) return "Medico";
    if (u.aiOnlyAccess) return "AI Only";
    return "Paziente";
  };

  const getUserTypeIcon = (u: UserData) => {
    if (u.isAdmin) return <Shield className="w-4 h-4 text-red-500" />;
    if (u.isDoctor) return <Stethoscope className="w-4 h-4 text-blue-500" />;
    if (u.aiOnlyAccess) return <Crown className="w-4 h-4 text-purple-500" />;
    return <User className="w-4 h-4 text-gray-500" />;
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestione Utenti</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Crea e gestisci utenti della piattaforma</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-user">
                <UserPlus className="w-4 h-4 mr-2" />
                Crea Utente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crea Nuovo Utente</DialogTitle>
                <DialogDescription>
                  Compila i campi per creare un nuovo utente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="utente@example.com"
                    data-testid="input-new-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="••••••••"
                    data-testid="input-new-password"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                      placeholder="Mario"
                      data-testid="input-new-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Cognome</Label>
                    <Input
                      id="lastName"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                      placeholder="Rossi"
                      data-testid="input-new-lastname"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userType">Tipo Utente *</Label>
                  <Select
                    value={newUser.userType}
                    onValueChange={(value) => setNewUser({ ...newUser, userType: value })}
                  >
                    <SelectTrigger data-testid="select-user-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Paziente</SelectItem>
                      <SelectItem value="doctor">Medico</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="ai_only">Accesso AI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={() => createUserMutation.mutate(newUser)}
                  disabled={!newUser.email || !newUser.password || createUserMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createUserMutation.isPending ? "Creazione..." : "Crea Utente"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Utenti Totali</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pazienti</p>
                  <p className="text-2xl font-bold">{users.filter(u => !u.isDoctor && !u.isAdmin && !u.aiOnlyAccess).length}</p>
                </div>
                <User className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Medici</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.isDoctor).length}</p>
                </div>
                <Stethoscope className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admin</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.isAdmin).length}</p>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tutti gli Utenti</CardTitle>
            <CardDescription>Gestisci tutti gli utenti della piattaforma</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per email o nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-users"
              />
            </div>

            {usersLoading ? (
              <p className="text-center text-muted-foreground py-8">Caricamento...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nessun utente trovato</p>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utente</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Piano</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getUserTypeIcon(u)}
                            <span className="font-medium">
                              {u.firstName || u.lastName 
                                ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
                                : 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getUserType(u)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={u.subscriptionTier === 'premium_plus' ? 'default' : 'secondary'}
                            className={u.subscriptionTier === 'premium_plus' 
                              ? 'bg-orange-500 hover:bg-orange-600' 
                              : ''}
                          >
                            {u.subscriptionTier === 'premium_plus' ? 'Premium Plus' : 
                             u.subscriptionTier === 'premium' ? 'Premium' : 'Free'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingUser(u);
                                setShowEditDialog(true);
                              }}
                              data-testid={`button-edit-${u.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Sei sicuro di voler eliminare ${u.email}?`)) {
                                  deleteUserMutation.mutate(u.id);
                                }
                              }}
                              data-testid={`button-delete-${u.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) {
            setEditingUser(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica Utente</DialogTitle>
              <DialogDescription>
                Modifica i ruoli e i permessi dell'utente. Le modifiche vengono salvate automaticamente.
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={editingUser.email} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Medico</Label>
                    <p className="text-sm text-muted-foreground">Accesso strumenti medici</p>
                  </div>
                  <Switch
                    checked={editingUser.isDoctor}
                    onCheckedChange={(checked) => {
                      updateUserMutation.mutate({
                        userId: editingUser.id,
                        updates: { isDoctor: checked }
                      });
                    }}
                    data-testid="switch-is-doctor"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Admin</Label>
                    <p className="text-sm text-muted-foreground">Accesso pannello admin</p>
                  </div>
                  <Switch
                    checked={editingUser.isAdmin}
                    onCheckedChange={(checked) => {
                      updateUserMutation.mutate({
                        userId: editingUser.id,
                        updates: { isAdmin: checked }
                      });
                    }}
                    data-testid="switch-is-admin"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Accesso AI</Label>
                    <p className="text-sm text-muted-foreground">Accesso limitato alle funzionalità AI</p>
                  </div>
                  <Switch
                    checked={editingUser.aiOnlyAccess}
                    onCheckedChange={(checked) => {
                      updateUserMutation.mutate({
                        userId: editingUser.id,
                        updates: { aiOnlyAccess: checked }
                      });
                    }}
                    data-testid="switch-ai-only"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingUser(null);
                  }}
                  data-testid="button-close-edit"
                >
                  Chiudi
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
