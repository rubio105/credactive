import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Save, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: string;
  isActive: boolean;
}

const API_KEYS = [
  {
    key: "OPENAI_API_KEY",
    label: "OpenAI API Key",
    description: "Chiave API per generazione domande AI e audio TTS",
    placeholder: "sk-...",
  },
  {
    key: "GEMINI_API_KEY",
    label: "Google Gemini API Key",
    description: "Chiave API per modelli Gemini (opzionale)",
    placeholder: "AI...",
  },
  {
    key: "ANTHROPIC_API_KEY",
    label: "Anthropic API Key",
    description: "Chiave API per modelli Claude (opzionale)",
    placeholder: "sk-ant-...",
  },
  {
    key: "STRIPE_SECRET_KEY",
    label: "Stripe Secret Key",
    description: "Chiave segreta Stripe per pagamenti",
    placeholder: "sk_live_... o sk_test_...",
  },
  {
    key: "BREVO_API_KEY",
    label: "Brevo API Key",
    description: "Chiave API per invio email",
    placeholder: "xkeysib-...",
  },
  {
    key: "BREVO_SENDER_EMAIL",
    label: "Brevo Sender Email",
    description: "Email mittente per Brevo",
    placeholder: "noreply@ciry.app",
  },
];

export function AdminAPIKeys() {
  const { toast } = useToast();
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ["/api/admin/settings"],
  });

  const updateMutation = useMutation({
    mutationFn: (data: { key: string; value: string; description?: string }) =>
      apiRequest(`/api/admin/settings/${data.key}`, "PUT", {
        value: data.value,
        description: data.description,
        category: "api_keys",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Impostazione salvata con successo" });
      setEditedValues({});
    },
    onError: () => {
      toast({ title: "Errore durante il salvataggio", variant: "destructive" });
    },
  });

  const toggleVisibility = (key: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(key)) {
      newVisible.delete(key);
    } else {
      newVisible.add(key);
    }
    setVisibleKeys(newVisible);
  };

  const handleSave = (apiKey: typeof API_KEYS[0]) => {
    const value = editedValues[apiKey.key] || getSetting(apiKey.key)?.value || "";
    updateMutation.mutate({
      key: apiKey.key,
      value: value.trim(),
      description: apiKey.description,
    });
  };

  const getSetting = (key: string) => {
    return settings?.find((s) => s.key === key);
  };

  const getValue = (key: string) => {
    if (editedValues[key] !== undefined) {
      return editedValues[key];
    }
    return getSetting(key)?.value || "";
  };

  const handleChange = (key: string, value: string) => {
    setEditedValues({ ...editedValues, [key]: value });
  };

  if (isLoading) {
    return <div>Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/admin" data-testid="button-back-home">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Dashboard
        </Link>
      </Button>

      <div>
        <h2 className="text-2xl font-bold">Configurazione API</h2>
        <p className="text-muted-foreground mt-1">
          Gestisci le chiavi API e le configurazioni dell'applicazione. Le chiavi vengono salvate in modo sicuro nel database.
        </p>
      </div>

      <div className="grid gap-6">
        {API_KEYS.map((apiKey) => {
          const currentValue = getValue(apiKey.key);
          const isVisible = visibleKeys.has(apiKey.key);
          const hasValue = currentValue.length > 0;
          const isEdited = editedValues[apiKey.key] !== undefined;

          return (
            <Card key={apiKey.key} data-testid={`card-setting-${apiKey.key}`}>
              <CardHeader>
                <CardTitle className="text-lg">{apiKey.label}</CardTitle>
                <CardDescription>{apiKey.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor={apiKey.key} className="sr-only">
                        {apiKey.label}
                      </Label>
                      <div className="relative">
                        <Input
                          id={apiKey.key}
                          type={isVisible ? "text" : "password"}
                          value={currentValue}
                          onChange={(e) => handleChange(apiKey.key, e.target.value)}
                          placeholder={apiKey.placeholder}
                          className="pr-10"
                          data-testid={`input-${apiKey.key}`}
                        />
                        {hasValue && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => toggleVisibility(apiKey.key)}
                            data-testid={`button-toggle-${apiKey.key}`}
                          >
                            {isVisible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSave(apiKey)}
                      disabled={updateMutation.isPending || (!isEdited && hasValue)}
                      data-testid={`button-save-${apiKey.key}`}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salva
                    </Button>
                  </div>
                  {hasValue && !isEdited && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ Configurato
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">⚠️ Nota Importante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Le chiavi API salvate qui sovrascrivono le variabili d'ambiente. Se vuoi tornare a usare le variabili d'ambiente, cancella la chiave dal database.
          </p>
          <p className="text-muted-foreground">
            Le chiavi sono memorizzate in modo sicuro nel database e accessibili solo agli amministratori.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
