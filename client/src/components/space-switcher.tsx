
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Building2, 
  Users, 
  Settings, 
  Crown,
  Check,
  ChevronDown,
  Briefcase,
  Home
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Workspace {
  id: string;
  name: string;
  type: 'personal' | 'professional';
  description?: string;
  memberCount?: number;
  isOwner: boolean;
  features: string[];
}

interface SpaceSwitcherProps {
  currentWorkspaceId?: string;
  onWorkspaceChange?: (workspaceId: string) => void;
}

function SpaceSwitcher({ currentWorkspaceId, onWorkspaceChange }: SpaceSwitcherProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceType, setNewWorkspaceType] = useState<'personal' | 'professional'>('personal');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch user's workspaces
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['/api/workspaces'],
    queryFn: () => apiRequest('/api/workspaces'),
  });

  // Create workspace mutation
  const createWorkspaceMutation = useMutation({
    mutationFn: (data: { name: string; type: 'personal' | 'professional' }) =>
      apiRequest('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces'] });
      setIsCreateDialogOpen(false);
      setNewWorkspaceName('');
      setNewWorkspaceType('personal');
    },
  });

  const currentWorkspace = workspaces.find((w: Workspace) => w.id === currentWorkspaceId) || workspaces[0];

  const handleCreateWorkspace = () => {
    if (newWorkspaceName.trim()) {
      createWorkspaceMutation.mutate({
        name: newWorkspaceName.trim(),
        type: newWorkspaceType,
      });
    }
  };

  const handleWorkspaceSelect = (workspaceId: string) => {
    onWorkspaceChange?.(workspaceId);
    setIsDropdownOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 p-2 border rounded-lg animate-pulse">
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 bg-gray-100 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Workspace Selector */}
      <div className="relative">
        <Button
          variant="ghost"
          className="w-full justify-between h-auto p-3 border border-border hover:bg-accent"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {currentWorkspace?.type === 'professional' ? (
                <Briefcase className="h-5 w-5 text-blue-600" />
              ) : (
                <Home className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-sm">
                {currentWorkspace?.name || 'Select Workspace'}
              </div>
              <div className="text-xs text-muted-foreground flex items-center space-x-2">
                <span className="capitalize">{currentWorkspace?.type}</span>
                {currentWorkspace?.type === 'professional' && (
                  <Crown className="h-3 w-3 text-amber-500" />
                )}
              </div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50">
            <div className="p-2">
              {/* Personal Workspaces */}
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Personal Workspaces
              </div>
              {workspaces
                .filter((workspace: Workspace) => workspace.type === 'personal')
                .map((workspace: Workspace) => (
                  <button
                    key={workspace.id}
                    className="w-full flex items-center space-x-3 p-2 hover:bg-accent rounded-md text-left"
                    onClick={() => handleWorkspaceSelect(workspace.id)}
                  >
                    <Home className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{workspace.name}</div>
                      <div className="text-xs text-muted-foreground">Personal</div>
                    </div>
                    {currentWorkspaceId === workspace.id && (
                      <Check className="h-4 w-4 text-ai-primary" />
                    )}
                  </button>
                ))}

              {/* Professional Workspaces */}
              {workspaces.some((w: Workspace) => w.type === 'professional') && (
                <>
                  <Separator className="my-2" />
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-2 flex items-center">
                    Professional Workspaces
                    <Crown className="h-3 w-3 text-amber-500 ml-1" />
                  </div>
                  {workspaces
                    .filter((workspace: Workspace) => workspace.type === 'professional')
                    .map((workspace: Workspace) => (
                      <button
                        key={workspace.id}
                        className="w-full flex items-center space-x-3 p-2 hover:bg-accent rounded-md text-left"
                        onClick={() => handleWorkspaceSelect(workspace.id)}
                      >
                        <Briefcase className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{workspace.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            Professional
                            {workspace.memberCount && (
                              <span className="ml-1">• {workspace.memberCount} members</span>
                            )}
                          </div>
                        </div>
                        {currentWorkspaceId === workspace.id && (
                          <Check className="h-4 w-4 text-ai-primary" />
                        )}
                      </button>
                    ))}
                </>
              )}

              <Separator className="my-2" />

              {/* Create New Workspace */}
              <button
                className="w-full flex items-center space-x-3 p-2 hover:bg-accent rounded-md text-left"
                onClick={() => {
                  setIsCreateDialogOpen(true);
                  setIsDropdownOpen(false);
                }}
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Create new workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Workspace Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace to organize your projects and collaborate with others.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                placeholder="My Awesome Workspace"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspace-type">Workspace Type</Label>
              <Select value={newWorkspaceType} onValueChange={(value: 'personal' | 'professional') => setNewWorkspaceType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">
                    <div className="flex items-center space-x-2">
                      <Home className="h-4 w-4 text-green-600" />
                      <span>Personal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="professional">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                      <span>Professional</span>
                      <Crown className="h-3 w-3 text-amber-500" />
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Feature comparison */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Features included:</div>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {newWorkspaceType === 'personal' ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <Check className="h-3 w-3 text-green-600" />
                      <span>Basic AI task extraction</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-3 w-3 text-green-600" />
                      <span>Simple time tracking</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-3 w-3 text-green-600" />
                      <span>Personal task board</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <Check className="h-3 w-3 text-green-600" />
                      <span>Advanced AI analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-3 w-3 text-green-600" />
                      <span>Team collaboration</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-3 w-3 text-green-600" />
                      <span>Advanced analytics</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-3 w-3 text-green-600" />
                      <span>Unlimited projects</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWorkspace}
              disabled={!newWorkspaceName.trim() || createWorkspaceMutation.isPending}
            >
              {createWorkspaceMutation.isPending ? 'Creating...' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </>
  );
}

export { SpaceSwitcher };
export default SpaceSwitcher;
