'use client';

export const dynamic = 'force-dynamic';
export const revalidate = false;

import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

export default function SubscribePage() {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">ProjectMind</h1>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
            Start free and upgrade when you're ready for more advanced features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle className="text-2xl">Personal</CardTitle>
                  <CardDescription>Perfect for individuals</CardDescription>
                </div>
                <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Free
                </div>
              </div>
              <div>
                <span className="text-5xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button className="w-full mb-6" variant="outline">
                  Current Plan
                </Button>
              </Link>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-green-700 dark:text-green-400">✅ Included (Free):</h4>
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="border-primary relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
            </div>
            <CardHeader className="pt-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle className="text-2xl">Premium</CardTitle>
                  <CardDescription>For professionals & teams</CardDescription>
                </div>
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Professional
                </div>
              </div>
              <div>
                <span className="text-5xl font-bold">$20</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full mb-6" data-testid="button-upgrade">
                Upgrade to Premium
              </Button>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">🌟 Everything in Personal, plus:</h4>
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I switch plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected immediately.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards, debit cards, and PayPal for secure payments.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is my data secure?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely! We use industry-standard encryption and security practices. Premium users get additional end-to-end encryption.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
