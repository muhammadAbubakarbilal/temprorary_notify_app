import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lock, ArrowRight, Zap, Users, Shield, BarChart3, Brain, Clock } from "lucide-react";

export default function Landing() {
  const freeFeatures = [
    "AI Note-taking (basic NLP task extraction, up to 5 tasks/day)",
    "Personal Task Board (single workspace only)",
    "Simple Time Tracking (start/stop timer on tasks)",
    "Recurring Tasks (limited: daily only)",
    "Cross-device sync (1 device only)",
    "Export Notes (basic text export only)",
    "Basic AI Suggestions"
  ];

  const premiumFeatures = [
    "Unlimited Workspaces (personal + professional)",
    "Advanced AI Task Extraction & Priority Analysis", 
    "AI Time Estimation",
    "Custom Recurrence Rules (weekly/monthly/intervals)",
    "Professional Mode with Team Management",
    "Team Collaboration (assign tasks, track statuses)",
    "Unlimited Device Sync",
    "End-to-end Encryption for Personal Workspace",
    "Advanced Reports & Analytics",
    "Attachments in Notes/Tasks",
    "Priority Customer Support"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold">ProjectMind</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <a href="/signin?mode=login" data-testid="button-signin">Sign In</a>
            </Button>
            <Button asChild>
              <a href="/signin?mode=signup" data-testid="button-get-started">Get Started Free</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-4">
            AI-Powered Productivity Platform
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Your AI-Powered Second Brain for Project Management
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your notes into actionable tasks with AI, manage projects with ease, 
            and track time effortlessly. From personal planning to professional collaboration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <a href="/signin?mode=signup" data-testid="button-start-free">
                Start Free Today <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <a href="/signin?mode=login">
                Sign In
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-16 px-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Intelligent Project Management</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Combining AI-powered note-taking, smart task management, and time tracking in one seamless platform.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <Zap className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>AI-Powered Notes</CardTitle>
                <CardDescription>
                  Turn your thoughts into actionable tasks automatically with advanced AI analysis
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Smart Analytics</CardTitle>
                <CardDescription>
                  Get insights into your productivity patterns and optimize your workflow
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Scale from personal productivity to full team project management
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-muted-foreground">
              Start free and upgrade when you're ready for more advanced features
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Personal</CardTitle>
                    <CardDescription>Perfect for individuals</CardDescription>
                  </div>
                  <Badge variant="secondary">Free</Badge>
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full mb-6" variant="outline" asChild>
                  <a href="/signin?mode=signup">Get Started Free</a>
                </Button>
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-700 dark:text-green-400">✅ Included (Free):</h4>
                  {freeFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border-blue-200 dark:border-blue-800">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white px-4 py-1">Most Popular</Badge>
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Premium</CardTitle>
                    <CardDescription>For professionals & teams</CardDescription>
                  </div>
                  <Badge>Professional</Badge>
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$20</span>
                  <span className="text-muted-foreground">/month per editor</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full mb-6" asChild>
                  <a href="/signin?mode=signup">Start Premium Trial</a>
                </Button>
                <div className="space-y-3">
                  <h4 className="font-semibold text-muted-foreground">Everything in Free, PLUS:</h4>
                  {premiumFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Premium Features Highlight */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold mb-6">Premium Features Preview</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Lock className="h-5 w-5 text-amber-600" />
                <span className="text-sm">Multiple Workspaces</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Lock className="h-5 w-5 text-amber-600" />
                <span className="text-sm">Advanced AI Analysis</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Lock className="h-5 w-5 text-amber-600" />
                <span className="text-sm">Team Collaboration</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Lock className="h-5 w-5 text-amber-600" />
                <span className="text-sm">Advanced Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Productivity?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who've supercharged their project management with AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <a href="/signin?mode=signup">Start Free Today</a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 text-white border-white hover:bg-white hover:text-blue-600" asChild>
              <a href="/signin?mode=login">Sign In</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900 text-slate-300">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-6 w-6 text-blue-400" />
                <span className="text-white font-bold">ProjectMind</span>
              </div>
              <p className="text-sm">
                AI-powered project management and note-taking for modern teams and individuals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 ProjectMind. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}