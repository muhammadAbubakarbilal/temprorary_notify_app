
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Repeat, 
  Calendar, 
  Clock, 
  Settings, 
  Plus,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RecurringTasksProps {
  taskId: string;
  taskTitle: string;
  hasAdvancedRecurrence?: boolean;
}

interface RecurrencePattern {
  pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  weekdays?: number[];
  monthDay?: number;
  endDate?: string;
  maxOccurrences?: number;
}

const WEEKDAYS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

function RecurringTasks({ 
  taskId, 
  taskTitle, 
  hasAdvancedRecurrence = false 
}: RecurringTasksProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pattern, setPattern] = useState<RecurrencePattern>({
    pattern: 'daily',
    interval: 1,
    weekdays: [],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createRecurrenceMutation = useMutation({
    mutationFn: async (recurrenceData: RecurrencePattern) => {
      return apiRequest(`/api/tasks/${taskId}/recurrence`, {
        method: 'POST',
        body: JSON.stringify(recurrenceData),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsOpen(false);
      toast({
        title: "Recurring tasks created",
        description: `Created ${data.count || 'multiple'} recurring instances`,
      });
    },
    onError: (error: any) => {
      if (error.message?.includes('Premium')) {
        toast({
          title: "Premium Feature",
          description: "Advanced recurring tasks require a Premium subscription",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Creation failed",
          description: error.message || "Failed to create recurring tasks",
          variant: "destructive",
        });
      }
    }
  });

  const handleWeekdayToggle = (weekday: number) => {
    setPattern(prev => ({
      ...prev,
      weekdays: prev.weekdays?.includes(weekday)
        ? prev.weekdays.filter(w => w !== weekday)
        : [...(prev.weekdays || []), weekday]
    }));
  };

  const handleCreateRecurrence = () => {
    createRecurrenceMutation.mutate(pattern);
  };

  const getPatternDescription = () => {
    switch (pattern.pattern) {
      case 'daily':
        return pattern.interval === 1 ? 'Every day' : `Every ${pattern.interval} days`;
      case 'weekly':
        if (pattern.weekdays && pattern.weekdays.length > 0) {
          const days = pattern.weekdays.map(w => WEEKDAYS[w].short).join(', ');
          return pattern.interval === 1 ? `Weekly on ${days}` : `Every ${pattern.interval} weeks on ${days}`;
        }
        return pattern.interval === 1 ? 'Weekly' : `Every ${pattern.interval} weeks`;
      case 'monthly':
        if (pattern.monthDay) {
          return pattern.interval === 1 
            ? `Monthly on day ${pattern.monthDay}` 
            : `Every ${pattern.interval} months on day ${pattern.monthDay}`;
        }
        return pattern.interval === 1 ? 'Monthly' : `Every ${pattern.interval} months`;
      case 'custom':
        return `Every ${pattern.interval} days (custom)`;
      default:
        return 'Custom pattern';
    }
  };

  if (!hasAdvancedRecurrence) {
    return (
      <Card className="text-center py-6" data-testid="recurring-upgrade-prompt">
        <CardContent>
          <Repeat className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <h4 className="font-medium mb-2">Advanced Recurring Tasks</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Set up complex recurring patterns with custom schedules and end dates
          </p>
          <Button size="sm" data-testid="button-upgrade-recurring">
            Upgrade to Premium
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-setup-recurring">
          <Repeat className="h-4 w-4 mr-2" />
          Make Recurring
          <Badge variant="secondary" className="ml-2">Premium</Badge>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl" data-testid="dialog-recurring-setup">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Set Up Recurring Task
          </DialogTitle>
          <DialogDescription>
            Create multiple instances of "{taskTitle}" with custom recurrence patterns
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pattern Type */}
          <div className="space-y-2">
            <Label>Recurrence Pattern</Label>
            <Select 
              value={pattern.pattern} 
              onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'custom') => 
                setPattern(prev => ({ ...prev, pattern: value }))
              }
            >
              <SelectTrigger data-testid="select-pattern-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interval */}
          <div className="space-y-2">
            <Label>Repeat Every</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="365"
                value={pattern.interval}
                onChange={(e) => setPattern(prev => ({ 
                  ...prev, 
                  interval: parseInt(e.target.value) || 1 
                }))}
                className="w-20"
                data-testid="input-interval"
              />
              <span className="text-sm text-muted-foreground">
                {pattern.pattern === 'daily' && 'day(s)'}
                {pattern.pattern === 'weekly' && 'week(s)'}
                {pattern.pattern === 'monthly' && 'month(s)'}
                {pattern.pattern === 'custom' && 'day(s)'}
              </span>
            </div>
          </div>

          {/* Weekly Options */}
          {pattern.pattern === 'weekly' && (
            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="flex gap-2 flex-wrap">
                {WEEKDAYS.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`weekday-${day.value}`}
                      checked={pattern.weekdays?.includes(day.value)}
                      onCheckedChange={() => handleWeekdayToggle(day.value)}
                      data-testid={`checkbox-weekday-${day.value}`}
                    />
                    <Label 
                      htmlFor={`weekday-${day.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {day.short}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Options */}
          {pattern.pattern === 'monthly' && (
            <div className="space-y-2">
              <Label>Day of Month (optional)</Label>
              <Input
                type="number"
                min="1"
                max="31"
                placeholder="e.g., 15 for the 15th of each month"
                value={pattern.monthDay || ''}
                onChange={(e) => setPattern(prev => ({ 
                  ...prev, 
                  monthDay: parseInt(e.target.value) || undefined 
                }))}
                data-testid="input-month-day"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the same day of month as the original task
              </p>
            </div>
          )}

          {/* End Conditions */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>End Date (optional)</Label>
              <Input
                type="date"
                value={pattern.endDate || ''}
                onChange={(e) => setPattern(prev => ({ 
                  ...prev, 
                  endDate: e.target.value || undefined 
                }))}
                data-testid="input-end-date"
              />
            </div>

            <div className="space-y-2">
              <Label>Max Occurrences (optional)</Label>
              <Input
                type="number"
                min="1"
                max="100"
                placeholder="e.g., 10"
                value={pattern.maxOccurrences || ''}
                onChange={(e) => setPattern(prev => ({ 
                  ...prev, 
                  maxOccurrences: parseInt(e.target.value) || undefined 
                }))}
                data-testid="input-max-occurrences"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Preview
            </h4>
            <p className="text-sm text-muted-foreground">
              <strong>Pattern:</strong> {getPatternDescription()}
            </p>
            {pattern.endDate && (
              <p className="text-sm text-muted-foreground">
                <strong>Until:</strong> {new Date(pattern.endDate).toLocaleDateString()}
              </p>
            )}
            {pattern.maxOccurrences && (
              <p className="text-sm text-muted-foreground">
                <strong>Max tasks:</strong> {pattern.maxOccurrences}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              data-testid="button-cancel-recurring"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRecurrence}
              disabled={createRecurrenceMutation.isPending}
              data-testid="button-create-recurring"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createRecurrenceMutation.isPending ? 'Creating...' : 'Create Recurring Tasks'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RecurringTasks;
