'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { apiRequest } from '@/app/lib/api-client';
import { queryClient } from '@/app/lib/query-client';

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: newProjectName,
          description: '',
          color: '#6366F1',
          status: 'active'
        }),
      });

      setNewProjectName('');
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">ProjectMind</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline">Settings</Button>
            <Button variant="ghost">Logout</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Manage your projects and tasks</p>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-semibold">Projects</h3>
            <Button onClick={() => setIsCreating(!isCreating)} data-testid="button-new-project">
              {isCreating ? 'Cancel' : 'New Project'}
            </Button>
          </div>

          {isCreating && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Create New Project</CardTitle>
                <CardDescription>Add a new project to your workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      type="text"
                      placeholder="My Awesome Project"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      required
                      data-testid="input-project-name"
                    />
                  </div>
                  <Button type="submit" data-testid="button-create-project">
                    Create Project
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-project-${project.id}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                      <CardTitle>{project.name}</CardTitle>
                    </div>
                    {project.description && (
                      <CardDescription>{project.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Status: {project.status}</span>
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">No projects yet. Create your first project to get started!</p>
                <Button onClick={() => setIsCreating(true)}>Create Your First Project</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{projects?.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Time Tracked</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">0h</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
