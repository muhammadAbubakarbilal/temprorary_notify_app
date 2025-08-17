import type { RecurrenceRule, InsertRecurrenceRule, Task, InsertTask } from '@shared/schema';

export interface RecurrencePattern {
  pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number; // Every N days/weeks/months
  weekdays?: number[]; // [0-6] Sunday=0, Monday=1, etc.
  monthDay?: number; // Day of month (1-31)
  endDate?: Date;
  maxOccurrences?: number;
}

export function parseRecurrencePattern(pattern: RecurrencePattern): Partial<InsertRecurrenceRule> {
  return {
    pattern: pattern.pattern,
    interval: pattern.interval,
    weekdays: pattern.weekdays || [],
    monthDay: pattern.monthDay,
    endDate: pattern.endDate?.toISOString(),
    maxOccurrences: pattern.maxOccurrences,
  };
}

export function calculateNextOccurrence(
  lastDate: Date, 
  rule: RecurrenceRule
): Date | null {
  const next = new Date(lastDate);
  
  switch (rule.pattern) {
    case 'daily':
      next.setDate(next.getDate() + rule.interval);
      break;
      
    case 'weekly':
      if (rule.weekdays && rule.weekdays.length > 0) {
        // Find next occurrence on specified weekdays
        const currentWeekday = next.getDay();
        const sortedWeekdays = [...rule.weekdays].sort((a, b) => a - b);
        
        let nextWeekday = sortedWeekdays.find(day => day > currentWeekday);
        if (!nextWeekday) {
          // Move to next week and use first weekday
          nextWeekday = sortedWeekdays[0];
          next.setDate(next.getDate() + (7 * rule.interval));
        }
        
        const daysToAdd = nextWeekday - currentWeekday;
        next.setDate(next.getDate() + daysToAdd);
      } else {
        // Default weekly: same day of week
        next.setDate(next.getDate() + (7 * rule.interval));
      }
      break;
      
    case 'monthly':
      if (rule.monthDay) {
        next.setMonth(next.getMonth() + rule.interval);
        next.setDate(rule.monthDay);
        
        // Handle month overflow (e.g., Feb 30 -> Feb 28)
        if (next.getDate() !== rule.monthDay) {
          next.setDate(0); // Last day of previous month
        }
      } else {
        // Same day of month
        const originalDay = next.getDate();
        next.setMonth(next.getMonth() + rule.interval);
        
        // Handle month overflow
        if (next.getDate() !== originalDay) {
          next.setDate(0); // Last day of previous month
        }
      }
      break;
      
    case 'custom':
      // For custom patterns, default to daily interval
      next.setDate(next.getDate() + rule.interval);
      break;
      
    default:
      return null;
  }
  
  // Check end conditions
  if (rule.endDate && next > new Date(rule.endDate)) {
    return null;
  }
  
  return next;
}

export function generateRecurringTasks(
  baseTask: Task,
  rule: RecurrenceRule,
  maxFutureOccurrences = 10
): Partial<InsertTask>[] {
  const tasks: Partial<InsertTask>[] = [];
  let currentDate = baseTask.dueDate ? new Date(baseTask.dueDate) : new Date();
  let occurrenceCount = 0;
  
  for (let i = 0; i < maxFutureOccurrences; i++) {
    const nextDate = calculateNextOccurrence(currentDate, rule);
    if (!nextDate) break;
    
    if (rule.maxOccurrences && occurrenceCount >= rule.maxOccurrences) {
      break;
    }
    
    tasks.push({
      title: baseTask.title,
      description: baseTask.description,
      projectId: baseTask.projectId,
      priority: baseTask.priority,
      status: 'todo',
      dueDate: nextDate.toISOString(),
      tags: baseTask.tags,
      seriesId: rule.seriesId,
    });
    
    currentDate = nextDate;
    occurrenceCount++;
  }
  
  return tasks;
}

export function isValidRecurrencePattern(pattern: RecurrencePattern): boolean {
  if (pattern.interval < 1) return false;
  
  switch (pattern.pattern) {
    case 'weekly':
      if (pattern.weekdays) {
        return pattern.weekdays.every(day => day >= 0 && day <= 6);
      }
      break;
      
    case 'monthly':
      if (pattern.monthDay && (pattern.monthDay < 1 || pattern.monthDay > 31)) {
        return false;
      }
      break;
  }
  
  if (pattern.endDate && pattern.endDate <= new Date()) {
    return false;
  }
  
  return true;
}

// Mock recurring task generation for development
export function generateMockRecurringTasks(baseTask: Partial<InsertTask>, pattern: string): Partial<InsertTask>[] {
  const tasks: Partial<InsertTask>[] = [];
  const now = new Date();
  
  for (let i = 1; i <= 5; i++) {
    const dueDate = new Date(now);
    
    switch (pattern) {
      case 'daily':
        dueDate.setDate(dueDate.getDate() + i);
        break;
      case 'weekly':
        dueDate.setDate(dueDate.getDate() + (i * 7));
        break;
      case 'monthly':
        dueDate.setMonth(dueDate.getMonth() + i);
        break;
      default:
        dueDate.setDate(dueDate.getDate() + i);
    }
    
    tasks.push({
      ...baseTask,
      title: `${baseTask.title} (${i})`,
      dueDate: dueDate.toISOString(),
      status: 'todo',
    });
  }
  
  return tasks;
}

export function getRecurrenceDescription(rule: RecurrenceRule): string {
  const { pattern, interval, weekdays, monthDay } = rule;
  
  switch (pattern) {
    case 'daily':
      return interval === 1 ? 'Daily' : `Every ${interval} days`;
      
    case 'weekly':
      if (weekdays && weekdays.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = weekdays.map(d => dayNames[d]).join(', ');
        return interval === 1 ? `Weekly on ${days}` : `Every ${interval} weeks on ${days}`;
      }
      return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      
    case 'monthly':
      if (monthDay) {
        return interval === 1 ? `Monthly on day ${monthDay}` : `Every ${interval} months on day ${monthDay}`;
      }
      return interval === 1 ? 'Monthly' : `Every ${interval} months`;
      
    case 'custom':
      return `Every ${interval} days (custom)`;
      
    default:
      return 'Unknown pattern';
  }
}