import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scale, Ruler, FileText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingDialog({ open, onOpenChange }: OnboardingDialogProps) {
  const { toast } = useToast();
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const completeMutation = useMutation({
    mutationFn: async (data: { heightCm?: number; weightKg?: number }) => {
      const res = await apiRequest("/api/user/complete-onboarding", "POST", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      onOpenChange(false);
      toast({
        title: "Profilo completato! 🎉",
        description: "Grazie per aver aggiornato il tuo profilo salute"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Impossibile salvare i dati",
        variant: "destructive"
      });
    },
  });

  const handleSubmit = () => {
    const data: { heightCm?: number; weightKg?: number } = {};
    
    if (heightCm && parseInt(heightCm) > 0) {
      data.heightCm = parseInt(heightCm);
    }
    
    if (weightKg && parseInt(weightKg) > 0) {
      data.weightKg = parseInt(weightKg);
    }

    completeMutation.mutate(data);
  };

  const handleSkip = () => {
    completeMutation.mutate({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-onboarding">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 rounded-lg">
              <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <DialogTitle className="text-2xl">Benvenuto in CIRY!</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Per offrirti un'esperienza personalizzata e consigli di prevenzione mirati, 
            aiutaci a conoscerti meglio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <AlertDescription className="ml-2 text-sm text-emerald-800 dark:text-emerald-200">
              <p className="font-semibold mb-1">📋 Non dimenticare!</p>
              <p>Dopo aver completato il profilo, carica i tuoi ultimi <strong>esami del sangue</strong> nella sezione AI Prevenzione per ricevere analisi personalizzate.</p>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="height" className="flex items-center gap-2 text-base">
                <Ruler className="w-4 h-4 text-emerald-600" />
                Altezza (cm) <span className="text-sm text-gray-500">(opzionale)</span>
              </Label>
              <Input
                id="height"
                type="number"
                placeholder="Es. 175"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                min="0"
                max="250"
                className="text-lg"
                data-testid="input-height"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center gap-2 text-base">
                <Scale className="w-4 h-4 text-emerald-600" />
                Peso (kg) <span className="text-sm text-gray-500">(opzionale)</span>
              </Label>
              <Input
                id="weight"
                type="number"
                placeholder="Es. 70"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                min="0"
                max="300"
                className="text-lg"
                data-testid="input-weight"
              />
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 Questi dati ci aiutano a calcolare il tuo BMI e fornire consigli più accurati.
            Puoi sempre aggiornarli più tardi dal tuo profilo.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={completeMutation.isPending}
            className="w-full sm:w-auto"
            data-testid="button-skip-onboarding"
          >
            Salta per ora
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={completeMutation.isPending}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            data-testid="button-complete-onboarding"
          >
            {completeMutation.isPending ? "Salvataggio..." : "Completa Profilo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
