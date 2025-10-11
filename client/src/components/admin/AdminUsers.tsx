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
import { Pencil, Trash2, ArrowLeft, Plus, Download, Upload, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  profession?: string;
  education?: string;
  company?: string;
  addressStreet?: string;
  addressCity?: string;
  addressPostalCode?: string;
  addressProvince?: string;
  addressCountry?: string;
  newsletterConsent: boolean;
  language?: string;
  isPremium: boolean;
  subscriptionTier: string;
  isAdmin: boolean;
  aiOnlyAccess: boolean;
  createdAt: string;
}

interface NewUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isPremium: boolean;
  subscriptionTier: string;
  isAdmin: boolean;
  aiOnlyAccess: boolean;
}

export function AdminUsers() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const USERS_PER_PAGE = 15;
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    isPremium: false,
    subscriptionTier: 'free',
    isAdmin: false,
    aiOnlyAccess: false,
  });

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

  const createMutation = useMutation({
    mutationFn: (data: NewUser) => apiRequest('/api/admin/users', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Utente creato con successo" });
      setIsCreateDialogOpen(false);
      setNewUser({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        isPremium: false,
        subscriptionTier: 'free',
        isAdmin: false,
        aiOnlyAccess: false,
      });
    },
    onError: (error: any) => {
      toast({ 
        title: error.message || "Errore durante la creazione", 
        variant: "destructive" 
      });
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleCreate = () => {
    if (!newUser.email || !newUser.password) {
      toast({ title: "Email e password sono obbligatori", variant: "destructive" });
      return;
    }
    createMutation.mutate(newUser);
  };

  const handleSave = () => {
    if (!editingUser) return;
    updateMutation.mutate({
      id: editingUser.id,
      updates: {
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        isPremium: editingUser.subscriptionTier !== 'free',
        subscriptionTier: editingUser.subscriptionTier,
        isAdmin: editingUser.isAdmin,
        aiOnlyAccess: editingUser.aiOnlyAccess,
      },
    });
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/users/export/csv');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Export completato con successo" });
    } catch (error) {
      toast({ title: "Errore durante l'export", variant: "destructive" });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const csvData = await file.text();
      const response = await fetch('/api/admin/users/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData }),
      });

      const result = await response.json();
      
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        toast({ 
          title: "Import completato", 
          description: `Importati ${result.imported} utenti. Errori: ${result.errors}` 
        });
      } else {
        toast({ title: "Errore durante l'import", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Errore durante l'import", variant: "destructive" });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Filter and paginate users
  const filteredUsers = users?.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query)
    );
  }) || [];

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    currentPage * USERS_PER_PAGE,
    (currentPage + 1) * USERS_PER_PAGE
  );

  // Reset to page 0 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(0);
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestione Utenti</h2>
          <p className="text-muted-foreground">Gestisci gli utenti della piattaforma</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExport} 
            data-testid="button-export-users"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={handleImportClick} 
            disabled={isImporting}
            data-testid="button-import-users"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isImporting ? 'Importazione...' : 'Import CSV'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-import-file"
          />
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-user">
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Utente
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Cerca utenti (email, nome, cognome, telefono)..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            data-testid="input-search-users"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredUsers.length} utenti trovati
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Cognome</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>Lingua</TableHead>
              <TableHead>Consenso Newsletter</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Data Registrazione</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.firstName}</TableCell>
                <TableCell>{user.lastName}</TableCell>
                <TableCell data-testid={`cell-phone-${user.id}`}>{user.phone || '-'}</TableCell>
                <TableCell data-testid={`cell-language-${user.id}`}>
                  {user.language ? user.language.toUpperCase() : '-'}
                </TableCell>
                <TableCell data-testid={`cell-newsletter-${user.id}`}>
                  {user.newsletterConsent ? (
                    <Badge variant="default">Sì</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.subscriptionTier === 'premium_plus' ? (
                    <Badge className="bg-gradient-to-r from-warning to-accent text-white" data-testid={`badge-premium-plus-${user.id}`}>Premium Plus</Badge>
                  ) : user.subscriptionTier === 'premium' ? (
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Pagina {currentPage + 1} di {totalPages} • Mostrando {paginatedUsers.length} di {filteredUsers.length} utenti
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Precedente
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pageNum = currentPage < 3 
                  ? i 
                  : currentPage > totalPages - 3 
                    ? totalPages - 5 + i 
                    : currentPage - 2 + i;
                
                if (pageNum < 0 || pageNum >= totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-10"
                    data-testid={`button-page-${pageNum}`}
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              data-testid="button-next-page"
            >
              Successiva
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col" data-testid="dialog-edit-user">
          <DialogHeader>
            <DialogTitle>Modifica Utente</DialogTitle>
            <DialogDescription>
              Modifica i dati dell'utente
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data di Nascita</Label>
                  <Input 
                    value={editingUser.dateOfBirth ? new Date(editingUser.dateOfBirth).toLocaleDateString('it-IT') : '-'} 
                    disabled 
                    data-testid="input-dateOfBirth"
                  />
                </div>
                <div>
                  <Label>Genere</Label>
                  <Input 
                    value={editingUser.gender || '-'} 
                    disabled 
                    data-testid="input-gender"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telefono</Label>
                  <Input 
                    value={editingUser.phone || '-'} 
                    disabled 
                    data-testid="input-phone"
                  />
                </div>
                <div>
                  <Label>Lingua</Label>
                  <Input 
                    value={editingUser.language ? editingUser.language.toUpperCase() : '-'} 
                    disabled 
                    data-testid="input-language"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Professione</Label>
                  <Input 
                    value={editingUser.profession || '-'} 
                    disabled 
                    data-testid="input-profession"
                  />
                </div>
                <div>
                  <Label>Formazione</Label>
                  <Input 
                    value={editingUser.education || '-'} 
                    disabled 
                    data-testid="input-education"
                  />
                </div>
              </div>
              <div>
                <Label>Azienda</Label>
                <Input 
                  value={editingUser.company || '-'} 
                  disabled 
                  data-testid="input-company"
                />
              </div>
              <div>
                <Label>Indirizzo</Label>
                <Input 
                  value={[
                    editingUser.addressStreet,
                    editingUser.addressCity,
                    editingUser.addressPostalCode,
                    editingUser.addressProvince,
                    editingUser.addressCountry
                  ].filter(Boolean).join(', ') || '-'} 
                  disabled 
                  data-testid="input-address"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Consenso Newsletter</Label>
                <Badge variant={editingUser.newsletterConsent ? "default" : "secondary"} data-testid="badge-newsletter">
                  {editingUser.newsletterConsent ? "Sì" : "No"}
                </Badge>
              </div>
              <div>
                <Label htmlFor="subscriptionTier">Livello Membership</Label>
                <Select
                  value={editingUser.subscriptionTier}
                  onValueChange={(value) => setEditingUser({ ...editingUser, subscriptionTier: value, isPremium: value !== 'free' })}
                >
                  <SelectTrigger id="subscriptionTier" data-testid="select-subscriptionTier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="premium_plus">Premium Plus</SelectItem>
                  </SelectContent>
                </Select>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="aiOnlyAccess">Accesso Solo AI</Label>
                <Switch
                  id="aiOnlyAccess"
                  checked={editingUser.aiOnlyAccess}
                  onCheckedChange={(checked) => setEditingUser({ ...editingUser, aiOnlyAccess: checked })}
                  data-testid="switch-aiOnlyAccess"
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col" data-testid="dialog-create-user">
          <DialogHeader>
            <DialogTitle>Crea Nuovo Utente</DialogTitle>
            <DialogDescription>
              Inserisci i dati del nuovo utente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div>
              <Label htmlFor="newEmail">Email *</Label>
              <Input
                id="newEmail"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="utente@esempio.it"
                data-testid="input-new-email"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Password sicura"
                data-testid="input-new-password"
              />
            </div>
            <div>
              <Label htmlFor="newFirstName">Nome</Label>
              <Input
                id="newFirstName"
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                placeholder="Mario"
                data-testid="input-new-firstName"
              />
            </div>
            <div>
              <Label htmlFor="newLastName">Cognome</Label>
              <Input
                id="newLastName"
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                placeholder="Rossi"
                data-testid="input-new-lastName"
              />
            </div>
            <div>
              <Label htmlFor="newSubscriptionTier">Livello Membership</Label>
              <Select
                value={newUser.subscriptionTier}
                onValueChange={(value) => setNewUser({ ...newUser, subscriptionTier: value, isPremium: value !== 'free' })}
              >
                <SelectTrigger id="newSubscriptionTier" data-testid="select-new-subscriptionTier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="premium_plus">Premium Plus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="newIsAdmin">Amministratore</Label>
              <Switch
                id="newIsAdmin"
                checked={newUser.isAdmin}
                onCheckedChange={(checked) => setNewUser({ ...newUser, isAdmin: checked })}
                data-testid="switch-new-isAdmin"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="newAiOnlyAccess">Accesso Solo AI</Label>
              <Switch
                id="newAiOnlyAccess"
                checked={newUser.aiOnlyAccess}
                onCheckedChange={(checked) => setNewUser({ ...newUser, aiOnlyAccess: checked })}
                data-testid="switch-new-aiOnlyAccess"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewUser({
                  email: '',
                  password: '',
                  firstName: '',
                  lastName: '',
                  isPremium: false,
                  subscriptionTier: 'free',
                  isAdmin: false,
                  aiOnlyAccess: false,
                });
              }}
            >
              Annulla
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={createMutation.isPending} 
              data-testid="button-save-new-user"
            >
              {createMutation.isPending ? "Creazione..." : "Crea Utente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
