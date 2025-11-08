import { IStorage } from './storage';

export class WearableScheduler {
  private storage: IStorage;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly DAILY_ANALYSIS_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  start() {
    if (this.intervalId) {
      console.log('[WearableScheduler] Already running');
      return;
    }

    console.log('[WearableScheduler] Starting daily report generation scheduler');
    
    // Run immediately on start
    this.generateDailyReports();

    // Then run every 24 hours
    this.intervalId = setInterval(() => {
      this.generateDailyReports();
    }, this.DAILY_ANALYSIS_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[WearableScheduler] Stopped');
    }
  }

  private async generateDailyReports() {
    try {
      console.log('[WearableScheduler] Generating daily wearable reports...');

      // Get all users with active wearable devices
      const devices = await this.storage.getAllWearableDevices();
      const uniqueUserIds = Array.from(new Set(devices.filter((d: any) => d.isActive).map((d: any) => d.userId)));

      console.log(`[WearableScheduler] Found ${uniqueUserIds.length} users with active devices`);

      // Generate report for each user with sufficient data
      let successCount = 0;
      let skipCount = 0;

      for (const userId of uniqueUserIds) {
        try {
          // Get last 7 days of readings
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          
          const readings = await this.storage.getBloodPressureReadingsByUser(userId, startDate, endDate);

          // Skip if no readings in last 7 days
          if (readings.length === 0) {
            console.log(`[WearableScheduler] Skipping user ${userId} - no readings in last 7 days`);
            skipCount++;
            continue;
          }

          // Calculate aggregated stats
          const totalReadings = readings.length;
          const avgSystolic = Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / totalReadings);
          const avgDiastolic = Math.round(readings.reduce((sum, r) => sum + r.diastolic, 0) / totalReadings);
          const heartRateReadings = readings.filter(r => r.heartRate);
          const avgHeartRate = heartRateReadings.length > 0 
            ? Math.round(heartRateReadings.reduce((sum, r) => sum + (r.heartRate || 0), 0) / heartRateReadings.length)
            : 0;
          const anomalies = readings.filter(r => r.isAnomalous);
          const anomalyCount = anomalies.length;

          // Generate AI-optimized context text
          const aiContextText = `
=== REPORT AUTOMATICO DISPOSITIVI WEARABLE ===
Periodo: ${startDate.toLocaleDateString('it-IT')} - ${endDate.toLocaleDateString('it-IT')}
Paziente ID: ${userId}
Generato automaticamente dal sistema

STATISTICHE AGGREGATE (ultimi 7 giorni):
- Misurazioni totali: ${totalReadings}
- Pressione media: ${avgSystolic}/${avgDiastolic} mmHg
- Battiti cardiaci medi: ${avgHeartRate || '--'} bpm
- Anomalie rilevate: ${anomalyCount} (${Math.round(anomalyCount / totalReadings * 100)}%)

DETTAGLIO ANOMALIE:
${anomalies.length > 0 ? anomalies.slice(0, 5).map(a => 
  `- ${new Date(a.measurementTime).toLocaleString('it-IT')}: ${a.systolic}/${a.diastolic} mmHg${a.heartRate ? `, ${a.heartRate} bpm` : ''} - ${a.aiAnalysis || 'Nessuna analisi'}`
).join('\n') + (anomalies.length > 5 ? `\n... e altre ${anomalies.length - 5} anomalie` : '') : '- Nessuna anomalia rilevata'}

TREND E RACCOMANDAZIONI:
${anomalyCount > totalReadings * 0.3 ? '⚠️ ATTENZIONE: Più del 30% delle misurazioni sono anomale. Consigliato controllo medico.' : ''}
${avgSystolic >= 140 || avgDiastolic >= 90 ? '⚠️ Pressione media elevata - possibile ipertensione. Monitoraggio continuo raccomandato.' : ''}
${avgSystolic < 90 || avgDiastolic < 60 ? '⚠️ Pressione media bassa - possibile ipotensione. Verificare con medico.' : ''}
${avgHeartRate && avgHeartRate > 100 ? '⚠️ Frequenza cardiaca media elevata (tachicardia). Valutare cause (stress, caffè, attività fisica).' : ''}
${avgHeartRate && avgHeartRate < 50 ? '⚠️ Frequenza cardiaca media bassa (bradicardia). Consultare cardiologo se sintomatico.' : ''}
${anomalyCount === 0 && avgSystolic < 130 && avgDiastolic < 80 ? '✓ Parametri nella norma. Continuare monitoraggio preventivo.' : ''}
`.trim();

          // Save report to database (doctorId is system-generated, set to userId for now)
          const report = await this.storage.createWearableDailyReport({
            patientId: userId,
            doctorId: userId, // System-generated report (could be changed to a dedicated system user ID)
            startDate,
            endDate,
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
            notes: 'Report generato automaticamente dal sistema',
          });

          console.log(`[WearableScheduler] Generated report ${report.id} for user ${userId} (${totalReadings} readings, ${anomalyCount} anomalies)`);
          successCount++;

        } catch (error: any) {
          console.error(`[WearableScheduler] Failed to generate report for user ${userId}:`, error.message);
        }
      }

      console.log(`[WearableScheduler] Daily report generation completed: ${successCount} reports generated, ${skipCount} users skipped`);
    } catch (error: any) {
      console.error('[WearableScheduler] Error in generateDailyReports:', error);
    }
  }
}
