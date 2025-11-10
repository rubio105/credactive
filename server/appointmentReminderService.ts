import { IStorage } from './storage';
import { sendWhatsAppMessage } from './twilio';

export interface ReminderServiceResult {
  success: boolean;
  remindersSent: number;
  errors?: Array<{ reminderId: string; error: string }>;
}

export async function sendPendingReminders(storage: IStorage): Promise<ReminderServiceResult> {
  const errors: Array<{ reminderId: string; error: string }> = [];
  let sentCount = 0;

  try {
    console.log('[ReminderService] Fetching pending reminders...');
    const reminders = await storage.fetchPendingReminders();
    
    if (reminders.length === 0) {
      console.log('[ReminderService] No pending reminders found');
      return { success: true, remindersSent: 0 };
    }

    console.log(`[ReminderService] Found ${reminders.length} pending reminder(s)`);

    for (const reminder of reminders) {
      try {
        const appointmentDate = new Date(reminder.startTime);
        const reminderLabel = reminder.reminderType === 'reminder_24h' ? '24 ore' : 
                             reminder.reminderType === 'reminder_2h' ? '2 ore' : 
                             'breve';
        
        const message = `🔔 Promemoria Teleconsulto\n\nAppuntamento tra ${reminderLabel}\nData: ${appointmentDate.toLocaleDateString('it-IT')}\nOra: ${appointmentDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}\n\n${reminder.videoRoomUrl ? `Link: ${reminder.videoRoomUrl}` : ''}`;

        // Send via WhatsApp if enabled
        if ((reminder.channel === 'whatsapp' || reminder.channel === 'both') && 
            reminder.patientWhatsapp && 
            reminder.whatsappNotificationsEnabled) {
          
          console.log(`[ReminderService] Sending WhatsApp reminder ${reminder.id} to ${reminder.patientWhatsapp}`);
          const result = await sendWhatsAppMessage(reminder.patientWhatsapp, message);
          
          if (!result.success) {
            throw new Error(`WhatsApp send failed: ${result.error}`);
          }

          await storage.markReminderSent(reminder.id, result.sid);
          sentCount++;
          console.log(`[ReminderService] Reminder ${reminder.id} sent successfully (SID: ${result.sid})`);
        } else {
          const reason = !reminder.patientWhatsapp 
            ? 'No phone number' 
            : !reminder.whatsappNotificationsEnabled 
              ? 'WhatsApp notifications disabled' 
              : `Channel is ${reminder.channel}`;
          
          console.log(`[ReminderService] Skipping reminder ${reminder.id} - ${reason}`);
          await storage.markReminderSkipped(reminder.id, reason);
        }

        // TODO: Add email sending if reminder.channel === 'email' || 'both'
        
      } catch (reminderError: any) {
        console.error(`[ReminderService] Failed to send reminder ${reminder.id}:`, reminderError.message);
        await storage.markReminderFailed(reminder.id, reminderError.message);
        errors.push({ reminderId: reminder.id, error: reminderError.message });
      }
    }

    console.log(`[ReminderService] Completed: ${sentCount} sent, ${errors.length} failed`);

    return {
      success: errors.length === 0,
      remindersSent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    console.error('[ReminderService] Critical error:', error.message);
    return {
      success: false,
      remindersSent: sentCount,
      errors: [{ reminderId: 'unknown', error: error.message }],
    };
  }
}
