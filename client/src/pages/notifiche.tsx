import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, BellOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

export default function NotifichePage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, "POST", {});
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div className="p-4 pb-20 md:pb-4" data-testid="notifiche-page">
      <Card className="shadow-sm border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle>Notifiche</CardTitle>
          </div>
          <CardDescription>Visualizza e gestisci le tue notifiche</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="all" data-testid="tab-all">
                Tutte ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" data-testid="tab-unread">
                Non lette ({notifications.filter(n => !n.isRead).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={notification.isRead ? "opacity-60" : ""}
                    data-testid={`notification-${notification.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {!notification.isRead && (
                              <Badge variant="default" className="text-xs">Nuovo</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: it })}
                            </span>
                          </div>
                          <CardTitle className="text-sm">{notification.title}</CardTitle>
                        </div>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            data-testid={`mark-read-${notification.id}`}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <BellOff className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    {filter === "unread" ? "Nessuna notifica non letta" : "Nessuna notifica"}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
