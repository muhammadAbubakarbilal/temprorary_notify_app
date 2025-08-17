import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Calendar, TrendingUp, Play, OctagonMinus, Pause, Download, Edit, BarChart3, Target } from "lucide-react";
import { formatTime, formatDuration } from "@/lib/time-utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TimeTrackingProps {
  projectId: string;
}

interface TimeEntry {
  id: string;
  taskId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  description?: string;
  createdAt: string;
}

interface ActiveTimer {
  id: string;
  taskId: string;
  startTime: string;
  createdAt: string;
}

interface TimeTrackingStats {
  totalTime: number;
  todayTime: number;
  weekTime: number;
  averageSession: number;
  productivity: number;
}

export default function TimeTracking({ projectId }: TimeTrackingProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const { toast } = useToast();

  // Fetch real data
  const { data: activeTimer } = useQuery({
    queryKey: ['/api/timer/active'],
    refetchInterval: isTracking ? 1000 : false,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/projects', projectId, 'tasks'],
    enabled: !!projectId,
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['/api/time-entries'],
  });

  const { data: activeTimers = [] } = useQuery({
    queryKey: ['/api/timers/active'],
    refetchInterval: 1000, // Update every second
  });

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const start = startTime.getTime();
        setElapsedTime(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  // Update from active timer
  useEffect(() => {
    if (activeTimer) {
      setIsTracking(true);
      setCurrentTask(activeTimer.taskId);
      setStartTime(new Date(activeTimer.startTime));
    } else {
      setIsTracking(false);
      setCurrentTask(null);
      setElapsedTime(0);
    }
  }, [activeTimer]);

  const handleStartStop = async () => {
    if (isTracking) {
      // Stop timer
      try {
        await fetch('/api/timer/stop', { method: 'POST' });
        queryClient.invalidateQueries({ queryKey: ['/api/timer/active'] });
        queryClient.invalidateQueries({ queryKey: ['/api/timers/active'] });
        queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'tasks'] });
        setIsTracking(false);
        setCurrentTask(null);
        setElapsedTime(0);
        setStartTime(null);
        toast({
          title: "Timer stopped",
          description: "Time logged successfully.",
        });
      } catch (error) {
        console.error('Failed to stop timer:', error);
        toast({
          title: "Error",
          description: "Failed to stop timer. Please try again.",
          variant: "destructive",
        });
      }
    } else if (selectedTask) {
      // Start timer
      try {
        await fetch('/api/timer/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: selectedTask })
        });
        queryClient.invalidateQueries({ queryKey: ['/api/timer/active'] });
        queryClient.invalidateQueries({ queryKey: ['/api/timers/active'] });
        setIsTracking(true);
        setCurrentTask(selectedTask);
        setStartTime(new Date());
        setElapsedTime(0);
      } catch (error) {
        console.error('Failed to start timer:', error);
        toast({
          title: "Error",
          description: "Failed to start timer. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Calculate active timer duration
  const getActiveTimerDuration = () => {
    if (!activeTimer) return 0;
    return Math.floor((currentTime.getTime() - new Date((activeTimer as any)?.startTime).getTime()) / 1000);
  };

  // Calculate duration for specific timer
  const getTimerDuration = (timer: any) => {
    if (!timer) return 0;
    return Math.floor((currentTime.getTime() - new Date(timer.startTime).getTime()) / 1000);
  };

  // Get all active tasks
  const getActiveTasksWithTimers = () => {
    return (activeTimers as any[]).map((timer: any) => {
      const task = (tasks as any[]).find((task: any) => task.id === timer.taskId);
      return {
        timer,
        task,
        duration: getTimerDuration(timer)
      };
    });
  };

  // Get the active task (for backward compatibility)
  const activeTask = activeTimer ? (tasks as any[]).find((task: any) => task.id === (activeTimer as any)?.taskId) : null;

  const activeTasksWithTimers = getActiveTasksWithTimers();

  const stopTimerMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest('/timer/stop', { method: 'POST', body: JSON.stringify({ taskId }) });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timer/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timers/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'tasks'] });
      toast({
        title: "Timer stopped",
        description: "Time logged successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to stop timer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startTimer = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest('/timer/start', { method: 'POST', body: JSON.stringify({ taskId }) });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timer/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timers/active'] });
      toast({
        title: "Timer started",
        description: "Time tracking has begun.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start timer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate time statistics
  const totalTimeToday = (tasks as any[]).reduce((sum: number, task: any) => sum + (task.totalTime || 0), 0);
  const totalTimeWeek = totalTimeToday; // Simplified for demo
  const averagePerDay = Math.floor(totalTimeWeek / 7);

  // Fetch time tracking statistics
  const { data: stats } = useQuery({
    queryKey: ['time-stats', projectId],
    queryFn: () => apiRequest(`/time-entries/stats/${projectId}`),
  });

  const timeStats: TimeTrackingStats = stats || {
    totalTime: 0,
    todayTime: 0,
    weekTime: 0,
    averageSession: 0,
    productivity: 0
  };

  return (
    <div className="h-full p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto">
        {/* Time Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Clock className="h-4 w-4 text-ai-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ai-text mb-1" data-testid="time-today">
                {formatTime(timeStats.todayTime)}
              </div>
              <CardDescription className="text-sm">+1h 15m from yesterday</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-ai-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ai-text mb-1" data-testid="time-week">
                {formatTime(timeStats.weekTime)}
              </div>
              <CardDescription className="text-sm">5 days tracked</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Per Day</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ai-text mb-1" data-testid="time-average">
                {formatTime(timeStats.averageSession)}
              </div>
              <CardDescription className="text-sm text-accent">+12% this week</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Timers</CardTitle>
              <Play className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ai-text mb-1" data-testid="active-timer">
                {activeTasksWithTimers.length}
              </div>
              <CardDescription className="text-sm">
                {activeTasksWithTimers.length === 0 ? "No active timers" :
                 activeTasksWithTimers.length === 1 ? "1 task running" :
                 `${activeTasksWithTimers.length} tasks running`}
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Start/Stop Timer Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-ai-text">Time Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <Select value={selectedTask} onValueChange={setSelectedTask}>
                  <SelectTrigger className="w-96">
                    <SelectValue placeholder="Select a task to track time" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((task: any) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleStartStop} disabled={!selectedTask && !isTracking}>
                  {isTracking ? (
                    <OctagonMinus className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {isTracking ? "Stop Timer" : "Start Timer"}
                </Button>
              </div>
              <div className="text-2xl font-bold text-ai-text">
                {formatTime(elapsedTime)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Activities - Show all active timers */}
        {activeTasksWithTimers.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-ai-text">
                Current Activities ({activeTasksWithTimers.length} running)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeTasksWithTimers.map(({ timer, task, duration }, index) => (
                  <div key={timer.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <div>
                        <div className="font-medium text-ai-text" data-testid={`current-task-title-${index}`}>
                          {task?.title || 'Unknown Task'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {task?.project?.name || 'Unknown Project'} • {task?.status?.replace('_', ' ') || 'in progress'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-red-600" data-testid={`current-timer-${index}`}>
                        {formatTime(duration)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={() => task && stopTimerMutation.mutate(task.id)}
                          disabled={stopTimerMutation.isPending}
                          data-testid={`stop-timer-${task?.id}`}
                        >
                          <OctagonMinus className="h-4 w-4 mr-2" />
                          {stopTimerMutation.isPending ? "Stopping..." : "Stop"}
                        </Button>
                        <Button
                          variant="outline"
                          data-testid={`pause-timer-${task?.id}`}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Entries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-ai-text">Recent Time Entries</CardTitle>
                <CardDescription>Track your time across tasks and projects</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32" data-testid="select-time-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" data-testid="export-time-entries">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">No time entries yet</p>
                  <p className="text-muted-foreground text-xs mt-1">Start tracking time on your tasks</p>
                </div>
              ) : (
                timeEntries.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors"
                    data-testid={`time-entry-${entry.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.task?.color || '#ccc' }}
                      />
                      <div>
                        <div className="font-medium text-ai-text">{entry.task?.title || entry.taskTitle}</div>
                        <div className="text-sm text-muted-foreground">{entry.project?.name || entry.projectName}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <span className="text-sm text-muted-foreground">{new Date(entry.startTime).toLocaleDateString()}</span>
                      <span className="font-medium text-ai-text" data-testid={`entry-duration-${entry.id}`}>
                        {formatDuration(entry.duration)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-ai-primary"
                        data-testid={`edit-entry-${entry.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}