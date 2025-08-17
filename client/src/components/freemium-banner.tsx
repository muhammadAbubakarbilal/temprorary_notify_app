import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Crown, 
  X,
  ChevronRight,
  TrendingUp,
  Users,
  BarChart3,
  Sparkles,
  Clock,
  Calendar
} from "lucide-react";

interface FreemiumBannerProps {
  usageStats?: {
    tasksExtracted: number;
    maxTasks: number;
    storageUsed: number;
    maxStorage: number;
  };
  daysLeftInTrial?: number;
  showTrialOffer?: boolean;
  onDismiss?: () => void;
  position?: 'top' | 'bottom' | 'sidebar';
}

export default function FreemiumBanner({ 
  usageStats = {
    tasksExtracted: 12,
    maxTasks: 20,
    storageUsed: 2.3,
    maxStorage: 5
  },
  daysLeftInTrial,
  showTrialOffer = true,
  onDismiss,
  position = 'top'
}: FreemiumBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleUpgrade = () => {
    window.location.href = '/subscribe';
  };

  const taskUsagePercent = (usageStats.tasksExtracted / usageStats.maxTasks) * 100;
  const storageUsagePercent = (usageStats.storageUsed / usageStats.maxStorage) * 100;
  const isNearLimit = taskUsagePercent >= 80 || storageUsagePercent >= 80;

  if (isDismissed) return null;

  // Compact sidebar version
  if (position === 'sidebar') {
    return (
      <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20" data-testid="freemium-banner-sidebar">
        <CardContent className="p-4">
          <div className="text-center space-y-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full w-fit mx-auto">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Go Premium</h4>
              <p className="text-xs text-muted-foreground">
                Unlock all features
              </p>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>AI Tasks</span>
                  <span>{usageStats.tasksExtracted}/{usageStats.maxTasks}</span>
                </div>
                <Progress value={taskUsagePercent} className="h-2" />
              </div>
            </div>
            <Button size="sm" onClick={handleUpgrade} className="w-full bg-amber-600 hover:bg-amber-700 text-white" data-testid="button-upgrade-sidebar">
              <Crown className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full banner for top/bottom positions
  return (
    <Card className={`border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 ${position === 'bottom' ? 'mt-6' : 'mb-6'}`} data-testid="freemium-banner">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Crown className="h-6 w-6 text-amber-600" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {daysLeftInTrial ? `${daysLeftInTrial} days left in trial` : 'Unlock Premium Features'}
                </h3>
                <Badge className="bg-amber-500 text-white">
                  {daysLeftInTrial ? 'Trial' : 'Free Plan'}
                </Badge>
                {isNearLimit && (
                  <Badge variant="destructive">
                    Usage Limit
                  </Badge>
                )}
              </div>
              
              <p className="text-muted-foreground">
                {daysLeftInTrial 
                  ? 'Continue enjoying Premium features or upgrade to keep unlimited access'
                  : 'Get unlimited AI task extraction, team collaboration, and advanced analytics'
                }
              </p>

              {/* Usage Stats */}
              <div className="grid gap-4 md:grid-cols-2 mt-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI Task Extractions
                    </span>
                    <span className={taskUsagePercent >= 80 ? 'text-red-600 font-medium' : ''}>
                      {usageStats.tasksExtracted}/{usageStats.maxTasks}
                    </span>
                  </div>
                  <Progress 
                    value={taskUsagePercent} 
                    className={`h-2 ${taskUsagePercent >= 80 ? '[&>div]:bg-red-500' : '[&>div]:bg-amber-500'}`}
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      Storage
                    </span>
                    <span className={storageUsagePercent >= 80 ? 'text-red-600 font-medium' : ''}>
                      {usageStats.storageUsed}GB/{usageStats.maxStorage}GB
                    </span>
                  </div>
                  <Progress 
                    value={storageUsagePercent} 
                    className={`h-2 ${storageUsagePercent >= 80 ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Premium Features Preview */}
            <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-white/50 dark:bg-black/20 rounded-lg border">
              <div className="flex items-center gap-1 text-sm">
                <Users className="h-4 w-4 text-blue-600" />
                <span>Team Collaboration</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>Advanced Analytics</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4 text-purple-600" />
                <span>Time Tracking</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {showTrialOffer && !daysLeftInTrial && (
                <Button variant="outline" size="sm" data-testid="button-start-trial">
                  <Calendar className="h-4 w-4 mr-2" />
                  Start 7-Day Trial
                </Button>
              )}
              
              <Button 
                onClick={handleUpgrade}
                className="bg-amber-600 hover:bg-amber-700 text-white"
                data-testid="button-upgrade-banner"
              >
                <Crown className="h-4 w-4 mr-2" />
                {daysLeftInTrial ? 'Upgrade Now' : 'Go Premium'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>

              {onDismiss && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleDismiss}
                  data-testid="button-dismiss-banner"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile-optimized layout */}
        <div className="lg:hidden mt-4 space-y-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span>Teams</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>Analytics</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-purple-600" />
              <span>Time Tracking</span>
            </div>
          </div>
          
          {showTrialOffer && !daysLeftInTrial && (
            <Button variant="outline" size="sm" className="w-full" data-testid="button-start-trial-mobile">
              <Calendar className="h-4 w-4 mr-2" />
              Start 7-Day Free Trial
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}