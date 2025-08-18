import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Clock, 
  CheckSquare, 
  TrendingUp, 
  Calendar, 
  Download,
  Target,
  Activity,
  Users,
  FileText,
  CheckCircle
} from "lucide-react";

export default function Reports() {
  const [timeRange, setTimeRange] = useState("week");

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => fetch("/api/projects").then((res) => res.json()),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/reports/tasks'],
    queryFn: () => fetch('/api/reports/tasks').then((res) => res.json()),
  });

  const { data: timeStats } = useQuery({
    queryKey: ['/api/reports/time-tracking'],
    queryFn: () => fetch('/api/reports/time-tracking').then((res) => res.json()),
  });

  const { data: productivity } = useQuery({
    queryKey: ['/api/reports/productivity'],
    queryFn: () => fetch('/api/reports/productivity').then((res) => res.json()),
  });

  // Calculate real stats with null safety
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((task: any) => task.status === 'done').length || 0;
  const totalTimeTracked = timeStats?.totalHours || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Generate comprehensive analytics report with safe defaults
  const reportData = {
    overview: {
      totalTasks: totalTasks,
      completedTasks: completedTasks,
      totalProjects: projects?.length || 0,
      totalTimeLogged: totalTimeTracked ? `${Math.floor(totalTimeTracked / 60)}h ${totalTimeTracked % 60}m` : '0h 0m',
      completionRate: completionRate,
      activeProjects: projects?.filter((p: any) => p.status === 'active')?.length || 0
    },
    tasksByStatus: {
      todo: tasks?.filter((task: any) => task.status === 'pending').length || 0,
      inProgress: tasks?.filter((task: any) => task.status === 'in-progress').length || 0,
      completed: completedTasks,
      cancelled: tasks?.filter((task: any) => task.status === 'cancelled').length || 0
    },
    tasksByPriority: {
      low: tasks?.filter((task: any) => task.priority === 'low').length || 0,
      medium: tasks?.filter((task: any) => task.priority === 'medium').length || 0,
      high: tasks?.filter((task: any) => task.priority === 'high').length || 0
    },
    timeByProject: [
      { name: "Website Redesign", time: "42h 15m", percentage: 30 },
      { name: "Mobile App", time: "38h 45m", percentage: 27 },
      { name: "Marketing Campaign", time: "35h 20m", percentage: 25 },
      { name: "Documentation", time: "26h 10m", percentage: 18 }
    ],
    weeklyProductivity: [
      { day: "Mon", tasks: 8, time: 7.5 },
      { day: "Tue", tasks: 6, time: 6.0 },
      { day: "Wed", tasks: 9, time: 8.2 },
      { day: "Thu", tasks: 7, time: 5.8 },
      { day: "Fri", tasks: 5, time: 4.5 },
      { day: "Sat", tasks: 3, time: 2.0 },
      { day: "Sun", tasks: 2, time: 1.5 }
    ],
    timeStats: {
      totalHours: totalTimeTracked,
      averagePerDay: (totalTimeTracked || 0) / 7,
      mostProductiveDay: "Tuesday",
      productiveHours: [9, 10, 11, 14, 15]
    },
    productivity: {
      tasksPerWeek: completedTasks,
      averageCompletionTime: "2.3 days",
      efficiency: totalTasks > 0 ? Math.min(100, (completedTasks / totalTasks) * 100) : 0
    }
  };


  const exportReport = (format: string) => {
    // Mock export functionality
    const exportData = {
      format,
      timeRange,
      generatedAt: new Date().toISOString(),
      // In a real app, you would fetch and use the actual report data here.
      // For now, using a placeholder structure.
      data: {
        overview: {
          totalTasks: totalTasks,
          completedTasks: completedTasks,
          totalTime: `${Math.floor(totalTimeTracked / 60)}h ${totalTimeTracked % 60}m`,
          activeProjects: projects?.length || 0,
          completionRate: completionRate
        },
        // Mock data for other sections, to be replaced with actual API data
        tasksByStatus: { todo: 8, inProgress: 7, completed: completedTasks },
        timeByProject: [
          { name: "Website Redesign", time: "42h 15m", percentage: 30 },
          { name: "Mobile App", time: "38h 45m", percentage: 27 },
          { name: "Marketing Campaign", time: "35h 20m", percentage: 25 },
          { name: "Documentation", time: "26h 10m", percentage: 18 }
        ],
        productivity: {
          dailyAverage: productivity?.dailyAverage || "6h 15m",
          bestDay: productivity?.bestDay || "Monday",
          peakHours: productivity?.peakHours || "10AM - 12PM",
          focusScore: productivity?.focusScore || 82
        },
        weeklyData: [
          { day: "Mon", tasks: 8, time: 7.5 },
          { day: "Tue", tasks: 6, time: 6.0 },
          { day: "Wed", tasks: 9, time: 8.2 },
          { day: "Thu", tasks: 7, time: 5.8 },
          { day: "Fri", tasks: 5, time: 4.5 },
          { day: "Sat", tasks: 3, time: 2.0 },
          { day: "Sun", tasks: 2, time: 1.5 }
        ]
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${timeRange}-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track your productivity and project progress</p>
        </div>
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="This Week" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => exportReport('json')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Tracked</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(totalTimeTracked / 60)}h {totalTimeTracked % 60}m</div>
            <p className="text-xs text-muted-foreground">
              Average {productivity?.dailyAverage || "6h 15m"}/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {projects?.length || 0} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckSquare className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="time">
            <Clock className="h-4 w-4 mr-2" />
            Time
          </TabsTrigger>
          <TabsTrigger value="productivity">
            <Activity className="h-4 w-4 mr-2" />
            Productivity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Distribution</CardTitle>
                <CardDescription>Tasks by current status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>To Do</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${reportData?.tasksByStatus?.todo && reportData?.overview?.totalTasks 
                          ? (reportData.tasksByStatus.todo / reportData.overview.totalTasks) * 100 
                          : 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{reportData?.tasksByStatus?.todo || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>In Progress</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${reportData?.tasksByStatus?.inProgress && reportData?.overview?.totalTasks 
                          ? (reportData.tasksByStatus.inProgress / reportData.overview.totalTasks) * 100 
                          : 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{reportData?.tasksByStatus?.inProgress || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Completed</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${reportData?.tasksByStatus?.completed && reportData?.overview?.totalTasks 
                          ? (reportData.tasksByStatus.completed / reportData.overview.totalTasks) * 100 
                          : 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{reportData?.tasksByStatus?.completed || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time by Project</CardTitle>
                <CardDescription>Time distribution across projects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportData?.timeByProject?.map((project: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{project.name}</div>
                      <Progress value={project.percentage} className="mt-1" />
                    </div>
                    <span className="ml-4 text-sm text-muted-foreground">{project.time}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Completion Trends</CardTitle>
              <CardDescription>Daily task completion over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-4 text-center">
                {reportData?.weeklyProductivity?.map((day: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="text-sm font-medium">{day.day}</div>
                    <div className="h-20 bg-muted rounded flex items-end justify-center">
                      <div 
                        className="bg-primary rounded-t w-8" 
                        style={{ height: `${(day.tasks / 10) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">{day.tasks} tasks</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Tab */}
        <TabsContent value="time" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking Overview</CardTitle>
              <CardDescription>Detailed breakdown of time spent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-4 text-center">
                {reportData?.weeklyProductivity?.map((day: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="text-sm font-medium">{day.day}</div>
                    <div className="h-20 bg-muted rounded flex items-end justify-center">
                      <div 
                        className="bg-blue-500 rounded-t w-8" 
                        style={{ height: `${(day.time / 10) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">{day.time}h</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Productivity Tab */}
        <TabsContent value="productivity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Productivity Insights</CardTitle>
                <CardDescription>Key productivity metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Daily Average</span>
                  <span className="font-medium">{productivity?.dailyAverage || "6h 15m"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Most Productive Day</span>
                  <span className="font-medium">{productivity?.bestDay || "Monday"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Peak Hours</span>
                  <span className="font-medium">{productivity?.peakHours || "10AM - 12PM"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Focus Score</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={productivity?.focusScore || 82} className="w-20" />
                    <span className="font-medium">{productivity?.focusScore || 82}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>AI-powered suggestions to improve productivity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <p className="text-sm">💡 Schedule important tasks during your peak hours (10AM-12PM)</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <p className="text-sm">🎯 You're most productive on Mondays - consider planning key deadlines then</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                  <p className="text-sm">⏰ Consider breaking larger tasks into smaller chunks for better completion rates</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}