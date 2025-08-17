import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, json, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Base tables first (no foreign keys)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  subscriptionPlan: text("subscription_plan").notNull().default('free'), // 'free' | 'premium'
  subscriptionStatus: text("subscription_status").notNull().default('active'), // 'active' | 'canceled' | 'past_due'
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  personalKeyRef: text("personal_key_ref"), // For encryption
  dailyTaskExtractionCount: integer("daily_task_extraction_count").notNull().default(0),
  lastTaskExtractionReset: timestamp("last_task_extraction_reset").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const spaces = pgTable("spaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'personal' | 'professional'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  spaceId: varchar("space_id").references(() => spaces.id).notNull(),
  name: text("name").notNull(),
  policyManagerNoteAccess: boolean("policy_manager_note_access").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const memberships = pgTable("memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").references(() => workspaces.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: text("role").notNull(), // 'owner' | 'manager' | 'member' | 'viewer'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default('#6366F1'),
  spaceId: varchar("space_id").references(() => spaces.id),
  workspaceId: varchar("workspace_id").references(() => workspaces.id),
  status: text("status").notNull().default('active'), // active, archived, deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  spaceId: varchar("space_id").references(() => spaces.id),
  workspaceId: varchar("workspace_id").references(() => workspaces.id),
  projectId: varchar("project_id").references(() => projects.id),
  authorId: varchar("author_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull().default(''),
  tags: json("tags").$type<string[]>().default([]),
  backlinks: json("backlinks").$type<string[]>().default([]),
  visibilityScope: text("visibility_scope").notNull().default('private'), // private, project, workspace
  lastProcessedLength: integer("last_processed_length").notNull().default(0), // For incremental task extraction
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  noteId: varchar("note_id").references(() => notes.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default('todo'), // todo, in_progress, paused, done
  priority: text("priority").notNull().default('medium'), // low, medium, high, urgent
  assigneeId: varchar("assignee_id").references(() => users.id),
  dueDate: timestamp("due_date"),
  tags: json("tags").$type<string[]>().default([]),
  seriesId: varchar("series_id"), // For recurring tasks
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const timeEntries = pgTable("time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration").notNull().default(0), // in seconds
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activeTimers = pgTable("active_timers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const boardColumns = pgTable("board_columns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskBoardPositions = pgTable("task_board_positions", {
  taskId: varchar("task_id").references(() => tasks.id).notNull(),
  columnId: varchar("column_id").references(() => boardColumns.id).notNull(),
  order: integer("order").notNull(),
});

export const subtasks = pgTable("subtasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id).notNull(),
  title: text("title").notNull(),
  done: boolean("done").notNull().default(false),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recurrenceRules = pgTable("recurrence_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id).notNull(),
  rruleText: text("rrule_text").notNull(),
  timezone: text("timezone").notNull().default('UTC'),
  nextOccurrenceAt: timestamp("next_occurrence_at"),
  seriesId: varchar("series_id"), // To link related recurring tasks
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scopeType: text("scope_type").notNull(), // 'user' | 'workspace'
  scopeId: varchar("scope_id").notNull(),
  key: text("key").notNull(),
  value: boolean("value").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").references(() => workspaces.id),
  actorId: varchar("actor_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: varchar("target_id").notNull(),
  diffJson: json("diff_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSpaceSchema = createInsertSchema(spaces).omit({
  id: true,
  createdAt: true,
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMembershipSchema = createInsertSchema(memberships).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubtaskSchema = createInsertSchema(subtasks).omit({
  id: true,
  createdAt: true,
});

export const insertBoardColumnSchema = createInsertSchema(boardColumns).omit({
  id: true,
  createdAt: true,
});

export const insertTaskBoardPositionSchema = createInsertSchema(taskBoardPositions);

export const insertRecurrenceRuleSchema = createInsertSchema(recurrenceRules).omit({
  id: true,
  createdAt: true,
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
});

export const insertActiveTimerSchema = createInsertSchema(activeTimers).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

export type Space = typeof spaces.$inferSelect;
export type InsertSpace = z.infer<typeof insertSpaceSchema>;

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Subtask = typeof subtasks.$inferSelect;
export type InsertSubtask = z.infer<typeof insertSubtaskSchema>;

export type BoardColumn = typeof boardColumns.$inferSelect;
export type InsertBoardColumn = z.infer<typeof insertBoardColumnSchema>;

export type TaskBoardPosition = typeof taskBoardPositions.$inferSelect;
export type InsertTaskBoardPosition = z.infer<typeof insertTaskBoardPositionSchema>;

export type RecurrenceRule = typeof recurrenceRules.$inferSelect;
export type InsertRecurrenceRule = z.infer<typeof insertRecurrenceRuleSchema>;

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

export type ActiveTimer = typeof activeTimers.$inferSelect;
export type InsertActiveTimer = z.infer<typeof insertActiveTimerSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Extended types with relations
export type ProjectWithStats = Project & {
  taskCount: number;
  noteCount: number;
};

export type TaskWithTimeTracking = Task & {
  totalTime: number;
  isActive: boolean;
};

export type NoteWithTaskCount = Note & {
  tasksExtracted: number;
};

export type TaskWithSubtasks = Task & {
  subtasks: Subtask[];
  boardPosition?: TaskBoardPosition & { column: BoardColumn };
};

export type UserWithWorkspaces = User & {
  workspaces: (Membership & { workspace: Workspace })[];
};

// API Response types
export type AITaskSuggestion = {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  assigneeId?: string;
  tags?: string[];
};

export type SpaceContext = {
  currentSpace: 'personal' | 'professional';
  workspaceId?: string;
  userId?: string;
};