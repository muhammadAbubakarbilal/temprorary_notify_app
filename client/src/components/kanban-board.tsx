import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Plus, Play, Pause, MoreHorizontal, Link, Calendar, RotateCcw } from "lucide-react";
import { formatTime } from "@/lib/time-utils";
import type { TaskWithTimeTracking, InsertTask, ActiveTimer } from "@shared/schema";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  projectId: string;
}

const taskStatuses = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-400' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-ai-primary' },
  { id: 'done', title: 'Done', color: 'bg-accent' },
] as const;

const priorityColors = {
  low: 'priority-low',
  medium: 'priority-medium',
  high: 'priority-high',
  urgent: 'priority-urgent'
};

export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [showRecurrenceDialog, setShowRecurrenceDialog] = useState(false);
  const { toast } = useToast();

  const { data: tasks = [] } = useQuery<TaskWithTimeTracking[]>({
    queryKey: ['/api/projects', projectId, 'tasks'],
    enabled: !!projectId,
  });

  const { data: activeTimer } = useQuery<ActiveTimer | null>({
    queryKey: ['/api/timer/active'],
    refetchInterval: 1000, // Update every second
  });

  const { data: activeTimers = [] } = useQuery<ActiveTimer[]>({
    queryKey: ['/api/timers/active'],
    refetchInterval: 1000, // Update every second
  });

  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      projectId: projectId,
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      const response = await apiRequest('POST', `/api/projects/${projectId}/tasks`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'tasks'] });
      toast({
        title: "Task created",
        description: "Your new task has been created successfully.",
      });
      setNewTaskOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InsertTask> }) => {
      const response = await apiRequest('PATCH', `/api/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'tasks'] });
    },
  });

  const startTimerMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest('POST', '/api/timer/start', {
        taskId,
        startTime: new Date(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timer/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timers/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'tasks'] });
      toast({
        title: "Timer started",
        description: "Time tracking started automatically.",
      });
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: async (taskId?: string) => {
      const response = await apiRequest('POST', '/api/timer/stop', { taskId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timer/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timers/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'tasks'] });
      toast({
        title: "Timer stopped",
        description: "Time logged automatically.",
      });
    },
  });

  const onSubmit = (data: InsertTask) => {
    createTaskMutation.mutate({ ...data, projectId });
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const oldStatus = result.source.droppableId as 'todo' | 'in_progress' | 'done';
    const newStatus = result.destination.droppableId as 'todo' | 'in_progress' | 'done';

    // Update task status
    updateTaskMutation.mutate({
      id: taskId,
      data: { status: newStatus }
    });

    // Auto-start timer when moving to "in_progress"
    if (newStatus === 'in_progress' && oldStatus !== 'in_progress') {
      // Check if this task already has an active timer
      const taskHasActiveTimer = activeTimers.some(timer => timer.taskId === taskId);
      if (!taskHasActiveTimer) {
        startTimerMutation.mutate(taskId);
      }
    }

    // Auto-stop timer when moving to "done" or back to "todo"
    if (oldStatus === 'in_progress' && newStatus !== 'in_progress') {
      // Find and stop the timer for this specific task
      const taskActiveTimer = activeTimers.find(timer => timer.taskId === taskId);
      if (taskActiveTimer) {
        stopTimerMutation.mutate(taskId);
      }
    }
  };

  const handleStartTimer = (taskId: string) => {
    startTimerMutation.mutate(taskId);
  };

  const handleStopTimer = (taskId?: string) => {
    stopTimerMutation.mutate(taskId);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="h-full p-3 md:p-6 custom-scrollbar overflow-x-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 h-full">
          {taskStatuses.map((status) => {
            const statusTasks = getTasksByStatus(status.id);

            return (
              <div key={status.id} className="flex-1 bg-ai-card rounded-xl border border-border flex flex-col min-h-0 min-w-80">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={cn("w-3 h-3 rounded-full mr-3", status.color)} />
                    <h3 className="font-semibold text-ai-text">{status.title}</h3>
                    <Badge variant="secondary" className="ml-2">
                      {statusTasks.length}
                    </Badge>
                  </div>
                  <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" data-testid={`add-task-${status.id}`}>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription>
                          Add a new task to your project.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Task Title</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter task title"
                                    data-testid="input-task-title"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter task description"
                                    data-testid="input-task-description"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-task-priority">
                                      <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="low">Low Priority</SelectItem>
                                    <SelectItem value="medium">Medium Priority</SelectItem>
                                    <SelectItem value="high">High Priority</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-task-status">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="todo">To Do</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setNewTaskOpen(false)}
                              data-testid="cancel-task"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createTaskMutation.isPending}
                              data-testid="submit-task"
                            >
                              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Droppable droppableId={status.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar",
                        snapshot.isDraggingOver && "drop-zone-active"
                      )}
                    >
                      {statusTasks.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground text-sm">No tasks yet</p>
                          <p className="text-muted-foreground text-xs mt-1">Drag tasks here or create new ones</p>
                        </div>
                      ) : (
                        statusTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "bg-white dark:bg-ai-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
                                  activeTimers.some(timer => timer.taskId === task.id) && "border-2 border-ai-primary/50",
                                  snapshot.isDragging && "task-card-dragging"
                                )}
                                data-testid={`task-${task.id}`}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <h4 className="font-medium text-ai-text flex-1 line-clamp-2">
                                    {task.title}
                                  </h4>
                                  <div className="flex items-center space-x-2 ml-2">
                                    {activeTimers.some(timer => timer.taskId === task.id) ? (
                                      <div className="flex items-center space-x-1">
                                        <div className="flex items-center space-x-1 bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                          <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                            Active
                                          </span>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleStopTimer(task.id)}
                                          className="p-1 h-6 w-6 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800"
                                          data-testid={`stop-timer-${task.id}`}
                                        >
                                          <Pause className="h-3 w-3 text-red-600" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleStartTimer(task.id)}
                                        className="p-1 h-6 w-6 hover:bg-accent/20"
                                        data-testid={`start-timer-${task.id}`}
                                      >
                                        <Play className="h-3 w-3 text-accent" />
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="p-1 h-6 w-6"
                                      data-testid={`task-menu-${task.id}`}
                                    >
                                      <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                  </div>
                                </div>

                                {task.description && (
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Badge
                                      variant="secondary"
                                      className={cn("text-xs", priorityColors[task.priority as keyof typeof priorityColors])}
                                    >
                                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                                    </Badge>
                                    {task.noteId && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs text-ai-secondary hover:text-ai-secondary/80 p-0 h-auto"
                                        data-testid={`note-link-${task.id}`}
                                      >
                                        <Link className="h-3 w-3 mr-1" />
                                        From note
                                      </Button>
                                    )}
                                  </div>

                                  <div className="text-xs text-muted-foreground">
                                    {task.totalTime > 0 && (
                                      <span className="text-accent">
                                        Total: {formatTime(task.totalTime)}
                                      </span>
                                    )}
                                    {task.dueDate && (
                                      <span className="ml-2">
                                        <Calendar className="h-3 w-3 inline mr-1" />
                                        Due {new Date(task.dueDate).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Recurring Tasks Dialog */}
      <Dialog open={showRecurrenceDialog} onOpenChange={setShowRecurrenceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Recurring Task</DialogTitle>
            <DialogDescription>
              Free plan supports daily recurring tasks only. Upgrade to Premium for weekly, monthly, and custom intervals.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Recurrence Pattern</label>
              <select className="w-full mt-1 p-2 border rounded-md">
                <option value="daily">Daily (Free)</option>
                <option value="weekly" disabled>Weekly (Premium)</option>
                <option value="monthly" disabled>Monthly (Premium)</option>
                <option value="custom" disabled>Custom (Premium)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1">Create Recurring Task</Button>
              <Button variant="outline" onClick={() => setShowRecurrenceDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}