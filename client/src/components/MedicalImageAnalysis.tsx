import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileImage, AlertTriangle, CheckCircle, Info, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadiologicalImageViewer } from "./RadiologicalImageViewer";
import { useState } from "react";

interface Finding {
  category: 'normal' | 'attention' | 'urgent';
  description: string; // Legacy field
  technicalDescription?: string; // For medical professionals
  patientDescription?: string; // For patients
  location?: string;
}

interface ImageAnalysisResult {
  id: string;
  imageType: 'xray' | 'mri' | 'ct' | 'ultrasound' | 'general';
  bodyPart?: string;
  findings: Finding[];
  overallAssessment: string; // Legacy field
  technicalAssessment?: string; // For medical professionals
  patientAssessment?: string; // For patients
  confidence: number;
  recommendations?: string[];
  uploadDate: string;
}

export function MedicalImageAnalysis({ analysis }: { analysis: ImageAnalysisResult }) {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewMode, setViewMode] = useState<'patient' | 'technical'>('patient');

  const getImageTypeName = (type: string) => {
    const names: Record<string, string> = {
      xray: "Radiografia",
      mri: "Risonanza Magnetica",
      ct: "TAC",
      ultrasound: "Ecografia",
      general: "Immagine Medica"
    };
    return names[type] || "Immagine Medica";
  };

  const getFindingIcon = (category: string) => {
    switch (category) {
      case 'normal':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'attention':
        return <Info className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'urgent':
        return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getFindingColor = (category: string) => {
    switch (category) {
      case 'normal':
        return "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800";
      case 'attention':
        return "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800";
      case 'urgent':
        return "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800";
      default:
        return "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800";
    }
  };

  const urgentFindings = analysis.findings.filter(f => f.category === 'urgent');
  const attentionFindings = analysis.findings.filter(f => f.category === 'attention');
  const normalFindings = analysis.findings.filter(f => f.category === 'normal');

  return (
    <>
      {/* Image Viewer (if requested) */}
      {showImageViewer && (
        <div className="mb-6">
          <RadiologicalImageViewer 
            reportId={analysis.id}
            findings={analysis.findings}
            imageType={analysis.imageType}
            bodyPart={analysis.bodyPart}
          />
        </div>
      )}

      {/* Findings Report */}
      <Card className="shadow-lg border-l-4 border-l-indigo-500 dark:border-l-indigo-400" data-testid={`image-analysis-${analysis.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileImage className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <CardTitle className="text-xl">Refertazione Radiologica</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3 mb-2">
                <Button
                  variant={viewMode === 'patient' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('patient')}
                  data-testid="button-patient-view"
                >
                  Versione Paziente
                </Button>
                <Button
                  variant={viewMode === 'technical' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('technical')}
                  data-testid="button-technical-view"
                >
                  Versione Medica
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-700" data-testid="badge-image-type">
                  {getImageTypeName(analysis.imageType)}
                </Badge>
              {analysis.bodyPart && (
                <Badge variant="outline" data-testid="badge-body-part">
                  {analysis.bodyPart}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs" data-testid="badge-confidence">
                <Eye className="w-3 h-3 mr-1" />
                Affidabilità {analysis.confidence}%
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Assessment */}
        <Alert className="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800">
          <Info className="w-5 h-5 text-indigo-600" />
          <AlertDescription className="ml-2">
            <p className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
              Valutazione Complessiva
            </p>
            <p className="text-sm text-indigo-800 dark:text-indigo-200">
              {viewMode === 'technical' 
                ? (analysis.technicalAssessment || analysis.overallAssessment)
                : (analysis.patientAssessment || analysis.overallAssessment)}
            </p>
          </AlertDescription>
        </Alert>

        {/* Urgent Findings */}
        {urgentFindings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Reperti Urgenti
            </h4>
            {urgentFindings.map((finding, index) => (
              <Alert key={index} className={getFindingColor(finding.category)}>
                <div className="flex gap-2">
                  {getFindingIcon(finding.category)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      {viewMode === 'technical'
                        ? (finding.technicalDescription || finding.description)
                        : (finding.patientDescription || finding.description)}
                    </p>
                    {finding.location && (
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Localizzazione: {finding.location}
                      </p>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Attention Findings */}
        {attentionFindings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Punti di Attenzione
            </h4>
            {attentionFindings.map((finding, index) => (
              <Alert key={index} className={getFindingColor(finding.category)}>
                <div className="flex gap-2">
                  {getFindingIcon(finding.category)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                      {viewMode === 'technical'
                        ? (finding.technicalDescription || finding.description)
                        : (finding.patientDescription || finding.description)}
                    </p>
                    {finding.location && (
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                        Localizzazione: {finding.location}
                      </p>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Normal Findings */}
        {normalFindings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Reperti Normali
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {normalFindings.map((finding, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getFindingColor(finding.category)}`}>
                  <div className="flex items-start gap-2">
                    {getFindingIcon(finding.category)}
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {viewMode === 'technical'
                        ? (finding.technicalDescription || finding.description)
                        : (finding.patientDescription || finding.description)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Raccomandazioni
            </p>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <Alert className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <AlertDescription className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Nota importante:</strong> Questa analisi è fornita a scopo informativo e di supporto. 
            Consultare sempre un medico specialista per una valutazione clinica completa e definitiva.
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant={showImageViewer ? "default" : "outline"} 
            size="sm" 
            className="flex-1" 
            onClick={() => setShowImageViewer(!showImageViewer)}
            data-testid="button-view-image"
          >
            <FileImage className="w-4 h-4 mr-2" />
            {showImageViewer ? 'Nascondi' : 'Vedi'} Immagine con Marcatori
          </Button>
          <Button variant="outline" size="sm" className="flex-1" data-testid="button-export-refertazione">
            Esporta Analisi PDF
          </Button>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
