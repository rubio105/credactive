import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Calendar, Clock, Users, Video, ArrowLeft, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LiveCourse, LiveCourseSession } from "@shared/schema";

type WebinarSession = Omit<LiveCourseSession, 'enrolled'> & {
  enrolled: number;
  isUserEnrolled?: boolean;
};

type WebinarWithSession = LiveCourse & {
  sessions: WebinarSession[];
};

export default function WebinarHealthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [enrollingSessionId, setEnrollingSessionId] = useState<string | null>(null);

  const { data: webinars, isLoading } = useQuery<WebinarWithSession[]>({
    queryKey: ["/api/webinar-health"],
  });

  const enrollMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest(`/api/webinar-health/enroll/${sessionId}`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Iscrizione confermata!",
        description: "Riceverai un'email di conferma con i dettagli del webinar.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/webinar-health"] });
      setEnrollingSessionId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Non è stato possibile completare l'iscrizione.",
        variant: "destructive",
      });
      setEnrollingSessionId(null);
    },
  });

  const handleEnroll = (sessionId: string) => {
    setEnrollingSessionId(sessionId);
    enrollMutation.mutate(sessionId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Caricamento webinar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/prevention")}
            className="mb-4"
            data-testid="button-back-prevention"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Prevenzione
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-900 to-pink-900 dark:from-purple-100 dark:to-pink-100 bg-clip-text text-transparent">
                Webinar Health
              </h1>
              <p className="text-muted-foreground">
                Eventi live gratuiti sulla prevenzione con medici esperti
              </p>
            </div>
          </div>
        </div>

        {/* Webinar List */}
        {!webinars || webinars.length === 0 ? (
          <Card className="text-center p-12">
            <Activity className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nessun webinar disponibile</h3>
            <p className="text-muted-foreground mb-6">
              I prossimi webinar sulla prevenzione verranno pubblicati a breve.
            </p>
            <Button onClick={() => setLocation("/prevention")} data-testid="button-back-no-webinars">
              Torna alla Prevenzione
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {webinars.map((webinar) => (
              <Card key={webinar.id} className="overflow-hidden shadow-lg border-purple-100 dark:border-purple-900">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2 text-purple-900 dark:text-purple-100">
                        {webinar.title}
                      </CardTitle>
                      <CardDescription className="text-base text-purple-700 dark:text-purple-300">
                        {webinar.description}
                      </CardDescription>
                    </div>
                    <Badge className="bg-purple-600 text-white" data-testid={`badge-webinar-${webinar.id}`}>
                      Gratuito
                    </Badge>
                  </div>
                  
                  {webinar.instructor && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-purple-800 dark:text-purple-200">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Relatore: {webinar.instructor}</span>
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="pt-6">
                  {webinar.objectives && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Argomenti trattati
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {webinar.objectives}
                      </p>
                    </div>
                  )}

                  {/* Sessions */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date disponibili
                    </h4>
                    
                    {webinar.sessions.map((session) => {
                      const isAvailable = session.status === 'available' && 
                        (session.capacity === null || session.enrolled < (session.capacity || 0));
                      const isFull = session.status === 'available' && 
                        session.capacity !== null && 
                        session.enrolled >= (session.capacity || 0);
                      const isPast = new Date(session.endDate) < new Date();
                      const isEnrolled = session.isUserEnrolled;

                      return (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                          data-testid={`session-${session.id}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-purple-600" />
                                <span className="font-medium">
                                  {format(new Date(session.startDate), "EEEE d MMMM yyyy", { locale: it })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-purple-600" />
                                <span>
                                  {format(new Date(session.startDate), "HH:mm")} - {format(new Date(session.endDate), "HH:mm")}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span>
                                {session.enrolled} / {session.capacity || '∞'} partecipanti
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {isEnrolled && (
                              <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Iscritto
                              </Badge>
                            )}
                            
                            {isPast ? (
                              <Badge variant="secondary" data-testid={`badge-past-${session.id}`}>Terminato</Badge>
                            ) : isFull ? (
                              <Badge variant="destructive" data-testid={`badge-full-${session.id}`}>Completo</Badge>
                            ) : isEnrolled ? (
                              session.streamingUrl && (
                                <Button
                                  asChild
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                  data-testid={`button-join-${session.id}`}
                                >
                                  <a href={session.streamingUrl} target="_blank" rel="noopener noreferrer">
                                    <Video className="w-4 h-4 mr-2" />
                                    Partecipa
                                  </a>
                                </Button>
                              )
                            ) : (
                              <Button
                                onClick={() => handleEnroll(session.id)}
                                disabled={!isAvailable || enrollingSessionId === session.id}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                data-testid={`button-enroll-${session.id}`}
                              >
                                {enrollingSessionId === session.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Iscrizione...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Partecipa Gratis
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
