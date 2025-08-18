// Mock database implementation for Replit environment
// This provides the same interface as the Drizzle ORM but uses in-memory storage
import * as schema from "@shared/schema";

// Mock database - in a real deployment, this would be PostgreSQL
export const pool = null;
export const db = null;

// Note: The actual storage operations are handled by MemStorage in storage.ts
// This file exists for compatibility with existing imports