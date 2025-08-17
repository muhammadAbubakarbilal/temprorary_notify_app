
export function formatTime(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  }
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  
  return `${wholeHours}h ${minutes}m`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

export function parseTimeString(timeStr: string): number {
  // Parse time strings like "2h 30m", "1.5h", "90m"
  const hourMatch = timeStr.match(/(\d+(?:\.\d+)?)h/);
  const minuteMatch = timeStr.match(/(\d+)m/);
  
  let totalMinutes = 0;
  
  if (hourMatch) {
    totalMinutes += parseFloat(hourMatch[1]) * 60;
  }
  
  if (minuteMatch) {
    totalMinutes += parseInt(minuteMatch[1]);
  }
  
  return totalMinutes;
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return target.toLocaleDateString();
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const startStr = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  const endStr = endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  return `${startStr} - ${endStr}`;
}

export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export function getWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

export function formatBusinessHours(totalMinutes: number): string {
  const hours = totalMinutes / 60;
  const businessDays = hours / 8; // Assuming 8-hour work days
  
  if (businessDays < 1) {
    return formatDuration(totalMinutes);
  }
  
  const days = Math.floor(businessDays);
  const remainingHours = (businessDays - days) * 8;
  
  if (remainingHours < 0.5) {
    return `${days}d`;
  }
  
  return `${days}d ${formatDuration(remainingHours * 60)}`;
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function isBusinessHours(date: Date = new Date()): boolean {
  const hour = date.getHours();
  const day = date.getDay();
  
  // Monday = 1, Friday = 5
  const isWeekday = day >= 1 && day <= 5;
  const isDuringBusinessHours = hour >= 9 && hour < 17;
  
  return isWeekday && isDuringBusinessHours;
}
