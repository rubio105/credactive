import { IStorage } from './storage';

export class LoginLogsScheduler {
  private storage: IStorage;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly RETENTION_DAYS = 10; // Keep logs for 10 days

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  start() {
    if (this.intervalId) {
      console.log('[LoginLogsScheduler] Already running');
      return;
    }

    console.log('[LoginLogsScheduler] Starting daily login logs cleanup (retention: 10 days)');
    
    // Run immediately on start
    this.cleanupOldLogs();

    // Then run every 24 hours
    this.intervalId = setInterval(() => {
      this.cleanupOldLogs();
    }, this.CLEANUP_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[LoginLogsScheduler] Stopped');
    }
  }

  private async cleanupOldLogs() {
    try {
      console.log(`[LoginLogsScheduler] Cleaning up login logs older than ${this.RETENTION_DAYS} days...`);

      const deletedCount = await this.storage.deleteOldLoginLogs(this.RETENTION_DAYS);

      console.log(`[LoginLogsScheduler] Cleanup completed: ${deletedCount} old login logs deleted`);
    } catch (error) {
      console.error('[LoginLogsScheduler] Error during cleanup:', error);
    }
  }
}
