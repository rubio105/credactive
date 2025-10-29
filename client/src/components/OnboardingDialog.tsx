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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scale, Ruler, FileText, Sparkles, Calendar, Activity, Cigarette, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingDialog({ open, onOpenChange }: OnboardingDialogProps) {
  const { toast } = useToast();
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [smokingStatus, setSmokingStatus] = useState("");
  const [physicalActivity, setPhysicalActivity] = useState("");
  const [userBio, setUserBio] = useState("");

  const completeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("/api/user/complete-onboarding", "POST", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onOpenChange(false);
      toast({
        title: "Profilo completato! 🎉",
        description: "Grazie per aver completato il tuo profilo di prevenzione"
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
    const data: any = {};

    if (age && parseInt(age) > 0) {
      data.age = parseInt(age);
    }

    if (gender) {
      data.gender = gender;
    }

    if (heightCm && parseInt(heightCm) > 0) {
      data.heightCm = parseInt(heightCm);
    }

    if (weightKg && parseInt(weightKg) > 0) {
      data.weightKg = parseInt(weightKg);
    }

    if (smokingStatus) {
      data.smokingStatus = smokingStatus;
    }

    if (physicalActivity) {
      data.physicalActivity = physicalActivity;
    }

    if (userBio && userBio.trim()) {
      data.userBio = userBio.trim();
    }

    completeMutation.mutate(data);
  };

  const handleSkip = () => {
    completeMutation.mutate({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-onboarding">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 rounded-lg">
              <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <DialogTitle className="text-2xl">Facciamo Prevenzione Insieme!</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Per offrirti consigli di prevenzione personalizzati e mirati, 
            aiutaci a conoscerti meglio. Tutti i campi sono opzionali.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Age */}
          <div className="space-y-2">
            <Label htmlFor="age" className="flex items-center gap-2 text-base font-semibold">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Età
            </Label>
            <Input
              id="age"
              type="number"
              placeholder="Es. 45"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="1"
              max="120"
              className="text-lg"
              data-testid="input-age"
            />
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Users className="w-4 h-4 text-emerald-600" />
              Sesso
            </Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="text-base" data-testid="select-gender">
                <SelectValue placeholder="Seleziona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Maschio</SelectItem>
                <SelectItem value="female">Femmina</SelectItem>
                <SelectItem value="other">Altro</SelectItem>
                <SelectItem value="prefer_not_to_say">Preferisco non dirlo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Height & Weight in a grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height" className="flex items-center gap-2 text-base font-semibold">
                <Ruler className="w-4 h-4 text-emerald-600" />
                Altezza (cm)
              </Label>
              <Input
                id="height"
                type="number"
                placeholder="175"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                min="0"
                max="250"
                className="text-lg"
                data-testid="input-height"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center gap-2 text-base font-semibold">
                <Scale className="w-4 h-4 text-emerald-600" />
                Peso (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                min="0"
                max="300"
                className="text-lg"
                data-testid="input-weight"
              />
            </div>
          </div>

          {/* Smoking Status */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Cigarette className="w-4 h-4 text-emerald-600" />
              Sei fumatore?
            </Label>
            <Select value={smokingStatus} onValueChange={setSmokingStatus}>
              <SelectTrigger className="text-base" data-testid="select-smoking-status">
                <SelectValue placeholder="Seleziona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="non-smoker">Non fumo</SelectItem>
                <SelectItem value="former-smoker">Ex fumatore</SelectItem>
                <SelectItem value="occasional-smoker">Fumatore occasionale</SelectItem>
                <SelectItem value="regular-smoker">Fumatore regolare</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Physical Activity */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Activity className="w-4 h-4 text-emerald-600" />
              Pratichi regolarmente attività fisica?
            </Label>
            <Select value={physicalActivity} onValueChange={setPhysicalActivity}>
              <SelectTrigger className="text-base" data-testid="select-physical-activity">
                <SelectValue placeholder="Seleziona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentario (nessuna attività)</SelectItem>
                <SelectItem value="light">Leggera (1-2 volte/settimana)</SelectItem>
                <SelectItem value="moderate">Moderata (3-4 volte/settimana)</SelectItem>
                <SelectItem value="active">Attivo (5-6 volte/settimana)</SelectItem>
                <SelectItem value="very-active">Molto attivo (tutti i giorni)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User Bio */}
          <div className="space-y-3">
            <Label htmlFor="bio" className="flex items-center gap-2 text-base font-semibold">
              <FileText className="w-4 h-4 text-emerald-600" />
              Raccontaci di te
            </Label>
            <Textarea
              id="bio"
              placeholder="Es. Ho una storia familiare di diabete, seguo una dieta mediterranea, mi piace fare jogging la mattina..."
              value={userBio}
              onChange={(e) => setUserBio(e.target.value)}
              rows={4}
              className="text-base resize-none"
              data-testid="textarea-user-bio"
            />
            <p className="text-sm text-gray-500">
              Condividi informazioni sulla tua salute, stile di vita, obiettivi di prevenzione...
            </p>
          </div>

          <Alert className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <AlertDescription className="ml-2 text-sm text-emerald-800 dark:text-emerald-200">
              <p className="font-semibold mb-1">🔒 Privacy garantita</p>
              <p>Questi dati vengono usati solo per personalizzare i tuoi consigli di prevenzione e non saranno mai condivisi con terze parti.</p>
            </AlertDescription>
          </Alert>
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