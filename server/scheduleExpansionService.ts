import { db } from './db';
import { 
  doctorScheduleRules, 
  doctorScheduleExceptions, 
  appointments,
  type DoctorScheduleRule,
  type DoctorScheduleException 
} from '@shared/schema';
import { eq, and, gte, lte, isNull, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

interface SlotToExpand {
  doctorId: string;
  startTime: Date;
  endTime: Date;
  appointmentType: string | null;
  studioAddress: string | null;
  originType: 'rule' | 'exception';
  originId: string;
  originVersion: number;
  priority: number; // Higher priority wins conflicts (exception > rule)
}

/**
 * Schedule Expansion Service
 * Expands recurring schedule rules into concrete appointment slots
 * Handles weekly, biweekly, monthly, and custom recurrence patterns
 * Applies exceptions (blocks, modifications, one-time slots)
 * Idempotent: safe to run multiple times via UPSERT
 */
export class ScheduleExpansionService {
  
  /**
   * Expand all active rules for all doctors
   * Called nightly by scheduler
   */
  static async expandAllDoctors(): Promise<{
    doctorsProcessed: number;
    slotsCreated: number;
    slotsUpdated: number;
    errors: string[];
  }> {
    console.log('[ScheduleExpansion] Starting expansion for all doctors...');
    
    const activeRules = await db.query.doctorScheduleRules.findMany({
      where: eq(doctorScheduleRules.isActive, true),
    });
    
    const doctorIds = Array.from(new Set(activeRules.map(r => r.doctorId)));
    
    let totalCreated = 0;
    let totalUpdated = 0;
    const errors: string[] = [];
    
    for (const doctorId of doctorIds) {
      try {
        const result = await this.expandDoctorSchedule(doctorId);
        totalCreated += result.slotsCreated;
        totalUpdated += result.slotsUpdated;
      } catch (error) {
        const msg = `Doctor ${doctorId}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[ScheduleExpansion] ${msg}`);
        errors.push(msg);
      }
    }
    
    console.log(`[ScheduleExpansion] Completed: ${doctorIds.length} doctors, ${totalCreated} created, ${totalUpdated} updated`);
    
    return {
      doctorsProcessed: doctorIds.length,
      slotsCreated: totalCreated,
      slotsUpdated: totalUpdated,
      errors,
    };
  }
  
  /**
   * Expand schedule for specific doctor
   * Called when doctor creates/updates rules
   */
  static async expandDoctorSchedule(doctorId: string): Promise<{
    slotsCreated: number;
    slotsUpdated: number;
  }> {
    console.log(`[ScheduleExpansion] Expanding schedule for doctor ${doctorId}...`);
    
    // Fetch active rules
    const rules = await db.query.doctorScheduleRules.findMany({
      where: and(
        eq(doctorScheduleRules.doctorId, doctorId),
        eq(doctorScheduleRules.isActive, true)
      ),
    });
    
    if (rules.length === 0) {
      console.log(`[ScheduleExpansion] No active rules for doctor ${doctorId}`);
      return { slotsCreated: 0, slotsUpdated: 0 };
    }
    
    // Fetch all exceptions for this doctor
    const exceptions = await db.query.doctorScheduleExceptions.findMany({
      where: eq(doctorScheduleExceptions.doctorId, doctorId),
    });
    
    const exceptionsMap = this.buildExceptionsMap(exceptions);
    
    let totalCreated = 0;
    let totalUpdated = 0;
    
    // Process each rule
    for (const rule of rules) {
      try {
        const slots = await this.expandRule(rule, exceptionsMap);
        
        // Upsert slots and track failures
        const result = await this.upsertSlots(slots);
        totalCreated += result.created;
        totalUpdated += result.updated;
        
        // Only advance lastExpandedAt if ALL upserts succeeded
        const totalAttempted = slots.length;
        const totalProcessed = result.created + result.updated + result.failed;
        const allSucceeded = result.failed === 0 && totalProcessed === totalAttempted;
        
        if (allSucceeded) {
          // Update lastExpandedAt to actual expansion end date
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const expansionEnd = new Date(now.getTime() + 12 * 7 * 24 * 60 * 60 * 1000);
          
          // Respect rule end date if set
          let actualExpansionEnd = expansionEnd;
          if (rule.endDate) {
            const ruleEnd = new Date(rule.endDate);
            ruleEnd.setHours(0, 0, 0, 0);
            if (actualExpansionEnd > ruleEnd) {
              actualExpansionEnd = ruleEnd;
            }
          }
          
          await db.update(doctorScheduleRules)
            .set({
              lastExpandedAt: actualExpansionEnd,
              lastExpandedVersion: (rule.lastExpandedVersion || 0) + 1,
            })
            .where(eq(doctorScheduleRules.id, rule.id));
        } else {
          console.warn(`[ScheduleExpansion] Rule ${rule.id}: ${result.failed} failed upserts, not advancing lastExpandedAt`);
        }
          
      } catch (error) {
        console.error(`[ScheduleExpansion] Error expanding rule ${rule.id}:`, error);
        throw error;
      }
    }
    
    console.log(`[ScheduleExpansion] Doctor ${doctorId}: ${totalCreated} created, ${totalUpdated} updated`);
    
    return {
      slotsCreated: totalCreated,
      slotsUpdated: totalUpdated,
    };
  }
  
  /**
   * Build map of exceptions by date for fast lookup
   */
  private static buildExceptionsMap(exceptions: DoctorScheduleException[]): Map<string, DoctorScheduleException[]> {
    const map = new Map<string, DoctorScheduleException[]>();
    
    for (const exc of exceptions) {
      const dateKey = exc.exceptionDate.toISOString().split('T')[0];
      const existing = map.get(dateKey) || [];
      existing.push(exc);
      map.set(dateKey, existing);
    }
    
    return map;
  }
  
  /**
   * Expand a single rule into concrete slots
   */
  private static async expandRule(
    rule: DoctorScheduleRule,
    exceptionsMap: Map<string, DoctorScheduleException[]>
  ): Promise<SlotToExpand[]> {
    const slots: SlotToExpand[] = [];
    
    // Calculate expansion window
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Effective start: advance past lastExpandedAt to avoid reprocessing
    let expansionStart: Date;
    if (rule.lastExpandedAt) {
      expansionStart = new Date(rule.lastExpandedAt);
      expansionStart.setDate(expansionStart.getDate() + 1); // Start from next day
      expansionStart.setHours(0, 0, 0, 0);
    } else if (rule.startDate) {
      expansionStart = new Date(rule.startDate);
      expansionStart.setHours(0, 0, 0, 0);
    } else {
      expansionStart = new Date(now);
    }
    
    // Ensure we don't go before rule start date
    if (rule.startDate) {
      const ruleStart = new Date(rule.startDate);
      ruleStart.setHours(0, 0, 0, 0);
      if (expansionStart < ruleStart) {
        expansionStart = ruleStart;
      }
    }
    
    // Expansion end: 12 weeks from today
    const expansionEnd = new Date(now.getTime() + 12 * 7 * 24 * 60 * 60 * 1000);
    
    // Respect rule end date if set
    if (rule.endDate) {
      const ruleEnd = new Date(rule.endDate);
      ruleEnd.setHours(23, 59, 59, 999);
      if (expansionEnd > ruleEnd) {
        expansionEnd.setTime(ruleEnd.getTime());
      }
    }
    
    // Generate dates based on recurrence pattern
    const dates = this.generateRecurrenceDates(rule, expansionStart, expansionEnd);
    
    // For each date, check exceptions and generate time slots
    for (const date of dates) {
      const dateKey = date.toISOString().split('T')[0];
      const dayExceptions = exceptionsMap.get(dateKey) || [];
      
      // Check for blocking exceptions
      const blockException = dayExceptions.find(e => e.exceptionType === 'block');
      if (blockException) {
        console.log(`[ScheduleExpansion] Skipping ${dateKey} - blocked by exception`);
        continue;
      }
      
      // Check for modification exceptions
      const modifyException = dayExceptions.find(e => e.exceptionType === 'modify');
      const effectiveRule = modifyException ? this.mergeRuleWithException(rule, modifyException) : rule;
      
      // Generate time slots for this date
      const daySlots = this.generateTimeSlotsForDate(date, effectiveRule);
      slots.push(...daySlots);
      
      // Add one-time slots from exceptions
      const oneTimeExceptions = dayExceptions.filter(e => e.exceptionType === 'one_time_slot');
      for (const exc of oneTimeExceptions) {
        if (exc.startTime && exc.endTime) {
          const oneTimeSlots = this.generateTimeSlotsForException(date, exc);
          slots.push(...oneTimeSlots);
        }
      }
    }
    
    return slots;
  }
  
  /**
   * Generate dates based on recurrence pattern
   */
  private static generateRecurrenceDates(
    rule: DoctorScheduleRule,
    start: Date,
    end: Date
  ): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);
    
    // Respect endDate if set
    const finalEnd = rule.endDate && rule.endDate < end ? rule.endDate : end;
    
    switch (rule.frequency) {
      case 'weekly':
        this.generateWeeklyDates(dates, current, finalEnd, rule);
        break;
      case 'biweekly':
        this.generateBiweeklyDates(dates, current, finalEnd, rule);
        break;
      case 'monthly':
        this.generateMonthlyDates(dates, current, finalEnd, rule);
        break;
      case 'custom':
        this.generateCustomDates(dates, current, finalEnd, rule);
        break;
    }
    
    return dates;
  }
  
  /**
   * Generate weekly recurrence dates
   * Uses strict arithmetic progression from rule start date
   */
  private static generateWeeklyDates(
    dates: Date[],
    start: Date,
    end: Date,
    rule: DoctorScheduleRule
  ): void {
    const interval = rule.interval || 1;
    const byWeekDay = rule.byWeekDay as number[] || [];
    const ruleStart = rule.startDate || start;
    
    // Normalize all dates to midnight
    const normalizedStart = new Date(start);
    normalizedStart.setHours(0, 0, 0, 0);
    const normalizedEnd = new Date(end);
    normalizedEnd.setHours(0, 0, 0, 0);
    const normalizedRuleStart = new Date(ruleStart);
    normalizedRuleStart.setHours(0, 0, 0, 0);
    
    // Start from the later of: expansion start OR rule start
    const effectiveStart = normalizedStart > normalizedRuleStart ? normalizedStart : normalizedRuleStart;
    const current = new Date(effectiveStart);
    
    while (current <= normalizedEnd) {
      // Calculate days since rule start (guaranteed >= 0 now)
      const daysSinceStart = Math.floor((current.getTime() - normalizedRuleStart.getTime()) / (24 * 60 * 60 * 1000));
      
      // Calculate which week this day falls in (0-indexed from rule start)
      const weekNumber = Math.floor(daysSinceStart / 7);
      
      // Check if this week matches the interval cadence
      if (weekNumber % interval === 0) {
        const dayOfWeek = current.getDay();
        
        // Check if this weekday matches the rule
        if (byWeekDay.length === 0 || byWeekDay.includes(dayOfWeek)) {
          dates.push(new Date(current));
        }
      }
      
      // Move to next day
      current.setDate(current.getDate() + 1);
    }
  }
  
  /**
   * Generate biweekly recurrence dates
   */
  private static generateBiweeklyDates(
    dates: Date[],
    start: Date,
    end: Date,
    rule: DoctorScheduleRule
  ): void {
    const modifiedRule = { ...rule, interval: 2 };
    this.generateWeeklyDates(dates, start, end, modifiedRule);
  }
  
  /**
   * Generate monthly recurrence dates
   * Uses exact month arithmetic from rule start
   */
  private static generateMonthlyDates(
    dates: Date[],
    start: Date,
    end: Date,
    rule: DoctorScheduleRule
  ): void {
    const interval = rule.interval || 1;
    const byMonthDay = rule.byMonthDay as number[] || [];
    const byWeekDay = rule.byWeekDay as number[] || [];
    const bySetPos = rule.bySetPos;
    const ruleStart = rule.startDate || start;
    
    // Normalize dates
    const normalizedStart = new Date(start);
    normalizedStart.setHours(0, 0, 0, 0);
    const normalizedEnd = new Date(end);
    normalizedEnd.setHours(23, 59, 59, 999);
    const normalizedRuleStart = new Date(ruleStart);
    normalizedRuleStart.setHours(0, 0, 0, 0);
    
    // Calculate original day-of-month intent from rule start
    const originalDayOfMonth = normalizedRuleStart.getDate();
    
    // Convert dates to month indices for arithmetic
    const ruleStartMonthIndex = normalizedRuleStart.getFullYear() * 12 + normalizedRuleStart.getMonth();
    const startMonthIndex = normalizedStart.getFullYear() * 12 + normalizedStart.getMonth();
    const endMonthIndex = normalizedEnd.getFullYear() * 12 + normalizedEnd.getMonth();
    
    // Find first valid month: must be >= start and on interval cadence from rule start
    let monthsSinceRuleStart = Math.max(0, startMonthIndex - ruleStartMonthIndex);
    const remainder = monthsSinceRuleStart % interval;
    if (remainder !== 0) {
      monthsSinceRuleStart += (interval - remainder);
    }
    
    // Iterate through months on interval cadence
    let currentMonthIndex = ruleStartMonthIndex + monthsSinceRuleStart;
    
    while (currentMonthIndex <= endMonthIndex) {
      const year = Math.floor(currentMonthIndex / 12);
      const month = currentMonthIndex % 12;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      if (byMonthDay.length > 0) {
        // Use specific days of month
        for (const day of byMonthDay) {
          if (day < 1 || day > daysInMonth) {
            continue;
          }
          
          const date = new Date(year, month, day);
          date.setHours(0, 0, 0, 0);
          
          // Check expansion window
          if (date >= normalizedStart && date <= normalizedEnd) {
            // Check rule end date
            if (rule.endDate) {
              const ruleEnd = new Date(rule.endDate);
              ruleEnd.setHours(23, 59, 59, 999);
              if (date <= ruleEnd) {
                dates.push(date);
              }
            } else {
              dates.push(date);
            }
          }
        }
      } else if (byWeekDay.length > 0 && bySetPos !== null && bySetPos !== undefined && bySetPos !== 0) {
        // Nth weekday of month (only if bySetPos is valid)
        const monthDates = this.getNthWeekdayOfMonth(year, month, byWeekDay, bySetPos);
        
        // Filter by expansion window AND rule end date
        const validDates = monthDates.filter(d => {
          if (d < normalizedStart || d > normalizedEnd) {
            return false;
          }
          // Check against rule end date
          if (rule.endDate) {
            const ruleEnd = new Date(rule.endDate);
            ruleEnd.setHours(23, 59, 59, 999);
            if (d > ruleEnd) {
              return false;
            }
          }
          return true;
        });
        
        dates.push(...validDates);
      } else {
        // Use original day-of-month, clamped to valid range
        const clampedDay = Math.min(originalDayOfMonth, daysInMonth);
        const date = new Date(year, month, clampedDay);
        date.setHours(0, 0, 0, 0);
        
        // Check expansion window
        if (date >= normalizedStart && date <= normalizedEnd) {
          // Check rule end date
          if (rule.endDate) {
            const ruleEnd = new Date(rule.endDate);
            ruleEnd.setHours(23, 59, 59, 999);
            if (date <= ruleEnd) {
              dates.push(date);
            }
          } else {
            dates.push(date);
          }
        }
      }
      
      // Advance by interval months
      currentMonthIndex += interval;
    }
  }
  
  /**
   * Get Nth weekday of month (e.g., first Monday = bySetPos: 1, byWeekDay: [1])
   */
  private static getNthWeekdayOfMonth(
    year: number,
    month: number,
    byWeekDay: number[],
    bySetPos: number
  ): Date[] {
    const dates: Date[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    for (const weekday of byWeekDay) {
      const candidates: Date[] = [];
      
      // Find all occurrences of this weekday in the month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        if (date.getDay() === weekday) {
          candidates.push(date);
        }
      }
      
      // Select based on bySetPos
      if (bySetPos > 0 && bySetPos <= candidates.length) {
        dates.push(candidates[bySetPos - 1]); // 1-indexed
      } else if (bySetPos < 0 && Math.abs(bySetPos) <= candidates.length) {
        dates.push(candidates[candidates.length + bySetPos]); // -1 = last, -2 = second-to-last
      }
    }
    
    return dates;
  }
  
  /**
   * Generate custom interval dates (fallback to weekly)
   */
  private static generateCustomDates(
    dates: Date[],
    start: Date,
    end: Date,
    rule: DoctorScheduleRule
  ): void {
    // For now, treat custom as weekly
    // TODO: Implement custom logic based on specific requirements
    this.generateWeeklyDates(dates, start, end, rule);
  }
  
  /**
   * Merge rule with modification exception
   * Uses nullish coalescing to preserve null/undefined distinction
   */
  private static mergeRuleWithException(
    rule: DoctorScheduleRule,
    exception: DoctorScheduleException
  ): DoctorScheduleRule {
    return {
      ...rule,
      startTime: exception.startTime ?? rule.startTime,
      endTime: exception.endTime ?? rule.endTime,
      slotDuration: exception.slotDuration ?? rule.slotDuration,
      appointmentType: exception.appointmentType ?? rule.appointmentType,
      studioAddress: exception.studioAddress ?? rule.studioAddress,
    };
  }
  
  /**
   * Generate time slots for a specific date based on rule
   */
  private static generateTimeSlotsForDate(
    date: Date,
    rule: DoctorScheduleRule
  ): SlotToExpand[] {
    const slots: SlotToExpand[] = [];
    
    const [startHour, startMin] = rule.startTime.split(':').map(Number);
    const [endHour, endMin] = rule.endTime.split(':').map(Number);
    
    const slotStart = new Date(date);
    slotStart.setHours(startHour, startMin, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMin, 0, 0);
    
    const slotDurationMs = rule.slotDuration * 60 * 1000;
    
    while (slotStart < dayEnd) {
      const slotEnd = new Date(slotStart.getTime() + slotDurationMs);
      
      if (slotEnd <= dayEnd) {
        slots.push({
          doctorId: rule.doctorId,
          startTime: new Date(slotStart),
          endTime: new Date(slotEnd),
          appointmentType: rule.appointmentType,
          studioAddress: rule.studioAddress,
          originType: 'rule',
          originId: rule.id,
          originVersion: (rule.lastExpandedVersion || 0) + 1, // Increment to allow updates
          priority: 1, // Rule slots have priority 1
        });
      }
      
      slotStart.setTime(slotStart.getTime() + slotDurationMs);
    }
    
    return slots;
  }
  
  /**
   * Generate time slots for one-time exception
   */
  private static generateTimeSlotsForException(
    date: Date,
    exception: DoctorScheduleException
  ): SlotToExpand[] {
    const slots: SlotToExpand[] = [];
    
    if (!exception.startTime || !exception.endTime || !exception.slotDuration) {
      return slots;
    }
    
    const [startHour, startMin] = exception.startTime.split(':').map(Number);
    const [endHour, endMin] = exception.endTime.split(':').map(Number);
    
    const slotStart = new Date(date);
    slotStart.setHours(startHour, startMin, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMin, 0, 0);
    
    const slotDurationMs = exception.slotDuration * 60 * 1000;
    
    while (slotStart < dayEnd) {
      const slotEnd = new Date(slotStart.getTime() + slotDurationMs);
      
      if (slotEnd <= dayEnd) {
        slots.push({
          doctorId: exception.doctorId,
          startTime: new Date(slotStart),
          endTime: new Date(slotEnd),
          appointmentType: exception.appointmentType || 'teleconsulto',
          studioAddress: exception.studioAddress,
          originType: 'exception',
          originId: exception.id,
          originVersion: 1000 + Math.floor((exception.updatedAt?.getTime() || Date.now()) / 1000), // Timestamp-based version
          priority: 10, // Exception slots have priority 10 (higher than rules)
        });
      }
      
      slotStart.setTime(slotStart.getTime() + slotDurationMs);
    }
    
    return slots;
  }
  
  /**
   * UPSERT slots into appointments table
   * Idempotent: uses (doctor_id, start_time) as unique key
   * Exception slots (priority 10) override rule slots (priority 1)
   */
  private static async upsertSlots(slots: SlotToExpand[]): Promise<{
    created: number;
    updated: number;
    failed: number;
  }> {
    if (slots.length === 0) {
      return { created: 0, updated: 0, failed: 0 };
    }
    
    let created = 0;
    let updated = 0;
    let failed = 0;
    
    // Process in batches to avoid overwhelming database
    const batchSize = 50;
    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);
      
      for (const slot of batch) {
        try {
          // Check if slot already exists
          const existing = await db.query.appointments.findFirst({
            where: and(
              eq(appointments.doctorId, slot.doctorId),
              eq(appointments.startTime, slot.startTime)
            ),
          });
          
          if (existing) {
            // Update if higher priority OR same priority with newer version
            const shouldUpdate = 
              existing.originVersion === null || 
              slot.originVersion > existing.originVersion ||
              (slot.originType === 'exception' && existing.originType === 'rule'); // Exceptions override rules
            
            if (shouldUpdate) {
              await db.update(appointments)
                .set({
                  endTime: slot.endTime,
                  appointmentType: slot.appointmentType,
                  studioAddress: slot.studioAddress,
                  originType: slot.originType,
                  originId: slot.originId,
                  originVersion: slot.originVersion,
                })
                .where(eq(appointments.id, existing.id));
              updated++;
            }
          } else {
            // Create new slot
            await db.insert(appointments).values({
              doctorId: slot.doctorId,
              startTime: slot.startTime,
              endTime: slot.endTime,
              status: 'available',
              appointmentType: slot.appointmentType,
              studioAddress: slot.studioAddress,
              originType: slot.originType,
              originId: slot.originId,
              originVersion: slot.originVersion,
            });
            created++;
          }
        } catch (error) {
          console.error(`[ScheduleExpansion] Error upserting slot at ${slot.startTime}:`, error);
          failed++;
          // Continue with other slots
        }
      }
    }
    
    return { created, updated, failed };
  }
}
