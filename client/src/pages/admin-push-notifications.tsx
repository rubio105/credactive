import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminPushNotifications() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      toast({
        title: "Errore",
        description: "Titolo e messaggio sono obbligatori",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const result = await apiRequest("/api/admin/push/send", "POST", {
        title,
        body,
        url: url || undefined,
      }) as unknown as { sent: number; failed: number };

      toast({
        title: "Notifiche inviate",
        description: `${result.sent} notifiche inviate con successo (${result.failed} fallite)`,
      });

      // Reset form
      setTitle("");
      setBody("");
      setUrl("");
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore nell'invio delle notifiche",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleTestNotification = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        // Check if already subscribed
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        
        if (existingSubscription) {
          toast({
            title: "Già iscritto",
            description: "Il browser è già iscritto alle notifiche push",
          });
          return;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        
        if (permission !== 'granted') {
          toast({
            title: "Permesso negato",
            description: "Per testare le notifiche, devi concedere il permesso",
            variant: "destructive",
          });
          return;
        }

        // Get VAPID public key
        const { publicKey } = await apiRequest("/api/push/vapid-public-key", "GET") as unknown as { publicKey: string };
        
        // Convert base64 VAPID key to Uint8Array
        const urlBase64ToUint8Array = (base64String: string) => {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };
        
        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        // Save subscription to server
        await apiRequest("/api/push/subscribe", "POST", {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...Array.from(new Uint8Array(subscription.getKey('p256dh')!)))),
            auth: btoa(String.fromCharCode(...Array.from(new Uint8Array(subscription.getKey('auth')!)))),
          },
        });

        toast({
          title: "Iscrizione completata",
          description: "Ora puoi ricevere notifiche push",
        });
      } catch (error: any) {
        console.error('Test notification error:', error);
        toast({
          title: "Errore",
          description: error.message || "Errore nel test delle notifiche",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Non supportato",
        description: "Il browser non supporta le notifiche push",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="heading-push-notifications">
            Notifiche Push
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Invia notifiche push a tutti gli utenti iscritti
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Send Notification Form */}
          <Card data-testid="card-send-notification">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Invia Notifica
              </CardTitle>
              <CardDescription>
                Invia una notifica push a tutti gli utenti iscritti
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titolo</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es: Nuova funzionalità disponibile"
                  data-testid="input-notification-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Messaggio</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Es: Scopri la nuova sezione AI Prevention..."
                  rows={4}
                  data-testid="input-notification-body"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL (opzionale)</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Es: /prevention"
                  data-testid="input-notification-url"
                />
              </div>

              <Button
                onClick={handleSendNotification}
                disabled={isSending}
                className="w-full"
                data-testid="button-send-notification"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSending ? "Invio in corso..." : "Invia a Tutti"}
              </Button>
            </CardContent>
          </Card>

          {/* Test & Info */}
          <div className="space-y-6">
            <Card data-testid="card-test-notification">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Test Notifiche
                </CardTitle>
                <CardDescription>
                  Iscriviti alle notifiche push per testarle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Clicca il pulsante per iscriverti alle notifiche push su questo browser. 
                  Potrai poi inviare notifiche di test.
                </p>
                <Button
                  onClick={handleTestNotification}
                  variant="outline"
                  className="w-full"
                  data-testid="button-test-notification"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Iscriviti per Test
                </Button>
              </CardContent>
            </Card>

            <Card data-testid="card-info">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Informazioni
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Stato Service Worker
                  </span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {'serviceWorker' in navigator ? 'Supportato' : 'Non supportato'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Notifiche Push
                  </span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {'PushManager' in window ? 'Supportato' : 'Non supportato'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Le notifiche push funzionano solo su HTTPS e richiedono il permesso dell'utente.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
