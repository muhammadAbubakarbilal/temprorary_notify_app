import type { Express } from "express";
import bcrypt from "bcrypt";
import { storage } from "./storage";

export async function setupAuth(app: Express) {
  // Get current user (for development, we'll use session or create a default user)
  app.get("/api/auth/user", async (req, res) => {
    try {
      // For now, return a default user or check session
      const userId = (req as any).session?.userId || 'dev-user-1';
      let user = await storage.getUser(userId);

      if (!user) {
        // Create default user if none exists
        user = await storage.createUserWithPassword({
          email: 'dev@example.com',
          password: 'dev-password', // Default password for dev user
          firstName: 'Dev',
          lastName: 'User',
          profileImageUrl: null
        });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Manual signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUserWithPassword({
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        profileImageUrl: null
      });

      // Set session
      (req as any).session = { userId: user.id };

      res.status(201).json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Manual signin
  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      (req as any).session = { userId: user.id };

      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Signin error:", error);
      res.status(500).json({ message: "Failed to sign in" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    try {
      (req as any).session = null;
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });
}

// Simple middleware to require authentication (not used currently)
export function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}