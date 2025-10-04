import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LanguageSelectorProps {
  open: boolean;
  onLanguageSelected: (language: string) => void;
}

const languages = [
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

export default function LanguageSelector({ open, onLanguageSelected }: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedLanguage) {
      toast({
        title: "Seleziona una lingua",
        description: "Per favore seleziona la tua lingua preferita",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/user/language", { language: selectedLanguage });

      // Invalidate user query to refetch with new language
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Lingua salvata",
        description: "La tua lingua è stata impostata con successo",
      });

      onLanguageSelected(selectedLanguage);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare la lingua. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Allow closing dialog and use default language if user closes without selecting
  const handleClose = () => {
    // Use Italian as default if user doesn't select anything
    onLanguageSelected("it");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Seleziona la tua lingua
          </DialogTitle>
          <DialogDescription className="text-center">
            Scegli la lingua in cui preferisci utilizzare la piattaforma
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          {languages.map((lang) => (
            <Card
              key={lang.code}
              className={`p-4 cursor-pointer transition-all hover:scale-105 ${
                selectedLanguage === lang.code
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-accent"
              }`}
              onClick={() => setSelectedLanguage(lang.code)}
              data-testid={`language-option-${lang.code}`}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <span className="text-3xl">{lang.flag}</span>
                <span className="font-medium text-sm">{lang.name}</span>
                {selectedLanguage === lang.code && (
                  <Check className="w-5 h-5 text-primary" data-testid={`selected-${lang.code}`} />
                )}
              </div>
            </Card>
          ))}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!selectedLanguage || isSubmitting}
          className="w-full"
          data-testid="button-confirm-language"
        >
          {isSubmitting ? "Salvataggio..." : "Conferma"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
