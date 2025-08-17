import type { 
  User, 
  Workspace, 
  Membership, 
  InsertMembership, 
  Task, 
  Project,
  AuditLog,
  InsertAuditLog 
} from '@shared/schema';

export interface TeamMember {
  user: User;
  membership: Membership;
  taskCount: number;
  completedTasks: number;
  totalTimeTracked: number;
}

export interface CollaborationActivity {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'comment_added' | 'file_uploaded' | 'project_updated';
  actorId: string;
  actorName: string;
  targetType: string;
  targetId: string;
  targetName: string;
  description: string;
  timestamp: string;
}

export interface WorkspaceStats {
  totalMembers: number;
  activeMembers: number;
  totalTasks: number;
  completedTasks: number;
  totalProjects: number;
  totalTimeTracked: number;
  recentActivity: CollaborationActivity[];
}

export function canUserAccessWorkspace(
  userId: string, 
  workspaceId: string, 
  memberships: Membership[]
): boolean {
  return memberships.some(m => 
    m.userId === userId && 
    m.workspaceId === workspaceId
  );
}

export function canUserManageWorkspace(
  userId: string, 
  workspaceId: string, 
  memberships: Membership[]
): boolean {
  const membership = memberships.find(m => 
    m.userId === userId && 
    m.workspaceId === workspaceId
  );
  return membership ? ['owner', 'manager'].includes(membership.role) : false;
}

export function canUserAssignTasks(
  userId: string, 
  workspaceId: string, 
  memberships: Membership[]
): boolean {
  const membership = memberships.find(m => 
    m.userId === userId && 
    m.workspaceId === workspaceId
  );
  return membership ? ['owner', 'manager', 'member'].includes(membership.role) : false;
}

export function getAvailableRoles(currentUserRole: string): string[] {
  switch (currentUserRole) {
    case 'owner':
      return ['owner', 'manager', 'member', 'viewer'];
    case 'manager':
      return ['member', 'viewer'];
    default:
      return [];
  }
}

export function generateInviteToken(workspaceId: string, role: string): string {
  // In production, this would be a secure JWT or database token
  const payload = {
    workspaceId,
    role,
    expires: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function parseInviteToken(token: string): { workspaceId: string; role: string; expires: number } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (payload.expires < Date.now()) {
      return null; // Token expired
    }
    return payload;
  } catch {
    return null;
  }
}

export function createAuditLog(
  workspaceId: string,
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  diff?: any
): Partial<InsertAuditLog> {
  return {
    workspaceId,
    actorId,
    action,
    targetType,
    targetId,
    diffJson: diff || null,
  };
}

export function generateActivityDescription(log: AuditLog, users: User[]): string {
  const actor = users.find(u => u.id === log.actorId);
  const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'Unknown User';

  switch (log.action) {
    case 'task_created':
      return `${actorName} created a new task`;
    case 'task_assigned':
      const assignee = log.diffJson?.assigneeId ? 
        users.find(u => u.id === log.diffJson.assigneeId) : null;
      const assigneeName = assignee ? `${assignee.firstName} ${assignee.lastName}` : 'someone';
      return `${actorName} assigned task to ${assigneeName}`;
    case 'task_completed':
      return `${actorName} completed a task`;
    case 'task_updated':
      return `${actorName} updated a task`;
    case 'project_created':
      return `${actorName} created a new project`;
    case 'member_added':
      return `${actorName} added a new team member`;
    case 'member_removed':
      return `${actorName} removed a team member`;
    case 'file_uploaded':
      return `${actorName} uploaded a file`;
    default:
      return `${actorName} performed an action`;
  }
}

export function calculateMemberStats(
  member: Membership & { user: User },
  tasks: Task[],
  timeEntries: any[]
): TeamMember {
  const memberTasks = tasks.filter(t => t.assigneeId === member.userId);
  const completedTasks = memberTasks.filter(t => t.status === 'done').length;
  
  const memberTimeEntries = timeEntries.filter(entry => {
    const task = tasks.find(t => t.id === entry.taskId);
    return task && task.assigneeId === member.userId;
  });
  
  const totalTimeTracked = memberTimeEntries.reduce((sum, entry) => sum + entry.duration, 0);

  return {
    user: member.user,
    membership: member,
    taskCount: memberTasks.length,
    completedTasks,
    totalTimeTracked: Math.round(totalTimeTracked / 3600), // Convert to hours
  };
}

export function filterSensitiveWorkspaceData(
  workspace: Workspace,
  userRole: string
): Partial<Workspace> {
  const baseData = {
    id: workspace.id,
    name: workspace.name,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };

  // Viewers have limited access to workspace details
  if (userRole === 'viewer') {
    return baseData;
  }

  // Members and above can see more details
  return {
    ...baseData,
    spaceId: workspace.spaceId,
    policyManagerNoteAccess: workspace.policyManagerNoteAccess,
  };
}

export function generateCollaborationInsights(
  teamMembers: TeamMember[],
  recentTasks: Task[],
  timeframe: 'week' | 'month' = 'week'
): {
  topPerformers: TeamMember[];
  collaborationScore: number;
  taskDistribution: { balanced: boolean; suggestions: string[] };
  communicationHealth: number;
} {
  // Sort by completion rate and recent activity
  const topPerformers = [...teamMembers]
    .sort((a, b) => {
      const aRate = a.taskCount > 0 ? a.completedTasks / a.taskCount : 0;
      const bRate = b.taskCount > 0 ? b.completedTasks / b.taskCount : 0;
      return bRate - aRate;
    })
    .slice(0, 3);

  // Calculate collaboration score based on task distribution and completion
  const totalTasks = teamMembers.reduce((sum, m) => sum + m.taskCount, 0);
  const avgTasksPerMember = totalTasks / teamMembers.length;
  const taskVariance = teamMembers.reduce((sum, m) => 
    sum + Math.pow(m.taskCount - avgTasksPerMember, 2), 0
  ) / teamMembers.length;
  
  const collaborationScore = Math.max(0, 100 - (taskVariance * 2));

  // Task distribution analysis
  const maxTasks = Math.max(...teamMembers.map(m => m.taskCount));
  const minTasks = Math.min(...teamMembers.map(m => m.taskCount));
  const balanced = (maxTasks - minTasks) <= 3;
  
  const suggestions = [];
  if (!balanced) {
    suggestions.push('Consider redistributing tasks for better balance');
  }
  if (collaborationScore < 70) {
    suggestions.push('Improve communication and coordination');
  }

  // Mock communication health score
  const communicationHealth = Math.floor(60 + Math.random() * 35);

  return {
    topPerformers,
    collaborationScore: Math.round(collaborationScore),
    taskDistribution: { balanced, suggestions },
    communicationHealth,
  };
}

// Mock data generators for development
export function generateMockTeamActivity(): CollaborationActivity[] {
  const activities = [
    {
      id: '1',
      type: 'task_completed' as const,
      actorId: 'user1',
      actorName: 'Alice Johnson',
      targetType: 'task',
      targetId: 'task1',
      targetName: 'Complete user authentication',
      description: 'Alice Johnson completed task "Complete user authentication"',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'task_assigned' as const,
      actorId: 'user2',
      actorName: 'Bob Smith',
      targetType: 'task',
      targetId: 'task2',
      targetName: 'Design landing page',
      description: 'Bob Smith assigned task "Design landing page" to Alice Johnson',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'file_uploaded' as const,
      actorId: 'user3',
      actorName: 'Carol Davis',
      targetType: 'note',
      targetId: 'note1',
      targetName: 'Project Requirements',
      description: 'Carol Davis uploaded a file to "Project Requirements"',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return activities;
}

export function generateMockWorkspaceStats(): WorkspaceStats {
  return {
    totalMembers: 5,
    activeMembers: 4,
    totalTasks: 24,
    completedTasks: 18,
    totalProjects: 3,
    totalTimeTracked: 156, // hours
    recentActivity: generateMockTeamActivity(),
  };
}