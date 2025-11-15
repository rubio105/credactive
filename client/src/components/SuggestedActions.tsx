import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  AlertTriangle,
  MessageSquarePlus,
  Users,
  Activity,
  FileCheck,
  Upload,
  TrendingUp,
  Stethoscope,
  Phone,
  ClipboardList,
} from "lucide-react";

interface SuggestedAction {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive";
  className?: string;
}

interface SuggestedActionsProps {
  isDoctor: boolean;
  hasRecentUploads?: boolean;
  hasActiveAlert?: boolean;
  pendingAlertCount?: number;
  onActionClick: (action: string, params?: any) => void;
}

export function SuggestedActions({
  isDoctor,
  hasRecentUploads = false,
  hasActiveAlert = false,
  pendingAlertCount = 0,
  onActionClick,
}: SuggestedActionsProps) {

  const patientActions: SuggestedAction[] = [];
  const doctorActions: SuggestedAction[] = [];

  if (isDoctor) {
    if (pendingAlertCount > 0) {
      doctorActions.push({
        id: 'review-alerts',
        label: `🚨 Rivedi ${pendingAlertCount} alert ${pendingAlertCount === 1 ? 'urgente' : 'urgenti'}`,
        icon: AlertTriangle,
        onClick: () => onActionClick('review-alerts'),
        variant: 'destructive',
        className: 'bg-red-600 hover:bg-red-700 text-white border-none',
      });
    }

    doctorActions.push(
      {
        id: 'patient-summaries',
        label: '👥 Riepilogo pazienti di oggi',
        icon: Users,
        onClick: () => onActionClick('patient-summaries'),
      },
      {
        id: 'patient-trends',
        label: '📊 Analisi trend pazienti',
        icon: TrendingUp,
        onClick: () => onActionClick('patient-trends'),
      },
      {
        id: 'clinical-note',
        label: '📝 Genera nota clinica',
        icon: FileCheck,
        onClick: () => onActionClick('clinical-note'),
      }
    );
  } else {
    if (hasRecentUploads) {
      patientActions.push({
        id: 'analyze-report',
        label: '📄 Analizza il mio referto',
        icon: FileText,
        onClick: () => onActionClick('analyze-report'),
        className: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-none',
      });
    }

    if (hasActiveAlert) {
      patientActions.push({
        id: 'alert-guidance',
        label: '🚨 Cosa devo fare?',
        icon: AlertTriangle,
        onClick: () => onActionClick('alert-guidance'),
        variant: 'destructive',
        className: 'bg-red-600 hover:bg-red-700 text-white border-none',
      });
    }

    const greetingActions = [
      {
        id: 'book-visit',
        label: '🏥 Prenota una visita',
        icon: Calendar,
        onClick: () => onActionClick('book-visit'),
      },
      {
        id: 'health-status',
        label: '📊 Come sta la mia salute?',
        icon: Activity,
        onClick: () => onActionClick('health-status'),
      },
      {
        id: 'upload-document',
        label: '📤 Carica un documento',
        icon: Upload,
        onClick: () => onActionClick('upload-document'),
      },
      {
        id: 'ask-question',
        label: '💬 Ho una domanda medica',
        icon: MessageSquarePlus,
        onClick: () => onActionClick('ask-question'),
      },
    ];

    if (!hasRecentUploads && !hasActiveAlert) {
      patientActions.push(...greetingActions.slice(0, 4));
    } else {
      patientActions.push(...greetingActions.slice(0, 2));
    }
  }

  const actions = isDoctor ? doctorActions : patientActions;

  if (actions.length === 0) return null;

  return (
    <div className="space-y-3 mb-4" data-testid="suggested-actions-container">
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
        <span className="font-medium">
          {isDoctor ? '🩺 Azioni rapide medico:' : '💡 Suggerimenti:'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              onClick={action.onClick}
              variant={action.variant || "outline"}
              size="sm"
              className={`
                justify-start text-left h-auto py-3 px-4 
                transition-all duration-200 
                hover:shadow-md hover:scale-[1.02]
                ${action.className || 'border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}
              `}
              data-testid={`suggested-action-${action.id}`}
            >
              <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-sm">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

interface DoctorContextActionsProps {
  patientId?: string;
  patientName?: string;
  onActionClick: (action: string, params?: any) => void;
}

export function DoctorContextActions({
  patientId,
  patientName,
  onActionClick,
}: DoctorContextActionsProps) {
  if (!patientId) return null;

  const actions: SuggestedAction[] = [
    {
      id: 'open-patient-record',
      label: '📋 Apri cartella completa',
      icon: ClipboardList,
      onClick: () => onActionClick('open-patient-record', { patientId }),
    },
    {
      id: 'contact-patient',
      label: '📞 Contatta paziente',
      icon: Phone,
      onClick: () => onActionClick('contact-patient', { patientId, patientName }),
    },
    {
      id: 'suggest-intervention',
      label: '💊 Suggerisci intervento',
      icon: Stethoscope,
      onClick: () => onActionClick('suggest-intervention', { patientId }),
    },
    {
      id: 'schedule-followup',
      label: '📅 Pianifica follow-up',
      icon: Calendar,
      onClick: () => onActionClick('schedule-followup', { patientId }),
    },
  ];

  return (
    <div className="space-y-3 mb-4 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg" data-testid="doctor-context-actions">
      <div className="flex items-center gap-2 text-sm font-medium text-orange-900 dark:text-orange-200">
        <AlertTriangle className="w-4 h-4" />
        <span>Alert da {patientName || 'paziente'}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              onClick={action.onClick}
              variant="outline"
              size="sm"
              className="justify-start text-left h-auto py-3 px-4 border-orange-300 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-all duration-200 hover:shadow-md"
              data-testid={`doctor-context-action-${action.id}`}
            >
              <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-sm">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
