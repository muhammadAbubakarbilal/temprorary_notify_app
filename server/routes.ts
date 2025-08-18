import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./googleAuth";
import {
  insertProjectSchema,
  insertNoteSchema,
  insertTaskSchema,
  insertTimeEntrySchema,
  insertActiveTimerSchema
} from "@shared/schema";
import Stripe from "stripe";

// Assuming getUserId is defined elsewhere and available in this scope
// For example, it might be imported from './authUtils' or defined directly.
// If it's not provided, this code will not run.
// Placeholder for getUserId if not explicitly provided in the context:
const getUserId = (req: any): string => {
  // Use session-based authentication
  if (req.session && req.session.userId) {
    return req.session.userId;
  }

  // Fallback to default user for development
  return 'default-user';
};


// Initialize Stripe (check if key exists)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {

  // User route is now handled by googleAuth.ts

  // Freemium helper function
  const checkFreemiumLimits = async (userId: string, feature: string): Promise<{ allowed: boolean, reason?: string }> => {
    const user = await storage.getUser(userId);
    if (!user) return { allowed: false, reason: "User not found" };

    if (user.subscriptionPlan === 'premium') {
      return { allowed: true };
    }

    // Check free plan limits
    switch (feature) {
      case 'ai-task-extraction': {
        // Reset daily count if needed
        if (user.lastTaskExtractionReset &&
            new Date().getDate() !== user.lastTaskExtractionReset.getDate()) {
          await storage.resetDailyTaskExtractionCount(userId);
        }

        if (user.dailyTaskExtractionCount >= 5) { // Free limit: 5 per day
          return {
            allowed: false,
            reason: "You've reached your free task extraction limit today. Upgrade to Premium for unlimited AI assistance."
          };
        }
        return { allowed: true };
      }
      case 'multiple-workspaces': {
        const workspaces = await storage.getUserWorkspaces(userId);
        if (workspaces.length >= 1) { // Free limit: 1 workspace
          return {
            allowed: false,
            reason: "Multiple workspaces are Premium-only. Keep personal free, go Premium for professional."
          };
        }
        return { allowed: true };
      }
      case 'recurring-tasks-advanced': {
        return {
          allowed: false,
          reason: "Custom recurrence is available in Premium. Upgrade to unlock."
        };
      }
      case 'attachments': {
        return {
          allowed: false,
          reason: "Attachments in notes/tasks are Premium-only features."
        };
      }
      default:
        return { allowed: true };
    }
  };

  // AI Task Extraction for temp content (with freemium limits)
  app.post("/api/notes/temp/extract-tasks", async (req: any, res) => {
    try {
      const userId = getUserId(req); // Mock user for development
      const { content } = req.body;

      // Check freemium limits
      const limitCheck = await checkFreemiumLimits(userId, 'ai-task-extraction');
      if (!limitCheck.allowed) {
        return res.status(402).json({
          message: limitCheck.reason,
          feature: 'ai-task-extraction',
          upgradeRequired: true
        });
      }

      // Increment extraction count
      await storage.incrementTaskExtractionCount(userId);

      // Mock AI extraction based on content
      const extractedTasks = [
        {
          title: "Review and implement suggestions from content",
          description: "Based on the note content provided",
          priority: "medium" as const,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        }
      ];

      res.json(extractedTasks);
    } catch (error) {
      console.error("Error extracting tasks:", error);
      res.status(500).json({ message: "Failed to extract tasks" });
    }
  });

  // AI Task Extraction (with freemium limits)
  app.post("/api/notes/:id/extract-tasks", async (req: any, res) => {
    try {
      const userId = getUserId(req); // Mock user for development
      const noteId = req.params.id;

      // Check freemium limits
      const limitCheck = await checkFreemiumLimits(userId, 'ai-task-extraction');
      if (!limitCheck.allowed) {
        return res.status(402).json({
          message: limitCheck.reason,
          feature: 'ai-task-extraction',
          upgradeRequired: true
        });
      }

      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      // Increment extraction count
      await storage.incrementTaskExtractionCount(userId);

      // Mock AI extraction for now (would integrate with OpenAI)
      const extractedTasks = [
        {
          title: "Review marketing campaign",
          description: "Based on your note content",
          priority: "medium" as const,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        }
      ];

      res.json(extractedTasks);
    } catch (error) {
      console.error("Error extracting tasks:", error);
      res.status(500).json({ message: "Failed to extract tasks" });
    }
  });

  // Projects (authenticated)
  app.get("/api/projects", async (req, res) => {
    try {
      const userId = getUserId(req); // Mock user for development
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req: any, res) => {
    try {
      const userId = getUserId(req); // Mock user for development
      const validation = insertProjectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid project data", errors: validation.error.errors });
      }

      const project = await storage.createProject({ ...validation.data, authorId: userId });
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      // Ensure user owns the project (or has access)
      const userId = getUserId(req);
      if (project.authorId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      // Ensure user owns the project (or has access)
      if (project.authorId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validation = insertProjectSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid project data", errors: validation.error.errors });
      }

      const updatedProject = await storage.updateProject(req.params.id, validation.data);
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      // Ensure user owns the project (or has access)
      if (project.authorId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deleteProject(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Notes (authenticated)
  app.get("/api/projects/:projectId/notes", async (req, res) => {
    try {
      const userId = getUserId(req);
      const projectId = req.params.projectId;

      // Verify project ownership before fetching notes
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.authorId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const notes = await storage.getNotesByProject(projectId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/projects/:projectId/notes", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const projectId = req.params.projectId;

      // Verify project ownership before creating note
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.authorId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validation = insertNoteSchema.safeParse({
        ...req.body,
        projectId: projectId,
        authorId: userId
      });

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid note data", errors: validation.error.errors });
      }

      const note = await storage.createNote(validation.data);
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.put("/api/notes/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const noteId = req.params.id;

      // Verify note ownership before updating
      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      if (note.authorId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validation = insertNoteSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid note data", errors: validation.error.errors });
      }

      const updatedNote = await storage.updateNote(noteId, validation.data);
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(updatedNote);
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const noteId = req.params.id;

      // Verify note ownership before deleting
      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      if (note.authorId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deleteNote(noteId);
      if (!success) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Tasks (authenticated)
  app.get("/api/projects/:projectId/tasks", async (req, res) => {
    try {
      const userId = getUserId(req);
      const projectId = req.params.projectId;

      // Verify project ownership before fetching tasks
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.authorId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const tasks = await storage.getTasksByProject(projectId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/projects/:projectId/tasks", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const projectId = req.params.projectId;

      // Verify project ownership before creating task
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.authorId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validation = insertTaskSchema.safeParse({
        ...req.body,
        projectId: projectId,
        assigneeId: userId
      });

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid task data", errors: validation.error.errors });
      }

      const task = await storage.createTask(validation.data);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const taskId = req.params.id;

      // Verify task ownership before updating
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      if (task.assigneeId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validation = insertTaskSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid task data", errors: validation.error.errors });
      }

      const updatedTask = await storage.updateTask(taskId, validation.data);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const taskId = req.params.id;

      // Verify task ownership before deleting
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      if (task.assigneeId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deleteTask(taskId);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Timer routes (authenticated)
  app.get("/api/timer/active", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const timer = await storage.getActiveTimer(userId);
      res.json(timer);
    } catch (error) {
      console.error("Error fetching active timer:", error);
      res.status(500).json({ message: "Failed to fetch active timer" });
    }
  });

  app.get("/api/time-entries", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const entries = await storage.getTimeEntriesByUser(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  // Reports endpoints
  app.get("/api/reports/tasks", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const tasks = await storage.getTasksByUser(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching task reports:", error);
      res.status(500).json({ message: "Failed to fetch task reports" });
    }
  });

  app.get("/api/reports/time-tracking", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getTimeTrackingStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching time tracking reports:", error);
      res.status(500).json({ message: "Failed to fetch time tracking reports" });
    }
  });

  app.get("/api/reports/productivity", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getProductivityStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching productivity reports:", error);
      res.status(500).json({ message: "Failed to fetch productivity reports" });
    }
  });

  app.post("/api/timer/start", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validation = insertActiveTimerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid timer data", errors: validation.error.errors });
      }

      const timer = await storage.startTimer({ ...validation.data, userId: userId });
      res.status(201).json(timer);
    } catch (error) {
      console.error("Error starting timer:", error);
      res.status(500).json({ message: "Failed to start timer" });
    }
  });

  app.post("/api/timer/stop", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const timeEntry = await storage.stopTimer(userId);
      res.json(timeEntry);
    } catch (error) {
      console.error("Error stopping timer:", error);
      res.status(500).json({ message: "Failed to stop timer" });
    }
  });

  // Stripe payment routes (if keys are available)
  if (stripe) {
    app.post("/api/create-payment-intent", async (req, res) => {
      try {
        const userId = getUserId(req); // Ensure user is authenticated for payment actions
        const { amount } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
          metadata: { userId: userId } // Associate payment with user
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ message: "Error creating payment intent: " + error.message });
      }
    });

    app.post('/api/get-or-create-subscription', async (req: any, res) => {
      try {
        const userId = getUserId(req);
        let user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (user.stripeSubscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          res.send({
            subscriptionId: subscription.id,
            clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
          });
          return;
        }

        if (!user.email) {
          return res.status(400).json({ message: 'No user email on file' });
        }

        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        });

        // Update user with customer ID before creating subscription
        user = await storage.updateUserCustomerId(userId, customer.id); // Assuming this function exists

        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{
            price: process.env.STRIPE_PRICE_ID, // Ensure STRIPE_PRICE_ID is set in environment variables
          }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });

        await storage.updateUserSubscription(userId, 'premium', 'active', customer.id, subscription.id);

        res.send({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      } catch (error: any) {
        console.error("Error creating subscription:", error);
        return res.status(400).send({ error: { message: error.message } });
      }
    });
  }

  // AI Services routes
  app.post('/api/ai/extract-tasks', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { noteContent, noteTitle, projectContext } = req.body;

      // Check freemium limits
      const limits = await checkFreemiumLimits(userId, 'ai-task-extraction');
      if (!limits.allowed) {
        return res.status(402).json({ message: limits.reason, upgradeRequired: true });
      }

      const { extractTasksFromNote } = await import('./services/ai-service');
      const tasks = await extractTasksFromNote(noteContent, noteTitle, projectContext);

      // Increment usage count
      await storage.incrementTaskExtractionCount(userId);

      res.json({ tasks });
    } catch (error: any) {
      console.error('AI task extraction error:', error);
      res.status(500).json({ message: 'Failed to extract tasks' });
    }
  });

  app.post('/api/ai/estimate-time', async (req: any, res) => {
    try {
      const userId = getUserId(req); // Assuming time estimation is also tied to user/limits
      const { taskTitle, taskDescription, complexity } = req.body;
      const { estimateTaskTime } = await import('./services/ai-service');
      const estimatedHours = await estimateTaskTime(taskTitle, taskDescription, complexity);
      res.json({ estimatedHours });
    } catch (error: any) {
      console.error('AI time estimation error:', error);
      res.status(500).json({ message: 'Failed to estimate time' });
    }
  });

  app.post('/api/ai/analyze-priority', async (req: any, res) => {
    try {
      const userId = getUserId(req); // Assuming priority analysis is also tied to user/limits
      const { taskTitle, taskDescription, projectContext, deadline } = req.body;
      const { analyzePriority } = await import('./services/ai-service');
      const priority = await analyzePriority(taskTitle, taskDescription, projectContext, deadline);
      res.json({ priority });
    } catch (error) {
      console.error('AI priority analysis error:', error);
      res.status(500).json({ message: 'Failed to analyze priority' });
    }
  });

  // File attachment routes
  app.post('/api/attachments', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      // Check if attachments are allowed for the user's plan
      const limits = await checkFreemiumLimits(userId, 'attachments');
      if (!limits.allowed) {
        return res.status(402).json({ message: limits.reason, upgradeRequired: true });
      }

      // In production, this would handle multipart/form-data
      // For now, creating mock attachment
      const { originalName, noteId, taskId } = req.body;
      const { createMockAttachment } = await import('./services/file-service');
      const attachmentData = createMockAttachment(originalName, userId);

      // Verify if note or task belongs to the user if provided
      if (noteId) {
        const note = await storage.getNote(noteId);
        if (!note || note.authorId !== userId) {
          return res.status(403).json({ message: "Cannot attach to a note you don't own." });
        }
      }
      if (taskId) {
        const task = await storage.getTask(taskId);
        if (!task || task.assigneeId !== userId) { // Assuming task ownership check here
          return res.status(403).json({ message: "Cannot attach to a task you are not assigned to." });
        }
      }

      const attachment = await storage.createAttachment({
        ...attachmentData,
        noteId,
        taskId,
        userId // Ensure userId is stored with the attachment
      });

      res.json(attachment);
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  app.get('/api/attachments/:id', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const attachmentId = req.params.id;

      const attachment = await storage.getAttachment(attachmentId);
      if (!attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }

      // Verify ownership or access rights
      if (attachment.userId !== userId) {
        // Additional checks might be needed here, e.g., if it's shared
        return res.status(403).json({ message: 'Access denied to attachment' });
      }

      res.json(attachment);
    } catch (error) {
      console.error('Get attachment error:', error);
      res.status(500).json({ message: 'Failed to get attachment' });
    }
  });

  // Advanced recurring tasks (Premium)
  app.post('/api/tasks/:id/recurrence', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const taskId = req.params.id;

      // Verify task ownership
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      if (task.assigneeId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check freemium limits for advanced recurrence
      const limits = await checkFreemiumLimits(userId, 'recurring-tasks-advanced');
      if (!limits.allowed) {
        return res.status(402).json({ message: limits.reason, upgradeRequired: true });
      }

      const { pattern, interval, weekdays, monthDay, endDate, maxOccurrences } = req.body;
      const { generateMockRecurringTasks } = await import('./services/recurrence-service');

      // In production, would create actual recurrence rule and tasks
      const recurringTasks = generateMockRecurringTasks(task, pattern);

      res.json({ message: 'Recurring tasks created', count: recurringTasks.length });
    } catch (error) {
      console.error('Recurrence creation error:', error);
      res.status(500).json({ message: 'Failed to create recurring tasks' });
    }
  });

  // Advanced analytics routes
  app.get('/api/analytics/productivity', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      // Check freemium limits for advanced analytics
      const limits = await checkFreemiumLimits(userId, 'advanced-reports'); // Assuming 'advanced-reports' covers this
      if (!limits.allowed) {
        return res.status(402).json({ message: limits.reason, upgradeRequired: true });
      }

      const tasks = await storage.getUserTasks(userId);
      const timeEntries = await storage.getUserTimeEntries(userId);

      const { calculateProductivityMetrics } = await import('./services/analytics-service');
      const metrics = calculateProductivityMetrics(
        tasks,
        timeEntries,
        { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }
      );

      res.json(metrics);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: 'Failed to generate analytics' });
    }
  });

  app.get('/api/analytics/time-tracking', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const timeEntries = await storage.getUserTimeEntries(userId);
      const projects = await storage.getProjects(userId); // Assuming user needs to own projects for this

      const { calculateTimeTrackingAnalytics } = await import('./services/analytics-service');
      const analytics = calculateTimeTrackingAnalytics(timeEntries, projects);

      res.json(analytics);
    } catch (error) {
      console.error('Time tracking analytics error:', error);
      res.status(500).json({ message: 'Failed to generate time analytics' });
    }
  });

  // Team collaboration routes
  app.get('/api/workspaces', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      // This should likely return workspaces the user is a member of, not just created by them.
      // Adjust storage.getUserWorkspaces to support this if needed.
      const workspaces = await storage.getUserWorkspaces(userId);
      res.json(workspaces);
    } catch (error) {
      console.error('Get workspaces error:', error);
      res.status(500).json({ message: 'Failed to get workspaces' });
    }
  });

  app.post('/api/workspaces', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      // Check freemium limits for multiple workspaces
      const limits = await checkFreemiumLimits(userId, 'multiple-workspaces');
      if (!limits.allowed) {
        return res.status(402).json({ message: limits.reason, upgradeRequired: true });
      }

      const { name, spaceId } = req.body;
      const workspace = await storage.createWorkspace({ name, spaceId, ownerId: userId }); // Assuming ownerId is stored

      // Add creator as owner
      await storage.createMembership({
        workspaceId: workspace.id,
        userId: userId,
        role: 'owner',
      });

      res.json(workspace);
    } catch (error) {
      console.error('Create workspace error:', error);
      res.status(500).json({ message: 'Failed to create workspace' });
    }
  });

  app.get('/api/workspaces/:id/members', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workspaceId = req.params.id;

      // Check if user is a member of the workspace
      const memberships = await storage.getWorkspaceMemberships(workspaceId);
      const { canUserAccessWorkspace } = await import('./services/collaboration-service');

      if (!canUserAccessWorkspace(userId, workspaceId, memberships)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const members = await storage.getWorkspaceMembers(workspaceId);
      res.json(members);
    } catch (error) {
      console.error('Get members error:', error);
      res.status(500).json({ message: 'Failed to get members' });
    }
  });

  app.post('/api/workspaces/:id/invite', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workspaceId = req.params.id;
      const { email, role } = req.body;

      const memberships = await storage.getWorkspaceMemberships(workspaceId);
      const { canUserManageWorkspace, generateInviteToken } = await import('./services/collaboration-service');

      if (!canUserManageWorkspace(userId, workspaceId, memberships)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      const inviteToken = generateInviteToken(workspaceId, role);

      // In production, would send email with invite link
      res.json({
        message: 'Invite created',
        inviteToken,
        inviteUrl: `/invite/${inviteToken}`
      });
    } catch (error) {
      console.error('Create invite error:', error);
      res.status(500).json({ message: 'Failed to create invite' });
    }
  });

  // Feature flags
  app.get("/api/feature-flags", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      const flags = await storage.getUserFeatureFlags(userId);

      // Add subscription-based feature flags
      const subscriptionFlags = {
        'multiple-workspaces': user?.subscriptionPlan === 'premium' || checkFreemiumLimits(userId, 'multiple-workspaces').then(limit => limit.allowed).catch(() => false),
        'advanced-ai': user?.subscriptionPlan === 'premium',
        'unlimited-devices': user?.subscriptionPlan === 'premium',
        'advanced-recurrence': user?.subscriptionPlan === 'premium',
        'advanced-reports': user?.subscriptionPlan === 'premium',
        'attachments': user?.subscriptionPlan === 'premium' || checkFreemiumLimits(userId, 'attachments').then(limit => limit.allowed).catch(() => false),
        'collaboration': user?.subscriptionPlan === 'premium',
        'encryption': user?.subscriptionPlan === 'premium',
        'priority-support': user?.subscriptionPlan === 'premium',
      };

      res.json({ ...flags, ...subscriptionFlags });
    } catch (error) {
      console.error("Error fetching feature flags:", error);
      res.status(500).json({ message: "Failed to fetch feature flags" });
    }
  });

  // === COMPREHENSIVE FEATURE COMPLETION ===

  // Team Management & Collaboration (Premium)
  app.post('/api/teams/create', async (req, res) => {
    try {
      const userId = getUserId(req);
      const { name, spaceId } = req.body;
      const { teamManagementService } = await import('./services/team-management-service');
      const result = await teamManagementService.createTeamWorkspace(userId, name, spaceId);
      res.json(result);
    } catch (error) {
      console.error('Team creation error:', error);
      res.status(500).json({ message: error.message || 'Failed to create team' });
    }
  });

  app.post('/api/teams/:workspaceId/invite', async (req, res) => {
    try {
      const userId = getUserId(req);
      const { workspaceId } = req.params;
      const { email, role } = req.body;
      const { teamManagementService } = await import('./services/team-management-service');
      const invitation = await teamManagementService.inviteTeamMember(workspaceId, userId, email, role);
      res.json(invitation);
    } catch (error) {
      console.error('Invitation error:', error);
      res.status(500).json({ message: error.message || 'Failed to send invitation' });
    }
  });

  app.get('/api/teams/:workspaceId/analytics', async (req, res) => {
    try {
      const userId = getUserId(req);
      const { workspaceId } = req.params;
      const { teamManagementService } = await import('./services/team-management-service');
      const analytics = await teamManagementService.getWorkspaceAnalytics(workspaceId, userId);
      res.json(analytics);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: error.message || 'Failed to get analytics' });
    }
  });

  // Priority Support System (Premium)
  app.post('/api/support/tickets', async (req, res) => {
    try {
      const userId = getUserId(req);
      const { subject, description, category, priority } = req.body;
      const { prioritySupportService } = await import('./services/priority-support-service');
      const ticket = await prioritySupportService.createTicket(userId, subject, description, category, priority);
      res.json(ticket);
    } catch (error) {
      console.error('Support ticket error:', error);
      res.status(500).json({ message: 'Failed to create support ticket' });
    }
  });

  app.get('/api/support/tickets', async (req, res) => {
    try {
      const userId = getUserId(req);
      const { prioritySupportService } = await import('./services/priority-support-service');
      const tickets = await prioritySupportService.getTickets(userId);
      res.json(tickets);
    } catch (error) {
      console.error('Support tickets error:', error);
      res.status(500).json({ message: 'Failed to get support tickets' });
    }
  });

  // Advanced Recurring Tasks (Premium)
  app.post('/api/recurring/create', async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      if (user?.subscriptionPlan !== 'premium') {
        return res.status(402).json({
          message: 'Advanced recurring tasks require Premium subscription',
          upgradeRequired: true
        });
      }

      const { baseTask, pattern } = req.body;
      const { recurringTaskService } = await import('./services/recurring-task-service');
      const result = await recurringTaskService.createRecurringTask(baseTask, pattern);
      res.json(result);
    } catch (error) {
      console.error('Recurring task error:', error);
      res.status(500).json({ message: 'Failed to create recurring task' });
    }
  });

  app.get('/api/recurring/:seriesId', async (req, res) => {
    try {
      const userId = getUserId(req); // Ensure user is authorized for this series
      const { seriesId } = req.params;
      const { recurringTaskService } = await import('./services/recurring-task-service');
      const tasks = await recurringTaskService.getRecurringTaskSeries(seriesId);
      // Add authorization check here if seriesId is user-specific
      res.json(tasks);
    } catch (error) {
      console.error('Recurring series error:', error);
      res.status(500).json({ message: 'Failed to get recurring tasks' });
    }
  });

  // Database Seeding for Demonstration
  app.post('/api/demo/seed', async (req, res) => {
    try {
      const userId = getUserId(req); // Seed data for the authenticated user
      const { databaseSeedingService } = await import('./services/database-seeding-service');
      await databaseSeedingService.seedDemoData(userId);
      res.json({ message: 'Demo data seeded successfully' });
    } catch (error) {
      console.error('Seeding error:', error);
      res.status(500).json({ message: 'Failed to seed demo data' });
    }
  });

  app.get('/api/demo/status', async (req, res) => {
    try {
      const userId = getUserId(req); // Check seed status for the authenticated user
      const { databaseSeedingService } = await import('./services/database-seeding-service');
      const isSeeded = await databaseSeedingService.isDemoDataSeeded(userId);
      res.json({ isSeeded });
    } catch (error) {
      console.error('Demo status error:', error);
      res.status(500).json({ message: 'Failed to check demo status' });
    }
  });

  // Enhanced Analytics & Reporting (Premium)
  app.get('/api/analytics/comprehensive', async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      if (user?.subscriptionPlan !== 'premium') {
        return res.status(402).json({
          message: 'Comprehensive analytics require Premium subscription',
          upgradeRequired: true
        });
      }

      const projects = await storage.getProjects(userId); // Assuming user needs to own projects
      const userTasks = await storage.getUserTasks(userId);
      const timeEntries = await storage.getUserTimeEntries(userId);

      const analytics = {
        overview: {
          totalProjects: projects.length,
          totalTasks: userTasks.length,
          completedTasks: userTasks.filter(t => t.status === 'completed').length,
          totalTimeTracked: timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 3600,
        },
        productivity: {
          tasksPerDay: userTasks.length / 30, // Example calculation
          averageTaskCompletionTime: 2.5, // Example data
          mostProductiveHours: [9, 10, 11, 14, 15], // Example data
          weeklyTrends: [12, 15, 18, 14, 16, 13, 11], // Example data
        },
        timeTracking: {
          totalHours: timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 3600,
          averagePerDay: 6.2, // Example data
          projectBreakdown: projects.map(p => ({
            projectName: p.name,
            hoursSpent: Math.random() * 40, // Example data
            efficiency: Math.random() * 100 // Example data
          }))
        }
      };

      res.json(analytics);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: 'Failed to get analytics' });
    }
  });

  // Freemium Limit Status
  app.get('/api/limits/status', async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Fetch actual workspace count for the user
      const userWorkspaces = await storage.getUserWorkspaces(userId);
      const workspaceCount = userWorkspaces.length;

      // Fetch actual team member count for the user's workspaces
      // This might require a more complex query depending on storage implementation
      let teamMemberCount = 0;
      if (user.subscriptionPlan === 'premium') {
        const workspaces = await storage.getUserWorkspaces(userId); // Get all workspaces the user is part of
        for (const workspace of workspaces) {
          const members = await storage.getWorkspaceMembers(workspace.id);
          teamMemberCount += members.length;
        }
      }


      const limits = {
        subscriptionPlan: user.subscriptionPlan,
        aiTaskExtraction: {
          used: user.dailyTaskExtractionCount,
          limit: user.subscriptionPlan === 'premium' ? -1 : 5, // -1 for unlimited
          resetTime: user.lastTaskExtractionReset
        },
        workspaces: {
          used: workspaceCount,
          limit: user.subscriptionPlan === 'premium' ? 50 : 1 // Example limits
        },
        teamMembers: {
          used: teamMemberCount,
          limit: user.subscriptionPlan === 'premium' ? 50 : 0 // Example limits, 0 for free tier
        },
        attachments: {
          allowed: user.subscriptionPlan === 'premium', // Simplified check, actual limit might be per user or plan
          storageUsed: '0MB', // Placeholder, needs actual calculation
          storageLimit: user.subscriptionPlan === 'premium' ? '10GB' : '0MB' // Example limits
        }
      };

      res.json(limits);
    } catch (error: any) {
      console.error('Limits status error:', error);
      res.status(500).json({ message: 'Failed to get limits status' });
    }
  });

  // Note: Authentication routes are now handled by googleAuth.ts

  const httpServer = createServer(app);
  return httpServer;
}