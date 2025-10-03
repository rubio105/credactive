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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  isPremium: boolean;
  sortOrder: number;
  imageUrl?: string;
}

export function AdminCategories() {
  const { toast } = useToast();
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Category>) => apiRequest("/api/admin/categories", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Categoria creata con successo" });
      setIsDialogOpen(false);
      setEditingCategory(null);
      setIsCreating(false);
    },
    onError: () => {
      toast({ title: "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<Category> }) =>
      apiRequest(`/api/admin/categories/${data.id}`, "PATCH", data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Categoria aggiornata con successo" });
      setIsDialogOpen(false);
      setEditingCategory(null);
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/categories/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Categoria eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory({
      name: '',
      slug: '',
      description: '',
      icon: '',
      color: '',
      isPremium: true,
      sortOrder: 0,
    });
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingCategory) return;
    
    if (isCreating) {
      createMutation.mutate(editingCategory);
    } else if (editingCategory.id) {
      updateMutation.mutate({
        id: editingCategory.id,
        updates: editingCategory,
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setEditingCategory({ ...editingCategory, imageUrl: data.url });
        toast({ title: "Immagine caricata con successo" });
      } else {
        toast({ title: "Errore durante il caricamento", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Errore durante il caricamento", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return <div>Caricamento...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestione Categorie</h2>
          <p className="text-muted-foreground">Gestisci le categorie dei quiz</p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-category">
          <Plus className="w-4 h-4 mr-2" />
          Nuova Categoria
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead>Ordine</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => (
              <TableRow key={category.id} data-testid={`row-category-${category.id}`}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell className="max-w-xs truncate">{category.description}</TableCell>
                <TableCell>{category.sortOrder}</TableCell>
                <TableCell>
                  {category.isPremium ? (
                    <Badge variant="default">Premium</Badge>
                  ) : (
                    <Badge variant="secondary">Free</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                      data-testid={`button-edit-category-${category.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Sei sicuro di voler eliminare questa categoria?')) {
                          deleteMutation.mutate(category.id);
                        }
                      }}
                      data-testid={`button-delete-category-${category.id}`}
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
        <DialogContent className="max-w-2xl" data-testid="dialog-category">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Nuova Categoria' : 'Modifica Categoria'}</DialogTitle>
            <DialogDescription>
              {isCreating ? 'Crea una nuova categoria' : 'Modifica i dati della categoria'}
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={editingCategory.name || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    data-testid="input-name"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={editingCategory.slug || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                    data-testid="input-slug"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  data-testid="textarea-description"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="icon">Icona</Label>
                  <Input
                    id="icon"
                    value={editingCategory.icon || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                    placeholder="es. ShieldCheck"
                    data-testid="input-icon"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Colore</Label>
                  <Input
                    id="color"
                    value={editingCategory.color || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                    placeholder="es. blue-600"
                    data-testid="input-color"
                  />
                </div>
                <div>
                  <Label htmlFor="sortOrder">Ordine</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={editingCategory.sortOrder ?? 0}
                    onChange={(e) => setEditingCategory({ ...editingCategory, sortOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    data-testid="input-sortOrder"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="image">Immagine</Label>
                <div className="flex gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    data-testid="input-image"
                  />
                  {uploading && <span className="text-sm text-muted-foreground">Caricamento...</span>}
                </div>
                {editingCategory.imageUrl && (
                  <img src={editingCategory.imageUrl} alt="Preview" className="mt-2 h-32 object-cover rounded" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isPremium">Premium</Label>
                <Switch
                  id="isPremium"
                  checked={editingCategory.isPremium}
                  onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, isPremium: checked })}
                  data-testid="switch-isPremium"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-category"
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
