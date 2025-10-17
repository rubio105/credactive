import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Send, Users, User, CheckCircle2, Info } from "lucide-react";

export default function AdminInAppNotifications() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<"all" | "specific">("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [relatedUrl, setRelatedUrl] = useState("");

  // Fetch all users for specific targeting
  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: targetType === "specific",
  });

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/admin/notifications/create", "POST", {
        title,
        message,
        type: "admin_broadcast",
        priority,
        targetUserId: targetType === "specific" ? targetUserId : undefined,
        relatedUrl: relatedUrl || null,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Notifica inviata!",
        description: `Notifica inviata con successo a ${data.count} utent${data.count === 1 ? 'e' : 'i'}.`,
      });
      // Reset form
      setTitle("");
      setMessage("");
      setTargetUserId("");
      setRelatedUrl("");
      setPriority("normal");
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile inviare la notifica.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "Campi obbligatori",
        description: "Inserisci titolo e messaggio.",
      });
      return;
    }

    if (targetType === "specific" && !targetUserId) {
      toast({
        variant: "destructive",
        title: "Utente richiesto",
        description: "Seleziona un utente per l'invio mirato.",
      });
      return;
    }

    createNotificationMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifiche In-App</h1>
          <p className="text-muted-foreground mt-1">
            Crea e invia notifiche in-app agli utenti (campanello di notifica)
          </p>
        </div>
      </div>

      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <Info className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <p className="font-medium mb-1">Nota importante</p>
          <p className="text-sm">
            Le notifiche create qui appariranno nel <strong>campanello delle notifiche</strong> in alto a destra nella navigation. 
            Gli utenti le vedranno quando accedono alla piattaforma. Per le notifiche push (browser), usa il pannello "Notifiche Push".
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Nuova Notifica In-App
          </CardTitle>
          <CardDescription>
            Le notifiche verranno visualizzate nel campanello di notifica degli utenti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target Type */}
            <div className="space-y-2">
              <Label htmlFor="targetType">Destinatari</Label>
              <Select
                value={targetType}
                onValueChange={(value: "all" | "specific") => setTargetType(value)}
              >
                <SelectTrigger data-testid="select-target-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Tutti gli utenti (Broadcast)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="specific">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Utente specifico</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Selection (if specific) */}
            {targetType === "specific" && (
              <div className="space-y-2">
                <Label htmlFor="targetUserId">Seleziona Utente</Label>
                <Select value={targetUserId} onValueChange={setTargetUserId}>
                  <SelectTrigger data-testid="select-user">
                    <SelectValue placeholder="Seleziona un utente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName} (${user.email})`
                          : user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priorità</Label>
              <Select
                value={priority}
                onValueChange={(value: "low" | "normal" | "high") => setPriority(value)}
              >
                <SelectTrigger data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Bassa</SelectItem>
                  <SelectItem value="normal">🟡 Normale</SelectItem>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="es. Nuova funzionalità disponibile"
                maxLength={100}
                data-testid="input-title"
              />
              <p className="text-xs text-muted-foreground">{title.length}/100 caratteri</p>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Messaggio *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Scrivi il messaggio della notifica..."
                rows={4}
                maxLength={500}
                data-testid="textarea-message"
              />
              <p className="text-xs text-muted-foreground">{message.length}/500 caratteri</p>
            </div>

            {/* Related URL (optional) */}
            <div className="space-y-2">
              <Label htmlFor="relatedUrl">URL Collegato (opzionale)</Label>
              <Input
                id="relatedUrl"
                value={relatedUrl}
                onChange={(e) => setRelatedUrl(e.target.value)}
                placeholder="es. /prevention o /subscribe"
                data-testid="input-url"
              />
              <p className="text-xs text-muted-foreground">
                Quando l'utente clicca sulla notifica, verrà reindirizzato a questo URL
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                type="submit"
                disabled={createNotificationMutation.isPending}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-send-notification"
              >
                {createNotificationMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Invia Notifica
                  </>
                )}
              </Button>

              {createNotificationMutation.isSuccess && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Notifica inviata!</span>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
