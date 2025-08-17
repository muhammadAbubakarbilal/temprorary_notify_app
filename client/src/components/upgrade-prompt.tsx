import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface UpgradePromptProps {
  feature: string;
  description: string;
  onClose?: () => void;
}

export function UpgradePrompt({ feature, description, onClose }: UpgradePromptProps) {
  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-amber-600" />
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            Premium Feature
          </Badge>
        </div>
        <CardTitle className="text-lg">{feature}</CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link href="/subscribe">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose} className="flex-shrink-0">
              Maybe Later
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface FeatureGateProps {
  feature: string;
  description: string;
  isEnabled: boolean;
  children: React.ReactNode;
}

export function FeatureGate({ feature, description, isEnabled, children }: FeatureGateProps) {
  if (isEnabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg">
        <UpgradePrompt feature={feature} description={description} />
      </div>
    </div>
  );
}