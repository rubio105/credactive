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

    console.log('[WearableScheduler] Starting daily trend analysis scheduler');
    
    // Run immediately on start
    this.scheduleDailyAnalysis();

    // Then run every 24 hours
    this.intervalId = setInterval(() => {
      this.scheduleDailyAnalysis();
    }, this.DAILY_ANALYSIS_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[WearableScheduler] Stopped');
    }
  }

  private async scheduleDailyAnalysis() {
    try {
      console.log('[WearableScheduler] Running daily trend analysis...');

      // Get all users with active wearable devices
      const devices = await this.storage.getAllWearableDevices();
      const uniqueUserIds = Array.from(new Set(devices.filter((d: any) => d.isActive).map((d: any) => d.userId)));

      console.log(`[WearableScheduler] Found ${uniqueUserIds.length} users with active devices`);

      // Create trend analysis job for each user
      for (const userId of uniqueUserIds) {
        try {
          const job = await this.storage.createJob({
            userId,
            jobType: 'wearable_trend_analysis',
            inputData: {
              analysisType: 'daily_summary',
            },
          });

          console.log(`[WearableScheduler] Created trend analysis job ${job.id} for user ${userId}`);
        } catch (error: any) {
          console.error(`[WearableScheduler] Failed to create job for user ${userId}:`, error.message);
        }
      }

      console.log('[WearableScheduler] Daily trend analysis scheduling completed');
    } catch (error: any) {
      console.error('[WearableScheduler] Error in scheduleDailyAnalysis:', error);
    }
  }
}
