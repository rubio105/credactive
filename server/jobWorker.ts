import { storage } from './storage';
import { extractTextFromMedicalReport } from './gemini';
import { anonymizeMedicalText } from './gemini';
import { analyzeRadiologicalImage } from './gemini';
import { WearableNotificationService } from './wearableNotifications';
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
      } else if (job.jobType === 'wearable_trend_analysis') {
        await this.processWearableTrendAnalysis(job.id, job.inputData, job.userId);
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
        const year = reportDate.getFullYear().toString().slice(-2); // Last 2 digits
        const formattedDate = `${day}-${month}-${year}`; // DD-MM-YY (formato italiano breve)
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
    // Check if radiological analysis was already performed during OCR extraction
    let radiologicalAnalysis = ocrResult.radiologicalAnalysis || null;
    
    // Only perform radiological analysis if NOT already done AND file type suggests it's needed
    if (!radiologicalAnalysis && fileType.startsWith('image/')) {
      const reportTypeLower = (ocrResult.reportType || '').toLowerCase();
      // Use word boundaries for short acronyms to avoid false positives (e.g., "pet" in "competenza")
      const petMatch = /\bpet\b/.test(reportTypeLower);
      const isRadiologicalImage = reportTypeLower.includes('radiol') || 
         reportTypeLower.includes('imaging') ||
         reportTypeLower.includes('xray') ||
         reportTypeLower.includes('mri') ||
         reportTypeLower.includes('ct') ||
         reportTypeLower.includes('tac') ||
         reportTypeLower.includes('ecografia') ||
         reportTypeLower.includes('ultrasound') ||
         reportTypeLower.includes('ecg') ||
         reportTypeLower.includes('elettrocardiogramma') ||
         reportTypeLower.includes('ecocardio') ||
         reportTypeLower.includes('mammografia') ||
         petMatch ||
         reportTypeLower.includes('scintigrafia');

      if (isRadiologicalImage) {
        try {
          await storage.updateJobProgress(jobId, 60, 'Analyzing radiological image...');
          
          // Get user data for ML training
          const user = userId ? await storage.getUserById(userId) : null;
          const userAge = user?.dateOfBirth 
            ? new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()
            : undefined;
          const userGender = user?.gender || undefined;
          
          radiologicalAnalysis = await analyzeRadiologicalImage(
            renamedFilePath, 
            fileType, 
            userId, 
            userAge, 
            userGender
          );
        } catch (radiologyError) {
          console.error('[JobWorker] Radiological analysis failed:', radiologyError);
        }
      }
    } else if (radiologicalAnalysis) {
      console.log('[JobWorker] Using radiological analysis from OCR step (avoiding duplicate API call)');
      await storage.updateJobProgress(jobId, 60, 'Using existing radiological analysis...');
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

  private async processWearableTrendAnalysis(jobId: string, inputData: any, userId: string) {
    const { analysisType = 'daily_summary' } = inputData;

    await storage.updateJobProgress(jobId, 10, 'Fetching wearable data...');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 24); // Last 24 hours

    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Get blood pressure readings from last 24h
    const readings = await storage.getBloodPressureReadingsByUser(
      userId,
      startDate,
      endDate
    );

    await storage.updateJobProgress(jobId, 30, 'Analyzing trends...');

    if (readings.length === 0) {
      await storage.completeJob(jobId, {
        message: 'No readings to analyze',
        readingsCount: 0,
      });
      return;
    }

    // Trend analysis
    const anomalousReadings = readings.filter((r: any) => r.isAnomalous);
    const highSeverityCount = readings.filter((r: any) => r.severity === 'high').length;
    const lowSeverityCount = readings.filter((r: any) => r.severity === 'low').length;
    const elevatedCount = readings.filter((r: any) => r.severity === 'elevated').length;

    // Check for concerning patterns
    const consecutiveHigh = this.detectConsecutiveAnomalies(readings, 'high', 3);
    const consecutiveLow = this.detectConsecutiveAnomalies(readings, 'low', 3);

    await storage.updateJobProgress(jobId, 60, 'Generating summary...');

    // Generate summary message
    let summary = `📊 Riepilogo Monitoraggio (ultime 24h)\n\n`;
    summary += `Letture totali: ${readings.length}\n`;
    summary += `Anomalie rilevate: ${anomalousReadings.length}\n\n`;

    if (highSeverityCount > 0) {
      summary += `⚠️ Pressione Alta: ${highSeverityCount} letture\n`;
    }
    if (lowSeverityCount > 0) {
      summary += `⚠️ Pressione Bassa: ${lowSeverityCount} letture\n`;
    }
    if (elevatedCount > 0) {
      summary += `⚡ Pressione Elevata: ${elevatedCount} letture\n`;
    }

    // Add trend warnings
    if (consecutiveHigh) {
      summary += `\n🚨 ATTENZIONE: Rilevate ${consecutiveHigh} letture consecutive con pressione alta. Consigliato contattare il medico.\n`;
    }
    if (consecutiveLow) {
      summary += `\n🚨 ATTENZIONE: Rilevate ${consecutiveLow} letture consecutive con pressione bassa. Consigliato contattare il medico.\n`;
    }

    // Calculate averages
    const avgSystolic = Math.round(
      readings.reduce((sum: number, r: any) => sum + r.systolic, 0) / readings.length
    );
    const avgDiastolic = Math.round(
      readings.reduce((sum: number, r: any) => sum + r.diastolic, 0) / readings.length
    );
    const heartRateReadings = readings.filter((r: any) => r.heartRate);
    const avgHeartRate = heartRateReadings.length > 0
      ? Math.round(
          heartRateReadings.reduce((sum: number, r: any) => sum + (r.heartRate || 0), 0) / heartRateReadings.length
        )
      : null;

    summary += `\n📈 Medie:\n`;
    summary += `Pressione: ${avgSystolic}/${avgDiastolic} mmHg\n`;
    if (avgHeartRate) {
      summary += `Battito: ${avgHeartRate} bpm\n`;
    }

    await storage.updateJobProgress(jobId, 80, 'Sending notifications...');

    // Send summary notification if there are concerning trends
    if (consecutiveHigh || consecutiveLow || highSeverityCount >= 3 || lowSeverityCount >= 3) {
      const notificationService = new WearableNotificationService(storage);
      
      // Send WhatsApp if enabled AND verified
      if (user.whatsappNotificationsEnabled && user.whatsappNumber && (user as any).whatsappVerified) {
        const { sendWhatsAppMessage } = await import('./twilio');
        await sendWhatsAppMessage(user.whatsappNumber, summary);
      }

      // Record notification
      await storage.createProactiveNotification({
        userId,
        notificationType: 'health_summary',
        channel: user.whatsappNotificationsEnabled ? 'whatsapp' : 'push',
        message: summary,
        status: 'sent',
      });
    }

    await storage.completeJob(jobId, {
      summary,
      readingsAnalyzed: readings.length,
      anomaliesFound: anomalousReadings.length,
      consecutiveHighCount: consecutiveHigh,
      consecutiveLowCount: consecutiveLow,
      averages: {
        systolic: avgSystolic,
        diastolic: avgDiastolic,
        heartRate: avgHeartRate,
      },
    });

    console.log('[JobWorker] Wearable trend analysis completed:', jobId, '→', readings.length, 'readings analyzed');
  }

  private detectConsecutiveAnomalies(
    readings: any[],
    severity: 'high' | 'low' | 'elevated',
    threshold: number
  ): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    // Sort by measurement time
    const sorted = readings.sort(
      (a, b) => new Date(a.measurementTime).getTime() - new Date(b.measurementTime).getTime()
    );

    for (const reading of sorted) {
      if (reading.severity === severity) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    return maxConsecutive >= threshold ? maxConsecutive : 0;
  }
}

// Singleton instance
export const jobWorker = new JobWorker();
