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
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function FeedbackDialog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: shouldPrompt } = useQuery<{ shouldPrompt: boolean }>({
    queryKey: ['/api/feedback/should-prompt'],
    enabled: !!user && !user.isAdmin, // Don't prompt admins
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (shouldPrompt?.shouldPrompt && user && !user.isAdmin) {
      // Wait 30 seconds before showing feedback dialog
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
    }
  }, [shouldPrompt, user]);

  const submitFeedbackMutation = useMutation({
    mutationFn: (data: { rating: number; comment?: string; source: string }) =>
      apiRequest("/api/feedback", "POST", data),
    onSuccess: () => {
      toast({
        title: "Grazie per il tuo feedback!",
        description: "Il tuo contributo ci aiuta a migliorare la piattaforma.",
      });
      setIsOpen(false);
      setRating(0);
      setComment("");
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
      source: "popup",
    });
  };

  const handleSkip = () => {
    setIsOpen(false);
    setRating(0);
    setComment("");
  };

  if (!user || user.isAdmin) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md" data-testid="dialog-feedback">
        <DialogHeader>
          <DialogTitle>Ci aiuti a migliorare?</DialogTitle>
          <DialogDescription>
            Il tuo feedback è prezioso per noi. Ci aiuta a rendere la piattaforma sempre migliore.
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
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="feedback-comment" className="text-sm font-medium">
              Commento (opzionale)
            </label>
            <Textarea
              id="feedback-comment"
              placeholder="Raccontaci la tua esperienza..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              data-testid="input-feedback-comment"
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
