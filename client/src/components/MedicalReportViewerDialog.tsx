import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Calendar, Activity, TrendingUp, Hospital } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { RadiologicalImageViewer } from "./RadiologicalImageViewer";
import { useToast } from "@/hooks/use-toast";

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

interface MedicalReport {
  id: string;
  title: string;
  reportType: string;
  uploadDate: string;
  ocrConfidence?: number;
  aiSummary?: string;
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
  const { toast } = useToast();

  if (!report) return null;

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/health-score/reports/${report.id}/pdf`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Errore durante il download');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `referto-${report.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download completato",
        description: "Il referto è stato scaricato con successo",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile scaricare il referto",
        variant: "destructive",
      });
    }
  };

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
    return names[type] || "Referto Medico";
  };

  const hasRadiologicalImage = report.radiologicalAnalysis && 
    report.fileType?.startsWith('image/');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" data-testid="medical-report-viewer-dialog">
        <DialogHeader>
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
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              data-testid="dialog-button-download-pdf"
            >
              <Download className="w-4 h-4 mr-2" />
              Scarica PDF
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue={hasRadiologicalImage ? "image" : "summary"} className="mt-4">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: hasRadiologicalImage ? "repeat(3, 1fr)" : "repeat(2, 1fr)" }}>
            {hasRadiologicalImage && (
              <TabsTrigger value="image" data-testid="tab-radiological-image">
                Immagine Radiologica
              </TabsTrigger>
            )}
            <TabsTrigger value="summary" data-testid="tab-summary">
              Riepilogo
            </TabsTrigger>
            <TabsTrigger value="values" data-testid="tab-values">
              Valori Medici
            </TabsTrigger>
          </TabsList>

          {/* Radiological Image Tab */}
          {hasRadiologicalImage && report.radiologicalAnalysis && (
            <TabsContent value="image" className="mt-4" data-testid="content-radiological-image">
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

          {/* Summary Tab */}
          <TabsContent value="summary" className="mt-4" data-testid="content-summary">
            {report.aiSummary ? (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Riepilogo AI
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  {report.aiSummary}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nessun riepilogo disponibile</p>
              </div>
            )}
          </TabsContent>

          {/* Medical Values Tab */}
          <TabsContent value="values" className="mt-4" data-testid="content-medical-values">
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
                <p>Nessun valore medico disponibile</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
