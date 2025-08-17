import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, X, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export function FreemiumBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();

  // Don't show if premium user or banner is dismissed
  if (dismissed || user?.subscriptionPlan === 'premium') {
    return null;
  }

  return (
    <Card className="mb-6 border-gradient-to-r from-purple-500/20 to-blue-500/20 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  Free Plan
                </Badge>
                <span className="text-sm font-medium">
                  Unlock Premium Features
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Get unlimited AI task extraction, multiple workspaces, team collaboration, and more!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Link href="/subscribe">
                <Crown className="w-4 h-4 mr-1" />
                Upgrade
              </Link>
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}