import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Settings, 
  User, 
  Bell, 
  Shield,
  CreditCard,
  Crown,
  Save,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserSettingsProps {
  userId: string;
  hasAdvancedSettings?: boolean;
}

interface UserPreferences {
  emailNotifications: boolean;
  taskReminders: boolean;
  weeklyDigest: boolean;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  workingHours: {
    start: string;
    end: string;
  };
  defaultProjectView: 'list' | 'kanban' | 'calendar';
}

export default function UserSettings({ 
  userId, 
  hasAdvancedSettings = false 
}: UserSettingsProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    taskReminders: true,
    weeklyDigest: false,
    theme: 'system',
    timezone: 'UTC',
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    defaultProjectView: 'kanban'
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
  });

  const { data: subscription } = useQuery({
    queryKey: [`/api/users/${userId}/subscription`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/subscription`);
      if (!response.ok) throw new Error('Failed to fetch subscription');
      return response.json();
    },
    enabled: hasAdvancedSettings,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: UserPreferences) => {
      const response = await fetch(`/api/users/${userId}/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences),
      });
      if (!response.ok) throw new Error('Failed to update preferences');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await fetch(`/api/users/${userId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    }
  });

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getUserDisplayName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.firstName || user?.email || 'Unknown User';
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="settings-loading">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="user-settings">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Manage your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-lg">
                {getInitials(getUserDisplayName(user))}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm" data-testid="button-upload-avatar">
                <Upload className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
              <p className="text-sm text-muted-foreground">
                Recommended: Square image, at least 200x200px
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                defaultValue={user?.firstName || ''}
                placeholder="Enter your first name"
                data-testid="input-first-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                defaultValue={user?.lastName || ''}
                placeholder="Enter your last name"
                data-testid="input-last-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                defaultValue={user?.email || ''}
                placeholder="your@email.com"
                disabled
                data-testid="input-email"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={preferences.timezone} onValueChange={(value) => handlePreferenceChange('timezone', value)}>
                <SelectTrigger data-testid="select-timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified about important updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive important updates via email
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
              data-testid="switch-email-notifications"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="taskReminders">Task Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about upcoming due dates
              </p>
            </div>
            <Switch
              id="taskReminders"
              checked={preferences.taskReminders}
              onCheckedChange={(checked) => handlePreferenceChange('taskReminders', checked)}
              data-testid="switch-task-reminders"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weeklyDigest">Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a summary of your weekly progress
              </p>
            </div>
            <Switch
              id="weeklyDigest"
              checked={preferences.weeklyDigest}
              onCheckedChange={(checked) => handlePreferenceChange('weeklyDigest', checked)}
              data-testid="switch-weekly-digest"
            />
          </div>
        </CardContent>
      </Card>

      {/* Workspace Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Workspace Preferences
          </CardTitle>
          <CardDescription>
            Customize your workspace appearance and behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={preferences.theme} onValueChange={(value: 'light' | 'dark' | 'system') => handlePreferenceChange('theme', value)}>
                <SelectTrigger data-testid="select-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Default Project View</Label>
              <Select value={preferences.defaultProjectView} onValueChange={(value: 'list' | 'kanban' | 'calendar') => handlePreferenceChange('defaultProjectView', value)}>
                <SelectTrigger data-testid="select-project-view">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">List View</SelectItem>
                  <SelectItem value="kanban">Kanban Board</SelectItem>
                  <SelectItem value="calendar">Calendar View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasAdvancedSettings && (
            <div className="space-y-4">
              <Separator />
              <h4 className="font-medium">Working Hours</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={preferences.workingHours.start}
                    onChange={(e) => handlePreferenceChange('workingHours', {
                      ...preferences.workingHours,
                      start: e.target.value
                    })}
                    data-testid="input-start-time"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={preferences.workingHours.end}
                    onChange={(e) => handlePreferenceChange('workingHours', {
                      ...preferences.workingHours,
                      end: e.target.value
                    })}
                    data-testid="input-end-time"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Information */}
      {hasAdvancedSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
              {subscription?.plan === 'premium' && (
                <Badge className="bg-amber-500 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Current Plan</h4>
                <p className="text-sm text-muted-foreground">
                  {subscription?.plan === 'premium' ? 'Premium Plan' : 'Free Plan'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {subscription?.plan === 'premium' ? '$20/month' : '$0'}
                </p>
                {subscription?.plan === 'premium' && (
                  <p className="text-sm text-muted-foreground">
                    Renews {subscription?.nextBilling ? new Date(subscription.nextBilling).toLocaleDateString() : 'monthly'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {subscription?.plan !== 'premium' ? (
                <Button data-testid="button-upgrade-subscription">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                </Button>
              ) : (
                <Button variant="outline" data-testid="button-manage-subscription">
                  Manage Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSavePreferences}
          disabled={updatePreferencesMutation.isPending}
          data-testid="button-save-settings"
        >
          <Save className="h-4 w-4 mr-2" />
          {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}