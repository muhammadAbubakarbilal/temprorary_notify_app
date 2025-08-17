import type { Task, TimeEntry, Project, User } from '@shared/schema';

export interface ProductivityMetrics {
  completionRate: number;
  averageTaskTime: number;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  totalTimeTracked: number;
  mostProductiveHour: number;
  productivityScore: number;
}

export interface ProjectAnalytics {
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  timeByProject: Record<string, number>;
  completionTrend: { date: string; completed: number; created: number }[];
  teamProductivity: { userId: string; tasksCompleted: number; timeTracked: number }[];
}

export interface TimeTrackingAnalytics {
  dailyHours: { date: string; hours: number }[];
  weeklyHours: { week: string; hours: number }[];
  projectBreakdown: { projectId: string; projectName: string; hours: number; percentage: number }[];
  averageSessionLength: number;
  totalSessions: number;
}

export interface AdvancedInsights {
  burndownChart: { date: string; planned: number; actual: number }[];
  velocityTrend: { period: string; velocity: number }[];
  blockerAnalysis: { type: string; count: number; impact: number }[];
  predictiveCompletion: { taskId: string; estimatedCompletion: string; confidence: number }[];
}

export function calculateProductivityMetrics(
  tasks: Task[],
  timeEntries: TimeEntry[],
  dateRange: { start: Date; end: Date }
): ProductivityMetrics {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const completedTasks = tasks.filter(t => t.status === 'done');
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  const tasksCompletedToday = completedTasks.filter(t => 
    t.updatedAt && new Date(t.updatedAt) >= today
  ).length;

  const tasksCompletedThisWeek = completedTasks.filter(t => 
    t.updatedAt && new Date(t.updatedAt) >= weekStart
  ).length;

  const totalTimeTracked = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const averageTaskTime = completedTasks.length > 0 ? totalTimeTracked / completedTasks.length : 0;

  // Calculate most productive hour based on time entries
  const hourCounts = new Array(24).fill(0);
  timeEntries.forEach(entry => {
    if (entry.startTime) {
      const hour = new Date(entry.startTime).getHours();
      hourCounts[hour] += entry.duration;
    }
  });
  const mostProductiveHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Simple productivity score (0-100)
  const productivityScore = Math.min(100, 
    (completionRate * 0.4) + 
    (Math.min(8, tasksCompletedThisWeek) * 7.5) + 
    (Math.min(3600, totalTimeTracked / tasks.length) / 3600 * 30)
  );

  return {
    completionRate: Math.round(completionRate),
    averageTaskTime: Math.round(averageTaskTime / 60), // Convert to minutes
    tasksCompletedToday,
    tasksCompletedThisWeek,
    totalTimeTracked: Math.round(totalTimeTracked / 3600), // Convert to hours
    mostProductiveHour,
    productivityScore: Math.round(productivityScore),
  };
}

export function calculateProjectAnalytics(
  tasks: Task[],
  timeEntries: TimeEntry[],
  projects: Project[]
): ProjectAnalytics {
  const tasksByStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tasksByPriority = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const timeByProject = timeEntries.reduce((acc, entry) => {
    const task = tasks.find(t => t.id === entry.taskId);
    if (task) {
      acc[task.projectId] = (acc[task.projectId] || 0) + entry.duration;
    }
    return acc;
  }, {} as Record<string, number>);

  // Generate completion trend for last 30 days
  const completionTrend = generateCompletionTrend(tasks, 30);

  // Mock team productivity (would need user task assignments)
  const teamProductivity = [
    { userId: 'user1', tasksCompleted: 12, timeTracked: 2400 },
    { userId: 'user2', tasksCompleted: 8, timeTracked: 1800 },
  ];

  return {
    tasksByStatus,
    tasksByPriority,
    timeByProject,
    completionTrend,
    teamProductivity,
  };
}

export function calculateTimeTrackingAnalytics(
  timeEntries: TimeEntry[],
  projects: Project[]
): TimeTrackingAnalytics {
  // Daily hours for last 30 days
  const dailyHours = generateDailyHours(timeEntries, 30);
  
  // Weekly hours for last 12 weeks
  const weeklyHours = generateWeeklyHours(timeEntries, 12);

  // Project breakdown
  const projectTime = timeEntries.reduce((acc, entry) => {
    const task = tasks.find(t => t.id === entry.taskId);
    if (task) {
      acc[task.projectId] = (acc[task.projectId] || 0) + entry.duration;
    }
    return acc;
  }, {} as Record<string, number>);

  const totalTime = Object.values(projectTime).reduce((sum, time) => sum + time, 0);
  
  const projectBreakdown = Object.entries(projectTime).map(([projectId, time]) => {
    const project = projects.find(p => p.id === projectId);
    return {
      projectId,
      projectName: project?.name || 'Unknown Project',
      hours: Math.round(time / 3600),
      percentage: totalTime > 0 ? Math.round((time / totalTime) * 100) : 0,
    };
  });

  const totalSessions = timeEntries.length;
  const averageSessionLength = totalSessions > 0 ? 
    Math.round(timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / totalSessions / 60) : 0;

  return {
    dailyHours,
    weeklyHours,
    projectBreakdown,
    averageSessionLength,
    totalSessions,
  };
}

export function generateAdvancedInsights(
  tasks: Task[],
  timeEntries: TimeEntry[],
  projects: Project[]
): AdvancedInsights {
  // Burndown chart (mock data for now)
  const burndownChart = generateBurndownChart(tasks, 14);
  
  // Velocity trend (tasks completed per week)
  const velocityTrend = generateVelocityTrend(tasks, 8);
  
  // Blocker analysis (mock data)
  const blockerAnalysis = [
    { type: 'Dependencies', count: 3, impact: 85 },
    { type: 'Resource Availability', count: 2, impact: 70 },
    { type: 'Technical Complexity', count: 5, impact: 60 },
  ];

  // Predictive completion (mock data)
  const predictiveCompletion = tasks
    .filter(t => t.status !== 'done')
    .slice(0, 5)
    .map(task => ({
      taskId: task.id,
      estimatedCompletion: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      confidence: Math.round(60 + Math.random() * 35), // 60-95% confidence
    }));

  return {
    burndownChart,
    velocityTrend,
    blockerAnalysis,
    predictiveCompletion,
  };
}

function generateCompletionTrend(tasks: Task[], days: number) {
  const trend = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const completed = tasks.filter(t => 
      t.status === 'done' && 
      t.updatedAt && 
      new Date(t.updatedAt).toDateString() === date.toDateString()
    ).length;
    
    const created = tasks.filter(t => 
      t.createdAt && 
      new Date(t.createdAt).toDateString() === date.toDateString()
    ).length;
    
    trend.push({ date: dateStr, completed, created });
  }
  
  return trend;
}

function generateDailyHours(timeEntries: TimeEntry[], days: number) {
  const daily = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayEntries = timeEntries.filter(entry => 
      entry.startTime && 
      new Date(entry.startTime).toDateString() === date.toDateString()
    );
    
    const hours = dayEntries.reduce((sum, entry) => sum + entry.duration, 0) / 3600;
    daily.push({ date: dateStr, hours: Math.round(hours * 100) / 100 });
  }
  
  return daily;
}

function generateWeeklyHours(timeEntries: TimeEntry[], weeks: number) {
  const weekly = [];
  const now = new Date();
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + (i * 7)));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekStr = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    
    const weekEntries = timeEntries.filter(entry => {
      if (!entry.startTime) return false;
      const entryDate = new Date(entry.startTime);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });
    
    const hours = weekEntries.reduce((sum, entry) => sum + entry.duration, 0) / 3600;
    weekly.push({ week: weekStr, hours: Math.round(hours * 100) / 100 });
  }
  
  return weekly;
}

function generateBurndownChart(tasks: Task[], days: number) {
  const chart = [];
  const now = new Date();
  const totalTasks = tasks.length;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const completedByDate = tasks.filter(t => 
      t.status === 'done' && 
      t.updatedAt && 
      new Date(t.updatedAt) <= date
    ).length;
    
    const planned = Math.max(0, totalTasks - Math.floor((i / days) * totalTasks));
    const actual = totalTasks - completedByDate;
    
    chart.push({ date: dateStr, planned, actual });
  }
  
  return chart;
}

function generateVelocityTrend(tasks: Task[], weeks: number) {
  const trend = [];
  const now = new Date();
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + (i * 7)));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekStr = `Week ${weeks - i}`;
    
    const completed = tasks.filter(t => 
      t.status === 'done' && 
      t.updatedAt && 
      new Date(t.updatedAt) >= weekStart && 
      new Date(t.updatedAt) <= weekEnd
    ).length;
    
    trend.push({ period: weekStr, velocity: completed });
  }
  
  return trend;
}