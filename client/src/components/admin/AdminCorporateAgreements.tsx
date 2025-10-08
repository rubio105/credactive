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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, Users, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

interface CorporateAgreement {
  id: string;
  companyName: string;
  emailDomain: string | null;
  promoCode: string | null;
  tier: string;
  isActive: boolean;
  licensesOwned: number;
  licensesUsed: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
}

interface NewAgreement {
  companyName: string;
  emailDomain: string;
  promoCode: string;
  tier: string;
  isActive: boolean;
  licensesOwned: string;
  notes: string;
  adminEmail: string;
}

export function AdminCorporateAgreements() {
  const { toast } = useToast();
  const [editingAgreement, setEditingAgreement] = useState<CorporateAgreement | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewingUsers, setViewingUsers] = useState<string | null>(null);
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);
  
  const [newAgreement, setNewAgreement] = useState<NewAgreement>({
    companyName: '',
    emailDomain: '',
    promoCode: '',
    tier: 'starter',
    isActive: true,
    licensesOwned: '5',
    notes: '',
    adminEmail: '',
  });

  const { data: agreements, isLoading } = useQuery<CorporateAgreement[]>({
    queryKey: ["/api/admin/corporate-agreements"],
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/corporate-agreements", viewingUsers, "users"],
    queryFn: async () => {
      if (!viewingUsers) return [];
      const response = await fetch(`/api/admin/corporate-agreements/${viewingUsers}/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: !!viewingUsers,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/corporate-agreements', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/corporate-agreements"] });
      toast({ title: "Accordo aziendale creato con successo" });
      setIsCreateDialogOpen(false);
      setNewAgreement({
        companyName: '',
        emailDomain: '',
        promoCode: '',
        tier: 'starter',
        isActive: true,
        licensesOwned: '5',
        notes: '',
        adminEmail: '',
      });
    },
    onError: () => {
      toast({ title: "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<CorporateAgreement> }) =>
      apiRequest(`/api/admin/corporate-agreements/${data.id}`, "PATCH", data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/corporate-agreements"] });
      toast({ title: "Accordo aziendale aggiornato con successo" });
      setIsEditDialogOpen(false);
      setEditingAgreement(null);
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/corporate-agreements/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/corporate-agreements"] });
      toast({ title: "Accordo aziendale eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const handleEdit = (agreement: CorporateAgreement) => {
    setEditingAgreement(agreement);
    setIsEditDialogOpen(true);
  };

  const handleViewUsers = (agreementId: string) => {
    setViewingUsers(agreementId);
    setIsUsersDialogOpen(true);
  };

  const handleCreate = () => {
    if (!newAgreement.companyName) {
      toast({ title: "Nome azienda obbligatorio", variant: "destructive" });
      return;
    }

    if (!newAgreement.emailDomain && !newAgreement.promoCode) {
      toast({ title: "Inserire almeno dominio email o codice promo", variant: "destructive" });
      return;
    }

    const data: any = {
      companyName: newAgreement.companyName,
      emailDomain: newAgreement.emailDomain || null,
      promoCode: newAgreement.promoCode || null,
      tier: newAgreement.tier,
      isActive: newAgreement.isActive,
      licensesOwned: newAgreement.licensesOwned ? parseInt(newAgreement.licensesOwned) : 5,
      notes: newAgreement.notes || null,
    };

    createMutation.mutate(data);
  };

  const handleSave = () => {
    if (!editingAgreement) return;

    updateMutation.mutate({
      id: editingAgreement.id,
      updates: {
        companyName: editingAgreement.companyName,
        emailDomain: editingAgreement.emailDomain,
        promoCode: editingAgreement.promoCode,
        tier: editingAgreement.tier,
        isActive: editingAgreement.isActive,
        licensesOwned: editingAgreement.licensesOwned,
        notes: editingAgreement.notes,
      },
    });
  };

  if (isLoading) {
    return <div>Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/" data-testid="button-back-home">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Home
        </Link>
      </Button>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Accordi Aziendali</h2>
          <p className="text-muted-foreground">Gestione degli accordi corporate per accesso Premium Full</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-agreement">
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Accordo
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Azienda</TableHead>
                <TableHead>Dominio Email</TableHead>
                <TableHead>Codice Promo</TableHead>
                <TableHead>Piano</TableHead>
                <TableHead>Licenze</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agreements?.map((agreement) => (
                <TableRow key={agreement.id} data-testid={`row-agreement-${agreement.id}`}>
                  <TableCell className="font-medium">{agreement.companyName}</TableCell>
                  <TableCell>{agreement.emailDomain || '-'}</TableCell>
                  <TableCell>{agreement.promoCode || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{agreement.tier}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewUsers(agreement.id)}
                      data-testid={`button-view-users-${agreement.id}`}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      {agreement.licensesUsed}/{agreement.licensesOwned}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={agreement.isActive ? "default" : "secondary"}>
                      {agreement.isActive ? 'Attivo' : 'Inattivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(agreement)}
                        data-testid={`button-edit-${agreement.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(agreement.id)}
                        data-testid={`button-delete-${agreement.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-create-agreement">
          <DialogHeader>
            <DialogTitle>Nuovo Accordo Aziendale</DialogTitle>
            <DialogDescription>
              Crea un nuovo accordo corporate per fornire accesso Premium Full agli utenti aziendali
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName">Nome Azienda *</Label>
              <Input
                id="companyName"
                value={newAgreement.companyName}
                onChange={(e) => setNewAgreement({ ...newAgreement, companyName: e.target.value })}
                placeholder="es. Acme Corporation"
                data-testid="input-company-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="adminEmail">Email Admin Aziendale</Label>
              <Input
                id="adminEmail"
                type="email"
                value={newAgreement.adminEmail}
                onChange={(e) => setNewAgreement({ ...newAgreement, adminEmail: e.target.value })}
                placeholder="es. admin@acme.com"
                data-testid="input-admin-email"
              />
              <p className="text-sm text-muted-foreground">
                Email dell'amministratore aziendale. Se l'utente non esiste, verrà creato automaticamente.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="emailDomain">Dominio Email</Label>
              <Input
                id="emailDomain"
                value={newAgreement.emailDomain}
                onChange={(e) => setNewAgreement({ ...newAgreement, emailDomain: e.target.value })}
                placeholder="es. @acme.com"
                data-testid="input-email-domain"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promoCode">Codice Promozionale</Label>
              <Input
                id="promoCode"
                value={newAgreement.promoCode}
                onChange={(e) => setNewAgreement({ ...newAgreement, promoCode: e.target.value.toUpperCase() })}
                placeholder="es. ACME2024"
                data-testid="input-promo-code"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tier">Piano</Label>
              <Select
                value={newAgreement.tier}
                onValueChange={(value) => {
                  const tierLicenses: Record<string, string> = {
                    starter: '5',
                    premium: '25',
                    premium_plus: '100',
                    enterprise: '500'
                  };
                  setNewAgreement({ 
                    ...newAgreement, 
                    tier: value,
                    licensesOwned: tierLicenses[value] || '5'
                  });
                }}
              >
                <SelectTrigger data-testid="select-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter (5 licenze)</SelectItem>
                  <SelectItem value="premium">Premium (25 licenze)</SelectItem>
                  <SelectItem value="premium_plus">Premium Plus (100 licenze)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (500 licenze)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="licensesOwned">Numero Licenze *</Label>
              <Input
                id="licensesOwned"
                type="number"
                value={newAgreement.licensesOwned}
                onChange={(e) => setNewAgreement({ ...newAgreement, licensesOwned: e.target.value })}
                placeholder="Numero di licenze acquistate"
                min="1"
                data-testid="input-licenses-owned"
              />
              <p className="text-sm text-muted-foreground">
                Numero totale di licenze che l'azienda può assegnare ai dipendenti
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Note</Label>
              <Input
                id="notes"
                value={newAgreement.notes}
                onChange={(e) => setNewAgreement({ ...newAgreement, notes: e.target.value })}
                placeholder="Note interne"
                data-testid="input-notes"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={newAgreement.isActive}
                onCheckedChange={(checked) => setNewAgreement({ ...newAgreement, isActive: checked })}
                data-testid="switch-is-active"
              />
              <Label htmlFor="isActive">Accordo attivo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel-create">
              Annulla
            </Button>
            <Button onClick={handleCreate} data-testid="button-confirm-create">Crea Accordo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-edit-agreement">
          <DialogHeader>
            <DialogTitle>Modifica Accordo Aziendale</DialogTitle>
          </DialogHeader>
          {editingAgreement && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-companyName">Nome Azienda</Label>
                <Input
                  id="edit-companyName"
                  value={editingAgreement.companyName}
                  onChange={(e) => setEditingAgreement({ ...editingAgreement, companyName: e.target.value })}
                  data-testid="input-edit-company-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-emailDomain">Dominio Email</Label>
                <Input
                  id="edit-emailDomain"
                  value={editingAgreement.emailDomain || ''}
                  onChange={(e) => setEditingAgreement({ ...editingAgreement, emailDomain: e.target.value || null })}
                  data-testid="input-edit-email-domain"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-promoCode">Codice Promozionale</Label>
                <Input
                  id="edit-promoCode"
                  value={editingAgreement.promoCode || ''}
                  onChange={(e) => setEditingAgreement({ ...editingAgreement, promoCode: e.target.value.toUpperCase() || null })}
                  data-testid="input-edit-promo-code"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tier">Piano</Label>
                <Select
                  value={editingAgreement.tier}
                  onValueChange={(value) => {
                    const tierLicenses: Record<string, number> = {
                      starter: 5,
                      premium: 25,
                      premium_plus: 100,
                      enterprise: 500
                    };
                    setEditingAgreement({ 
                      ...editingAgreement, 
                      tier: value,
                      licensesOwned: tierLicenses[value] || 5
                    });
                  }}
                >
                  <SelectTrigger data-testid="select-edit-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter (5 licenze)</SelectItem>
                    <SelectItem value="premium">Premium (25 licenze)</SelectItem>
                    <SelectItem value="premium_plus">Premium Plus (100 licenze)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (500 licenze)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-licensesOwned">Numero Licenze</Label>
                <Input
                  id="edit-licensesOwned"
                  type="number"
                  value={editingAgreement.licensesOwned}
                  onChange={(e) => setEditingAgreement({ ...editingAgreement, licensesOwned: parseInt(e.target.value) || 5 })}
                  min="1"
                  data-testid="input-edit-licenses-owned"
                />
                <p className="text-sm text-muted-foreground">
                  Licenze usate: {editingAgreement.licensesUsed}/{editingAgreement.licensesOwned}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Note</Label>
                <Input
                  id="edit-notes"
                  value={editingAgreement.notes || ''}
                  onChange={(e) => setEditingAgreement({ ...editingAgreement, notes: e.target.value })}
                  data-testid="input-edit-notes"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={editingAgreement.isActive}
                  onCheckedChange={(checked) => setEditingAgreement({ ...editingAgreement, isActive: checked })}
                  data-testid="switch-edit-is-active"
                />
                <Label htmlFor="edit-isActive">Accordo attivo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-cancel-edit">
              Annulla
            </Button>
            <Button onClick={handleSave} data-testid="button-confirm-edit">Salva Modifiche</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Users Dialog */}
      <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
        <DialogContent className="max-w-3xl" data-testid="dialog-view-users">
          <DialogHeader>
            <DialogTitle>Utenti Associati</DialogTitle>
            <DialogDescription>
              Elenco degli utenti con accesso corporate tramite questo accordo
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Caricamento utenti...</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Azienda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.companyName}</TableCell>
                    </TableRow>
                  ))}
                  {users?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Nessun utente associato
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
