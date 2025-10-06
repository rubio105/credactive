import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/navigation";
import { Award, Download, Share2, CheckCircle, Lock, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Certificate {
  id: string;
  quizTitle: string;
  score: number;
  verificationCode: string;
  isPublic: boolean;
  issuedAt: string;
}

export default function Certificates() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/user/certificates"],
    enabled: isAuthenticated,
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ certificateId, isPublic }: { certificateId: string; isPublic: boolean }) => {
      const response = await apiRequest(`/api/user/certificates/${certificateId}/visibility`, 'PATCH', { isPublic });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/certificates"] });
      toast({
        title: "Visibilità aggiornata",
        description: "Le impostazioni di visibilità del certificato sono state aggiornate.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la visibilità del certificato.",
        variant: "destructive",
      });
    },
  });

  const handleDownload = (certificateId: string, quizTitle: string) => {
    window.open(`/api/certificates/download/${certificateId}`, '_blank');
    toast({
      title: "Download avviato",
      description: `Scaricamento del certificato per "${quizTitle}"`,
    });
  };

  const handleShare = (verificationCode: string) => {
    const shareUrl = `${window.location.origin}/verify/${verificationCode}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copiato!",
      description: "Il link di verifica è stato copiato negli appunti.",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 80) return "text-primary";
    if (score >= 70) return "text-warning";
    return "text-muted-foreground";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "Eccellente";
    if (score >= 80) return "Ottimo";
    if (score >= 70) return "Buono";
    return "Sufficiente";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <CardContent>
              <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Accesso Richiesto</h2>
              <p className="text-muted-foreground mb-4">
                Devi effettuare il login per visualizzare i tuoi certificati.
              </p>
              <Button onClick={() => window.location.href = "/login"}>
                Vai al Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="certificates-title">
            <Award className="inline-block mr-3 text-warning" />
            I Miei Certificati
          </h1>
          <p className="text-muted-foreground">
            Visualizza, scarica e condividi i tuoi certificati di completamento
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Caricamento certificati...</p>
          </div>
        ) : certificates && certificates.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {certificates.map((cert, index) => (
              <Card 
                key={cert.id} 
                className="border-2 hover:border-primary/50 transition-all"
                data-testid={`certificate-${index}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2" data-testid={`cert-title-${index}`}>
                        {cert.quizTitle}
                      </CardTitle>
                      <Badge variant="secondary" className="mb-2">
                        {getScoreBadge(cert.score)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-warning/10">
                      <Award className="w-8 h-8 text-warning" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Score */}
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">Punteggio</span>
                      <span className={`text-2xl font-bold ${getScoreColor(cert.score)}`} data-testid={`cert-score-${index}`}>
                        {cert.score}%
                      </span>
                    </div>

                    {/* Issue Date */}
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">Data rilascio</span>
                      <span className="font-medium">
                        {new Date(cert.issuedAt).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Verification Code */}
                    <div className="py-2">
                      <span className="text-sm text-muted-foreground block mb-1">Codice verifica</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded" data-testid={`cert-code-${index}`}>
                        {cert.verificationCode}
                      </code>
                    </div>

                    {/* Public Toggle */}
                    <div className="flex items-center justify-between py-2">
                      <Label htmlFor={`public-${cert.id}`} className="text-sm cursor-pointer">
                        Certificato pubblico
                      </Label>
                      <Switch
                        id={`public-${cert.id}`}
                        checked={cert.isPublic}
                        onCheckedChange={(checked) =>
                          toggleVisibilityMutation.mutate({ certificateId: cert.id, isPublic: checked })
                        }
                        data-testid={`cert-toggle-${index}`}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleDownload(cert.id, cert.quizTitle)}
                        className="flex-1"
                        data-testid={`button-download-${index}`}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Scarica PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleShare(cert.verificationCode)}
                        data-testid={`button-share-${index}`}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <CardContent className="text-center">
              <Award className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-3">Nessun Certificato</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Completa i quiz con un punteggio del 70% o superiore per ottenere i certificati digitali.
              </p>
              <Button onClick={() => window.location.href = "/"}>
                Inizia un Quiz
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mt-8 bg-muted/30">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Come funzionano i certificati
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Ottieni un certificato per ogni quiz completato con almeno il 70%</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Scarica i certificati in formato PDF professionale</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Condividi i certificati pubblici tramite link di verifica</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Ogni certificato ha un codice univoco di verifica</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
