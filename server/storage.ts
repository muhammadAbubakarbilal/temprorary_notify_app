import {
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
import { nanoid } from "nanoid";
import crypto from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(userData: any): Promise<User>;
  updateUserSubscription(id: string, plan: string, status: string, customerId?: string, subscriptionId?: string): Promise<User | undefined>;
  resetDailyTaskExtractionCount(userId: string): Promise<void>;
  incrementTaskExtractionCount(userId: string): Promise<number>;
  getUserByEmail(email: string): Promise<User | null>;
  createUserWithPassword(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  }): Promise<User>;

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

// In-memory storage implementation for Replit environment
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private spaces: Map<string, Space> = new Map();
  private workspaces: Map<string, Workspace> = new Map();
  private memberships: Map<string, Membership> = new Map();
  private projects: Map<string, Project> = new Map();
  private notes: Map<string, Note> = new Map();
  private tasks: Map<string, Task> = new Map();
  private subtasks: Map<string, Subtask> = new Map();
  private timeEntries: Map<string, TimeEntry> = new Map();
  private activeTimers: Map<string, ActiveTimer> = new Map();
  private boardColumns: Map<string, BoardColumn> = new Map();
  private taskBoardPositions: Map<string, TaskBoardPosition> = new Map();
  private recurrenceRules: Map<string, RecurrenceRule> = new Map();
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();
  private attachments: Map<string, Attachment> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create default user
    const defaultUserId = "default-user";
    const defaultUser: User = {
      id: defaultUserId,
      email: "demo@example.com",
      firstName: "Demo",
      lastName: "User",
      profileImageUrl: null,
      subscriptionPlan: "premium",
      subscriptionStatus: "active",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      personalKeyRef: null,
      dailyTaskExtractionCount: 0,
      lastTaskExtractionReset: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(defaultUserId, defaultUser);

    // Create default space
    const defaultSpaceId = nanoid();
    const defaultSpace: Space = {
      id: defaultSpaceId,
      type: "personal",
      createdAt: new Date(),
    };
    this.spaces.set(defaultSpaceId, defaultSpace);

    // Create default workspace
    const defaultWorkspaceId = nanoid();
    const defaultWorkspace: Workspace = {
      id: defaultWorkspaceId,
      spaceId: defaultSpaceId,
      name: "Personal Workspace",
      policyManagerNoteAccess: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workspaces.set(defaultWorkspaceId, defaultWorkspace);

    // Create default membership
    const defaultMembershipId = nanoid();
    const defaultMembership: Membership = {
      id: defaultMembershipId,
      workspaceId: defaultWorkspaceId,
      userId: defaultUserId,
      role: "owner",
      createdAt: new Date(),
    };
    this.memberships.set(defaultMembershipId, defaultMembership);

    // Create sample project
    const sampleProjectId = nanoid();
    const sampleProject: Project = {
      id: sampleProjectId,
      name: "Welcome Project",
      description: "Your first project to get started",
      color: "#6366F1",
      spaceId: defaultSpaceId,
      workspaceId: defaultWorkspaceId,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(sampleProjectId, sampleProject);

    // Create sample note
    const sampleNoteId = nanoid();
    const sampleNote: Note = {
      id: sampleNoteId,
      spaceId: defaultSpaceId,
      workspaceId: defaultWorkspaceId,
      projectId: sampleProjectId,
      authorId: defaultUserId,
      title: "Welcome Note",
      content: "Welcome to your AI-powered productivity platform! Start by creating tasks and notes.",
      tags: [],
      backlinks: [],
      visibilityScope: "private",
      lastProcessedLength: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notes.set(sampleNoteId, sampleNote);

    // Create sample task
    const sampleTaskId = nanoid();
    const sampleTask: Task = {
      id: sampleTaskId,
      projectId: sampleProjectId,
      noteId: sampleNoteId,
      title: "Get started with your productivity platform",
      description: "Explore the features and create your first real project",
      status: "todo",
      priority: "medium",
      assigneeId: defaultUserId,
      dueDate: null,
      tags: ["onboarding"],
      seriesId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(sampleTaskId, sampleTask);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    const user: User = {
      ...existingUser,
      ...userData,
      id: userData.id!,
      updatedAt: new Date(),
    } as User;

    if (!existingUser) {
      user.createdAt = new Date();
    }

    this.users.set(userData.id!, user);
    return user;
  }

  async updateUserSubscription(id: string, plan: string, status: string, customerId?: string, subscriptionId?: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      subscriptionPlan: plan,
      subscriptionStatus: status,
      stripeCustomerId: customerId || user.stripeCustomerId,
      stripeSubscriptionId: subscriptionId || user.stripeSubscriptionId,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async resetDailyTaskExtractionCount(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.dailyTaskExtractionCount = 0;
      user.lastTaskExtractionReset = new Date();
      this.users.set(userId, user);
    }
  }

  async incrementTaskExtractionCount(userId: string): Promise<number> {
    const user = this.users.get(userId);
    if (user) {
      user.dailyTaskExtractionCount++;
      this.users.set(userId, user);
      return user.dailyTaskExtractionCount;
    }
    return 0;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    return user || null;
  }

  async createUser(userData: any): Promise<User> {
    const userId = userData.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const user: User = {
      id: userId,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      profileImageUrl: userData.profileImageUrl || null,
      subscriptionPlan: userData.subscriptionPlan || 'free',
      subscriptionStatus: userData.subscriptionStatus || 'active',
      stripeCustomerId: userData.stripeCustomerId || null,
      stripeSubscriptionId: userData.stripeSubscriptionId || null,
      personalKeyRef: null,
      dailyTaskExtractionCount: userData.dailyTaskExtractionCount || 0,
      lastTaskExtractionReset: userData.lastTaskExtractionReset || new Date(),
      password: userData.password,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(userId, user);
    return user;
  }

  async createUserWithPassword(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  }): Promise<User> {
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const user: User = {
      id: userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: userData.profileImageUrl,
      subscriptionPlan: 'free',
      subscriptionStatus: 'active',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      personalKeyRef: null,
      dailyTaskExtractionCount: 0,
      lastTaskExtractionReset: new Date(),
      password: userData.password,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(userId, user);
    return user;
  }

  // Projects
  async getProjects(userId?: string): Promise<ProjectWithStats[]> {
    const projectsArray = Array.from(this.projects.values())
      .filter(p => p.status === 'active')
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return projectsArray.map(project => ({
      ...project,
      taskCount: Array.from(this.tasks.values()).filter(t => t.projectId === project.id).length,
      noteCount: Array.from(this.notes.values()).filter(n => n.projectId === project.id).length,
    }));
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const newProject: Project = {
      id: nanoid(),
      name: project.name,
      description: project.description || null,
      color: project.color || '#6366F1',
      spaceId: project.spaceId || null,
      workspaceId: project.workspaceId || null,
      status: project.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(newProject.id, newProject);
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) return undefined;

    const updatedProject: Project = {
      ...existingProject,
      ...project,
      updatedAt: new Date(),
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Notes
  async getNotesByProject(projectId: string): Promise<NoteWithTaskCount[]> {
    const notesArray = Array.from(this.notes.values())
      .filter(n => n.projectId === projectId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return notesArray.map(note => ({
      ...note,
      tasksExtracted: Array.from(this.tasks.values()).filter(t => t.noteId === note.id).length,
    }));
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async createNote(note: InsertNote): Promise<Note> {
    const newNote: Note = {
      id: nanoid(),
      spaceId: note.spaceId || null,
      workspaceId: note.workspaceId || null,
      projectId: note.projectId || null,
      authorId: note.authorId || null,
      title: note.title,
      content: note.content || '',
      tags: note.tags || [],
      backlinks: note.backlinks || [],
      visibilityScope: note.visibilityScope || 'private',
      lastProcessedLength: note.lastProcessedLength || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notes.set(newNote.id, newNote);
    return newNote;
  }

  async updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined> {
    const existingNote = this.notes.get(id);
    if (!existingNote) return undefined;

    const updatedNote: Note = {
      ...existingNote,
      ...note,
      updatedAt: new Date(),
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }

  // Tasks
  async getTasksByProject(projectId: string): Promise<TaskWithTimeTracking[]> {
    const tasksArray = Array.from(this.tasks.values())
      .filter(t => t.projectId === projectId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return tasksArray.map(task => {
      const totalTime = Array.from(this.timeEntries.values())
        .filter(te => te.taskId === task.id)
        .reduce((sum, te) => sum + te.duration, 0);

      const isActive = Array.from(this.activeTimers.values())
        .some(at => at.taskId === task.id);

      return {
        ...task,
        totalTime,
        isActive,
      };
    });
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const newTask: Task = {
      id: nanoid(),
      projectId: task.projectId,
      noteId: task.noteId || null,
      title: task.title,
      description: task.description || null,
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      assigneeId: task.assigneeId || null,
      dueDate: task.dueDate || null,
      tags: task.tags || [],
      seriesId: task.seriesId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(newTask.id, newTask);
    return newTask;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;

    const updatedTask: Task = {
      ...existingTask,
      projectId: task.projectId || existingTask.projectId,
      noteId: task.noteId !== undefined ? task.noteId || null : existingTask.noteId,
      title: task.title || existingTask.title,
      description: task.description !== undefined ? task.description || null : existingTask.description,
      status: task.status || existingTask.status,
      priority: task.priority || existingTask.priority,
      assigneeId: task.assigneeId !== undefined ? task.assigneeId || null : existingTask.assigneeId,
      dueDate: task.dueDate !== undefined ? task.dueDate || null : existingTask.dueDate,
      tags: task.tags !== undefined ? task.tags || [] : existingTask.tags,
      seriesId: task.seriesId !== undefined ? task.seriesId || null : existingTask.seriesId,
      updatedAt: new Date(),
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Time Entries
  async getTimeEntriesByTask(taskId: string): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values())
      .filter(te => te.taskId === taskId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const newEntry: TimeEntry = {
      id: nanoid(),
      taskId: entry.taskId,
      startTime: entry.startTime,
      endTime: entry.endTime || null,
      duration: entry.duration || 0,
      description: entry.description || null,
      createdAt: new Date(),
    };
    this.timeEntries.set(newEntry.id, newEntry);
    return newEntry;
  }

  async updateTimeEntry(id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const existingEntry = this.timeEntries.get(id);
    if (!existingEntry) return undefined;

    const updatedEntry: TimeEntry = {
      ...existingEntry,
      ...entry,
    };
    this.timeEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  // Active Timers
  async getActiveTimer(userId?: string): Promise<ActiveTimer | undefined> {
    return Array.from(this.activeTimers.values())[0];
  }

  async startTimer(timer: InsertActiveTimer): Promise<ActiveTimer> {
    // Stop any existing active timers first
    await this.stopTimer();

    const newTimer: ActiveTimer = {
      id: nanoid(),
      ...timer,
      createdAt: new Date(),
    };
    this.activeTimers.set(newTimer.id, newTimer);
    return newTimer;
  }

  async stopTimer(userId?: string): Promise<TimeEntry | undefined> {
    const activeTimerArray = Array.from(this.activeTimers.values());
    if (activeTimerArray.length === 0) return undefined;

    const activeTimer = activeTimerArray[0];
    this.activeTimers.delete(activeTimer.id);

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - activeTimer.startTime.getTime()) / 1000);

    const timeEntry = await this.createTimeEntry({
      taskId: activeTimer.taskId,
      startTime: activeTimer.startTime,
      endTime,
      duration,
    });

    return timeEntry;
  }

  // Feature Flags
  async getUserFeatureFlags(userId: string): Promise<Record<string, boolean>> {
    const flags = Array.from(this.featureFlags.values())
      .filter(flag => flag.scopeType === 'user' && flag.scopeId === userId);

    return flags.reduce((acc: Record<string, boolean>, flag: FeatureFlag) => {
      acc[flag.key] = flag.value;
      return acc;
    }, {});
  }

  async setFeatureFlag(scopeType: string, scopeId: string, key: string, value: boolean): Promise<FeatureFlag> {
    const existingFlag = Array.from(this.featureFlags.values())
      .find(f => f.scopeType === scopeType && f.scopeId === scopeId && f.key === key);

    if (existingFlag) {
      existingFlag.value = value;
      existingFlag.updatedAt = new Date();
      this.featureFlags.set(existingFlag.id, existingFlag);
      return existingFlag;
    }

    const newFlag: FeatureFlag = {
      id: nanoid(),
      scopeType,
      scopeId,
      key,
      value,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.featureFlags.set(newFlag.id, newFlag);
    return newFlag;
  }

  // Spaces and Workspaces
  async getUserSpaces(userId: string): Promise<Space[]> {
    const userMemberships = Array.from(this.memberships.values())
      .filter(m => m.userId === userId);

    const userWorkspaceIds = userMemberships.map(m => m.workspaceId);
    const userWorkspaces = Array.from(this.workspaces.values())
      .filter(w => userWorkspaceIds.includes(w.id));

    const spaceIds = userWorkspaces.map(w => w.spaceId);
    return Array.from(this.spaces.values())
      .filter(s => spaceIds.includes(s.id));
  }

  async createPersonalSpace(userId: string): Promise<Space> {
    const space: Space = {
      id: nanoid(),
      type: 'personal',
      createdAt: new Date(),
    };
    this.spaces.set(space.id, space);

    const workspace: Workspace = {
      id: nanoid(),
      spaceId: space.id,
      name: 'Personal',
      policyManagerNoteAccess: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workspaces.set(workspace.id, workspace);

    const membership: Membership = {
      id: nanoid(),
      workspaceId: workspace.id,
      userId,
      role: 'owner',
      createdAt: new Date(),
    };
    this.memberships.set(membership.id, membership);

    return space;
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const userMemberships = Array.from(this.memberships.values())
      .filter(m => m.userId === userId);

    const workspaceIds = userMemberships.map(m => m.workspaceId);
    return Array.from(this.workspaces.values())
      .filter(w => workspaceIds.includes(w.id));
  }

  async getWorkspacesBySpace(spaceId: string): Promise<Workspace[]> {
    return Array.from(this.workspaces.values())
      .filter(w => w.spaceId === spaceId);
  }

  // Reports and Time Tracking
  async getTimeEntriesByUser(userId: string): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values());
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(t => t.assigneeId === userId);
  }

  async getTimeTrackingStats(userId: string): Promise<{ totalHours: number; weeklyHours: number; averagePerDay: number }> {
    const entries = await this.getTimeEntriesByUser(userId);
    const totalSeconds = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalHours = totalSeconds / 3600;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyEntries = entries.filter(entry => entry.startTime >= oneWeekAgo);
    const weeklySeconds = weeklyEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const weeklyHours = weeklySeconds / 3600;

    const averagePerDay = weeklyHours / 7;

    return {
      totalHours,
      weeklyHours,
      averagePerDay,
    };
  }

  async getProductivityStats(userId: string): Promise<{ completionRate: number; averageTasksPerDay: number; streak: number }> {
    const tasks = await this.getTasksByUser(userId);
    const completedTasks = tasks.filter(t => t.status === 'done');
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

    // Simple calculation for demo purposes
    const averageTasksPerDay = tasks.length / 7; // Assuming 7 days
    const streak = 5; // Mock streak

    return {
      completionRate,
      averageTasksPerDay,
      streak,
    };
  }

  // Attachments (Premium)
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const newAttachment: Attachment = {
      id: nanoid(),
      fileName: attachment.fileName,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
      filePath: attachment.filePath,
      uploadedBy: attachment.uploadedBy,
      noteId: attachment.noteId || null,
      taskId: attachment.taskId || null,
      createdAt: new Date(),
    };
    this.attachments.set(newAttachment.id, newAttachment);
    return newAttachment;
  }

  async getAttachment(id: string): Promise<Attachment | undefined> {
    return this.attachments.get(id);
  }

  async getAttachmentsByNote(noteId: string): Promise<Attachment[]> {
    return Array.from(this.attachments.values())
      .filter(a => a.noteId === noteId);
  }

  async getAttachmentsByTask(taskId: string): Promise<Attachment[]>{
    return Array.from(this.attachments.values())
      .filter(a => a.taskId === taskId);
  }

  async deleteAttachment(id: string): Promise<boolean> {
    return this.attachments.delete(id);
  }

  // Enhanced Analytics (Premium)
  async getUserTasks(userId: string): Promise<Task[]> {
    return this.getTasksByUser(userId);
  }

  async getUserTimeEntries(userId: string): Promise<TimeEntry[]>{
    return this.getTimeEntriesByUser(userId);
  }

  // Team Collaboration (Premium)
  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const newWorkspace: Workspace = {
      id: nanoid(),
      spaceId: workspace.spaceId,
      name: workspace.name,
      policyManagerNoteAccess: workspace.policyManagerNoteAccess || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workspaces.set(newWorkspace.id, newWorkspace);
    return newWorkspace;
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    return this.workspaces.get(id);
  }

  async createMembership(membership: InsertMembership): Promise<Membership> {
    const newMembership: Membership = {
      id: nanoid(),
      ...membership,
      createdAt: new Date(),
    };
    this.memberships.set(newMembership.id, newMembership);
    return newMembership;
  }

  async getWorkspaceMemberships(workspaceId: string): Promise<Membership[]> {
    return Array.from(this.memberships.values())
      .filter(m => m.workspaceId === workspaceId);
  }

  async getWorkspaceMembers(workspaceId: string): Promise<(Membership & { user: User })[]> {
    const memberships = await this.getWorkspaceMemberships(workspaceId);
    return memberships.map(membership => ({
      ...membership,
      user: this.users.get(membership.userId)!,
    }));
  }

  async updateMembershipRole(workspaceId: string, userId: string, role: string): Promise<void> {
    const membership = Array.from(this.memberships.values())
      .find(m => m.workspaceId === workspaceId && m.userId === userId);

    if (membership) {
      membership.role = role;
      this.memberships.set(membership.id, membership);
    }
  }
}

// Create storage instance
export const storage = new MemStorage();