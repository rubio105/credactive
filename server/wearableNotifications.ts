import { IStorage } from './storage';
import { sendWhatsAppMessage } from './twilio';
import webPush from 'web-push';

export interface WearableAnomalyEvent {
  userId: string;
  readingType: 'blood_pressure' | 'heart_rate';
  severity: 'normal' | 'elevated' | 'high' | 'low';
  analysis: string;
  readingData: {
    systolic?: number;
    diastolic?: number;
    heartRate?: number;
    measurementTime: Date;
  };
}

export interface TriageAlertEvent {
  patientId: string;
  patientName: string;
  urgencyLevel: 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  alertId: string;
}

export class WearableNotificationService {
  private storage: IStorage;
  private lastNotificationTime: Map<string, number> = new Map();
  private readonly DEBOUNCE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async sendAnomalyNotification(event: WearableAnomalyEvent): Promise<void> {
    try {
      // Only send notifications for high/low severity
      if (event.severity !== 'high' && event.severity !== 'low') {
        return;
      }

      // Debouncing: Check if we sent a notification recently for this user
      const debounceKey = `${event.userId}-${event.readingType}`;
      const lastNotification = this.lastNotificationTime.get(debounceKey);
      const now = Date.now();

      if (lastNotification && (now - lastNotification) < this.DEBOUNCE_WINDOW_MS) {
        console.log(`[WearableNotifications] Debounced notification for user ${event.userId} (sent ${Math.round((now - lastNotification) / 1000 / 60)} min ago)`);
        return;
      }

      // Get user details
      const user = await this.storage.getUser(event.userId);
      if (!user) {
        console.error(`[WearableNotifications] User not found: ${event.userId}`);
        return;
      }

      // Send WhatsApp notification if enabled AND verified
      if (user.whatsappNotificationsEnabled && user.whatsappNumber && (user as any).whatsappVerified) {
        await this.sendWhatsAppNotification(user.whatsappNumber, event);
      }

      // Send push notification
      await this.sendPushNotification(event.userId, event);

      // Record notification in database
      await this.storage.createProactiveNotification({
        userId: event.userId,
        notificationType: event.readingType === 'blood_pressure' ? 'blood_pressure_alert' : 'heart_rate_alert',
        channel: user.whatsappNotificationsEnabled ? 'whatsapp' : 'push',
        message: event.analysis,
        status: 'sent',
      });

      // Update debounce timestamp
      this.lastNotificationTime.set(debounceKey, now);

      console.log(`[WearableNotifications] Sent ${event.severity} severity alert to user ${event.userId}`);
    } catch (error: any) {
      console.error('[WearableNotifications] Error sending notification:', error);
    }
  }

  private async sendWhatsAppNotification(phoneNumber: string, event: WearableAnomalyEvent): Promise<void> {
    try {
      const message = this.formatWhatsAppMessage(event);
      const result = await sendWhatsAppMessage(phoneNumber, message);
      
      if (!result.success) {
        console.error(`[WearableNotifications] WhatsApp send failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('[WearableNotifications] WhatsApp error:', error.message);
    }
  }

  private async sendPushNotification(userId: string, event: WearableAnomalyEvent): Promise<void> {
    try {
      const subscriptions = await this.storage.getPushSubscriptionsByUser(userId);
      
      const payload = JSON.stringify({
        title: event.readingType === 'blood_pressure' 
          ? '⚠️ Alert Pressione Sanguigna' 
          : '⚠️ Alert Battito Cardiaco',
        body: event.analysis,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: {
          url: '/wearable',
          type: 'wearable_anomaly',
          severity: event.severity
        }
      });

      for (const subscription of subscriptions) {
        try {
          await webPush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
              }
            },
            payload
          );
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await this.storage.deletePushSubscription(subscription.id);
          }
        }
      }
    } catch (error: any) {
      console.error('[WearableNotifications] Push notification error:', error.message);
    }
  }

  private formatWhatsAppMessage(event: WearableAnomalyEvent): string {
    const { readingType, severity, readingData, analysis } = event;
    
    let header = '';
    let values = '';
    
    if (readingType === 'blood_pressure') {
      header = severity === 'high' ? '🔴 ALERT IPERTENSIONE' : '⚠️ ALERT IPOTENSIONE';
      values = `Pressione: ${readingData.systolic}/${readingData.diastolic} mmHg`;
      if (readingData.heartRate) {
        values += `\nBattiti: ${readingData.heartRate} bpm`;
      }
    } else {
      header = severity === 'high' ? '🔴 ALERT TACHICARDIA' : '⚠️ ALERT BRADICARDIA';
      values = `Battito cardiaco: ${readingData.heartRate} bpm`;
    }

    const timestamp = readingData.measurementTime.toLocaleString('it-IT', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    return `${header}\n\n${values}\n\n${analysis}\n\nRilevato: ${timestamp}\n\nSe i sintomi persistono, contatta il tuo medico tramite l'app CIRY.`;
  }

  async sendTriageAlertNotification(event: TriageAlertEvent): Promise<void> {
    try {
      // Only send notifications for critical alerts (EMERGENCY or HIGH)
      if (event.urgencyLevel !== 'EMERGENCY' && event.urgencyLevel !== 'HIGH') {
        return;
      }

      // Get all doctors linked to this patient
      const patientDoctors = await this.storage.getPatientDoctors(event.patientId);
      
      if (patientDoctors.length === 0) {
        console.log(`[TriageAlertNotifications] No doctors linked to patient ${event.patientId}`);
        return;
      }

      // Send push notification to each doctor
      for (const doctor of patientDoctors) {
        await this.sendDoctorPushNotification(doctor.id, event);
      }

      console.log(`[TriageAlertNotifications] Sent ${event.urgencyLevel} alert notifications to ${patientDoctors.length} doctor(s) for patient ${event.patientName}`);
    } catch (error: any) {
      console.error('[TriageAlertNotifications] Error sending notification:', error);
    }
  }

  private async sendDoctorPushNotification(doctorId: string, event: TriageAlertEvent): Promise<void> {
    try {
      const subscriptions = await this.storage.getPushSubscriptionsByUser(doctorId);
      
      const urgencyEmoji = event.urgencyLevel === 'EMERGENCY' ? '🚨' : '⚠️';
      const title = `${urgencyEmoji} Alert ${event.urgencyLevel} - ${event.patientName}`;
      
      const payload = JSON.stringify({
        title,
        body: event.reason,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: {
          url: `/doctor/alert/${event.alertId}`,
          type: 'triage_alert',
          urgency: event.urgencyLevel,
          patientId: event.patientId
        }
      });

      for (const subscription of subscriptions) {
        try {
          await webPush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
              }
            },
            payload
          );
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await this.storage.deletePushSubscription(subscription.id);
          }
        }
      }
    } catch (error: any) {
      console.error('[TriageAlertNotifications] Push notification error:', error.message);
    }
  }
}

// Singleton instance
let notificationService: WearableNotificationService | null = null;

export function getWearableNotificationService(storage: IStorage): WearableNotificationService {
  if (!notificationService) {
    notificationService = new WearableNotificationService(storage);
  }
  return notificationService;
}
