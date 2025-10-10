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
import { Pencil, Trash2, Plus, ArrowLeft, Sparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  maxCoursesPerMonth: number | null;
  maxQuizGamingPerWeek: number | null;
  aiTokensPerMonth: number | null;
  includesWebinarHealth: boolean;
  includesProhmedSupport: boolean;
  stripeEnabled: boolean;
  stripeProductId: string | null;
  stripePriceId: string | null;
  isActive: boolean;
}

export function AdminSubscriptionPlans() {
  const { toast } = useToast();
  const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [featuresText, setFeaturesText] = useState("");
  const [isFormattingAI, setIsFormattingAI] = useState(false);

  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/subscription-plans"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<SubscriptionPlan>) => 
      apiRequest("/api/admin/subscription-plans", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      toast({ title: "Piano creato con successo" });
      setIsDialogOpen(false);
      setEditingPlan(null);
      setIsCreating(false);
      setFeaturesText("");
    },
    onError: () => {
      toast({ title: "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<SubscriptionPlan> }) =>
      apiRequest(`/api/admin/subscription-plans/${data.id}`, "PATCH", data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      toast({ title: "Piano aggiornato con successo" });
      setIsDialogOpen(false);
      setEditingPlan(null);
      setFeaturesText("");
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/admin/subscription-plans/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      toast({ title: "Piano eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFeaturesText(plan.features?.join("\n") || "");
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingPlan({
      name: "",
      description: "",
      price: 0,
      currency: "EUR",
      interval: "year",
      features: [],
      maxCoursesPerMonth: null,
      maxQuizGamingPerWeek: null,
      aiTokensPerMonth: null,
      includesWebinarHealth: false,
      includesProhmedSupport: false,
      stripeEnabled: false,
      stripeProductId: null,
      stripePriceId: null,
      isActive: true,
    });
    setFeaturesText("");
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleFormatWithAI = async () => {
    if (!featuresText.trim()) {
      toast({ title: "Inserisci una descrizione da formattare", variant: "destructive" });
      return;
    }

    setIsFormattingAI(true);
    try {
      const response = await apiRequest(
        "/api/admin/subscription-plans/format-description",
        "POST",
        { description: featuresText }
      );
      const data = await response.json();
      
      if (data.features) {
        setEditingPlan({ 
          ...editingPlan, 
          features: data.features 
        });
        setFeaturesText(data.features.join("\n"));
        toast({ title: "Formattazione completata con AI" });
      }
    } catch (error) {
      toast({ title: "Errore nella formattazione AI", variant: "destructive" });
    } finally {
      setIsFormattingAI(false);
    }
  };

  const handleSave = () => {
    if (!editingPlan) return;

    // Parse features from text
    const features = featuresText
      .split("\n")
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const planData = {
      ...editingPlan,
      features,
    };

    if (isCreating) {
      createMutation.mutate(planData);
    } else if (editingPlan.id) {
      updateMutation.mutate({
        id: editingPlan.id,
        updates: planData,
      });
    }
  };

  const formatPrice = (priceInCents: number, currency: string) => {
    const amount = priceInCents / 100;
    try {
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      return `${amount.toFixed(0)} ${currency}`;
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
          <h2 className="text-2xl font-bold">Gestione Piani</h2>
          <p className="text-muted-foreground">Gestisci i piani di sottoscrizione</p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-plan">
          <Plus className="w-4 h-4 mr-2" />
          Crea Piano
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Prezzo</TableHead>
            <TableHead>Intervallo</TableHead>
            <TableHead>Limiti</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead>Stripe</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans?.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{plan.name}</div>
                  <div className="text-sm text-muted-foreground">{plan.description}</div>
                </div>
              </TableCell>
              <TableCell>{formatPrice(plan.price, plan.currency)}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {plan.interval === 'year' ? 'Annuale' : plan.interval === 'month' ? 'Mensile' : plan.interval}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm space-y-1">
                  {plan.maxCoursesPerMonth !== null && (
                    <div>Corsi: {plan.maxCoursesPerMonth === -1 ? '∞' : plan.maxCoursesPerMonth}/mese</div>
                  )}
                  {plan.maxQuizGamingPerWeek !== null && (
                    <div>Quiz: {plan.maxQuizGamingPerWeek === -1 ? '∞' : plan.maxQuizGamingPerWeek}/sett</div>
                  )}
                  {plan.aiTokensPerMonth !== null && (
                    <div>Token: {plan.aiTokensPerMonth === -1 ? '∞' : plan.aiTokensPerMonth}/mese</div>
                  )}
                  {plan.includesWebinarHealth && <Badge variant="secondary">Webinar</Badge>}
                  {plan.includesProhmedSupport && <Badge variant="secondary">Prohmed</Badge>}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={plan.isActive ? "default" : "secondary"}>
                  {plan.isActive ? "Attivo" : "Inattivo"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={plan.stripeEnabled ? "default" : "outline"}>
                  {plan.stripeEnabled ? "Abilitato" : "Disabilitato"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(plan)}
                    data-testid={`button-edit-${plan.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Sei sicuro di voler eliminare il piano "${plan.name}"?`)) {
                        deleteMutation.mutate(plan.id);
                      }
                    }}
                    data-testid={`button-delete-${plan.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Crea Nuovo Piano" : "Modifica Piano"}
            </DialogTitle>
            <DialogDescription>
              Configura i dettagli del piano di sottoscrizione
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Piano</Label>
                <Input
                  id="name"
                  value={editingPlan?.name || ""}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, name: e.target.value })
                  }
                  placeholder="es. Premium"
                  data-testid="input-plan-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="id">ID Piano</Label>
                <Input
                  id="id"
                  value={editingPlan?.id || ""}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, id: e.target.value })
                  }
                  placeholder="es. premium"
                  disabled={!isCreating}
                  data-testid="input-plan-id"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={editingPlan?.description || ""}
                onChange={(e) =>
                  setEditingPlan({ ...editingPlan, description: e.target.value })
                }
                placeholder="Descrizione del piano"
                data-testid="textarea-plan-description"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Prezzo (centesimi)</Label>
                <Input
                  id="price"
                  type="number"
                  value={editingPlan?.price || 0}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) || 0 })
                  }
                  placeholder="9900"
                  data-testid="input-plan-price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Valuta</Label>
                <Select
                  value={editingPlan?.currency || "EUR"}
                  onValueChange={(value) =>
                    setEditingPlan({ ...editingPlan, currency: value })
                  }
                >
                  <SelectTrigger data-testid="select-plan-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval">Intervallo</Label>
                <Select
                  value={editingPlan?.interval || "year"}
                  onValueChange={(value) =>
                    setEditingPlan({ ...editingPlan, interval: value })
                  }
                >
                  <SelectTrigger data-testid="select-plan-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Mensile</SelectItem>
                    <SelectItem value="year">Annuale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Limiti di Utilizzo</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxCourses">Corsi/Mese</Label>
                  <Input
                    id="maxCourses"
                    type="number"
                    value={editingPlan?.maxCoursesPerMonth ?? ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxCoursesPerMonth: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="-1 per illimitato"
                    data-testid="input-max-courses"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxQuiz">Quiz Gaming/Sett</Label>
                  <Input
                    id="maxQuiz"
                    type="number"
                    value={editingPlan?.maxQuizGamingPerWeek ?? ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxQuizGamingPerWeek: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="-1 per illimitato"
                    data-testid="input-max-quiz"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Token AI/Mese</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={editingPlan?.aiTokensPerMonth ?? ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        aiTokensPerMonth: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="-1 per illimitato"
                    data-testid="input-max-tokens"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="webinar"
                    checked={editingPlan?.includesWebinarHealth || false}
                    onCheckedChange={(checked) =>
                      setEditingPlan({ ...editingPlan, includesWebinarHealth: checked })
                    }
                    data-testid="switch-webinar"
                  />
                  <Label htmlFor="webinar">Include Webinar Health</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="prohmed"
                    checked={editingPlan?.includesProhmedSupport || false}
                    onCheckedChange={(checked) =>
                      setEditingPlan({ ...editingPlan, includesProhmedSupport: checked })
                    }
                    data-testid="switch-prohmed"
                  />
                  <Label htmlFor="prohmed">Include Assistenza Prohmed</Label>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="features">Funzionalità (una per riga)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFormatWithAI}
                  disabled={isFormattingAI}
                  data-testid="button-format-ai"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isFormattingAI ? "Formattando..." : "Formatta con AI"}
                </Button>
              </div>
              <Textarea
                id="features"
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder="Inserisci le funzionalità una per riga&#10;oppure scrivi una descrizione e usa AI per formattarla"
                rows={6}
                data-testid="textarea-features"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Integrazione Stripe</h3>
              <div className="grid gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="stripeEnabled"
                    checked={editingPlan?.stripeEnabled || false}
                    onCheckedChange={(checked) =>
                      setEditingPlan({ ...editingPlan, stripeEnabled: checked })
                    }
                    data-testid="switch-stripe-enabled"
                  />
                  <Label htmlFor="stripeEnabled">Abilita Pagamenti Stripe</Label>
                </div>

                {editingPlan?.stripeEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stripeProductId">Stripe Product ID</Label>
                      <Input
                        id="stripeProductId"
                        value={editingPlan?.stripeProductId || ""}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, stripeProductId: e.target.value })
                        }
                        placeholder="prod_..."
                        data-testid="input-stripe-product-id"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stripePriceId">Stripe Price ID</Label>
                      <Input
                        id="stripePriceId"
                        value={editingPlan?.stripePriceId || ""}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, stripePriceId: e.target.value })
                        }
                        placeholder="price_..."
                        data-testid="input-stripe-price-id"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={editingPlan?.isActive ?? true}
                onCheckedChange={(checked) =>
                  setEditingPlan({ ...editingPlan, isActive: checked })
                }
                data-testid="switch-is-active"
              />
              <Label htmlFor="isActive">Piano Attivo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingPlan(null);
                setFeaturesText("");
              }}
              data-testid="button-cancel"
            >
              Annulla
            </Button>
            <Button onClick={handleSave} data-testid="button-save">
              {isCreating ? "Crea" : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
