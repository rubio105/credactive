/**
 * Health Report Types - Shared across the application
 * 
 * These types define the structure of AI-analyzed health reports
 * uploaded by users and processed by the AI system.
 * 
 * IMPORTANT: This interface must match the exact shape returned by
 * the backend API endpoint /api/health-score/reports/my
 */

export interface HealthReport {
  id: string;
  reportType: string;
  fileName: string;
  fileType: string;
  reportDate: string | null;
  issuer: string | null;
  aiSummary: string;
  extractedValues: Record<string, any>;
  radiologicalAnalysis: {
    imageType: string;
    bodyPart: string;
    findings: Array<{
      category: 'normal' | 'attention' | 'urgent';
      description: string;
      location?: string;
      confidence?: number;
    }>;
    overallAssessment: string;
    recommendations: string[];
    confidence: number;
  } | null;
  createdAt: string;
}

/**
 * Helper function to format report date
 */
export function formatReportDate(date: string | null): string {
  if (!date) return 'Data non disponibile';
  return new Date(date).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Helper function to get urgency level from health report
 * Based on radiological findings only (since that's what the API provides)
 * 
 * IMPORTANT: Handles both legacy (findings as string[]) and canonical 
 * (findings as object[]) formats for backward compatibility
 */
export function getReportUrgencyLevel(report: HealthReport): 'none' | 'attention' | 'urgent' {
  // Check radiological findings
  if (report.radiologicalAnalysis?.findings) {
    const findings = report.radiologicalAnalysis.findings;
    
    // Defensive check: only process if findings is an array of objects (not strings)
    if (Array.isArray(findings) && findings.length > 0 && typeof findings[0] === 'object') {
      const hasUrgent = findings.some(f => f.category === 'urgent');
      if (hasUrgent) return 'urgent';
      
      const hasAttention = findings.some(f => f.category === 'attention');
      if (hasAttention) return 'attention';
    }
  }
  
  return 'none';
}
