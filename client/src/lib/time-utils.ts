export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

export function parseTimeInput(timeString: string): number {
  // Parse formats like "2h 30m", "1:30", "90m", etc.
  const hourMinuteRegex = /^(\d+)h\s*(\d+)m$/i;
  const colonFormatRegex = /^(\d+):(\d+)$/;
  const minutesOnlyRegex = /^(\d+)m$/i;
  const hoursOnlyRegex = /^(\d+)h$/i;
  
  let match = timeString.match(hourMinuteRegex);
  if (match) {
    return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60;
  }
  
  match = timeString.match(colonFormatRegex);
  if (match) {
    return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60;
  }
  
  match = timeString.match(minutesOnlyRegex);
  if (match) {
    return parseInt(match[1]) * 60;
  }
  
  match = timeString.match(hoursOnlyRegex);
  if (match) {
    return parseInt(match[1]) * 3600;
  }
  
  return 0;
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
}
