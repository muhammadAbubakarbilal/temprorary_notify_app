import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertProjectSchema, 
  insertNoteSchema, 
  insertTaskSchema,
  insertTimeEntrySchema,
  insertActiveTimerSchema 
} from "@shared/schema";
import Stripe from "stripe";

// Initialize Stripe (check if key exists)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

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
  app.post("/api/notes/temp/extract-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.post("/api/notes/:id/extract-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = insertProjectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid project data", errors: validation.error.errors });
      }
      
      const project = await storage.createProject(validation.data);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const validation = insertProjectSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid project data", errors: validation.error.errors });
      }

      const project = await storage.updateProject(req.params.id, validation.data);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
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
  app.get("/api/projects/:projectId/notes", isAuthenticated, async (req, res) => {
    try {
      const notes = await storage.getNotesByProject(req.params.projectId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/projects/:projectId/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = insertNoteSchema.safeParse({
        ...req.body,
        projectId: req.params.projectId,
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

  app.put("/api/notes/:id", isAuthenticated, async (req, res) => {
    try {
      const validation = insertNoteSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid note data", errors: validation.error.errors });
      }

      const note = await storage.updateNote(req.params.id, validation.data);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteNote(req.params.id);
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
  app.get("/api/projects/:projectId/tasks", isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.getTasksByProject(req.params.projectId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/projects/:projectId/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = insertTaskSchema.safeParse({
        ...req.body,
        projectId: req.params.projectId,
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

  app.put("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const validation = insertTaskSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid task data", errors: validation.error.errors });
      }

      const task = await storage.updateTask(req.params.id, validation.data);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteTask(req.params.id);
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
  app.get("/api/timer/active", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timer = await storage.getActiveTimer(userId);
      res.json(timer);
    } catch (error) {
      console.error("Error fetching active timer:", error);
      res.status(500).json({ message: "Failed to fetch active timer" });
    }
  });

  app.get("/api/time-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getTimeEntriesByUser(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  // Reports endpoints
  app.get("/api/reports/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasks = await storage.getTasksByUser(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching task reports:", error);
      res.status(500).json({ message: "Failed to fetch task reports" });
    }
  });

  app.get("/api/reports/time-tracking", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getTimeTrackingStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching time tracking reports:", error);
      res.status(500).json({ message: "Failed to fetch time tracking reports" });
    }
  });

  app.get("/api/reports/productivity", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getProductivityStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching productivity reports:", error);
      res.status(500).json({ message: "Failed to fetch productivity reports" });
    }
  });

  app.post("/api/timer/start", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = insertActiveTimerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid timer data", errors: validation.error.errors });
      }
      
      const timer = await storage.startTimer(validation.data);
      res.status(201).json(timer);
    } catch (error) {
      console.error("Error starting timer:", error);
      res.status(500).json({ message: "Failed to start timer" });
    }
  });

  app.post("/api/timer/stop", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timeEntry = await storage.stopTimer(userId);
      res.json(timeEntry);
    } catch (error) {
      console.error("Error stopping timer:", error);
      res.status(500).json({ message: "Failed to stop timer" });
    }
  });

  // Stripe payment routes (if keys are available)
  if (stripe) {
    app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
      try {
        const { amount } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ message: "Error creating payment intent: " + error.message });
      }
    });

    app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        let user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (user.stripeSubscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          res.send({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
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

        user = await storage.updateUserSubscription(user.id, 'premium', 'active', customer.id);

        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{
            price: 'price_1234567890', // You'll need to set STRIPE_PRICE_ID
          }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });

        await storage.updateUserSubscription(user!.id, 'premium', 'active', customer.id, subscription.id);
    
        res.send({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        });
      } catch (error: any) {
        console.error("Error creating subscription:", error);
        return res.status(400).send({ error: { message: error.message } });
      }
    });
  }

  // Feature flags
  app.get("/api/feature-flags", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const flags = await storage.getUserFeatureFlags(userId);
      
      // Add subscription-based feature flags
      const subscriptionFlags = {
        'multiple-workspaces': user?.subscriptionPlan === 'premium',
        'advanced-ai': user?.subscriptionPlan === 'premium',
        'unlimited-devices': user?.subscriptionPlan === 'premium',
        'advanced-recurrence': user?.subscriptionPlan === 'premium',
        'advanced-reports': user?.subscriptionPlan === 'premium',
        'attachments': user?.subscriptionPlan === 'premium',
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

  const httpServer = createServer(app);
  return httpServer;
}