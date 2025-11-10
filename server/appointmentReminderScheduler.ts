import { IStorage } from './storage';
import { sendPendingReminders } from './appointmentReminderService';

export class AppointmentReminderScheduler {
  private storage: IStorage;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly REMINDER_INTERVAL = 10 * 60 * 1000; // 10 minutes

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  start() {
    if (this.intervalId) {
      console.log('[AppointmentReminderScheduler] Already running');
      return;
    }

    console.log('[AppointmentReminderScheduler] Starting (interval: 10 minutes)');
    
    // Run immediately on start
    this.tick();

    // Then run every 10 minutes
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.REMINDER_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[AppointmentReminderScheduler] Stopped');
    }
  }

  private async tick() {
    try {
      console.log('[AppointmentReminderScheduler] Running scheduled reminder check...');

      const result = await sendPendingReminders(this.storage);

      if (result.success) {
        console.log(`[AppointmentReminderScheduler] Completed: ${result.remindersSent} reminder(s) sent`);
      } else {
        console.error(`[AppointmentReminderScheduler] Completed with errors: ${result.remindersSent} sent, ${result.errors?.length || 0} failed`);
        if (result.errors) {
          result.errors.forEach(({ reminderId, error }) => {
            console.error(`  - Reminder ${reminderId}: ${error}`);
          });
        }
      }
    } catch (error) {
      console.error('[AppointmentReminderScheduler] Error during tick:', error);
    }
  }

  // Manual trigger for testing/debugging
  async runNow(): Promise<void> {
    console.log('[AppointmentReminderScheduler] Manual trigger requested');
    await this.tick();
  }
}
