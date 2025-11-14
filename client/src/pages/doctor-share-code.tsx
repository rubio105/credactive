import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Share2, QrCode, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { BackButton } from "@/components/BackButton";

export default function DoctorShareCode() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [doctorCode, setDoctorCode] = useState<string>((user as any)?.doctorCode || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
  const inviteLink = doctorCode ? `${baseUrl}/register?referral=${doctorCode}` : '';

  // Sync doctorCode state with user data when it loads
  useEffect(() => {
    if ((user as any)?.doctorCode) {
      setDoctorCode((user as any).doctorCode);
    }
  }, [user]);

  // Generate code ONLY if user is loaded and has no code
  useEffect(() => {
    if (user && !(user as any)?.doctorCode && !doctorCode && !isGenerating) {
      generateCode();
    }
  }, [user, doctorCode, isGenerating]);

  const generateCode = async () => {
    setIsGenerating(true);
    try {
      const response = await apiRequest('/api/doctor/generate-code', 'POST');
      const data = await response.json();
      setDoctorCode(data.code);
      toast({
        title: "Codice generato!",
        description: "Il tuo codice di invito è pronto per essere condiviso",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile generare il codice. Riprova",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiato!",
      description: `${label} copiato negli appunti`,
    });
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Invito a CIRY',
          text: 'Registrati su CIRY usando il mio link di invito:',
          url: inviteLink,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          copyToClipboard(inviteLink, 'Link di invito');
        }
      }
    } else {
      copyToClipboard(inviteLink, 'Link di invito');
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-4 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto space-y-6 pt-20">
          <BackButton className="mb-4" />
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Condividi il tuo codice</h1>
            <p className="text-muted-foreground">
              I tuoi pazienti possono registrarsi automaticamente usando il tuo link di invito
            </p>
          </div>

          <Card className="shadow-lg border-2 border-orange-200">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-6 h-6" />
                Il tuo codice medico
              </CardTitle>
              <CardDescription className="text-white/90">
                Condividi questo codice con i tuoi pazienti
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Doctor Code */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Codice medico
                </label>
                <div className="flex gap-2">
                  <Input
                    value={doctorCode}
                    readOnly
                    className="font-mono text-lg font-bold text-center bg-gray-50"
                    placeholder="Genera il tuo codice"
                    data-testid="input-doctor-code"
                  />
                  <Button
                    onClick={() => copyToClipboard(doctorCode, 'Codice')}
                    disabled={!doctorCode}
                    variant="outline"
                    size="icon"
                    data-testid="button-copy-code"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={generateCode}
                    disabled={isGenerating}
                    variant="outline"
                    size="icon"
                    title="Rigenera codice"
                    data-testid="button-regenerate-code"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Invite Link */}
              {doctorCode && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Link di invito
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={inviteLink}
                      readOnly
                      className="text-sm bg-gray-50"
                      data-testid="input-invite-link"
                    />
                    <Button
                      onClick={() => copyToClipboard(inviteLink, 'Link')}
                      variant="outline"
                      size="icon"
                      data-testid="button-copy-link"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Share Button */}
              {doctorCode && (
                <Button
                  onClick={shareLink}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                  size="lg"
                  data-testid="button-share"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Condividi link
                </Button>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h3 className="font-semibold text-blue-900 mb-2">Come funziona:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Condividi il link di invito con i tuoi pazienti</li>
                  <li>I pazienti compilano il form di registrazione</li>
                  <li>Dopo la verifica email, vengono automaticamente collegati a te</li>
                  <li>Puoi vedere e gestire i tuoi pazienti nella sezione "I miei pazienti"</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
