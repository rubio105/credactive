import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Star, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export function FeedbackDialog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("improvement");

  const { data: shouldPrompt } = useQuery<{ shouldPrompt: boolean }>({
    queryKey: ['/api/feedback/should-prompt'],
    enabled: !!user && !user.isAdmin, // Don't prompt admins
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (shouldPrompt?.shouldPrompt && user && !user.isAdmin) {
      // Wait 1 second before showing feedback dialog
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000); // 1 second

      return () => clearTimeout(timer);
    }
  }, [shouldPrompt, user]);

  const submitFeedbackMutation = useMutation({
    mutationFn: (data: { rating: number; comment?: string; message?: string; category?: string; page?: string; source: string }) =>
      apiRequest("/api/feedback", "POST", data),
    onSuccess: () => {
      toast({
        title: "Grazie per il tuo feedback!",
        description: "Il tuo contributo ci aiuta a migliorare la piattaforma.",
      });
      setIsOpen(false);
      setRating(0);
      setComment("");
      setMessage("");
      setCategory("improvement");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile inviare il feedback.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Seleziona una valutazione",
        description: "Per favore, seleziona almeno una stella.",
        variant: "destructive",
      });
      return;
    }

    submitFeedbackMutation.mutate({
      rating,
      comment: comment.trim() || undefined,
      message: message.trim() || undefined,
      category,
      page: location,
      source: "popup",
    });
  };

  const handleSkip = () => {
    setIsOpen(false);
    setRating(0);
    setComment("");
    setMessage("");
    setCategory("improvement");
  };

  if (!user || user.isAdmin) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md" data-testid="dialog-feedback">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Come sta andando CIRY?
          </DialogTitle>
          <DialogDescription>
            Il tuo feedback è prezioso per migliorare la piattaforma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm font-medium">Come valuti la tua esperienza?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                  data-testid={`star-${star}`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 5 && "Eccellente! 🎉"}
                {rating === 4 && "Molto bene! 👍"}
                {rating === 3 && "Buono 👌"}
                {rating === 2 && "Sufficiente 🤔"}
                {rating === 1 && "Può migliorare 💪"}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="improvement" data-testid="category-improvement">
                  Suggerimento di miglioramento
                </SelectItem>
                <SelectItem value="bug" data-testid="category-bug">
                  Bug o problema tecnico
                </SelectItem>
                <SelectItem value="feature_request" data-testid="category-feature">
                  Richiesta funzionalità
                </SelectItem>
                <SelectItem value="other" data-testid="category-other">
                  Altro
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="feedback-message">
              Il tuo feedback <span className="text-muted-foreground">(opzionale)</span>
            </Label>
            <Textarea
              id="feedback-message"
              placeholder="Raccontaci la tua esperienza con CIRY..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              data-testid="input-feedback-message"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={submitFeedbackMutation.isPending}
            data-testid="button-skip-feedback"
          >
            Salta
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitFeedbackMutation.isPending || rating === 0}
            data-testid="button-submit-feedback"
          >
            {submitFeedbackMutation.isPending ? "Invio..." : "Invia Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
