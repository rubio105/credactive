import type { Express, Request, Response } from "express";
import { z } from "zod";
import type { IStorage } from "./storage";
import { 
  insertWearableDeviceSchema, 
  insertBloodPressureReadingSchema,
  insertWearableDailyReportSchema
} from "@shared/schema";

// Validation schemas
const deviceCreateSchema = insertWearableDeviceSchema.extend({
  deviceType: z.enum(['blood_pressure', 'glucose', 'heart_rate', 'weight', 'oximeter', 'ecg']),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  deviceId: z.string().min(1),
  apiToken: z.string().optional(),
});

const deviceUpdateSchema = deviceCreateSchema.partial().omit({ userId: true, deviceId: true });

const bloodPressureReadingSchema = insertBloodPressureReadingSchema.extend({
  deviceId: z.string().uuid().optional(),
  systolic: z.number().int().min(50).max(250),
  diastolic: z.number().int().min(30).max(150),
  heartRate: z.number().int().min(30).max(220).optional(),
  measurementTime: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});

const dateRangeQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Anomaly detection utility for blood pressure
function detectBloodPressureAnomaly(systolic: number, diastolic: number): {
  isAnomalous: boolean;
  analysis: string;
  severity: 'normal' | 'elevated' | 'high' | 'low';
} {
  const issues: string[] = [];
  let severity: 'normal' | 'elevated' | 'high' | 'low' = 'normal';

  // Hypotension (low blood pressure)
  if (systolic < 90 || diastolic < 60) {
    issues.push(`Pressione bassa rilevata (${systolic}/${diastolic} mmHg)`);
    severity = 'low';
  }
  
  // Hypertension Stage 2 (very high)
  else if (systolic >= 140 || diastolic >= 90) {
    issues.push(`Ipertensione rilevata (${systolic}/${diastolic} mmHg)`);
    severity = 'high';
  }
  
  // Elevated / Hypertension Stage 1
  else if (systolic >= 130 || diastolic >= 80) {
    issues.push(`Pressione elevata (${systolic}/${diastolic} mmHg) - monitorare attentamente`);
    severity = 'elevated';
  }

  // Check for pulse pressure (difference between systolic and diastolic)
  const pulsePressure = systolic - diastolic;
  if (pulsePressure > 60) {
    issues.push(`Pressione differenziale elevata (${pulsePressure} mmHg)`);
  } else if (pulsePressure < 30) {
    issues.push(`Pressione differenziale ridotta (${pulsePressure} mmHg)`);
  }

  const isAnomalous = issues.length > 0;
  const analysis = isAnomalous 
    ? `⚠️ Anomalia rilevata: ${issues.join('. ')}. Consigliato controllo medico se persistente.`
    : `✓ Pressione nella norma (${systolic}/${diastolic} mmHg). Valori ottimali: <120/<80 mmHg.`;

  return { isAnomalous, analysis, severity };
}

// Anomaly detection utility for heart rate
function detectHeartRateAnomaly(heartRate: number, context: 'resting' | 'active' = 'resting'): {
  isAnomalous: boolean;
  analysis: string;
  severity: 'normal' | 'elevated' | 'high' | 'low';
} {
  const issues: string[] = [];
  let severity: 'normal' | 'elevated' | 'high' | 'low' = 'normal';

  if (context === 'resting') {
    // Bradycardia (resting heart rate too low)
    if (heartRate < 50) {
      issues.push(`Bradicardia rilevata (${heartRate} bpm a riposo)`);
      severity = 'low';
    }
    
    // Tachycardia (resting heart rate too high)
    else if (heartRate > 100) {
      issues.push(`Tachicardia rilevata (${heartRate} bpm a riposo)`);
      severity = 'high';
    }
    
    // Elevated resting heart rate
    else if (heartRate > 85) {
      issues.push(`Battito cardiaco elevato (${heartRate} bpm) - monitorare`);
      severity = 'elevated';
    }
  } else {
    // Post-activity thresholds
    if (heartRate > 120) {
      issues.push(`Battito elevato post-attività (${heartRate} bpm)`);
      severity = 'elevated';
    }
  }

  const isAnomalous = issues.length > 0;
  const analysis = isAnomalous 
    ? `⚠️ Anomalia battito cardiaco: ${issues.join('. ')}. Consigliato controllo medico se persistente.`
    : `✓ Battito cardiaco nella norma (${heartRate} bpm). Range ottimale a riposo: 60-100 bpm.`;

  return { isAnomalous, analysis, severity };
}

export function registerWearableRoutes(app: Express, deps: { storage: IStorage; isAuthenticated: any; isAdmin: any }) {
  const { storage, isAuthenticated, isAdmin } = deps;

  // ========== DEVICE MANAGEMENT ==========

  // Register new wearable device
  app.post('/api/wearable/devices', isAuthenticated, async (req: any, res: Response) => {
    try {
      const parsed = deviceCreateSchema.parse(req.body);
      
      const device = await storage.createWearableDevice({
        ...parsed,
        userId: req.user.id,
      });

      return res.json({ 
        success: true, 
        device,
        message: 'Dispositivo registrato con successo' 
      });
    } catch (error: any) {
      console.error('Error creating wearable device:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          success: false, 
          message: 'Dati non validi', 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Errore durante la registrazione del dispositivo' 
      });
    }
  });

  // Get user's registered devices
  app.get('/api/wearable/devices', isAuthenticated, async (req: any, res: Response) => {
    try {
      const devices = await storage.getWearableDevicesByUser(req.user.id);
      
      return res.json({ 
        success: true, 
        devices 
      });
    } catch (error: any) {
      console.error('Error fetching wearable devices:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore durante il recupero dei dispositivi' 
      });
    }
  });

  // Update device info
  app.patch('/api/wearable/devices/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const deviceId = req.params.id;
      const parsed = deviceUpdateSchema.parse(req.body);

      // Verify ownership
      const existingDevice = await storage.getWearableDeviceById(deviceId);
      if (!existingDevice) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dispositivo non trovato' 
        });
      }

      if (existingDevice.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Non autorizzato' 
        });
      }

      const updatedDevice = await storage.updateWearableDevice(deviceId, parsed);

      return res.json({ 
        success: true, 
        device: updatedDevice,
        message: 'Dispositivo aggiornato con successo' 
      });
    } catch (error: any) {
      console.error('Error updating wearable device:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          success: false, 
          message: 'Dati non validi', 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: 'Errore durante l\'aggiornamento del dispositivo' 
      });
    }
  });

  // Delete device
  app.delete('/api/wearable/devices/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const deviceId = req.params.id;

      // Verify ownership
      const existingDevice = await storage.getWearableDeviceById(deviceId);
      if (!existingDevice) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dispositivo non trovato' 
        });
      }

      if (existingDevice.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Non autorizzato' 
        });
      }

      await storage.deleteWearableDevice(deviceId);

      return res.json({ 
        success: true, 
        message: 'Dispositivo eliminato con successo' 
      });
    } catch (error: any) {
      console.error('Error deleting wearable device:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore durante l\'eliminazione del dispositivo' 
      });
    }
  });

  // ========== BLOOD PRESSURE READINGS ==========

  // Submit blood pressure reading (with inline AI anomaly detection)
  app.post('/api/wearable/blood-pressure', isAuthenticated, async (req: any, res: Response) => {
    try {
      const parsed = bloodPressureReadingSchema.parse(req.body);

      // Verify device ownership if deviceId is provided
      if (parsed.deviceId) {
        const device = await storage.getWearableDeviceById(parsed.deviceId);
        
        if (!device) {
          return res.status(404).json({ 
            success: false, 
            message: 'Dispositivo non trovato' 
          });
        }

        if (device.userId !== req.user.id) {
          return res.status(403).json({ 
            success: false, 
            message: 'Non autorizzato: dispositivo non appartiene all\'utente' 
          });
        }

        // Update last sync timestamp for the device
        await storage.updateWearableDevice(parsed.deviceId, {
          lastSyncAt: new Date(),
        });
      }

      // Inline anomaly detection for blood pressure
      const bpAnomaly = detectBloodPressureAnomaly(
        parsed.systolic, 
        parsed.diastolic
      );

      // Inline anomaly detection for heart rate (if provided)
      let hrAnomaly = null;
      if (parsed.heartRate) {
        hrAnomaly = detectHeartRateAnomaly(parsed.heartRate, 'resting');
      }

      // Determine overall anomaly status, severity, and primary reading type
      const isAnomalous = bpAnomaly.isAnomalous || (hrAnomaly?.isAnomalous ?? false);
      
      // Severity ranking: high > low > elevated > normal
      const severityRank = { high: 4, low: 3, elevated: 2, normal: 1 };
      const bpSeverityRank = severityRank[bpAnomaly.severity];
      const hrSeverityRank = hrAnomaly ? severityRank[hrAnomaly.severity] : 0;
      
      let severity: 'normal' | 'elevated' | 'high' | 'low';
      let readingType: 'blood_pressure' | 'heart_rate';
      
      if (hrSeverityRank > bpSeverityRank) {
        // Heart rate anomaly is more severe
        severity = hrAnomaly!.severity;
        readingType = 'heart_rate';
      } else {
        // Blood pressure anomaly is more severe (or equal, prefer BP)
        severity = bpAnomaly.severity;
        readingType = 'blood_pressure';
      }
      
      const analysisPoints = [bpAnomaly.analysis];
      if (hrAnomaly) {
        analysisPoints.push(hrAnomaly.analysis);
      }
      const analysis = analysisPoints.join('\n');

      // Create reading
      const createdReading = await storage.createBloodPressureReading({
        userId: req.user.id,
        deviceId: parsed.deviceId || null,
        systolic: parsed.systolic,
        diastolic: parsed.diastolic,
        heartRate: parsed.heartRate || null,
        measurementTime: new Date(parsed.measurementTime),
        notes: parsed.notes || null,
      });

      // Update with anomaly analysis
      const reading = await storage.updateBloodPressureReading(createdReading.id, {
        isAnomalous,
        aiAnalysis: analysis,
      });

      // Send notifications if anomalies detected
      if (isAnomalous && (severity === 'high' || severity === 'low')) {
        const { getWearableNotificationService } = await import('./wearableNotifications');
        const notificationService = getWearableNotificationService(storage);
        
        await notificationService.sendAnomalyNotification({
          userId: req.user.id,
          readingType, // Correctly set based on which anomaly is more severe
          severity,
          analysis,
          readingData: {
            systolic: parsed.systolic,
            diastolic: parsed.diastolic,
            heartRate: parsed.heartRate || undefined,
            measurementTime: new Date(parsed.measurementTime),
          },
        });
      }

      return res.json({ 
        success: true, 
        reading: {
          ...reading,
          severity,
          recommendation: isAnomalous 
            ? 'Consigliato controllo medico se i valori persistono'
            : 'Valori nella norma, continua il monitoraggio regolare'
        },
        message: isAnomalous 
          ? 'Misurazione salvata - Anomalia rilevata' 
          : 'Misurazione salvata con successo'
      });
    } catch (error: any) {
      console.error('Error creating blood pressure reading:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          success: false, 
          message: 'Dati non validi', 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: 'Errore durante il salvataggio della misurazione' 
      });
    }
  });

  // Get blood pressure readings history
  app.get('/api/wearable/blood-pressure', isAuthenticated, async (req: any, res: Response) => {
    try {
      const query = dateRangeQuerySchema.parse(req.query);
      
      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;

      const readings = await storage.getBloodPressureReadingsByUser(
        req.user.id, 
        startDate, 
        endDate
      );

      // Calculate statistics
      const stats = {
        total: readings.length,
        anomalous: readings.filter(r => r.isAnomalous).length,
        averageSystolic: readings.length > 0 
          ? Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / readings.length)
          : 0,
        averageDiastolic: readings.length > 0
          ? Math.round(readings.reduce((sum, r) => sum + r.diastolic, 0) / readings.length)
          : 0,
      };

      return res.json({ 
        success: true, 
        readings,
        stats
      });
    } catch (error: any) {
      console.error('Error fetching blood pressure readings:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          success: false, 
          message: 'Parametri non validi', 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: 'Errore durante il recupero delle misurazioni' 
      });
    }
  });

  // Get anomalous readings for current user
  app.get('/api/wearable/blood-pressure/anomalies', isAuthenticated, async (req: any, res: Response) => {
    try {
      const anomalies = await storage.getAnomalousBloodPressureReadings(req.user.id);

      return res.json({ 
        success: true, 
        anomalies,
        count: anomalies.length
      });
    } catch (error: any) {
      console.error('Error fetching anomalous blood pressure readings:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore durante il recupero delle anomalie' 
      });
    }
  });

  // ========== ADMIN ENDPOINTS ==========

  // View all anomalous readings across users (admin only)
  app.get('/api/admin/wearable/anomalies', isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const anomalies = await storage.getAnomalousBloodPressureReadings();

      return res.json({ 
        success: true, 
        anomalies,
        count: anomalies.length
      });
    } catch (error: any) {
      console.error('Error fetching all anomalous readings:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore durante il recupero delle anomalie' 
      });
    }
  });

  // Dashboard stats for wearable data (admin only)
  app.get('/api/admin/wearable/stats', isAuthenticated, isAdmin, async (req: any, res: Response) => {
    try {
      const query = dateRangeQuerySchema.parse(req.query);
      
      const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
      const endDate = query.endDate ? new Date(query.endDate) : new Date();

      // TODO: Add more comprehensive stats methods to storage if needed
      const anomalies = await storage.getAnomalousBloodPressureReadings();
      const recentAnomalies = anomalies.filter(a => 
        a.measurementTime && 
        new Date(a.measurementTime) >= startDate && 
        new Date(a.measurementTime) <= endDate
      );

      return res.json({ 
        success: true, 
        stats: {
          totalAnomalies: recentAnomalies.length,
          period: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          // TODO: Add more detailed breakdowns (by user, by severity, trends, etc.)
        }
      });
    } catch (error: any) {
      console.error('Error fetching wearable stats:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore durante il recupero delle statistiche' 
      });
    }
  });

  // ========== WEARABLE DAILY REPORTS (DOCTORS ONLY) ==========

  // Generate daily report for a patient (doctor only)
  app.post('/api/wearable/reports/generate', isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!req.user.isDoctor && !req.user.isAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Solo i medici possono generare report' 
        });
      }

      const { patientId, startDate, endDate, notes } = req.body;

      if (!patientId || !startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'patientId, startDate e endDate sono obbligatori' 
        });
      }

      // Fetch patient's blood pressure readings for the period
      const readings = await storage.getBloodPressureReadingsByUser(
        patientId, 
        new Date(startDate), 
        new Date(endDate)
      );

      if (readings.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Nessuna misurazione trovata per questo periodo' 
        });
      }

      // Calculate aggregated stats
      const totalReadings = readings.length;
      const avgSystolic = Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / totalReadings);
      const avgDiastolic = Math.round(readings.reduce((sum, r) => sum + r.diastolic, 0) / totalReadings);
      const avgHeartRate = Math.round(
        readings.filter(r => r.heartRate).reduce((sum, r) => sum + (r.heartRate || 0), 0) / 
        readings.filter(r => r.heartRate).length
      );
      const anomalies = readings.filter(r => r.isAnomalous);
      const anomalyCount = anomalies.length;

      // Generate AI-optimized context text
      const aiContextText = `
=== REPORT DISPOSITIVI WEARABLE ===
Periodo: ${new Date(startDate).toLocaleDateString('it-IT')} - ${new Date(endDate).toLocaleDateString('it-IT')}
Paziente ID: ${patientId}

STATISTICHE AGGREGATE:
- Misurazioni totali: ${totalReadings}
- Pressione media: ${avgSystolic}/${avgDiastolic} mmHg
- Battiti cardiaci medi: ${avgHeartRate || '--'} bpm
- Anomalie rilevate: ${anomalyCount} (${Math.round(anomalyCount / totalReadings * 100)}%)

DETTAGLIO ANOMALIE:
${anomalies.length > 0 ? anomalies.map(a => 
  `- ${new Date(a.measurementTime).toLocaleString('it-IT')}: ${a.systolic}/${a.diastolic} mmHg${a.heartRate ? `, ${a.heartRate} bpm` : ''} - ${a.aiAnalysis || 'Nessuna analisi'}`
).join('\n') : '- Nessuna anomalia rilevata'}

${notes ? `\nNOTE MEDICHE:\n${notes}` : ''}

RACCOMANDAZIONI:
${anomalyCount > totalReadings * 0.3 ? '⚠️ ATTENZIONE: Più del 30% delle misurazioni sono anomale. Consigliato approfondimento.' : ''}
${avgSystolic >= 140 || avgDiastolic >= 90 ? '⚠️ Pressione media elevata - possibile ipertensione.' : ''}
${avgSystolic < 90 || avgDiastolic < 60 ? '⚠️ Pressione media bassa - possibile ipotensione.' : ''}
${avgHeartRate && avgHeartRate > 100 ? '⚠️ Frequenza cardiaca media elevata (tachicardia).' : ''}
${avgHeartRate && avgHeartRate < 50 ? '⚠️ Frequenza cardiaca media bassa (bradicardia).' : ''}
`.trim();

      // Save report to database
      const report = await storage.createWearableDailyReport({
        patientId,
        doctorId: req.user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reportData: {
          totalReadings,
          avgSystolic,
          avgDiastolic,
          avgHeartRate,
          anomalyCount,
          anomalyPercentage: Math.round(anomalyCount / totalReadings * 100),
          readings: readings.map(r => ({
            time: r.measurementTime,
            systolic: r.systolic,
            diastolic: r.diastolic,
            heartRate: r.heartRate,
            isAnomalous: r.isAnomalous,
          })),
        },
        aiContextText,
        notes,
      });

      return res.json({ 
        success: true, 
        report,
        message: 'Report generato con successo' 
      });
    } catch (error: any) {
      console.error('Error generating wearable report:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore durante la generazione del report' 
      });
    }
  });

  // Get single report by ID
  app.get('/api/wearable/reports/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const reportId = req.params.id;
      const report = await storage.getWearableDailyReportById(reportId);

      if (!report) {
        return res.status(404).json({ 
          success: false, 
          message: 'Report non trovato' 
        });
      }

      // Only doctor who created it, the patient, or admin can view
      if (report.doctorId !== req.user.id && 
          report.patientId !== req.user.id && 
          !req.user.isAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Non autorizzato' 
        });
      }

      return res.json({ 
        success: true, 
        report 
      });
    } catch (error: any) {
      console.error('Error fetching report:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore durante il recupero del report' 
      });
    }
  });

  // Get all reports for a patient (patient themselves, their doctor, or admin)
  app.get('/api/wearable/reports/patient/:patientId', isAuthenticated, async (req: any, res: Response) => {
    try {
      const patientId = req.params.patientId;
      
      // Only the patient themselves, doctors, or admin can access
      if (patientId !== req.user.id && !req.user.isDoctor && !req.user.isAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Non autorizzato' 
        });
      }

      const reports = await storage.getWearableDailyReportsByPatient(patientId, 50);

      return res.json({ 
        success: true, 
        reports 
      });
    } catch (error: any) {
      console.error('Error fetching patient reports:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore durante il recupero dei report del paziente' 
      });
    }
  });

  // Get all reports created by current doctor
  app.get('/api/wearable/reports/doctor/my-reports', isAuthenticated, async (req: any, res: Response) => {
    try {
      if (!req.user.isDoctor && !req.user.isAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Solo i medici possono accedere a questo endpoint' 
        });
      }

      const reports = await storage.getWearableDailyReportsByDoctor(req.user.id, 100);

      return res.json({ 
        success: true, 
        reports 
      });
    } catch (error: any) {
      console.error('Error fetching doctor reports:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore durante il recupero dei report del medico' 
      });
    }
  });
}
