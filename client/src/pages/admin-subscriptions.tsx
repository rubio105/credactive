import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Crown, Users, Search, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier: string;
  isPremium: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  aiOnlyAccess: boolean;
}

export default function AdminSubscriptionsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>("free");

  const { data: users = [], isLoading } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateTierMutation = useMutation({
    mutationFn: async ({ userId, tier }: { userId: string; tier: string }) => {
      const response = await apiRequest(`/api/admin/users/${userId}`, "PATCH", {
        subscriptionTier: tier,
        isPremium: tier !== "free",
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Errore sconosciuto" }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      toast({
        title: "Piano aggiornato",
        description: "Il piano dell'utente è stato modificato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare il piano",
        variant: "destructive",
      });
    },
  });

  const stats = {
    total: users.length,
    free: users.filter((u) => u.subscriptionTier === "free").length,
    premium: users.filter((u) => u.subscriptionTier === "premium").length,
    premiumPlus: users.filter((u) => u.subscriptionTier === "premium_plus").length,
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query)
    );
  });

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "premium_plus":
        return <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">Premium Plus</Badge>;
      case "premium":
        return <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">Premium</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const handleEditTier = (user: UserData) => {
    setEditingUser(user);
    setSelectedTier(user.subscriptionTier || "free");
  };

  const handleSaveTier = () => {
    if (!editingUser) return;
    updateTierMutation.mutate({ userId: editingUser.id, tier: selectedTier });
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestione Subscription</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Visualizza e modifica i piani degli utenti</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totale Utenti</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Free</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.free}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? ((stats.free / stats.total) * 100).toFixed(1) : '0'}% del totale
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Premium</CardTitle>
              <Crown className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.premium}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? ((stats.premium / stats.total) * 100).toFixed(1) : '0'}% del totale
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Premium Plus</CardTitle>
              <Crown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.premiumPlus}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? ((stats.premiumPlus / stats.total) * 100).toFixed(1) : '0'}% del totale
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Utenti e Piani</CardTitle>
                <CardDescription>Gestisci i piani di subscription degli utenti</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca utente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-subscriptions"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Piano</TableHead>
                    <TableHead>Tipo Utente</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : "-"}
                      </TableCell>
                      <TableCell>{getTierBadge(user.subscriptionTier || "free")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.isAdmin && <Badge variant="outline">Admin</Badge>}
                          {user.isDoctor && <Badge variant="outline">Dottore</Badge>}
                          {user.aiOnlyAccess && <Badge variant="outline">AI Only</Badge>}
                          {!user.isAdmin && !user.isDoctor && !user.aiOnlyAccess && (
                            <Badge variant="outline">Paziente</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTier(user)}
                          data-testid={`button-edit-tier-${user.id}`}
                        >
                          Modifica Piano
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica Piano Subscription</DialogTitle>
              <DialogDescription>
                Cambia il piano di subscription per {editingUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Piano Corrente</label>
                <div>{editingUser && getTierBadge(editingUser.subscriptionTier || "free")}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nuovo Piano</label>
                <Select value={selectedTier} onValueChange={setSelectedTier}>
                  <SelectTrigger data-testid="select-new-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="premium_plus">Premium Plus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Annulla
              </Button>
              <Button
                onClick={handleSaveTier}
                disabled={updateTierMutation.isPending}
                data-testid="button-save-tier"
              >
                {updateTierMutation.isPending ? "Salvataggio..." : "Salva"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
