import { useState } from "react";
import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/sidebar";
import NotesEditor from "@/components/notes-editor";
import KanbanBoard from "@/components/kanban-board";
import TimeTracking from "@/components/time-tracking";
import SpaceSwitcher from "@/components/space-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Share, MoreHorizontal, Menu, Edit, CheckSquare, Clock, Settings, Calendar, Users, FileText, BarChart3 } from "lucide-react";
import UserSettings from "@/components/user-settings";
import Reports from "@/components/reports";
import RecurringTasks from "@/components/recurring-tasks";
import { TeamCollaboration } from "@/components/team-collaboration";
import FileAttachments from "@/components/file-attachments";
import AnalyticsDashboard from "@/components/analytics-dashboard";


type TabType = 'notes' | 'tasks' | 'time' | 'reports' | 'settings' | 'recurring' | 'team' | 'attachments' | 'analytics';
type SpaceType = 'personal' | 'professional';





export default function Dashboard() {
  const { id: projectId } = useParams();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentProjectId, setCurrentProjectId] = useState(projectId || 'project-1');
  const [currentSpace, setCurrentSpace] = useState<SpaceType>('personal');

  // Handle space change with filtering
  const handleSpaceChange = (space: SpaceType) => {
    setCurrentSpace(space);
    // You could add logic here to filter projects by space
    // For now, we'll just update the UI state
  };

  const { data: project } = useQuery({
    queryKey: ['/api/projects', currentProjectId],
    enabled: !!currentProjectId,
  });

  const { data: featureFlags } = useQuery({
    queryKey: ['/api/feature-flags'],
  });

  const { data: aiStatus } = useQuery({
    queryKey: ['/api/timer/active'],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => fetch("/api/projects").then((res) => res.json()),
  });

  // Create default project if none exist
  const createDefaultProject = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "My First Project",
          description: "Welcome to your first project! Start by creating notes and tasks.",
          color: "#3B82F6",
          status: "active"
        }),
      });
      return response.json();
    },
    onSuccess: (newProject) => {
      setCurrentProjectId(newProject.id);
    },
  });

  // Auto-create default project if none exist
  React.useEffect(() => {
    if (projects && projects.length === 0 && !createDefaultProject.isPending) {
      createDefaultProject.mutate();
    }
  }, [projects, createDefaultProject]);

  const currentProject = Array.isArray(projects) ? (projects.find(p => p.id === currentProjectId) || projects[0] || null) : null;

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'notes', label: 'Notes', icon: Edit },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'time', label: 'Time Tracking', icon: Clock },
    { id: 'reports', label: 'Reports', icon: MoreHorizontal }, // Added Reports tab
    { id: 'recurring', label: 'Recurring Tasks', icon: Calendar },
    { id: 'team', label: 'Team Collaboration', icon: Users },
    { id: 'attachments', label: 'Attachments', icon: FileText }, // Changed FileAttachments icon to FileText
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-ai-background">
      <Sidebar 
        isOpen={sidebarOpen}
        onProjectSelect={setCurrentProjectId}
        currentProjectId={currentProjectId}
        onTabChange={setActiveTab}
        onNewNoteClick={() => {
          // This will be handled by the NotesEditor component
          setActiveTab('notes');
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Header */}
        <div className="bg-ai-card border-b border-border p-3 md:p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="toggle-sidebar"
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-xl md:text-2xl font-semibold text-ai-text truncate">
                {(project as any)?.name || 'Loading...'}
              </h2>
              <div className="hidden md:flex items-center space-x-2">
                <Badge variant="secondary" className="bg-accent/10 text-accent">
                  Active
                </Badge>
                <span className="text-gray-500">•</span>
                <span className="text-sm text-muted-foreground">Last updated 2 hours ago</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3 flex-wrap gap-2">
              {/* Space Switcher */}
              <SpaceSwitcher 
                currentWorkspaceId={currentSpace === 'personal' ? 'personal-workspace' : 'professional-workspace'}
                onWorkspaceChange={(id: string) => handleSpaceChange(id.includes('personal') ? 'personal' : 'professional')}
              />

              {/* AI Status Indicator */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-ai-secondary/10 rounded-lg">
                <div className="w-2 h-2 bg-ai-secondary rounded-full animate-pulse-ai"></div>
                <span className="text-sm font-medium text-ai-secondary">AI Active</span>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="share-project">
                    <Share className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Project</DialogTitle>
                    <DialogDescription>
                      Share this project with your team members
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Project Link</label>
                      <div className="flex mt-1">
                        <Input 
                          value={`${window.location.origin}/project/${currentProjectId}`}
                          readOnly
                          className="mr-2"
                        />
                        <Button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/project/${currentProjectId}`);
                            // You could add a toast here
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Invite by Email</label>
                      <div className="flex mt-1">
                        <Input placeholder="Enter email address" className="mr-2" />
                        <Button>Send Invite</Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="more-options">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={async () => {
                            try {
                              await logout.mutateAsync();
                              window.location.href = '/';
                            } catch (error) {
                              console.error('Logout error:', error);
                            }
                          }}
                        >
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center mt-4 space-x-1 overflow-x-auto custom-scrollbar pb-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className={`px-3 md:px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id 
                      ? "bg-ai-primary text-white hover:bg-ai-primary/90" 
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`tab-${tab.id}`}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'notes' && (
            <NotesEditor projectId={currentProjectId} />
          )}
          {activeTab === 'tasks' && (
            <KanbanBoard projectId={currentProjectId} />
          )}
          {activeTab === 'time' && (
            <TimeTracking projectId={currentProjectId} />
          )}
          {activeTab === 'reports' && ( // Render Reports component when 'reports' tab is active
            <Reports />
          )}
          {activeTab === 'recurring' && (
            <RecurringTasks taskId="sample-task" taskTitle="Sample Task" hasAdvancedRecurrence />
          )}
          {activeTab === 'team' && (
            <TeamCollaboration workspaceId="current-workspace" hasTeamFeatures />
          )}
          {activeTab === 'attachments' && (
            <FileAttachments projectId={currentProjectId} />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard projectId={currentProjectId} />
          )}
          {activeTab === 'settings' && ( // Render UserSettings component when 'settings' tab is active
            <UserSettings userId={(user as any)?.id || 'current-user'} hasAdvancedSettings />
          )}

          {/* Conditional rendering for empty states */}
          {!currentProject && (activeTab === 'notes' || activeTab === 'tasks') && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Create a project to get started with notes and tasks.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}