import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface LiveCourseSession {
  id: string;
  courseId: string;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolled: number;
  status: string;
}

interface ProgramModule {
  moduleTitle: string;
  hours: string;
  topics?: string;
}

interface LiveCourse {
  id: string;
  quizId: string;
  title: string;
  description?: string;
  objectives?: string;
  programModules?: ProgramModule[];
  cosaInclude?: string[];
  instructor?: string;
  duration?: string;
  price: number;
  sessions: LiveCourseSession[];
}

interface LiveCourseModalProps {
  quizId: string;
  quizTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

function CheckoutForm({ courseId, sessionId, onSuccess }: { courseId: string; sessionId: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Errore pagamento",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        await apiRequest('/api/live-courses/confirm-enrollment', 'POST', {
          paymentIntentId: paymentIntent.id,
          courseId,
          sessionId,
        });
        
        toast({
          title: "Iscrizione confermata!",
          description: "Riceverai un'email con i dettagli del corso.",
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'iscrizione.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
        data-testid="button-confirm-payment"
      >
        {isProcessing ? 'Elaborazione...' : 'Conferma Pagamento'}
      </Button>
    </form>
  );
}

export function LiveCourseModal({ quizId, quizTitle, isOpen, onClose }: LiveCourseModalProps) {
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<LiveCourseSession | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const { data: courseData, isLoading } = useQuery<LiveCourse>({
    queryKey: ['/api/live-courses/quiz', quizId],
    enabled: isOpen,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (data: { courseId: string; sessionId: string }) =>
      apiRequest('/api/live-courses/purchase', 'POST', data) as unknown as Promise<{ clientSecret: string }>,
    onSuccess: (data: { clientSecret: string }) => {
      setClientSecret(data.clientSecret);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile iniziare il pagamento. Riprova.",
        variant: "destructive",
      });
    },
  });

  const handleSessionSelect = (session: LiveCourseSession) => {
    if (!courseData) return;
    setSelectedSession(session);
    purchaseMutation.mutate({
      courseId: courseData.id,
      sessionId: session.id,
    });
  };

  const handleSuccess = () => {
    setSelectedSession(null);
    setClientSecret(null);
    onClose();
  };

  const handleBack = () => {
    setSelectedSession(null);
    setClientSecret(null);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent data-testid="modal-live-course">
          <div className="text-center py-8">Caricamento...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!courseData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent data-testid="modal-live-course">
          <DialogHeader>
            <DialogTitle>Corso Live Non Disponibile</DialogTitle>
            <DialogDescription>
              Al momento non ci sono corsi live disponibili per questo quiz.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const availableSessions = courseData.sessions?.filter(s => 
    s.status === 'available' && (s.enrolled || 0) < (s.capacity || 30)
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="modal-live-course">
        <DialogHeader>
          <DialogTitle>{courseData.title}</DialogTitle>
          <DialogDescription>{courseData.description}</DialogDescription>
        </DialogHeader>

        {!selectedSession ? (
          <div className="space-y-6">
            {courseData.objectives && (
              <div>
                <h3 className="font-semibold mb-2">Obiettivi del corso</h3>
                <p className="text-sm text-muted-foreground leading-relaxed" data-testid="course-objectives">
                  {courseData.objectives}
                </p>
              </div>
            )}

            {courseData.programModules && courseData.programModules.length > 0 && (
              <div className="border border-border rounded-lg p-4 bg-accent/10">
                <h3 className="font-bold mb-3 uppercase text-sm tracking-wide">PROGRAMMA DEL CORSO</h3>
                <div className="space-y-2" data-testid="course-program-modules">
                  {courseData.programModules.map((module, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">{module.moduleTitle}</span>
                      {module.hours && <span className="text-muted-foreground"> ({module.hours})</span>}
                      {module.topics && <span className="text-muted-foreground">: {module.topics}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-3">Date Disponibili</h3>
              {availableSessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nessuna data disponibile al momento.</p>
              ) : (
                <div className="space-y-2">
                  {availableSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleSessionSelect(session)}
                      className="w-full p-4 border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors text-left"
                      data-testid={`session-${session.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="font-medium">
                              {new Date(session.startDate).toLocaleDateString('it-IT', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(session.startDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(session.endDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">€{(courseData.price / 100).toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            {session.enrolled || 0}/{session.capacity || 30} posti
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 text-sm">
              {courseData.instructor && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Docente:</span>
                  <span className="text-muted-foreground" data-testid="course-instructor">{courseData.instructor}</span>
                </div>
              )}

              {courseData.duration && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Durata:</span>
                  <span className="text-muted-foreground" data-testid="course-duration">{courseData.duration}</span>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                <Check className="w-5 h-5" />
                Cosa Include
              </h4>
              <ul className="text-sm space-y-2 ml-6 list-disc text-foreground/80" data-testid="course-includes">
                {courseData.cosaInclude && courseData.cosaInclude.length > 0 ? (
                  courseData.cosaInclude.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))
                ) : (
                  <>
                    <li>Formazione live con {courseData.instructor || 'esperti del settore'}</li>
                    <li>Materiale didattico completo</li>
                    <li>Certificato di partecipazione</li>
                    <li>Accesso al gruppo di supporto</li>
                    <li>Q&A e casi studio pratici</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        ) : clientSecret ? (
          <div className="space-y-4">
            <Button variant="ghost" onClick={handleBack} className="mb-2">
              ← Indietro
            </Button>
            <div className="p-4 bg-accent/20 rounded-lg mb-4">
              <div className="text-sm space-y-1">
                <div><strong>Corso:</strong> {courseData.title}</div>
                <div><strong>Data:</strong> {new Date(selectedSession.startDate).toLocaleDateString('it-IT')}</div>
                <div><strong>Totale:</strong> €{(courseData.price / 100).toFixed(2)}</div>
              </div>
            </div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm 
                courseId={courseData.id} 
                sessionId={selectedSession.id}
                onSuccess={handleSuccess}
              />
            </Elements>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Inizializzazione pagamento...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
