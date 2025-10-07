import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { DollarSign, Save, Plus, Edit, Trash2, Wand2, Check, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Setting {
  key: string;
  value: string;
  description?: string;
  category?: string;
}

interface Settings {
  subscriptionPrice: number;
  currency: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  description?: string;
  features: string[];
  isActive: boolean;
  stripeEnabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export function AdminSettings() {
  const { toast } = useToast();
  const [price, setPrice] = useState('90');
  const [currency, setCurrency] = useState('EUR');
  
  // Subscription plan form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planCurrency, setPlanCurrency] = useState('EUR');
  const [planInterval, setPlanInterval] = useState('year');
  const [planDescription, setPlanDescription] = useState('');
  const [planFeatures, setPlanFeatures] = useState<string[]>([]);
  const [planActive, setPlanActive] = useState(true);
  const [planStripeEnabled, setPlanStripeEnabled] = useState(false);
  const [planSortOrder, setPlanSortOrder] = useState(0);
  const [isFormattingDescription, setIsFormattingDescription] = useState(false);

  const { data: settingsArray } = useQuery<Setting[]>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: subscriptionPlans = [], isLoading: isLoadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/subscription-plans"],
  });

  // Transform array of settings into an object
  const settings: Settings | undefined = settingsArray ? {
    subscriptionPrice: parseFloat(settingsArray.find(s => s.key === 'subscriptionPrice')?.value || '90'),
    currency: settingsArray.find(s => s.key === 'currency')?.value || 'EUR',
  } : undefined;

  useEffect(() => {
    if (settings) {
      setPrice(settings.subscriptionPrice.toString());
      setCurrency(settings.currency);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: Settings) => apiRequest("/api/admin/settings", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Impostazioni salvate con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante il salvataggio", variant: "destructive" });
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/subscription-plans", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({ title: "Piano creato con successo" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/admin/subscription-plans/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({ title: "Piano aggiornato con successo" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/subscription-plans/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({ title: "Piano eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const formatDescriptionMutation = useMutation({
    mutationFn: (description: string) => 
      apiRequest("/api/admin/subscription-plans/format-description", "POST", { description }),
    onSuccess: (data: any) => {
      if (data && Array.isArray(data.features)) {
        setPlanFeatures(data.features);
        toast({ title: "Descrizione formattata con successo" });
      } else {
        toast({ title: "Formato risposta non valido", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Errore durante la formattazione", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      subscriptionPrice: parseFloat(price),
      currency,
    });
  };

  const resetForm = () => {
    setEditingPlan(null);
    setPlanName('');
    setPlanPrice('');
    setPlanCurrency('EUR');
    setPlanInterval('year');
    setPlanDescription('');
    setPlanFeatures([]);
    setPlanActive(true);
    setPlanStripeEnabled(false);
    setPlanSortOrder(0);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanPrice(plan.price.toString());
    setPlanCurrency(plan.currency);
    setPlanInterval(plan.interval);
    setPlanDescription(plan.description || '');
    setPlanFeatures(plan.features);
    setPlanActive(plan.isActive);
    setPlanStripeEnabled(plan.stripeEnabled);
    setPlanSortOrder(plan.sortOrder);
    setIsDialogOpen(true);
  };

  const handleDeletePlan = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo piano?')) {
      deletePlanMutation.mutate(id);
    }
  };

  const handleFormatDescription = () => {
    if (!planDescription.trim()) {
      toast({ title: "Inserisci prima una descrizione", variant: "destructive" });
      return;
    }
    setIsFormattingDescription(true);
    formatDescriptionMutation.mutate(planDescription, {
      onSettled: () => setIsFormattingDescription(false),
    });
  };

  const handleSavePlan = () => {
    const planData = {
      name: planName,
      price: parseFloat(planPrice),
      currency: planCurrency,
      interval: planInterval,
      description: planDescription,
      features: planFeatures,
      isActive: planActive,
      stripeEnabled: planStripeEnabled,
      sortOrder: planSortOrder,
    };

    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data: planData });
    } else {
      createPlanMutation.mutate(planData);
    }
  };

  const handleAddFeature = () => {
    setPlanFeatures([...planFeatures, '']);
  };

  const handleUpdateFeature = (index: number, value: string) => {
    const newFeatures = [...planFeatures];
    newFeatures[index] = value;
    setPlanFeatures(newFeatures);
  };

  const handleRemoveFeature = (index: number) => {
    setPlanFeatures(planFeatures.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Impostazioni</h2>
        <p className="text-muted-foreground">Configura le impostazioni della piattaforma</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general" data-testid="tab-general">Generali</TabsTrigger>
          <TabsTrigger value="plans" data-testid="tab-plans">Piani Abbonamento</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <div className="grid gap-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Abbonamento Premium
                </CardTitle>
                <CardDescription>
                  Configura il prezzo dell'abbonamento annuale premium
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Prezzo Annuale</Label>
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      data-testid="input-price"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Valuta</Label>
                    <Input
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      placeholder="EUR"
                      data-testid="input-currency"
                    />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-settings">
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? "Salvataggio..." : "Salva Impostazioni"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiche Piattaforma</CardTitle>
                <CardDescription>
                  Panoramica generale della piattaforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prezzo Corrente:</span>
                    <span className="font-medium" data-testid="text-current-price">
                      €{settings?.subscriptionPrice || 90}/anno
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valuta:</span>
                    <span className="font-medium">{settings?.currency || 'EUR'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="mt-6">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Piani di Abbonamento</h3>
              <p className="text-sm text-muted-foreground">Gestisci i piani disponibili per gli utenti</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-plan">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuovo Piano
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPlan ? 'Modifica Piano' : 'Nuovo Piano di Abbonamento'}
                  </DialogTitle>
                  <DialogDescription>
                    Configura i dettagli del piano. Usa l'AI per formattare automaticamente la descrizione.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="plan-name">Nome Piano</Label>
                      <Input
                        id="plan-name"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder="Es. Basic, Premium, Enterprise"
                        data-testid="input-plan-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan-price">Prezzo</Label>
                      <Input
                        id="plan-price"
                        type="number"
                        value={planPrice}
                        onChange={(e) => setPlanPrice(e.target.value)}
                        placeholder="90"
                        data-testid="input-plan-price"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="plan-currency">Valuta</Label>
                      <Input
                        id="plan-currency"
                        value={planCurrency}
                        onChange={(e) => setPlanCurrency(e.target.value)}
                        placeholder="EUR"
                        data-testid="input-plan-currency"
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan-interval">Durata</Label>
                      <Input
                        id="plan-interval"
                        value={planInterval}
                        onChange={(e) => setPlanInterval(e.target.value)}
                        placeholder="year, month"
                        data-testid="input-plan-interval"
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan-sort">Ordine</Label>
                      <Input
                        id="plan-sort"
                        type="number"
                        value={planSortOrder}
                        onChange={(e) => setPlanSortOrder(parseInt(e.target.value) || 0)}
                        data-testid="input-plan-sort"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="plan-active"
                        checked={planActive}
                        onCheckedChange={setPlanActive}
                        data-testid="switch-plan-active"
                      />
                      <Label htmlFor="plan-active">Piano Attivo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="plan-stripe"
                        checked={planStripeEnabled}
                        onCheckedChange={setPlanStripeEnabled}
                        data-testid="switch-plan-stripe"
                      />
                      <Label htmlFor="plan-stripe">Abilita Pagamento Stripe</Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="plan-description">Descrizione (opzionale)</Label>
                    <Textarea
                      id="plan-description"
                      value={planDescription}
                      onChange={(e) => setPlanDescription(e.target.value)}
                      placeholder="Descrivi i servizi inclusi nel piano..."
                      rows={3}
                      data-testid="input-plan-description"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={handleFormatDescription}
                      disabled={isFormattingDescription || !planDescription.trim()}
                      data-testid="button-format-description"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      {isFormattingDescription ? "Formattazione..." : "Formatta con AI"}
                    </Button>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Funzionalità</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddFeature}
                        data-testid="button-add-feature"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Aggiungi
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {planFeatures && planFeatures.length > 0 ? (
                        planFeatures.map((feature, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={feature}
                              onChange={(e) => handleUpdateFeature(index, e.target.value)}
                              placeholder="Descrivi una funzionalità..."
                              data-testid={`input-feature-${index}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFeature(index)}
                              data-testid={`button-remove-feature-${index}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Nessuna funzionalità aggiunta. Usa "Formatta con AI" per generarle automaticamente dalla descrizione.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                    data-testid="button-cancel-plan"
                  >
                    Annulla
                  </Button>
                  <Button
                    onClick={handleSavePlan}
                    disabled={!planName || !planPrice || createPlanMutation.isPending || updatePlanMutation.isPending}
                    data-testid="button-save-plan"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {createPlanMutation.isPending || updatePlanMutation.isPending ? "Salvataggio..." : "Salva Piano"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoadingPlans ? (
            <div className="text-center py-8">Caricamento piani...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptionPlans.map((plan) => (
                <Card key={plan.id} className={!plan.isActive ? "opacity-60" : ""} data-testid={`card-plan-${plan.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>
                          {plan.currency} {plan.price}/{plan.interval === 'year' ? 'anno' : 'mese'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPlan(plan)}
                          data-testid={`button-edit-plan-${plan.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePlan(plan.id)}
                          data-testid={`button-delete-plan-${plan.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                    )}
                    <ul className="space-y-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Ordine: {plan.sortOrder}</span>
                        <span>{plan.isActive ? 'Attivo' : 'Inattivo'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stripe:</span>
                        <span className={plan.stripeEnabled ? 'text-green-600' : 'text-gray-400'}>
                          {plan.stripeEnabled ? 'Abilitato' : 'Disabilitato'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {subscriptionPlans.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Nessun piano configurato. Crea il primo piano usando il pulsante "Nuovo Piano".
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
