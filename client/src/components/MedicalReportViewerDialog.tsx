import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Calendar, Activity, TrendingUp, Hospital, CheckCircle, AlertTriangle, AlertCircle, Stethoscope, Shield } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { RadiologicalImageViewer } from "./RadiologicalImageViewer";
import { useAuth } from "@/hooks/useAuth";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-7xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0" data-testid="medical-report-viewer-dialog">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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

        <Tabs defaultValue={hasRadiologicalImage ? "image" : "riepilogo"} className="flex-1 flex flex-col overflow-hidden px-6">
          <TabsList className="grid w-full my-4" style={{ gridTemplateColumns: hasRadiologicalImage ? "repeat(5, 1fr)" : "repeat(4, 1fr)" }}>
            {hasRadiologicalImage && (
              <TabsTrigger value="image" data-testid="tab-radiological-image">
                Immagine Radiologica
              </TabsTrigger>
            )}
            <TabsTrigger value="riepilogo" data-testid="tab-summary">
              Riepilogo
            </TabsTrigger>
            <TabsTrigger value="panoramica" data-testid="tab-overview">
              Panoramica
            </TabsTrigger>
            <TabsTrigger value="prevenzione" data-testid="tab-prevention">
              Prevenzione
            </TabsTrigger>
            <TabsTrigger value="valori" data-testid="tab-values">
              Valori Clinici
            </TabsTrigger>
          </TabsList>

          {/* Radiological Image Tab */}
          {hasRadiologicalImage && report.radiologicalAnalysis && (
            <TabsContent value="image" className="flex-1 overflow-y-auto pb-6" data-testid="content-radiological-image">
              <div className="space-y-4">
                <RadiologicalImageViewer
                  reportId={report.id}
                  findings={report.radiologicalAnalysis.findings}
                  imageType={report.radiologicalAnalysis.imageType}
                  bodyPart={report.radiologicalAnalysis.bodyPart}
                />
                
                {/* Overall Assessment */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Valutazione Complessiva
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    {report.radiologicalAnalysis.overallAssessment}
                  </p>
                  {report.radiologicalAnalysis.recommendations && report.radiologicalAnalysis.recommendations.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                        Raccomandazioni:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {report.radiologicalAnalysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-blue-800 dark:text-blue-200">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Confidenza AI: {report.radiologicalAnalysis.confidence}%
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Riepilogo Tab */}
          <TabsContent value="riepilogo" className="flex-1 overflow-y-auto pb-6" data-testid="content-summary">
            {(report.aiAnalysis?.patientSummary || report.aiAnalysis?.doctorSummary || report.aiSummary) ? (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  {isDoctor ? <Stethoscope className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  Riepilogo
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed whitespace-pre-wrap">
                  {isDoctor 
                    ? (report.aiAnalysis?.doctorSummary || report.aiSummary)
                    : (report.aiAnalysis?.patientSummary || report.aiSummary)
                  }
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nessun riepilogo disponibile</p>
              </div>
            )}
          </TabsContent>

          {/* Panoramica Tab */}
          <TabsContent value="panoramica" className="flex-1 overflow-y-auto pb-6" data-testid="content-overview">
            {report.aiAnalysis?.diagnosis ? (
              <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Panoramica
                </p>
                <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed whitespace-pre-wrap">
                  {report.aiAnalysis.diagnosis}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nessuna panoramica disponibile</p>
              </div>
            )}
          </TabsContent>

          {/* Prevenzione Tab */}
          <TabsContent value="prevenzione" className="flex-1 overflow-y-auto pb-6" data-testid="content-prevention">
            {report.aiAnalysis?.prevention ? (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Consigli di Prevenzione
                </p>
                <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed whitespace-pre-wrap">
                  {report.aiAnalysis.prevention}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nessun consiglio di prevenzione disponibile</p>
              </div>
            )}
          </TabsContent>

          {/* Valori Medici Tab */}
          <TabsContent value="valori" className="flex-1 overflow-y-auto pb-6" data-testid="content-medical-values">
            {report.medicalValues && report.medicalValues.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.medicalValues.map((value, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      value.isAbnormal 
                        ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' 
                        : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                    }`}
                    data-testid={`dialog-medical-value-${index}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {value.name}
                      </span>
                      <span className={`text-lg font-bold ${
                        value.isAbnormal ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'
                      }`}>
                        {value.value} {value.unit}
                      </span>
                    </div>
                    {value.referenceRange && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Range di riferimento: {value.referenceRange}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nessun valore disponibile</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
