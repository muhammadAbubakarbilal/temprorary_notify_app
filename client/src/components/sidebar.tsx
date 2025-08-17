import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  FileText, 
  Clock, 
  BarChart3, 
  ChevronLeft,
  MoreHorizontal,
  Settings,
  LogOut,
  Crown,
  User,
  Folder,
  Calendar,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type TabType = 'notes' | 'tasks' | 'time' | 'reports' | 'settings';

interface SidebarProps {
  isOpen: boolean;
  onProjectSelect: (projectId: string) => void;
  currentProjectId: string;
  onTabChange: (tab: TabType) => void;
  onNewNoteClick: () => void;
}

export default function Sidebar({ 
  isOpen, 
  onProjectSelect, 
  currentProjectId, 
  onTabChange,
  onNewNoteClick 
}: SidebarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => fetch("/api/projects").then((res) => res.json()),
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: { name: string; description?: string }) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...projectData,
          color: "#3B82F6", // Default blue color
          status: "active"
        }),
      });
      if (!response.ok) throw new Error("Failed to create project");
      return response.json();
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onProjectSelect(newProject.id);
      setNewProjectName("");
      setIsCreateDialogOpen(false);
      toast({
        title: "Project Created",
        description: `${newProject.name} has been created successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    createProjectMutation.mutate({
      name: newProjectName.trim(),
      description: `Project created on ${new Date().toLocaleDateString()}`
    });
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const menuItems = [
    { id: 'notes' as TabType, label: 'New Note', icon: FileText },
    { id: 'tasks' as TabType, label: 'Tasks', icon: Target },
    { id: 'time' as TabType, label: 'Time Tracking', icon: Clock },
    { id: 'reports' as TabType, label: 'Reports', icon: BarChart3 },
  ];

  if (!isOpen) {
    return (
      <div className="w-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-10 h-10 p-0"
          onClick={() => onTabChange('notes')}
        >
          <Plus className="h-5 w-5" />
        </Button>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0"
              onClick={() => onTabChange(item.id)}
            >
              <IconComponent className="h-5 w-5" />
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-0 h-auto">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Badge variant={user?.subscriptionPlan === 'premium' ? 'default' : 'secondary'} className="text-xs">
                      {user?.subscriptionPlan === 'premium' ? 'Pro' : 'Free'}
                    </Badge>
                  </div>
                </div>
                <MoreHorizontal className="h-4 w-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => onTabChange('settings')}>
              <User className="h-4 w-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            {user?.subscriptionPlan !== 'premium' && (
              <DropdownMenuItem onClick={() => window.location.href = '/subscribe'}>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-2">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full justify-start" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Give your project a name to get started with notes and tasks.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || createProjectMutation.isPending}
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full justify-start"
              size="sm"
              onClick={() => {
                if (item.id === 'notes') {
                  onNewNoteClick();
                }
                onTabChange(item.id);
              }}
            >
              <IconComponent className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
          );
        })}
      </div>

      {/* Projects Section */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Projects</h3>
        </div>
        <ScrollArea className="flex-1 px-2">
          {projects.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              <Folder className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No projects yet</p>
              <p className="text-xs">Create your first project to get started</p>
            </div>
          ) : (
            <div className="space-y-1">
              {projects.map((project: any) => (
                <Button
                  key={project.id}
                  variant={currentProjectId === project.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left",
                    currentProjectId === project.id && "bg-gray-100 dark:bg-gray-800"
                  )}
                  size="sm"
                  onClick={() => onProjectSelect(project.id)}
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-3" 
                    style={{ backgroundColor: project.color || "#3B82F6" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{project.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {project.status === 'active' ? 'Active' : 'Archived'}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          size="sm"
          onClick={() => onTabChange('settings')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
}