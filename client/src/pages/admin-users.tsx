import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Crown, Search, Stethoscope, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isDoctor: boolean;
  isPremium: boolean;
  subscriptionTier: string;
  aiOnlyAccess: boolean;
}

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users = [], isLoading: usersLoading } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!(user as any)?.isAdmin,
  });

  const togglePremiumPlusMutation = useMutation({
    mutationFn: async ({ userId, enable }: { userId: string; enable: boolean }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/premium-plus`, { enable });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Successo",
        description: "Piano Premium Plus aggiornato",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il piano",
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

  const doctors = filteredUsers.filter(u => u.isDoctor);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestione Utenti</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestisci piani Premium Plus per i medici</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <p className="text-sm text-muted-foreground">Medici</p>
                  <p className="text-2xl font-bold">{doctors.length}</p>
                </div>
                <Stethoscope className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Premium Plus</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.subscriptionTier === 'premium_plus').length}
                  </p>
                </div>
                <Crown className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Doctors Management */}
        <Card>
          <CardHeader>
            <CardTitle>Gestione Premium Plus Medici</CardTitle>
            <CardDescription>Abilita o disabilita Premium Plus per i medici registrati</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca medico per email o nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-users"
              />
            </div>

            {usersLoading ? (
              <p className="text-center text-muted-foreground py-8">Caricamento...</p>
            ) : doctors.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nessun medico trovato</p>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medico</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Piano Attuale</TableHead>
                      <TableHead className="text-right">Premium Plus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors.map((doctor) => (
                      <TableRow key={doctor.id} data-testid={`row-doctor-${doctor.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">
                              {doctor.firstName || doctor.lastName 
                                ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()
                                : 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{doctor.email}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={doctor.subscriptionTier === 'premium_plus' ? 'default' : 'secondary'}
                            className={doctor.subscriptionTier === 'premium_plus' 
                              ? 'bg-orange-500 hover:bg-orange-600' 
                              : ''}
                          >
                            {doctor.subscriptionTier === 'premium_plus' ? 'Premium Plus' : 
                             doctor.subscriptionTier === 'premium' ? 'Premium' : 'Free'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={doctor.subscriptionTier === 'premium_plus'}
                              onCheckedChange={(checked) => {
                                togglePremiumPlusMutation.mutate({
                                  userId: doctor.id,
                                  enable: checked,
                                });
                              }}
                              disabled={togglePremiumPlusMutation.isPending}
                              data-testid={`switch-premium-plus-${doctor.id}`}
                            />
                            <Shield className={`w-4 h-4 ${
                              doctor.subscriptionTier === 'premium_plus' 
                                ? 'text-orange-500' 
                                : 'text-muted-foreground'
                            }`} />
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
      </div>
    </AdminLayout>
  );
}
