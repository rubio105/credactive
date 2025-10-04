import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isPremium: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export function AdminUsers() {
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<User> }) =>
      apiRequest(`/api/admin/users/${data.id}`, "PATCH", data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Utente aggiornato con successo" });
      setIsEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/users/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Utente eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingUser) return;
    updateMutation.mutate({
      id: editingUser.id,
      updates: {
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        isPremium: editingUser.isPremium,
        isAdmin: editingUser.isAdmin,
      },
    });
  };

  if (isLoading) {
    return <div>Caricamento...</div>;
  }

  return (
    <div>
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/" data-testid="button-back-home">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Home
        </Link>
      </Button>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Gestione Utenti</h2>
        <p className="text-muted-foreground">Gestisci gli utenti della piattaforma</p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Cognome</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Data Registrazione</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.firstName}</TableCell>
                <TableCell>{user.lastName}</TableCell>
                <TableCell>
                  {user.isPremium ? (
                    <Badge variant="default" data-testid={`badge-premium-${user.id}`}>Premium</Badge>
                  ) : (
                    <Badge variant="secondary" data-testid={`badge-free-${user.id}`}>Free</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.isAdmin && <Badge variant="destructive" data-testid={`badge-admin-${user.id}`}>Admin</Badge>}
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString('it-IT')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(user)}
                      data-testid={`button-edit-user-${user.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Sei sicuro di voler eliminare questo utente?')) {
                          deleteMutation.mutate(user.id);
                        }
                      }}
                      data-testid={`button-delete-user-${user.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-user">
          <DialogHeader>
            <DialogTitle>Modifica Utente</DialogTitle>
            <DialogDescription>
              Modifica i dati dell'utente
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={editingUser.email} disabled />
              </div>
              <div>
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  value={editingUser.firstName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                  data-testid="input-firstName"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Cognome</Label>
                <Input
                  id="lastName"
                  value={editingUser.lastName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                  data-testid="input-lastName"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isPremium">Accesso Premium</Label>
                <Switch
                  id="isPremium"
                  checked={editingUser.isPremium}
                  onCheckedChange={(checked) => setEditingUser({ ...editingUser, isPremium: checked })}
                  data-testid="switch-isPremium"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isAdmin">Amministratore</Label>
                <Switch
                  id="isAdmin"
                  checked={editingUser.isAdmin}
                  onCheckedChange={(checked) => setEditingUser({ ...editingUser, isAdmin: checked })}
                  data-testid="switch-isAdmin"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-user">
              {updateMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
