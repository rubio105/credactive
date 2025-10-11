import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Download, TrendingUp, Calendar, Activity } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MedicalTrendChart } from "./MedicalTrendChart";
import { useToast } from "@/hooks/use-toast";

interface MedicalValue {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
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
}

export function MedicalReportCard({ report }: { report: MedicalReport }) {
  const [showTrendDialog, setShowTrendDialog] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const { toast } = useToast();

  // Get trend data when a value is selected
  const { data: trendData } = useQuery({
    queryKey: ['/api/health-score/trends', selectedValue],
    queryFn: async () => {
      if (!selectedValue) return null;
      const response = await fetch(`/api/health-score/trends/${encodeURIComponent(selectedValue)}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch trend data');
      return response.json();
    },
    enabled: !!selectedValue && showTrendDialog,
  });

  const handleViewTrend = (valueName: string) => {
    // Use exact value name without lowercasing to match extractedValues keys
    setSelectedValue(valueName);
    setShowTrendDialog(true);
  };

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

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-blue-500 dark:border-l-blue-400" data-testid={`medical-report-${report.id}`}>
      {/* Prohmed Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-3 flex items-center justify-between">
        <img 
          src="/images/prohmed-logo.jpg" 
          alt="Prohmed" 
          className="h-8 object-contain bg-white rounded px-2"
        />
        <span className="text-white text-sm font-medium">Referto Medico</span>
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-lg">{report.title}</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge className={getReportTypeColor(report.reportType)} data-testid="badge-report-type">
                {getReportTypeName(report.reportType)}
              </Badge>
              {report.ocrConfidence !== undefined && (
                <Badge variant="outline" className="text-xs" data-testid="badge-ocr-confidence">
                  <Activity className="w-3 h-3 mr-1" />
                  Affidabilità {report.ocrConfidence}%
                </Badge>
              )}
              {report.hospitalName && (
                <Badge variant="outline" className="text-xs" data-testid="badge-hospital">
                  {report.hospitalName}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" data-testid="button-download-report">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400" data-testid="report-date">
          <Calendar className="w-4 h-4" />
          <span>
            {format(new Date(report.uploadDate), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
          </span>
        </div>

        {/* AI Summary */}
        {report.aiSummary && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3" data-testid="ai-summary">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Riepilogo AI
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              {report.aiSummary}
            </p>
          </div>
        )}

        {/* Medical Values */}
        {report.medicalValues && report.medicalValues.length > 0 && (
          <div className="space-y-2" data-testid="medical-values-section">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Valori Rilevati:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {report.medicalValues.map((value, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded-lg border ${
                    value.isAbnormal 
                      ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' 
                      : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                  }`}
                  data-testid={`medical-value-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {value.name}
                    </span>
                    <span className={`text-sm font-bold ${
                      value.isAbnormal ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'
                    }`}>
                      {value.value} {value.unit}
                    </span>
                  </div>
                  {value.referenceRange && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Range: {value.referenceRange}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {report.medicalValues && report.medicalValues.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => handleViewTrend(report.medicalValues![0].name)}
              data-testid="button-view-trend"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Vedi Trend
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleDownloadPDF}
            data-testid="button-export-pdf"
          >
            <Download className="w-4 h-4 mr-2" />
            Scarica PDF
          </Button>
        </div>
      </CardContent>

      {/* Trend Dialog */}
      <Dialog open={showTrendDialog} onOpenChange={setShowTrendDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Analisi Trend</DialogTitle>
            <DialogDescription>
              Visualizza l'evoluzione dei valori medici nel tempo
            </DialogDescription>
          </DialogHeader>
          {trendData && trendData.dataPoints && (
            <MedicalTrendChart 
              title={trendData.valueName.charAt(0).toUpperCase() + trendData.valueName.slice(1)}
              unit="" 
              data={trendData.dataPoints.map((d: any) => ({
                date: d.date,
                value: d.value
              }))}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
