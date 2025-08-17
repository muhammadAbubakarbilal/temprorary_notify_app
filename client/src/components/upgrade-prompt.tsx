import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  ChevronRight, 
  Check,
  Sparkles,
  Users,
  BarChart3,
  Paperclip,
  Repeat,
  Clock
} from "lucide-react";

interface UpgradePromptProps {
  feature?: string;
  title?: string;
  description?: string;
  showFeatureList?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const PREMIUM_FEATURES = [
  {
    icon: Sparkles,
    title: "Advanced AI Task Extraction",
    description: "Smart task suggestions with time estimation and priority analysis"
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Productivity insights, time tracking reports, and performance trends"
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite team members, manage roles, and work together on projects"
  },
  {
    icon: Paperclip,
    title: "File Attachments",
    description: "Attach documents, images, and files to notes and tasks"
  },
  {
    icon: Repeat,
    title: "Advanced Recurring Tasks",
    description: "Complex recurring patterns with custom schedules and end dates"
  },
  {
    icon: Clock,
    title: "Enhanced Time Tracking",
    description: "Detailed time logs, project breakdown, and productivity scoring"
  }
];

export function UpgradePrompt({ 
  feature,
  title = "Unlock Premium Features",
  description = "Upgrade to Premium to access advanced productivity tools and team collaboration features",
  showFeatureList = true,
  size = 'medium'
}: UpgradePromptProps) {
  
  const handleUpgrade = () => {
    // In production, this would redirect to the billing page
    window.location.href = '/subscribe';
  };

  if (size === 'small') {
    return (
      <Card className="text-center py-4" data-testid="upgrade-prompt-small">
        <CardContent>
          <Crown className="h-6 w-6 mx-auto text-amber-500 mb-2" />
          <p className="text-sm font-medium mb-2">{feature || "Premium Feature"}</p>
          <Button size="sm" onClick={handleUpgrade} data-testid="button-upgrade-small">
            Upgrade
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (size === 'large') {
    return (
      <div className="max-w-4xl mx-auto" data-testid="upgrade-prompt-large">
        <Card className="border-2 border-amber-200 dark:border-amber-800">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <Crown className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              {title}
              <Badge className="bg-amber-500 text-white">Premium</Badge>
            </CardTitle>
            <CardDescription className="text-lg">
              {description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {showFeatureList && (
              <div className="grid gap-4 md:grid-cols-2">
                {PREMIUM_FEATURES.map((feature, index) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FeatureIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                size="lg" 
                onClick={handleUpgrade}
                className="bg-amber-600 hover:bg-amber-700 text-white"
                data-testid="button-upgrade-large"
              >
                <Crown className="h-5 w-5 mr-2" />
                Upgrade to Premium
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                ✓ 30-day money-back guarantee • ✓ Cancel anytime • ✓ Instant access
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Medium size (default)
  return (
    <Card className="text-center border-amber-200 dark:border-amber-800" data-testid="upgrade-prompt-medium">
      <CardHeader>
        <div className="flex justify-center mb-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <Crown className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          {title}
          <Badge className="bg-amber-500 text-white">Premium</Badge>
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showFeatureList && (
          <div className="grid gap-2 text-left">
            {PREMIUM_FEATURES.slice(0, 3).map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>{feature.title}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="ml-6">And {PREMIUM_FEATURES.length - 3} more features...</span>
            </div>
          </div>
        )}
        
        <Button 
          onClick={handleUpgrade}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          data-testid="button-upgrade-medium"
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to Premium
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
        
        <p className="text-xs text-muted-foreground">
          Start your 7-day free trial
        </p>
      </CardContent>
    </Card>
  );
}