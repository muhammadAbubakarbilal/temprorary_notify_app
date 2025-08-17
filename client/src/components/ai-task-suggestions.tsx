import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Clock, AlertCircle, Brain } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { AITaskSuggestion } from "@shared/schema";

interface AITaskSuggestionsProps {
  noteId: string;
  projectId: string;
  suggestions: AITaskSuggestion[];
  onAccept?: (task: AITaskSuggestion) => void;
  onReject?: (index: number) => void;
}

const priorityIcons = {
  low: Clock,
  medium: AlertCircle,
  high: AlertCircle,
  urgent: AlertCircle,
};

const priorityColors = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function AITaskSuggestions({
  noteId,
  projectId,
  suggestions,
  onAccept,
  onReject
}: AITaskSuggestionsProps) {
  const [acceptingTasks, setAcceptingTasks] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: async (task: AITaskSuggestion & { noteId: string; projectId: string }) => {
      return apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate,
          projectId: task.projectId,
          noteId: task.noteId,
          tags: task.tags || [],
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });

  const handleAcceptTask = async (task: AITaskSuggestion, index: number) => {
    setAcceptingTasks(prev => new Set(prev).add(index));
    
    try {
      await createTaskMutation.mutateAsync({
        ...task,
        noteId,
        projectId,
      });
      
      onAccept?.(task);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setAcceptingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleRejectTask = (index: number) => {
    onReject?.(index);
  };

  if (!suggestions.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Brain className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No task suggestions available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Write some notes to get AI-powered task suggestions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <Brain className="h-4 w-4 mr-2 text-ai-secondary" />
          AI Task Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const PriorityIcon = priorityIcons[suggestion.priority];
          const isAccepting = acceptingTasks.has(index);
          
          return (
            <div
              key={index}
              className="p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-card-foreground leading-5">
                  {suggestion.title}
                </h4>
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleAcceptTask(suggestion, index)}
                    disabled={isAccepting}
                  >
                    {isAccepting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRejectTask(index)}
                    disabled={isAccepting}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {suggestion.description && (
                <p className="text-xs text-muted-foreground mb-2 leading-4">
                  {suggestion.description}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className={`text-xs px-2 py-0.5 ${priorityColors[suggestion.priority]}`}
                  >
                    <PriorityIcon className="h-3 w-3 mr-1" />
                    {suggestion.priority}
                  </Badge>
                  
                  {suggestion.dueDate && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(suggestion.dueDate).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                
                {suggestion.tags && suggestion.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    {suggestion.tags.slice(0, 2).map((tag, tagIndex) => (
                      <Badge
                        key={tagIndex}
                        variant="outline"
                        className="text-xs px-1.5 py-0.5"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {suggestion.tags.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{suggestion.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}