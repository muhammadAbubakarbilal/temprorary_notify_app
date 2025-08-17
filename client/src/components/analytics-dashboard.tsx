import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  Users,
  Zap,
  Award,
  Activity,
  ChevronRight,
  PieChart,
  LineChart
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatTime, formatDuration } from "@/lib/time-utils";

interface AnalyticsDashboardProps {
  projectId?: string;
  workspaceId?: string;
  hasAdvancedAnalytics?: boolean;
}

interface ProductivityMetrics {
  completionRate: number;
  averageTaskTime: number;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  totalTimeTracked: number;
  mostProductiveHour: number;
  productivityScore: number;
  tasksCompleted: number;
  averageCompletionTime: number;
  focusScore: number;
  productivityTrend: number;
}

interface TimeTrackingAnalytics {
  dailyHours: { date: string; hours: number }[];
  weeklyHours: { week: string; hours: number }[];
  projectBreakdown: { projectId: string; projectName: string; hours: number; percentage: number }[];
  averageSessionLength: number;
  totalSessions: number;
  totalTracked: number;
  dailyAverage: number;
  weeklyTrend: number[];
}

interface TeamMetrics {
  activeMembers: number;
  collaborationScore: number;
  taskDistribution: { member: string; tasks: number }[];
}

function AnalyticsDashboard({ projectId, workspaceId, hasAdvancedAnalytics = true }: AnalyticsDashboardProps) {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('week');
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: productivityMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/analytics/productivity', timeframe],
    queryFn: () => apiRequest('/api/analytics/productivity'),
    enabled: hasAdvancedAnalytics,
  });

  const { data: timeAnalytics, isLoading: timeLoading } = useQuery({
    queryKey: ['/api/analytics/time-tracking', timeframe],
    queryFn: () => apiRequest('/api/analytics/time-tracking'),
    enabled: hasAdvancedAnalytics,
  });

  const { data: teamMetrics } = useQuery({
    queryKey: ['analytics/team', workspaceId, selectedPeriod],
    queryFn: () => apiRequest(`/analytics/team?period=${selectedPeriod}&workspaceId=${workspaceId}`),
    enabled: !!workspaceId && hasAdvancedAnalytics,
  });

  if (!hasAdvancedAnalytics) {
    return (
      <Card className="text-center py-8" data-testid="analytics-upgrade-prompt">
        <CardContent>
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
          <p className="text-muted-foreground mb-4">
            Get detailed insights into your productivity with Premium analytics
          </p>
          <Button data-testid="button-upgrade-analytics">
            Upgrade to Premium
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (metricsLoading || timeLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="analytics-loading">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getProductivityLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'bg-green-500' };
    if (score >= 60) return { level: 'Good', color: 'bg-blue-500' };
    if (score >= 40) return { level: 'Fair', color: 'bg-yellow-500' };
    return { level: 'Needs Improvement', color: 'bg-red-500' };
  };

  const metrics: ProductivityMetrics = productivityMetrics || {
    completionRate: 75,
    averageTaskTime: 45,
    tasksCompletedToday: 3,
    tasksCompletedThisWeek: 12,
    totalTimeTracked: 28,
    mostProductiveHour: 10,
    productivityScore: 78,
    tasksCompleted: 12,
    averageCompletionTime: 45,
    focusScore: 78,
    productivityTrend: 5
  };

  const timeData: TimeTrackingAnalytics = timeAnalytics || {
    dailyHours: [],
    weeklyHours: [],
    projectBreakdown: [
      { projectId: '1', projectName: 'Main Project', hours: 20, percentage: 71 },
      { projectId: '2', projectName: 'Side Project', hours: 8, percentage: 29 }
    ],
    averageSessionLength: 85,
    totalSessions: 24,
    totalTracked: 28,
    dailyAverage: 4,
    weeklyTrend: []
  };

  const teamData: TeamMetrics = teamMetrics || {
    activeMembers: 0,
    collaborationScore: 0,
    taskDistribution: []
  };

  const productivityLevel = getProductivityLevel(metrics.productivityScore);

  return (
    <div className="h-full p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ai-text">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Your productivity insights and trends
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40" data-testid="select-timeframe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
            <TabsTrigger value="time">Time Tracking</TabsTrigger>
            <TabsTrigger value="team">Team Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card data-testid="metric-completion-rate">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <Target className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.completionRate}%</div>
                  <Progress value={metrics.completionRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card data-testid="metric-productivity-score">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
                  <Award className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.productivityScore}</div>
                  <Badge className={`mt-2 ${productivityLevel.color} text-white`}>
                    {productivityLevel.level}
                  </Badge>
                </CardContent>
              </Card>

              <Card data-testid="metric-tasks-completed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasks This Week</CardTitle>
                  <Activity className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.tasksCompletedThisWeek}</div>
                  <span className="text-sm text-muted-foreground">
                    {metrics.tasksCompletedToday} today
                  </span>
                </CardContent>
              </Card>

              <Card data-testid="metric-time-tracked">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time Tracked</CardTitle>
                  <Clock className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalTimeTracked}h</div>
                  <span className="text-sm text-muted-foreground">
                    Peak: {metrics.mostProductiveHour}:00
                  </span>
                </CardContent>
              </Card>
            </div>

            {/* Quick Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="project-breakdown">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Project Time Breakdown
                  </CardTitle>
                  <CardDescription>How your time is distributed across projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {timeData.projectBreakdown.map((project, index) => (
                      <div key={project.projectId} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{project.projectName}</span>
                          <span className="text-muted-foreground">{project.hours}h ({project.percentage}%)</span>
                        </div>
                        <Progress value={project.percentage} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="session-stats">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Session Statistics
                  </CardTitle>
                  <CardDescription>Your work session patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Total Sessions</span>
                      <span className="text-xl font-bold">{timeData.totalSessions}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Average Length</span>
                      <span className="text-xl font-bold">{timeData.averageSessionLength}m</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Focus Score</span>
                      <span className="text-xl font-bold">
                        {Math.round((timeData.averageSessionLength / 60) * 10)}/10
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Productivity Tab */}
          <TabsContent value="productivity" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Completion Rate</CardTitle>
                  <CardDescription>Tasks completed vs assigned</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-ai-text">
                    {Math.round((metrics.tasksCompleted / Math.max(metrics.tasksCompleted + 5, 1)) * 100)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avg Completion Time</CardTitle>
                  <CardDescription>Average time per task</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-ai-text">
                    {formatDuration(metrics.averageCompletionTime)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Focus Sessions</CardTitle>
                  <CardDescription>Deep work periods</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-ai-text">
                    {Math.floor(metrics.focusScore / 10)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Time Tracking Tab */}
          <TabsContent value="time" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Time Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Tracked:</span>
                    <span className="font-bold">{formatTime(timeData.totalTracked)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Average:</span>
                    <span className="font-bold">{formatTime(timeData.dailyAverage)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Most Productive Hour:</span>
                    <span className="font-bold">{metrics.mostProductiveHour}:00</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <BarChart3 className="h-16 w-16 mb-4" />
                    <p>Weekly chart would go here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Team Analytics Tab */}
          <TabsContent value="team" className="space-y-6">
            {workspaceId ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Active Members:</span>
                      <span className="font-bold">{teamData.activeMembers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Collaboration Score:</span>
                      <span className="font-bold">{teamData.collaborationScore}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Task Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {teamData.taskDistribution.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No team data available</p>
                      ) : (
                        teamData.taskDistribution.map((member, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{member.member}</span>
                            <span className="font-bold">{member.tasks} tasks</span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Team Analytics Unavailable</h3>
                  <p className="text-muted-foreground">
                    Team analytics are available in professional workspaces
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Insights & Recommendations */}
        <Card data-testid="insights-recommendations" className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription>Personalized recommendations to boost productivity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {metrics.completionRate < 70 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                  <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Improve Task Completion
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Break down large tasks into smaller, manageable chunks to boost completion rates.
                    </p>
                  </div>
                </div>
              )}

              {metrics.averageTaskTime > 60 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      Optimize Time Management
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Consider using time-boxing techniques to improve focus and reduce task duration.
                    </p>
                  </div>
                </div>
              )}

              {metrics.tasksCompletedThisWeek < 5 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                  <Activity className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Increase Weekly Output
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Set daily task goals to maintain consistent progress throughout the week.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { AnalyticsDashboard };
export default AnalyticsDashboard;