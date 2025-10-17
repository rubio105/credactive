import { storage } from './storage';
import { extractTextFromMedicalReport } from './gemini';
import { anonymizeMedicalText } from './gemini';
import { analyzeRadiologicalImage } from './gemini';
import path from 'path';
import fs from 'fs';

export class JobWorker {
  private isRunning = false;
  private pollInterval = 3000; // Poll every 3 seconds

  async start() {
    if (this.isRunning) {
      console.log('[JobWorker] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[JobWorker] Started - polling for pending jobs every 3s');
    
    this.poll();
  }

  async stop() {
    this.isRunning = false;
    console.log('[JobWorker] Stopped');
  }

  private async poll() {
    while (this.isRunning) {
      try {
        await this.processNextJob();
      } catch (error) {
        console.error('[JobWorker] Poll error:', error);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
    }
  }

  private async processNextJob() {
    const pendingJobs = await storage.getPendingJobs(1);

    if (pendingJobs.length === 0) {
      return; // No jobs to process
    }

    const job = pendingJobs[0];
    console.log('[JobWorker] Processing job:', job.id, job.jobType);

    try {
      // Update job status to processing
      await storage.updateJob(job.id, {
        status: 'processing',
        startedAt: new Date(),
      });

      if (job.jobType === 'medical_report_analysis') {
        await this.processMedicalReportAnalysis(job.id, job.inputData, job.userId);
      } else {
        throw new Error(`Unknown job type: ${job.jobType}`);
      }
    } catch (error: any) {
      console.error('[JobWorker] Job failed:', job.id, error);
      await storage.failJob(job.id, error.message || 'Unknown error');
    }
  }

  private async processMedicalReportAnalysis(jobId: string, inputData: any, userId: string) {
    const { filePath, fileType, fileName, fileSize, triageSessionId } = inputData;

    // Step 1: OCR extraction
    await storage.updateJobProgress(jobId, 20, 'Extracting text from document...');
    const ocrResult = await extractTextFromMedicalReport(filePath, fileType);

    // Step 1.5: Rename file with category + date
    let renamedFileName = fileName;
    let renamedFilePath = filePath;
    
    if (ocrResult.reportType) {
      try {
        // Sanitize report type to prevent path traversal attacks
        const sanitizedReportType = ocrResult.reportType
          .replace(/[^a-zA-Z0-9\s\-_àèéìòùÀÈÉÌÒÙ]/g, '') // Remove special chars except spaces, hyphens, underscores, Italian accents
          .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
          .trim()
          .slice(0, 100); // Limit length to 100 chars
        
        if (!sanitizedReportType) {
          throw new Error('Report type is empty after sanitization');
        }
        
        const reportDate = ocrResult.reportDate ? new Date(ocrResult.reportDate) : new Date();
        const day = reportDate.getDate().toString().padStart(2, '0');
        const month = (reportDate.getMonth() + 1).toString().padStart(2, '0');
        const year = reportDate.getFullYear();
        const formattedDate = `${day}-${month}-${year}`; // DD-MM-YYYY (formato italiano)
        const ext = path.extname(fileName);
        const newFileName = `${sanitizedReportType} ${formattedDate}${ext}`;
        const newFilePath = path.join(path.dirname(filePath), newFileName);
        
        fs.renameSync(filePath, newFilePath);
        renamedFileName = newFileName;
        renamedFilePath = newFilePath;
        console.log('[JobWorker] Renamed file:', fileName, '→', newFileName);
      } catch (renameError) {
        console.error('[JobWorker] Failed to rename file:', renameError);
        // Continue with original name if rename fails
      }
    }

    // Step 2: PII anonymization
    await storage.updateJobProgress(jobId, 40, 'Anonymizing personal information...');
    const anonymizationResult = await anonymizeMedicalText(ocrResult.extractedText);

    // Step 3: Radiological analysis (if applicable)
    let radiologicalAnalysis = null;
    const reportTypeLower = (ocrResult.reportType || '').toLowerCase();
    const isRadiologicalImage = fileType.startsWith('image/') && 
      (reportTypeLower.includes('radiol') || 
       reportTypeLower.includes('imaging') ||
       reportTypeLower.includes('xray') ||
       reportTypeLower.includes('mri') ||
       reportTypeLower.includes('ct') ||
       reportTypeLower.includes('tac') ||
       reportTypeLower.includes('ecografia') ||
       reportTypeLower.includes('ultrasound'));

    if (isRadiologicalImage) {
      try {
        await storage.updateJobProgress(jobId, 60, 'Analyzing radiological image...');
        radiologicalAnalysis = await analyzeRadiologicalImage(renamedFilePath, fileType);
      } catch (radiologyError) {
        console.error('[JobWorker] Radiological analysis failed:', radiologyError);
      }
    }

    // Step 4: Create health report
    await storage.updateJobProgress(jobId, 80, 'Creating health report...');
    const healthReport = await storage.createHealthReport({
      userId,
      triageSessionId: triageSessionId || null,
      reportType: ocrResult.reportType,
      fileName: renamedFileName,
      fileType,
      fileSize,
      filePath: `medical-reports/${path.basename(renamedFilePath)}`,
      originalText: ocrResult.extractedText,
      anonymizedText: anonymizationResult.anonymizedText,
      detectedLanguage: ocrResult.detectedLanguage,
      medicalKeywords: ocrResult.medicalKeywords,
      extractedValues: ocrResult.extractedValues,
      radiologicalAnalysis: radiologicalAnalysis || undefined,
      aiSummary: ocrResult.summary,
      aiAnalysis: ocrResult.aiAnalysis || undefined,
      issuer: ocrResult.issuer || null,
      reportDate: ocrResult.reportDate ? new Date(ocrResult.reportDate) : null,
      isAnonymized: true,
      removedPiiTypes: anonymizationResult.removedPiiTypes,
      userConsent: true,
    });

    // Step 5: Complete job
    await storage.completeJob(jobId, {
      reportId: healthReport.id,
      report: healthReport,
      ocrConfidence: ocrResult.confidence,
      piiRemoved: anonymizationResult.piiCount,
      hasRadiologicalAnalysis: radiologicalAnalysis !== null,
    });

    // Step 6: If report was uploaded during a triage session, notify AI automatically
    if (triageSessionId) {
      try {
        const session = await storage.getTriageSessionById(triageSessionId);
        if (session && session.status !== 'closed') {
          // Create system message to inform AI about the new report
          const reportInfo = `[SISTEMA] Un nuovo referto è stato caricato e analizzato:
- Tipo: ${ocrResult.reportType}
- Data: ${ocrResult.reportDate ? new Date(ocrResult.reportDate).toLocaleDateString('it-IT') : 'Non disponibile'}
- Valori estratti: ${Object.keys(ocrResult.extractedValues || {}).join(', ') || 'Nessuno'}

Il referto è ora disponibile nel contesto della conversazione e verrà incluso automaticamente nelle prossime risposte dell'AI.`;

          await storage.createTriageMessage({
            sessionId: triageSessionId,
            role: 'system',
            content: reportInfo,
          });

          console.log('[JobWorker] Created system message in triage session:', triageSessionId, 'for new report:', healthReport.id);
        }
      } catch (triageError) {
        console.error('[JobWorker] Failed to create triage notification:', triageError);
        // Don't fail the job if notification fails
      }
    }

    // Step 7: Cleanup temporary file
    try {
      if (fs.existsSync(renamedFilePath)) {
        fs.unlinkSync(renamedFilePath);
        console.log('[JobWorker] Cleaned up temporary file:', renamedFilePath);
      }
    } catch (cleanupError) {
      console.error('[JobWorker] Failed to cleanup file:', cleanupError);
    }

    console.log('[JobWorker] Job completed successfully:', jobId, '→ Report:', healthReport.id);
  }
}

// Singleton instance
export const jobWorker = new JobWorker();
