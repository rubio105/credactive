import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { DollarSign, Save } from "lucide-react";

interface Settings {
  subscriptionPrice: number;
  currency: string;
}

export function AdminSettings() {
  const { toast } = useToast();
  const [price, setPrice] = useState('90');
  const [currency, setCurrency] = useState('EUR');

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/admin/settings"],
  });

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

  const handleSave = () => {
    updateMutation.mutate({
      subscriptionPrice: parseFloat(price),
      currency,
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Impostazioni</h2>
        <p className="text-muted-foreground">Configura le impostazioni della piattaforma</p>
      </div>

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
    </div>
  );
}
