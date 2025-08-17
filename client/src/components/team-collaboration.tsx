import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  UserPlus, 
  Settings, 
  Crown,
  Shield,
  Eye,
  Mail,
  ChevronRight,
  MoreVertical
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Workspace, Membership, User } from "@shared/schema";

interface TeamCollaborationProps {
  workspaceId: string;
  hasTeamFeatures?: boolean;
}

interface WorkspaceMember extends Membership {
  user: User;
}

const ROLE_INFO = {
  owner: { label: 'Owner', icon: Crown, color: 'text-yellow-600', description: 'Full access to workspace and settings' },
  admin: { label: 'Admin', icon: Shield, color: 'text-red-600', description: 'Manage members and workspace settings' },
  member: { label: 'Member', icon: Users, color: 'text-blue-600', description: 'Edit projects and tasks' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-green-600', description: 'View-only access' },
};

export function TeamCollaboration({ 
  workspaceId, 
  hasTeamFeatures = false 
}: TeamCollaborationProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: workspace } = useQuery({
    queryKey: [`/api/workspaces/${workspaceId}`],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${workspaceId}`);
      if (!response.ok) throw new Error('Failed to fetch workspace');
      return response.json();
    },
    enabled: hasTeamFeatures,
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: [`/api/workspaces/${workspaceId}/members`],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json();
    },
    enabled: hasTeamFeatures,
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const response = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (!response.ok) throw new Error('Failed to send invitation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/members`] });
      setInviteOpen(false);
      setInviteEmail('');
      toast({
        title: "Invitation sent",
        description: "Team member will receive an email invitation",
      });
    },
    onError: (error: any) => {
      if (error.message?.includes('Premium')) {
        toast({
          title: "Premium Feature",
          description: "Team collaboration requires a Premium subscription",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invitation failed",
          description: error.message || "Failed to send invitation",
          variant: "destructive",
        });
      }
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error('Failed to update role');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/members`] });
      toast({
        title: "Role updated",
        description: "Member role has been updated successfully",
      });
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, { 
        method: 'DELETE' 
      });
      if (!response.ok) throw new Error('Failed to remove member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/members`] });
      toast({
        title: "Member removed",
        description: "Team member has been removed from workspace",
      });
    }
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName || user.email || 'Unknown User';
  };

  if (!hasTeamFeatures) {
    return (
      <Card className="text-center py-8" data-testid="team-upgrade-prompt">
        <CardContent>
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Team Collaboration</h3>
          <p className="text-muted-foreground mb-4">
            Invite team members and collaborate on projects with Premium workspace features
          </p>
          <Button data-testid="button-upgrade-team">
            Upgrade to Premium
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="team-collaboration">
      {/* Workspace Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {workspace?.name || 'Workspace'} Team
                <Badge variant="secondary">Premium</Badge>
              </CardTitle>
              <CardDescription>
                Manage team members and their access levels
              </CardDescription>
            </div>
            
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-invite-member">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              
              <DialogContent data-testid="dialog-invite-member">
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join this workspace
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      data-testid="input-invite-email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={(value: 'admin' | 'member' | 'viewer') => setInviteRole(value)}>
                      <SelectTrigger data-testid="select-invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin - Manage workspace and members</SelectItem>
                        <SelectItem value="member">Member - Edit projects and tasks</SelectItem>
                        <SelectItem value="viewer">Viewer - View-only access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setInviteOpen(false)}
                      data-testid="button-cancel-invite"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleInvite}
                      disabled={!inviteEmail.trim() || inviteMutation.isPending}
                      data-testid="button-send-invite"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({members.length})</CardTitle>
          <CardDescription>
            Current members and their roles in this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3" data-testid="members-loading">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8" data-testid="no-members">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No team members yet</p>
              <p className="text-sm text-muted-foreground">Invite colleagues to start collaborating</p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="members-list">
              {members.map((member: WorkspaceMember) => {
                const roleInfo = ROLE_INFO[member.role as keyof typeof ROLE_INFO];
                const RoleIcon = roleInfo.icon;
                
                return (
                  <div 
                    key={member.userId}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    data-testid={`member-${member.userId}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {getInitials(getUserDisplayName(member.user))}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {getUserDisplayName(member.user)}
                        </p>
                        {member.role === 'owner' && (
                          <Crown className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.user.email || 'No email'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={roleInfo.color}
                      >
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {roleInfo.label}
                      </Badge>
                      
                      {member.role !== 'owner' && (
                        <Select 
                          value={member.role} 
                          onValueChange={(role) => updateRoleMutation.mutate({ 
                            userId: member.userId, 
                            role 
                          })}
                        >
                          <SelectTrigger className="w-32 h-8" data-testid={`select-role-${member.userId}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      
                      {member.role !== 'owner' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMemberMutation.mutate(member.userId)}
                          disabled={removeMemberMutation.isPending}
                          data-testid={`button-remove-${member.userId}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Role Permissions
          </CardTitle>
          <CardDescription>
            Understanding what each role can do in this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(ROLE_INFO).map(([role, info]) => {
              const RoleIcon = info.icon;
              
              return (
                <div key={role} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <RoleIcon className={`h-5 w-5 ${info.color}`} />
                    <h4 className="font-medium">{info.label}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {info.description}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}