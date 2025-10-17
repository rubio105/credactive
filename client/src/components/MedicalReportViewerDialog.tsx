import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Calendar, Activity, TrendingUp, Hospital, CheckCircle, AlertTriangle, AlertCircle, Stethoscope, Shield, Heart, Lightbulb, BarChart3, Pill, Eye, Image as ImageIcon, User, Phone, Mail, Smartphone, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { RadiologicalImageViewer } from "./RadiologicalImageViewer";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MedicalValue {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
}

interface Finding {
  category: 'normal' | 'attention' | 'urgent';
  location?: string;
  description: string;
  severity?: 'low' | 'medium' | 'high';
  confidence: number;
}

interface RadiologicalAnalysis {
  imageType: 'xray' | 'mri' | 'ct' | 'ultrasound' | 'general';
  bodyPart?: string;
  findings: Finding[];
  overallAssessment: string;
  recommendations: string[];
  confidence: number;
}

interface AiAnalysis {
  patientSummary?: string;
  doctorSummary?: string;
  diagnosis?: string;
  prevention?: string;
  severity?: "normal" | "moderate" | "urgent";
}

interface MedicalReport {
  id: string;
  title: string;
  reportType: string;
  uploadDate: string;
  ocrConfidence?: number;
  aiSummary?: string;
  aiAnalysis?: AiAnalysis;
  medicalValues?: MedicalValue[];
  language?: string;
  hospitalName?: string;
  fileType?: string;
  radiologicalAnalysis?: RadiologicalAnalysis;
}

interface MedicalReportViewerDialogProps {
  report: MedicalReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MedicalReportViewerDialog({ 
  report, 
  open, 
  onOpenChange 
}: MedicalReportViewerDialogProps) {
  const { user } = useAuth();
  const isDoctor = user?.isDoctor;
  
  if (!report) return null;

  const getReportTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      esame_sangue: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800",
      radiologia: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800",
      cardiologia: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-800",
      ecografia: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-200 dark:border-green-800",
      risonanza: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-800",
      tac: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-800",
      ecg: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950/40 dark:text-pink-200 dark:border-pink-800",
      esame_urine: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-200 dark:border-yellow-800",
      generale: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/40 dark:text-gray-200 dark:border-gray-800",
      doctor_note: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800",
    };
    return colors[type] || colors.generale;
  };

  const getReportTypeName = (type: string) => {
    const names: Record<string, string> = {
      esame_sangue: "Esame del Sangue",
      radiologia: "Radiologia",
      cardiologia: "Cardiologia",
      ecografia: "Ecografia",
      risonanza: "Risonanza Magnetica",
      tac: "TAC",
      ecg: "Elettrocardiogramma",
      esame_urine: "Esame delle Urine",
      generale: "Referto Generale",
      doctor_note: "Nota Medica",
    };
    return names[type] || "Referto Sanitario";
  };

  const getSeverityBadge = (severity?: "normal" | "moderate" | "urgent") => {
    if (!severity) return null;
    
    const severityConfig = {
      normal: {
        icon: CheckCircle,
        text: "Nella Norma",
        className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-200 dark:border-green-800"
      },
      moderate: {
        icon: AlertTriangle,
        text: "Richiede Attenzione",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-200 dark:border-yellow-800"
      },
      urgent: {
        icon: AlertCircle,
        text: "Urgente",
        className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800"
      }
    };

    const config = severityConfig[severity];
    const Icon = config.icon;

    return (
      <Badge className={config.className} data-testid="dialog-badge-severity">
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const hasRadiologicalImage = report.radiologicalAnalysis && 
    report.fileType?.startsWith('image/');

  // Extract attention points from abnormal values and urgent findings
  const abnormalValues = report.medicalValues?.filter(v => v.isAbnormal) || [];
  const urgentFindings = report.radiologicalAnalysis?.findings.filter(f => f.category === 'urgent') || [];
  const attentionFindings = report.radiologicalAnalysis?.findings.filter(f => f.category === 'attention') || [];

  const hasAttentionPoints = abnormalValues.length > 0 || urgentFindings.length > 0 || attentionFindings.length > 0;

  // Patient-focused tabs
  const renderPatientTabs = () => (
    <>
      <TabsList className="grid w-full my-4" style={{ 
        gridTemplateColumns: `repeat(${
          3 + 
          (hasAttentionPoints ? 1 : 0) + 
          (report.medicalValues && report.medicalValues.length > 0 ? 1 : 0) + 
          (hasRadiologicalImage ? 1 : 0)
        }, 1fr)` 
      }}>
        <TabsTrigger value="overview" data-testid="tab-patient-overview">
          <FileText className="w-4 h-4 mr-2" />
          Cosa Dice
        </TabsTrigger>
        {hasAttentionPoints && (
          <TabsTrigger value="attention" data-testid="tab-patient-attention">
            <Eye className="w-4 h-4 mr-2" />
            Punti di Attenzione
          </TabsTrigger>
        )}
        <TabsTrigger value="prevention" data-testid="tab-patient-prevention">
          <Shield className="w-4 h-4 mr-2" />
          Piano Prevenzione
        </TabsTrigger>
        <TabsTrigger value="contact" data-testid="tab-patient-contact">
          <Phone className="w-4 h-4 mr-2" />
          Contatta Prohmed
        </TabsTrigger>
        {report.medicalValues && report.medicalValues.length > 0 && (
          <TabsTrigger value="values" data-testid="tab-patient-values">
            <BarChart3 className="w-4 h-4 mr-2" />
            I Tuoi Valori
          </TabsTrigger>
        )}
        {hasRadiologicalImage && (
          <TabsTrigger value="image" data-testid="tab-patient-image">
            <ImageIcon className="w-4 h-4 mr-2" />
            Immagine
          </TabsTrigger>
        )}
      </TabsList>

      {/* Patient Overview Tab */}
      <TabsContent value="overview" className="flex-1 overflow-y-auto pb-6 space-y-4" data-testid="content-patient-overview">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <FileText className="w-5 h-5" />
              Spiegazione Semplice del Referto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.aiAnalysis?.patientSummary || report.aiSummary ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {report.aiAnalysis?.patientSummary || report.aiSummary}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Nessuna spiegazione disponibile. Contatta il tuo medico per maggiori informazioni.
              </p>
            )}
          </CardContent>
        </Card>

        {report.aiAnalysis?.severity && (
          <Alert className={
            report.aiAnalysis.severity === 'urgent' ? 'border-red-200 bg-red-50 dark:bg-red-950/20' :
            report.aiAnalysis.severity === 'moderate' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20' :
            'border-green-200 bg-green-50 dark:bg-green-950/20'
          }>
            <AlertDescription className="flex items-start gap-3">
              {report.aiAnalysis.severity === 'urgent' && <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />}
              {report.aiAnalysis.severity === 'moderate' && <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />}
              {report.aiAnalysis.severity === 'normal' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
              <div>
                <p className="font-semibold mb-1">
                  {report.aiAnalysis.severity === 'urgent' && 'Attenzione: Richiesta Valutazione Urgente'}
                  {report.aiAnalysis.severity === 'moderate' && 'Consigliamo di Monitorare'}
                  {report.aiAnalysis.severity === 'normal' && 'Tutto nella Norma'}
                </p>
                <p className="text-sm">
                  {report.aiAnalysis.severity === 'urgent' && 'Ti consigliamo di contattare subito il medico Prohmed per una valutazione professionale.'}
                  {report.aiAnalysis.severity === 'moderate' && 'Alcune cose richiedono attenzione. Controlla i punti di attenzione e parlane con il tuo medico.'}
                  {report.aiAnalysis.severity === 'normal' && 'I risultati sono nella norma. Continua con il piano di prevenzione per mantenerti in salute.'}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>

      {/* Patient Attention Points Tab */}
      {hasAttentionPoints && (
        <TabsContent value="attention" className="flex-1 overflow-y-auto pb-6 space-y-4" data-testid="content-patient-attention">
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <Eye className="w-5 h-5" />
                Cosa Monitorare
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {abnormalValues.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Valori da Tenere d'Occhio
                  </h4>
                  <div className="space-y-2">
                    {abnormalValues.map((value, idx) => (
                      <Alert key={idx} className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                        <AlertDescription>
                          <p className="font-medium text-orange-900 dark:text-orange-100">
                            {value.name}: <span className="text-orange-700 dark:text-orange-300">{value.value} {value.unit}</span>
                          </p>
                          <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                            Questo valore è fuori dal range normale {value.referenceRange && `(${value.referenceRange})`}. 
                            Parlane con il tuo medico per capire cosa significa e cosa fare.
                          </p>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {urgentFindings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Richiede Attenzione Immediata
                  </h4>
                  <div className="space-y-2">
                    {urgentFindings.map((finding, idx) => (
                      <Alert key={idx} className="border-red-200 bg-red-50 dark:bg-red-950/20">
                        <AlertDescription>
                          <p className="font-medium text-red-900 dark:text-red-100">
                            {finding.location && `${finding.location}: `}
                            {finding.description}
                          </p>
                          <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                            Contatta subito il medico Prohmed per una valutazione professionale.
                          </p>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {attentionFindings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-yellow-700 dark:text-yellow-300 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Da Controllare
                  </h4>
                  <div className="space-y-2">
                    {attentionFindings.map((finding, idx) => (
                      <Alert key={idx} className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                        <AlertDescription>
                          <p className="font-medium text-yellow-900 dark:text-yellow-100">
                            {finding.location && `${finding.location}: `}
                            {finding.description}
                          </p>
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                            Monitora questa situazione e parlane con il tuo medico al prossimo consulto.
                          </p>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {/* Patient Prevention Plan Tab */}
      <TabsContent value="prevention" className="flex-1 overflow-y-auto pb-6 space-y-4" data-testid="content-patient-prevention">
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Shield className="w-5 h-5" />
              Il Tuo Piano di Prevenzione
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.aiAnalysis?.prevention ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {report.aiAnalysis.prevention}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-500 dark:text-gray-400 italic">
                  Piano di prevenzione personalizzato non disponibile.
                </p>
                <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                    <p className="font-medium mb-2">Consigli Generali di Prevenzione:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Mantieni uno stile di vita sano con alimentazione equilibrata</li>
                      <li>Fai regolare attività fisica (almeno 30 minuti al giorno)</li>
                      <li>Dormi 7-8 ore per notte</li>
                      <li>Controlla regolarmente i tuoi valori di salute</li>
                      <li>Non fumare e limita l'alcol</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {report.radiologicalAnalysis?.recommendations && report.radiologicalAnalysis.recommendations.length > 0 && (
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Lightbulb className="w-5 h-5" />
                Raccomandazioni dall'Analisi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.radiologicalAnalysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Patient Contact Prohmed Tab */}
      <TabsContent value="contact" className="flex-1 overflow-y-auto pb-6 space-y-4" data-testid="content-patient-contact">
        <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Phone className="w-6 h-6" />
              Team Medico Prohmed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-3">
                Hai bisogno di chiarimenti sul referto?
              </h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                Il team medico Prohmed è a tua disposizione per spiegarti nel dettaglio i risultati e guidarti nel percorso di prevenzione.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => window.open('tel:+393408012929', '_self')}
                  data-testid="button-call-prohmed"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Chiama Ora
                </Button>
                <Button 
                  variant="outline" 
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => window.open('mailto:info@prohmed.it', '_self')}
                  data-testid="button-email-prohmed"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Invia Email
                </Button>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Consulenza Medica Personalizzata
                </p>
                <p className="text-sm">
                  Il nostro team di medici specializzati in prevenzione ti aiuta a capire i tuoi referti e a creare un piano di salute su misura per te.
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Smartphone className="w-5 h-5" />
              App Prohmed - Porta la Salute con Te
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Scarica l'app Prohmed per avere accesso immediato a:
            </p>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100 text-sm">Referti Sempre Disponibili</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    Tutti i tuoi esami medici organizzati e accessibili ovunque
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100 text-sm">Chat Diretta con i Medici</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    Risposte rapide e consigli professionali quando ne hai bisogno
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100 text-sm">Promemoria Esami</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    Non dimenticare mai gli screening periodici importanti
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100 text-sm">Prenotazioni Online</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    Prenota visite e consulenze in pochi tap
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Scarica Gratis da:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  className="border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                  onClick={() => window.open('https://apps.apple.com/app/prohmed', '_blank')}
                  data-testid="button-download-ios"
                >
                  <Download className="w-4 h-4 mr-2" />
                  App Store (iOS)
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
                <Button 
                  variant="outline"
                  className="border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                  onClick={() => window.open('https://play.google.com/store/apps/details?id=com.prohmed', '_blank')}
                  data-testid="button-download-android"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Google Play
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
          <Heart className="w-4 h-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-200">
            <p className="font-medium mb-1">La Tua Salute, la Nostra Priorità</p>
            <p className="text-sm">
              Prohmed è il tuo partner nella prevenzione. Siamo qui per supportarti in ogni momento del tuo percorso verso una vita più sana.
            </p>
          </AlertDescription>
        </Alert>
      </TabsContent>

      {/* Patient Values Tab */}
      {report.medicalValues && report.medicalValues.length > 0 && (
        <TabsContent value="values" className="flex-1 overflow-y-auto pb-6" data-testid="content-patient-values">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.medicalValues.map((value, index) => (
              <Card 
                key={index}
                className={`${
                  value.isAbnormal 
                    ? 'border-red-200 dark:border-red-800' 
                    : 'border-green-200 dark:border-green-800'
                }`}
                data-testid={`dialog-medical-value-${index}`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {value.isAbnormal ? (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {value.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${
                      value.isAbnormal ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'
                    }`}>
                      {value.value}
                    </span>
                    {value.unit && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">{value.unit}</span>
                    )}
                  </div>
                  {value.referenceRange && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Valori normali: {value.referenceRange}
                    </p>
                  )}
                  {value.isAbnormal && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                      Fuori dal range normale - Parlane con il medico
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      )}

      {/* Patient Radiological Image Tab */}
      {hasRadiologicalImage && report.radiologicalAnalysis && (
        <TabsContent value="image" className="flex-1 overflow-y-auto pb-6" data-testid="content-patient-image">
          <RadiologicalImageViewer
            reportId={report.id}
            findings={report.radiologicalAnalysis.findings}
            imageType={report.radiologicalAnalysis.imageType}
            bodyPart={report.radiologicalAnalysis.bodyPart}
          />
        </TabsContent>
      )}
    </>
  );

  // Doctor-focused tabs
  const renderDoctorTabs = () => (
    <>
      <TabsList className="grid w-full my-4" style={{ gridTemplateColumns: hasRadiologicalImage ? "repeat(4, 1fr)" : "repeat(3, 1fr)" }}>
        <TabsTrigger value="clinical" data-testid="tab-doctor-clinical">
          <Stethoscope className="w-4 h-4 mr-2" />
          Analisi Clinica
        </TabsTrigger>
        <TabsTrigger value="data" data-testid="tab-doctor-data">
          <BarChart3 className="w-4 h-4 mr-2" />
          Dati Obiettivi
        </TabsTrigger>
        <TabsTrigger value="therapeutic" data-testid="tab-doctor-therapeutic">
          <Pill className="w-4 h-4 mr-2" />
          Supporto Terapeutico
        </TabsTrigger>
        {hasRadiologicalImage && (
          <TabsTrigger value="imaging" data-testid="tab-doctor-imaging">
            <ImageIcon className="w-4 h-4 mr-2" />
            Imaging
          </TabsTrigger>
        )}
      </TabsList>

      {/* Doctor Clinical Analysis Tab */}
      <TabsContent value="clinical" className="flex-1 overflow-y-auto pb-6 space-y-4" data-testid="content-doctor-clinical">
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Stethoscope className="w-5 h-5" />
              Sintesi Clinica
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.aiAnalysis?.doctorSummary || report.aiSummary ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                  {report.aiAnalysis?.doctorSummary || report.aiSummary}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Nessuna sintesi clinica disponibile
              </p>
            )}
          </CardContent>
        </Card>

        {report.aiAnalysis?.diagnosis && (
          <Card className="border-indigo-200 dark:border-indigo-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <Activity className="w-5 h-5" />
                Diagnosi/Valutazione
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                {report.aiAnalysis.diagnosis}
              </p>
            </CardContent>
          </Card>
        )}

        {report.aiAnalysis?.severity && (
          <Alert className={
            report.aiAnalysis.severity === 'urgent' ? 'border-red-200 bg-red-50 dark:bg-red-950/20' :
            report.aiAnalysis.severity === 'moderate' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20' :
            'border-green-200 bg-green-50 dark:bg-green-950/20'
          }>
            <AlertDescription>
              <p className="font-semibold text-sm">
                Livello di Urgenza: {getSeverityBadge(report.aiAnalysis.severity)}
              </p>
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>

      {/* Doctor Objective Data Tab */}
      <TabsContent value="data" className="flex-1 overflow-y-auto pb-6 space-y-4" data-testid="content-doctor-data">
        {report.medicalValues && report.medicalValues.length > 0 && (
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <BarChart3 className="w-5 h-5" />
                Valori di Laboratorio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.medicalValues.map((value, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      value.isAbnormal 
                        ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' 
                        : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800'
                    }`}
                    data-testid={`dialog-doctor-value-${index}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        {value.name}
                      </span>
                      {value.isAbnormal && (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className={`text-xl font-bold font-mono ${
                        value.isAbnormal ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {value.value}
                      </span>
                      {value.unit && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">{value.unit}</span>
                      )}
                    </div>
                    {value.referenceRange && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Ref: {value.referenceRange}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {report.radiologicalAnalysis && (
          <Card className="border-indigo-200 dark:border-indigo-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <Activity className="w-5 h-5" />
                Reperti Radiologici
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Badge variant="outline">
                  {report.radiologicalAnalysis.imageType.toUpperCase()}
                </Badge>
                {report.radiologicalAnalysis.bodyPart && (
                  <span>{report.radiologicalAnalysis.bodyPart}</span>
                )}
                <span className="ml-auto">Confidenza: {report.radiologicalAnalysis.confidence}%</span>
              </div>

              <div className="space-y-2">
                {report.radiologicalAnalysis.findings.map((finding, idx) => (
                  <Alert 
                    key={idx}
                    className={
                      finding.category === 'urgent' ? 'border-red-200 bg-red-50 dark:bg-red-950/20' :
                      finding.category === 'attention' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20' :
                      'border-green-200 bg-green-50 dark:bg-green-950/20'
                    }
                  >
                    <AlertDescription>
                      <div className="flex items-start justify-between">
                        <div>
                          {finding.location && (
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                              {finding.location}
                            </p>
                          )}
                          <p className="text-sm font-mono">{finding.description}</p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {finding.category === 'urgent' ? 'Urgente' : finding.category === 'attention' ? 'Attenzione' : 'Normale'}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
                  Valutazione Complessiva
                </p>
                <p className="text-sm text-indigo-800 dark:text-indigo-200 font-mono">
                  {report.radiologicalAnalysis.overallAssessment}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Doctor Therapeutic Support Tab */}
      <TabsContent value="therapeutic" className="flex-1 overflow-y-auto pb-6 space-y-4" data-testid="content-doctor-therapeutic">
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Shield className="w-5 h-5" />
              Indicazioni Preventive
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.aiAnalysis?.prevention ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                  {report.aiAnalysis.prevention}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Nessuna indicazione preventiva specifica disponibile
              </p>
            )}
          </CardContent>
        </Card>

        {report.radiologicalAnalysis?.recommendations && report.radiologicalAnalysis.recommendations.length > 0 && (
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Lightbulb className="w-5 h-5" />
                Raccomandazioni Diagnostiche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.radiologicalAnalysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-mono">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {(abnormalValues.length > 0 || urgentFindings.length > 0) && (
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="w-5 h-5" />
                Punti Critici da Monitorare
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {abnormalValues.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                    Valori Anomali
                  </p>
                  {abnormalValues.map((value, idx) => (
                    <p key={idx} className="text-sm font-mono text-red-700 dark:text-red-300">
                      • {value.name}: {value.value} {value.unit} {value.referenceRange && `(Ref: ${value.referenceRange})`}
                    </p>
                  ))}
                </div>
              )}
              {urgentFindings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2 mt-3">
                    Reperti Urgenti
                  </p>
                  {urgentFindings.map((finding, idx) => (
                    <p key={idx} className="text-sm font-mono text-red-700 dark:text-red-300">
                      • {finding.location && `${finding.location}: `}{finding.description}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Doctor Imaging Tab */}
      {hasRadiologicalImage && report.radiologicalAnalysis && (
        <TabsContent value="imaging" className="flex-1 overflow-y-auto pb-6" data-testid="content-doctor-imaging">
          <RadiologicalImageViewer
            reportId={report.id}
            findings={report.radiologicalAnalysis.findings}
            imageType={report.radiologicalAnalysis.imageType}
            bodyPart={report.radiologicalAnalysis.bodyPart}
          />
        </TabsContent>
      )}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-7xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0" data-testid="medical-report-viewer-dialog">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl flex items-center gap-3">
                {isDoctor ? (
                  <Stethoscope className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Heart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                )}
                {report.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge className={getReportTypeColor(report.reportType)} data-testid="dialog-badge-report-type">
                  {getReportTypeName(report.reportType)}
                </Badge>
                {getSeverityBadge(report.aiAnalysis?.severity)}
                {report.ocrConfidence !== undefined && (
                  <Badge variant="outline" className="text-xs" data-testid="dialog-badge-ocr-confidence">
                    <Activity className="w-3 h-3 mr-1" />
                    Affidabilità {report.ocrConfidence}%
                  </Badge>
                )}
                {report.hospitalName && (
                  <Badge variant="outline" className="text-xs" data-testid="dialog-badge-hospital">
                    <Hospital className="w-3 h-3 mr-1" />
                    {report.hospitalName}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs" data-testid="dialog-badge-date">
                  <Calendar className="w-3 h-3 mr-1" />
                  {format(new Date(report.uploadDate), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue={isDoctor ? "clinical" : "overview"} className="flex-1 flex flex-col overflow-hidden px-6">
          {isDoctor ? renderDoctorTabs() : renderPatientTabs()}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
