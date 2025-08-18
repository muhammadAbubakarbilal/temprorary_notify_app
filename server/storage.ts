import {
  users,
  spaces,
  workspaces,
  memberships,
  projects,
  notes,
  tasks,
  subtasks,
  timeEntries,
  activeTimers,
  boardColumns,
  taskBoardPositions,
  recurrenceRules,
  featureFlags,
  auditLogs,
  attachments,
  type User,
  type UpsertUser,
  type InsertUser,
  type Space,
  type InsertSpace,
  type Workspace,
  type InsertWorkspace,
  type Membership,
  type InsertMembership,
  type Project,
  type InsertProject,
  type Note,
  type InsertNote,
  type Task,
  type InsertTask,
  type Subtask,
  type InsertSubtask,
  type TimeEntry,
  type InsertTimeEntry,
  type ActiveTimer,
  type InsertActiveTimer,
  type BoardColumn,
  type InsertBoardColumn,
  type TaskBoardPosition,
  type InsertTaskBoardPosition,
  type RecurrenceRule,
  type InsertRecurrenceRule,
  type FeatureFlag,
  type InsertFeatureFlag,
  type AuditLog,
  type InsertAuditLog,
  type Attachment,
  type InsertAttachment,
  type AITaskSuggestion,
  type ProjectWithStats,
  type TaskWithTimeTracking,
  type TaskWithSubtasks,
  type NoteWithTaskCount
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, count, isNull } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSubscription(id: string, plan: string, status: string, customerId?: string, subscriptionId?: string): Promise<User | undefined>;
  resetDailyTaskExtractionCount(userId: string): Promise<void>;
  incrementTaskExtractionCount(userId: string): Promise<number>;

  // Projects
  getProjects(userId?: string): Promise<ProjectWithStats[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Notes
  getNotesByProject(projectId: string): Promise<NoteWithTaskCount[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;

  // Tasks
  getTasksByProject(projectId: string): Promise<TaskWithTimeTracking[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Time Entries
  getTimeEntriesByTask(taskId: string): Promise<TimeEntry[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;

  // Active Timers
  getActiveTimer(userId?: string): Promise<ActiveTimer | undefined>;
  startTimer(timer: InsertActiveTimer): Promise<ActiveTimer>;
  stopTimer(userId?: string): Promise<TimeEntry | undefined>;

  // Feature Flags
  getUserFeatureFlags(userId: string): Promise<Record<string, boolean>>;
  setFeatureFlag(scopeType: string, scopeId: string, key: string, value: boolean): Promise<FeatureFlag>;

  // Spaces and Workspaces
  getUserSpaces(userId: string): Promise<Space[]>;
  createPersonalSpace(userId: string): Promise<Space>;
  getUserWorkspaces(userId: string): Promise<Workspace[]>;
  getWorkspacesBySpace(spaceId: string): Promise<Workspace[]>;

  // Reports and Time Tracking
  getTimeEntriesByUser(userId: string): Promise<TimeEntry[]>;
  getTasksByUser(userId: string): Promise<Task[]>;
  getTimeTrackingStats(userId: string): Promise<{ totalHours: number; weeklyHours: number; averagePerDay: number }>;
  getProductivityStats(userId: string): Promise<{ completionRate: number; averageTasksPerDay: number; streak: number }>;

  // Attachments (Premium)
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  getAttachment(id: string): Promise<Attachment | undefined>;
  getAttachmentsByNote(noteId: string): Promise<Attachment[]>;
  getAttachmentsByTask(taskId: string): Promise<Attachment[]>;
  deleteAttachment(id: string): Promise<boolean>;

  // Enhanced Analytics (Premium)
  getUserTasks(userId: string): Promise<Task[]>;
  getUserTimeEntries(userId: string): Promise<TimeEntry[]>;

  // Team Collaboration (Premium)
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  getWorkspace(id: string): Promise<Workspace | undefined>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  getWorkspaceMemberships(workspaceId: string): Promise<Membership[]>;
  getWorkspaceMembers(workspaceId: string): Promise<(Membership & { user: User })[]>;
  updateMembershipRole(workspaceId: string, userId: string, role: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserSubscription(id: string, plan: string, status: string, customerId?: string, subscriptionId?: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionPlan: plan,
        subscriptionStatus: status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async resetDailyTaskExtractionCount(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        dailyTaskExtractionCount: 0,
        lastTaskExtractionReset: new Date()
      })
      .where(eq(users.id, userId));
  }

  async incrementTaskExtractionCount(userId: string): Promise<number> {
    const [user] = await db
      .update(users)
      .set({
        dailyTaskExtractionCount: sql`${users.dailyTaskExtractionCount} + 1`
      })
      .where(eq(users.id, userId))
      .returning({ count: users.dailyTaskExtractionCount });
    return user.count;
  }

  // Projects
  async getProjects(userId?: string): Promise<ProjectWithStats[]> {
    const projectsWithStats = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        color: projects.color,
        spaceId: projects.spaceId,
        workspaceId: projects.workspaceId,
        status: projects.status,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        taskCount: sql<number>`cast(count(distinct ${tasks.id}) as int)`,
        noteCount: sql<number>`cast(count(distinct ${notes.id}) as int)`,
      })
      .from(projects)
      .leftJoin(tasks, eq(projects.id, tasks.projectId))
      .leftJoin(notes, eq(projects.id, notes.projectId))
      .where(eq(projects.status, 'active'))
      .groupBy(projects.id)
      .orderBy(desc(projects.updatedAt));

    return projectsWithStats;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Notes
  async getNotesByProject(projectId: string): Promise<NoteWithTaskCount[]> {
    const notesWithTaskCount = await db
      .select({
        id: notes.id,
        spaceId: notes.spaceId,
        workspaceId: notes.workspaceId,
        projectId: notes.projectId,
        authorId: notes.authorId,
        title: notes.title,
        content: notes.content,
        tags: notes.tags,
        backlinks: notes.backlinks,
        visibilityScope: notes.visibilityScope,
        lastProcessedLength: notes.lastProcessedLength,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        tasksExtracted: sql<number>`cast(count(${tasks.id}) as int)`,
      })
      .from(notes)
      .leftJoin(tasks, eq(notes.id, tasks.noteId))
      .where(eq(notes.projectId, projectId))
      .groupBy(notes.id)
      .orderBy(desc(notes.updatedAt));

    return notesWithTaskCount;
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values([note]).returning();
    return newNote;
  }

  async updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined> {
    const updateData = { ...note, updatedAt: new Date() };
    const [updatedNote] = await db
      .update(notes)
      .set(updateData)
      .where(eq(notes.id, id))
      .returning();
    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Tasks
  async getTasksByProject(projectId: string): Promise<TaskWithTimeTracking[]> {
    const tasksWithTime = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        noteId: tasks.noteId,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        assigneeId: tasks.assigneeId,
        dueDate: tasks.dueDate,
        tags: tasks.tags,
        seriesId: tasks.seriesId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        totalTime: sql<number>`cast(coalesce(sum(${timeEntries.duration}), 0) as int)`,
        isActive: sql<boolean>`case when ${activeTimers.id} is not null then true else false end`,
      })
      .from(tasks)
      .leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId))
      .leftJoin(activeTimers, eq(tasks.id, activeTimers.taskId))
      .where(eq(tasks.projectId, projectId))
      .groupBy(tasks.id, activeTimers.id)
      .orderBy(desc(tasks.updatedAt));

    return tasksWithTime;
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values([task]).returning();
    return newTask;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const updateData = { ...task, updatedAt: new Date() };
    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Time Entries
  async getTimeEntriesByTask(taskId: string): Promise<TimeEntry[]> {
    return await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.taskId, taskId))
      .orderBy(desc(timeEntries.startTime));
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const [newEntry] = await db.insert(timeEntries).values(entry).returning();
    return newEntry;
  }

  async updateTimeEntry(id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const [updatedEntry] = await db
      .update(timeEntries)
      .set(entry)
      .where(eq(timeEntries.id, id))
      .returning();
    return updatedEntry;
  }

  // Active Timers
  async getActiveTimer(userId?: string): Promise<ActiveTimer | undefined> {
    const [timer] = await db.select().from(activeTimers).limit(1);
    return timer;
  }

  async startTimer(timer: InsertActiveTimer): Promise<ActiveTimer> {
    // Stop any existing active timers first
    await this.stopTimer();

    const [newTimer] = await db.insert(activeTimers).values(timer).returning();
    return newTimer;
  }

  async stopTimer(userId?: string): Promise<TimeEntry | undefined> {
    const [activeTimer] = await db.select().from(activeTimers).limit(1);

    if (!activeTimer) {
      return undefined;
    }

    // Delete the active timer
    await db.delete(activeTimers).where(eq(activeTimers.id, activeTimer.id));

    // Create time entry
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - activeTimer.startTime.getTime()) / 1000);

    const [timeEntry] = await db.insert(timeEntries).values({
      taskId: activeTimer.taskId,
      startTime: activeTimer.startTime,
      endTime,
      duration,
    }).returning();

    return timeEntry;
  }

  // Feature Flags
  async getUserFeatureFlags(userId: string): Promise<Record<string, boolean>> {
    const flags = await db
      .select()
      .from(featureFlags)
      .where(
        and(
          eq(featureFlags.scopeType, 'user'),
          eq(featureFlags.scopeId, userId)
        )
      );

    return flags.reduce((acc, flag) => {
      acc[flag.key] = flag.value;
      return acc;
    }, {} as Record<string, boolean>);
  }

  async setFeatureFlag(scopeType: string, scopeId: string, key: string, value: boolean): Promise<FeatureFlag> {
    const [flag] = await db
      .insert(featureFlags)
      .values({ scopeType, scopeId, key, value })
      .onConflictDoUpdate({
        target: [featureFlags.scopeType, featureFlags.scopeId, featureFlags.key],
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return flag;
  }

  // Spaces and Workspaces
  async getUserSpaces(userId: string): Promise<Space[]> {
    const result = await db
      .select({
        id: spaces.id,
        type: spaces.type,
        createdAt: spaces.createdAt
      })
      .from(spaces)
      .innerJoin(workspaces, eq(spaces.id, workspaces.spaceId))
      .innerJoin(memberships, eq(workspaces.id, memberships.workspaceId))
      .where(eq(memberships.userId, userId));
    return result;
  }

  async createPersonalSpace(userId: string): Promise<Space> {
    const [space] = await db.insert(spaces).values({
      type: 'personal'
    }).returning();

    // Create default personal workspace
    const [workspace] = await db.insert(workspaces).values({
      spaceId: space.id,
      name: 'Personal',
      policyManagerNoteAccess: false
    }).returning();

    // Create membership
    await db.insert(memberships).values({
      workspaceId: workspace.id,
      userId,
      role: 'owner'
    });

    return space;
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const result = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        spaceId: workspaces.spaceId,
        policyManagerNoteAccess: workspaces.policyManagerNoteAccess
      })
      .from(workspaces)
      .innerJoin(memberships, eq(workspaces.id, memberships.workspaceId))
      .where(eq(memberships.userId, userId));
    return result;
  }

  async getWorkspacesBySpace(spaceId: string): Promise<Workspace[]> {
    return await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.spaceId, spaceId));
  }

  // Reports and Time Tracking
  async getTimeEntriesByUser(userId: string): Promise<TimeEntry[]> {
    // This is a placeholder. A real implementation would fetch time entries associated with tasks belonging to the user.
    // For now, returning an empty array.
    return [];
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    // This is a placeholder. A real implementation would fetch tasks assigned to the user.
    // For now, returning an empty array.
    return [];
  }

  async getTimeTrackingStats(userId: string): Promise<{ totalHours: number; weeklyHours: number; averagePerDay: number }> {
    // Placeholder for time tracking statistics
    return {
      totalHours: 0,
      weeklyHours: 0,
      averagePerDay: 0
    };
  }

  async getProductivityStats(userId: string): Promise<{ completionRate: number; averageTasksPerDay: number; streak: number }> {
    // Placeholder for productivity statistics
    return {
      completionRate: 0,
      averageTasksPerDay: 0,
      streak: 0
    };
  }

  // Attachments (Premium)
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const [result] = await db.insert(attachments).values(attachment).returning();
    return result;
  }

  async getAttachment(id: string): Promise<Attachment | undefined> {
    const [attachment] = await db.select().from(attachments).where(eq(attachments.id, id));
    return attachment;
  }

  async getAttachmentsByNote(noteId: string): Promise<Attachment[]> {
    return await db.select().from(attachments).where(eq(attachments.noteId, noteId));
  }

  async getAttachmentsByTask(taskId: string): Promise<Attachment[]> {
    return await db.select().from(attachments).where(eq(attachments.taskId, taskId));
  }

  async deleteAttachment(id: string): Promise<boolean> {
    const result = await db.delete(attachments).where(eq(attachments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Enhanced Analytics (Premium)
  async getUserTasks(userId: string): Promise<Task[]> {
    const result = await db
      .select({
        id: tasks.id,
        status: tasks.status,
        title: tasks.title,
        projectId: tasks.projectId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        description: tasks.description,
        tags: tasks.tags,
        noteId: tasks.noteId,
        priority: tasks.priority,
        assigneeId: tasks.assigneeId,
        dueDate: tasks.dueDate,
        seriesId: tasks.seriesId
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(projects.spaceId, userId)); // Assuming projects are linked to user spaces
    return result;
  }

  async getUserTimeEntries(userId: string): Promise<TimeEntry[]> {
    const result = await db
      .select({
        id: timeEntries.id,
        taskId: timeEntries.taskId,
        createdAt: timeEntries.createdAt,
        description: timeEntries.description,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        duration: timeEntries.duration
      })
      .from(timeEntries)
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(projects.spaceId, userId)); // Assuming projects are linked to user spaces
    return result;
  }

  // Team Collaboration (Premium)
  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const [result] = await db.insert(workspaces).values(workspace).returning();
    return result;
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace;
  }

  async createMembership(membership: InsertMembership): Promise<Membership> {
    const [result] = await db.insert(memberships).values(membership).returning();
    return result;
  }

  async getWorkspaceMemberships(workspaceId: string): Promise<Membership[]> {
    return await db.select().from(memberships).where(eq(memberships.workspaceId, workspaceId));
  }

  async getWorkspaceMembers(workspaceId: string): Promise<(Membership & { user: User })[]> {
    const result = await db
      .select({
        // Membership fields
        id: memberships.id,
        role: memberships.role,
        workspaceId: memberships.workspaceId,
        userId: memberships.userId,
        createdAt: memberships.createdAt,
        // User fields
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          subscriptionPlan: users.subscriptionPlan,
          subscriptionStatus: users.subscriptionStatus,
          stripeCustomerId: users.stripeCustomerId,
          stripeSubscriptionId: users.stripeSubscriptionId,
          personalKeyRef: users.personalKeyRef,
          dailyTaskExtractionCount: users.dailyTaskExtractionCount,
          lastTaskExtractionReset: users.lastTaskExtractionReset,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        }
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.workspaceId, workspaceId));
    return result as (Membership & { user: User })[];
  }

  async updateMembershipRole(workspaceId: string, userId: string, role: string): Promise<void> {
    await db
      .update(memberships)
      .set({ role })
      .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, userId)));
  }
}

export const storage = new DatabaseStorage();