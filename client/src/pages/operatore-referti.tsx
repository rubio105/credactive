import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, FileText, CheckCircle, Clock, LogOut, Loader2 } from "lucide-react";
import prohmedLogo from "@assets/image_1768563399301.png";

export default function OperatoreReferti() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientFiscalCode, setPatientFiscalCode] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  const { data: myReports, isLoading: reportsLoading } = useQuery<any[]>({
    queryKey: ["/api/report-documents/operator/my-uploads"],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
        toast({
          title: "Formato non supportato",
          description: "Carica solo file PDF o immagini",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File troppo grande",
          description: "Il file non può superare 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !patientName.trim()) {
      toast({
        title: "Dati mancanti",
        description: "Inserisci il nome del paziente e seleziona un file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("patientName", patientName.trim());
      if (patientFiscalCode.trim()) {
        formData.append("patientFiscalCode", patientFiscalCode.trim().toUpperCase());
      }

      const response = await fetch("/api/report-documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Errore durante il caricamento");
      }

      toast({
        title: "Documento caricato",
        description: "Il documento è stato inviato per l'analisi AI",
      });

      setSelectedFile(null);
      setPatientName("");
      setPatientFiscalCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/report-documents/operator/my-uploads"] });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il caricamento",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_upload":
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            In elaborazione
          </span>
        );
      case "pending_review":
      case "in_review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            <FileText className="h-3 w-3" />
            In revisione
          </span>
        );
      case "signed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Firmato
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (!user?.isReportOperator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">Accesso non autorizzato</p>
            <Button onClick={() => setLocation("/login")} className="mt-4">
              Torna al login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={prohmedLogo} alt="Prohmed" className="h-10" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Portale Operatore</h1>
              <p className="text-sm text-gray-500">Caricamento Documenti</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Esci
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-8" data-testid="card-upload">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Carica Nuovo Documento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="patientName">Nome Paziente *</Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Mario Rossi"
                  data-testid="input-patient-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientFiscalCode">Codice Fiscale</Label>
                <Input
                  id="patientFiscalCode"
                  value={patientFiscalCode}
                  onChange={(e) => setPatientFiscalCode(e.target.value.toUpperCase())}
                  placeholder="RSSMRA80A01H501U"
                  maxLength={16}
                  data-testid="input-fiscal-code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Documento (PDF o Immagine) *</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-file"
                />
                <label htmlFor="file" className="cursor-pointer">
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-blue-600">
                      <FileText className="h-6 w-6" />
                      <span className="font-medium">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <p>Clicca per selezionare un file</p>
                      <p className="text-xs mt-1">PDF o immagine, max 10MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || !patientName.trim()}
              className="w-full"
              data-testid="button-upload"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Caricamento in corso...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Carica Documento
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="card-history">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Documenti Caricati
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : !myReports?.length ? (
              <p className="text-gray-500 text-center py-8">Nessun documento caricato</p>
            ) : (
              <div className="space-y-3">
                {myReports.map((report: any) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    data-testid={`report-item-${report.id}`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{report.patientName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}