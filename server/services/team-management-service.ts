import { storage } from '../storage';
import { InsertWorkspace, InsertMembership, User } from '@shared/schema';
import { nanoid } from 'nanoid';

export interface TeamInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: 'member' | 'admin' | 'owner';
  invitedBy: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface WorkspacePermissions {
  canCreateProjects: boolean;
  canDeleteProjects: boolean;
  canManageMembers: boolean;
  canAccessAnalytics: boolean;
  canManageBilling: boolean;
  canViewAllNotes: boolean;
  canEditAllNotes: boolean;
  maxProjectsAllowed: number;
}

export class TeamManagementService {
  async createTeamWorkspace(ownerId: string, name: string, spaceId?: string): Promise<any> {
    // Check if user has premium subscription
    const owner = await storage.getUser(ownerId);
    if (!owner || owner.subscriptionPlan !== 'premium') {
      throw new Error('Team workspaces require a Premium subscription');
    }

    // Create or get space
    let workspaceSpaceId = spaceId;
    if (!workspaceSpaceId) {
      const space = await storage.createPersonalSpace(ownerId);
      workspaceSpaceId = space.id;
    }

    // Create workspace
    const workspace: InsertWorkspace = {
      id: nanoid(),
      spaceId: workspaceSpaceId,
      name,
      policyManagerNoteAccess: true, // Enable team collaboration features
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const createdWorkspace = await storage.createWorkspace(workspace);

    // Create owner membership
    const membership: InsertMembership = {
      id: nanoid(),
      workspaceId: createdWorkspace.id,
      userId: ownerId,
      role: 'owner',
      createdAt: new Date()
    };

    await storage.createMembership(membership);

    return {
      workspace: createdWorkspace,
      permissions: this.getRolePermissions('owner')
    };
  }

  async inviteTeamMember(
    workspaceId: string, 
    inviterUserId: string, 
    email: string, 
    role: 'member' | 'admin' = 'member'
  ): Promise<TeamInvitation> {
    // Check inviter permissions
    const inviterMembership = await this.getUserWorkspaceMembership(workspaceId, inviterUserId);
    if (!inviterMembership || !this.canInviteMembers(inviterMembership.role)) {
      throw new Error('Insufficient permissions to invite team members');
    }

    // Check workspace limits
    const members = await storage.getWorkspaceMembers(workspaceId);
    if (members.length >= this.getMaxTeamSize(inviterMembership.role)) {
      throw new Error('Team size limit reached. Upgrade your plan for larger teams.');
    }

    // Create invitation (in a real app, this would be stored in database)
    const invitation: TeamInvitation = {
      id: nanoid(),
      workspaceId,
      email,
      role,
      invitedBy: inviterUserId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending'
    };

    // In a real implementation, send email invitation
    console.log(`Team invitation sent to ${email} for workspace ${workspaceId}`);

    return invitation;
  }

  async acceptInvitation(invitationId: string, userId: string): Promise<any> {
    // In a real implementation, would fetch invitation from database
    // For demo purposes, create a mock accepted invitation
    const membership: InsertMembership = {
      id: nanoid(),
      workspaceId: 'demo-workspace-id',
      userId,
      role: 'member',
      createdAt: new Date()
    };

    return await storage.createMembership(membership);
  }

  async updateMemberRole(
    workspaceId: string, 
    adminUserId: string, 
    targetUserId: string, 
    newRole: 'member' | 'admin'
  ): Promise<void> {
    const adminMembership = await this.getUserWorkspaceMembership(workspaceId, adminUserId);
    if (!adminMembership || !this.canManageMembers(adminMembership.role)) {
      throw new Error('Insufficient permissions to manage team members');
    }

    await storage.updateMembershipRole(workspaceId, targetUserId, newRole);
  }

  async removeTeamMember(
    workspaceId: string, 
    adminUserId: string, 
    targetUserId: string
  ): Promise<void> {
    const adminMembership = await this.getUserWorkspaceMembership(workspaceId, adminUserId);
    if (!adminMembership || !this.canManageMembers(adminMembership.role)) {
      throw new Error('Insufficient permissions to remove team members');
    }

    // Prevent removing the owner
    const targetMembership = await this.getUserWorkspaceMembership(workspaceId, targetUserId);
    if (targetMembership?.role === 'owner') {
      throw new Error('Cannot remove workspace owner');
    }

    // In a real implementation, would have a deleteMembership method
    console.log(`Removing user ${targetUserId} from workspace ${workspaceId}`);
  }

  async getWorkspaceAnalytics(workspaceId: string, userId: string): Promise<any> {
    const membership = await this.getUserWorkspaceMembership(workspaceId, userId);
    if (!membership || !this.canAccessAnalytics(membership.role)) {
      throw new Error('Insufficient permissions to view analytics');
    }

    // Get workspace members and their activities
    const members = await storage.getWorkspaceMembers(workspaceId);
    const memberIds = members.map(m => m.userId);

    // Mock analytics data (in real implementation, would aggregate from database)
    return {
      teamSize: members.length,
      totalProjects: 0, // Would count projects in workspace
      totalTasks: 0, // Would count tasks across workspace projects
      totalTimeTracked: 0, // Would sum time entries
      memberActivity: memberIds.map(id => ({
        userId: id,
        tasksCompleted: Math.floor(Math.random() * 50),
        hoursWorked: Math.floor(Math.random() * 40),
        lastActive: new Date()
      })),
      productivityTrends: {
        weeklyTaskCompletion: [12, 18, 15, 22, 19, 25, 21],
        weeklyTimeSpent: [32, 45, 38, 42, 36, 48, 41]
      }
    };
  }

  private async getUserWorkspaceMembership(workspaceId: string, userId: string): Promise<any | null> {
    const memberships = await storage.getWorkspaceMemberships(workspaceId);
    return memberships.find(m => m.userId === userId) || null;
  }

  private getRolePermissions(role: string): WorkspacePermissions {
    switch (role) {
      case 'owner':
        return {
          canCreateProjects: true,
          canDeleteProjects: true,
          canManageMembers: true,
          canAccessAnalytics: true,
          canManageBilling: true,
          canViewAllNotes: true,
          canEditAllNotes: true,
          maxProjectsAllowed: -1 // unlimited
        };
      case 'admin':
        return {
          canCreateProjects: true,
          canDeleteProjects: true,
          canManageMembers: true,
          canAccessAnalytics: true,
          canManageBilling: false,
          canViewAllNotes: true,
          canEditAllNotes: true,
          maxProjectsAllowed: 50
        };
      case 'member':
      default:
        return {
          canCreateProjects: true,
          canDeleteProjects: false,
          canManageMembers: false,
          canAccessAnalytics: false,
          canManageBilling: false,
          canViewAllNotes: false,
          canEditAllNotes: false,
          maxProjectsAllowed: 10
        };
    }
  }

  private canInviteMembers(role: string): boolean {
    return ['owner', 'admin'].includes(role);
  }

  private canManageMembers(role: string): boolean {
    return ['owner', 'admin'].includes(role);
  }

  private canAccessAnalytics(role: string): boolean {
    return ['owner', 'admin'].includes(role);
  }

  private getMaxTeamSize(role: string): number {
    // Team size limits based on subscription
    return role === 'owner' ? 50 : 25; // Premium limits
  }
}

export const teamManagementService = new TeamManagementService();