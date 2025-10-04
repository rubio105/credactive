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
import { Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { RichTextEditor } from "@/components/RichTextEditor";

interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  placement: string; // 'header', 'footer', 'none'
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export function AdminContentPages() {
  const { toast } = useToast();
  const [editingPage, setEditingPage] = useState<Partial<ContentPage> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data: pages, isLoading } = useQuery<ContentPage[]>({
    queryKey: ["/api/admin/content-pages"],
  });

  const createMutation = useMutation({
    mutationFn: (page: Partial<ContentPage>) => 
      apiRequest("/api/admin/content-pages", "POST", page),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content-pages"] });
      toast({ title: "Pagina creata con successo" });
      setIsDialogOpen(false);
      setEditingPage(null);
    },
    onError: () => {
      toast({ title: "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ContentPage> }) =>
      apiRequest(`/api/admin/content-pages/${id}`, "PATCH", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content-pages"] });
      toast({ title: "Pagina aggiornata con successo" });
      setIsDialogOpen(false);
      setEditingPage(null);
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/admin/content-pages/${id}`, "DELETE", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content-pages"] });
      toast({ title: "Pagina eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const handleEdit = (page: ContentPage) => {
    setEditingPage(page);
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingPage({
      slug: '',
      title: '',
      content: '<p>Inserisci qui il contenuto della pagina...</p>',
      placement: 'footer',
      isPublished: true,
    });
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingPage) return;
    
    if (!editingPage.slug || !editingPage.title) {
      toast({ 
        title: "Campi obbligatori mancanti", 
        description: "Slug e titolo sono obbligatori",
        variant: "destructive" 
      });
      return;
    }
    
    if (isCreating) {
      createMutation.mutate(editingPage);
    } else if (editingPage.id) {
      const { id, slug, createdAt, updatedAt, ...updates } = editingPage;
      updateMutation.mutate({ id, updates });
    }
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
          <h2 className="text-2xl font-bold">Gestione Pagine</h2>
          <p className="text-muted-foreground">Gestisci le pagine statiche del sito (Privacy, Termini, ecc.)</p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-page">
          <Plus className="w-4 h-4 mr-2" />
          Nuova Pagina
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slug</TableHead>
              <TableHead>Titolo</TableHead>
              <TableHead>Posizione</TableHead>
              <TableHead>Pubblicata</TableHead>
              <TableHead>Ultima Modifica</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages?.map((page) => (
              <TableRow key={page.id} data-testid={`row-page-${page.slug}`}>
                <TableCell className="font-mono text-sm">{page.slug}</TableCell>
                <TableCell className="font-medium">{page.title}</TableCell>
                <TableCell>
                  <Badge variant={page.placement === 'header' ? 'default' : page.placement === 'footer' ? 'secondary' : 'outline'}>
                    {page.placement === 'header' && '📍 Menu Top'}
                    {page.placement === 'footer' && '⬇️ Footer'}
                    {page.placement === 'none' && '—'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {page.isPublished ? (
                    <Badge variant="default" data-testid={`badge-published-${page.slug}`}>Pubblicata</Badge>
                  ) : (
                    <Badge variant="secondary" data-testid={`badge-draft-${page.slug}`}>Bozza</Badge>
                  )}
                </TableCell>
                <TableCell>{new Date(page.updatedAt).toLocaleDateString('it-IT')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(page)}
                      data-testid={`button-edit-page-${page.slug}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Sei sicuro di voler eliminare questa pagina?')) {
                          deleteMutation.mutate(page.id);
                        }
                      }}
                      data-testid={`button-delete-page-${page.slug}`}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Nuova Pagina' : 'Modifica Pagina'}
            </DialogTitle>
            <DialogDescription>
              {isCreating 
                ? 'Crea una nuova pagina statica per il sito'
                : 'Modifica il contenuto della pagina'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                value={editingPage?.slug || ''}
                onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                placeholder="privacy-policy"
                disabled={!isCreating}
                data-testid="input-page-slug"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {isCreating 
                  ? "Lo slug identifica la pagina nell'URL (es. privacy-policy). Usa solo lettere minuscole, numeri e trattini."
                  : "Lo slug non può essere modificato dopo la creazione"}
              </p>
            </div>

            <div>
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                value={editingPage?.title || ''}
                onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                placeholder="Privacy Policy"
                data-testid="input-page-title"
              />
            </div>

            <div>
              <Label htmlFor="placement">Posizionamento</Label>
              <Select
                value={editingPage?.placement || 'none'}
                onValueChange={(value) => setEditingPage({ ...editingPage, placement: value })}
              >
                <SelectTrigger id="placement" data-testid="select-page-placement">
                  <SelectValue placeholder="Seleziona posizione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">📍 Menu in Alto</SelectItem>
                  <SelectItem value="footer">⬇️ Footer (in basso)</SelectItem>
                  <SelectItem value="none">🚫 Nessuna (solo link diretto)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Scegli dove mostrare il link a questa pagina
              </p>
            </div>

            <div>
              <Label>Contenuto</Label>
              <RichTextEditor
                content={editingPage?.content || ''}
                onChange={(html) => setEditingPage({ ...editingPage, content: html })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={editingPage?.isPublished ?? true}
                onCheckedChange={(checked) => 
                  setEditingPage({ ...editingPage, isPublished: checked })
                }
                data-testid="switch-page-published"
              />
              <Label htmlFor="isPublished">Pubblica la pagina</Label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setIsDialogOpen(false)}
              data-testid="button-cancel-page"
            >
              Annulla
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-page"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Salvataggio...' : 'Salva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
