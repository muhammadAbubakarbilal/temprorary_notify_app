import { storage } from '../storage';
import { InsertTask } from '@shared/schema';
import { nanoid } from 'nanoid';

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // e.g., every 2 days, every 3 weeks
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday) for weekly patterns
  dayOfMonth?: number; // 1-31 for monthly patterns
  monthOfYear?: number; // 1-12 for yearly patterns
  customCron?: string; // For advanced custom patterns
  endDate?: Date;
  maxOccurrences?: number;
}

export interface RecurringTaskData {
  baseTaskId: string;
  pattern: RecurringPattern;
  nextDueDate: Date;
  occurrencesCreated: number;
}

export class RecurringTaskService {
  async createRecurringTask(
    baseTask: Omit<InsertTask, 'id' | 'seriesId'>, 
    pattern: RecurringPattern
  ): Promise<{ baseTask: any; seriesId: string }> {
    const seriesId = nanoid();
    
    // Create the base task with series ID
    const taskWithSeries = {
      ...baseTask,
      id: nanoid(),
      seriesId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const createdTask = await storage.createTask(taskWithSeries);
    
    // Store recurring pattern metadata (in a real implementation, this would be stored in the database)
    const recurringData: RecurringTaskData = {
      baseTaskId: createdTask.id,
      pattern,
      nextDueDate: this.calculateNextDueDate(baseTask.dueDate || new Date(), pattern),
      occurrencesCreated: 1
    };
    
    // For demo purposes, create the next 2-3 instances immediately
    await this.generateUpcomingInstances(recurringData, 3);
    
    return { baseTask: createdTask, seriesId };
  }

  async generateUpcomingInstances(recurringData: RecurringTaskData, count: number): Promise<void> {
    const baseTask = await storage.getTask(recurringData.baseTaskId);
    if (!baseTask) return;

    let currentDueDate = recurringData.nextDueDate;
    
    for (let i = 0; i < count; i++) {
      if (this.shouldStopGenerating(recurringData, currentDueDate)) break;
      
      const newTask: InsertTask = {
        ...baseTask,
        id: nanoid(),
        dueDate: currentDueDate,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await storage.createTask(newTask);
      currentDueDate = this.calculateNextDueDate(currentDueDate, recurringData.pattern);
      recurringData.occurrencesCreated++;
    }
  }

  private calculateNextDueDate(currentDate: Date, pattern: RecurringPattern): Date {
    const next = new Date(currentDate);
    
    switch (pattern.type) {
      case 'daily':
        next.setDate(next.getDate() + pattern.interval);
        break;
        
      case 'weekly':
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          // Find next occurrence of any specified day
          let daysToAdd = 1;
          while (!pattern.daysOfWeek.includes((next.getDay() + daysToAdd) % 7)) {
            daysToAdd++;
            if (daysToAdd > 7) break; // Safety check
          }
          next.setDate(next.getDate() + daysToAdd);
        } else {
          next.setDate(next.getDate() + (7 * pattern.interval));
        }
        break;
        
      case 'monthly':
        if (pattern.dayOfMonth) {
          next.setMonth(next.getMonth() + pattern.interval);
          next.setDate(pattern.dayOfMonth);
        } else {
          next.setMonth(next.getMonth() + pattern.interval);
        }
        break;
        
      case 'yearly':
        next.setFullYear(next.getFullYear() + pattern.interval);
        if (pattern.monthOfYear) {
          next.setMonth(pattern.monthOfYear - 1);
        }
        break;
        
      case 'custom':
        // For custom patterns, would implement cron parsing here
        // For now, default to daily
        next.setDate(next.getDate() + 1);
        break;
    }
    
    return next;
  }

  private shouldStopGenerating(recurringData: RecurringTaskData, nextDate: Date): boolean {
    if (recurringData.pattern.endDate && nextDate > recurringData.pattern.endDate) {
      return true;
    }
    
    if (recurringData.pattern.maxOccurrences && 
        recurringData.occurrencesCreated >= recurringData.pattern.maxOccurrences) {
      return true;
    }
    
    // Don't generate too far in the future (6 months max)
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    
    return nextDate > sixMonthsFromNow;
  }

  async getRecurringTaskSeries(seriesId: string): Promise<any[]> {
    // In a real implementation, would query tasks by seriesId
    const tasks = await storage.getTasksByProject(''); // This would need to be updated to support series queries
    return tasks.filter(task => task.seriesId === seriesId);
  }

  async updateRecurringSeries(seriesId: string, updates: Partial<InsertTask>): Promise<void> {
    // Update all future tasks in the series
    const tasks = await this.getRecurringTaskSeries(seriesId);
    const futureTasks = tasks.filter(task => 
      task.dueDate && task.dueDate > new Date() && task.status === 'pending'
    );
    
    for (const task of futureTasks) {
      await storage.updateTask(task.id, updates);
    }
  }

  async completeRecurringTask(taskId: string): Promise<void> {
    const task = await storage.getTask(taskId);
    if (!task) return;
    
    // Mark as completed
    await storage.updateTask(taskId, { 
      status: 'completed',
      updatedAt: new Date()
    });
    
    // If this is part of a recurring series, ensure future instances exist
    if (task.seriesId) {
      // Check if we need to generate more instances
      const seriesTasks = await this.getRecurringTaskSeries(task.seriesId);
      const futureTasks = seriesTasks.filter(t => 
        t.dueDate && t.dueDate > new Date()
      );
      
      if (futureTasks.length < 2) {
        // Generate more instances to maintain a buffer
        // This would require storing the pattern, simplified for demo
      }
    }
  }
}

export const recurringTaskService = new RecurringTaskService();