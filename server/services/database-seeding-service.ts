import { storage } from '../storage';
import { nanoid } from 'nanoid';

export class DatabaseSeedingService {
  async seedDemoData(userId: string = 'dev-user-1'): Promise<void> {
    try {
      console.log('Starting database seeding...');

      // Seed demo projects
      const projects = await this.seedProjects(userId);
      
      // Seed demo notes for each project
      for (const project of projects) {
        await this.seedNotes(project.id);
      }

      // Seed demo tasks for each project
      for (const project of projects) {
        await this.seedTasks(project.id);
      }

      // Seed time entries
      await this.seedTimeEntries();

      // Seed demo workspace if user is premium
      await this.seedWorkspaces(userId);

      console.log('Database seeding completed successfully');
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }

  private async seedProjects(userId: string) {
    const demoProjects = [
      {
        id: nanoid(),
        name: 'Product Launch Strategy',
        description: 'Comprehensive strategy for launching our new product line',
        color: '#3B82F6',
        status: 'active',
        spaceId: null,
        workspaceId: null,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: nanoid(),
        name: 'Website Redesign',
        description: 'Complete overhaul of company website with modern design',
        color: '#10B981',
        status: 'active',
        spaceId: null,
        workspaceId: null,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: nanoid(),
        name: 'Q4 Marketing Campaign',
        description: 'End-of-year marketing push across all channels',
        color: '#F59E0B',
        status: 'active',
        spaceId: null,
        workspaceId: null,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        updatedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      }
    ];

    const createdProjects = [];
    for (const project of demoProjects) {
      try {
        const created = await storage.createProject(project);
        createdProjects.push(created);
        console.log(`Created project: ${project.name}`);
      } catch (error) {
        console.error(`Failed to create project ${project.name}:`, error);
      }
    }

    return createdProjects;
  }

  private async seedNotes(projectId: string) {
    const demoNotes = [
      {
        id: nanoid(),
        projectId,
        spaceId: null,
        workspaceId: null,
        authorId: 'dev-user-1',
        title: 'Initial Research and Market Analysis',
        content: `# Market Research Findings

## Key Insights
- Target audience shows 73% interest in our solution
- Main competitors have 2-3 week delivery times
- Price sensitivity analysis indicates $99-149 sweet spot

## Action Items
- [ ] Conduct additional focus groups
- [ ] Finalize pricing strategy
- [ ] Review competitive positioning

## Next Steps
Schedule follow-up meeting with marketing team to review findings and align on go-to-market strategy.`,
        tags: ['research', 'market-analysis', 'strategy'],
        backlinks: [],
        visibilityScope: 'private',
        lastProcessedLength: 0,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: nanoid(),
        projectId,
        spaceId: null,
        workspaceId: null,
        authorId: 'dev-user-1',
        title: 'Team Meeting Notes - Strategy Session',
        content: `# Strategy Planning Session
**Date:** ${new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}
**Attendees:** Marketing Team, Product Team, Leadership

## Decisions Made
1. Launch timeline moved to Q1 next year
2. Focus on premium features first
3. Beta testing program approved

## Outstanding Questions
- Budget allocation for advertising?
- Partnership opportunities with influencers?
- International market considerations?

## Follow-up Actions
- Sarah: Draft beta testing criteria
- Mike: Research advertising platforms
- Team: Prepare Q1 roadmap presentation`,
        tags: ['meeting-notes', 'strategy', 'planning'],
        backlinks: [],
        visibilityScope: 'team',
        lastProcessedLength: 0,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      }
    ];

    for (const note of demoNotes) {
      try {
        await storage.createNote(note);
        console.log(`Created note: ${note.title}`);
      } catch (error) {
        console.error(`Failed to create note ${note.title}:`, error);
      }
    }
  }

  private async seedTasks(projectId: string) {
    const demoTasks = [
      {
        id: nanoid(),
        projectId,
        noteId: null,
        title: 'Complete competitive analysis report',
        description: 'Research top 5 competitors and document features, pricing, and market positioning',
        status: 'completed',
        priority: 'high',
        assigneeId: 'dev-user-1',
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago (past due, but completed)
        tags: ['research', 'analysis'],
        seriesId: null,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        id: nanoid(),
        projectId,
        noteId: null,
        title: 'Design wireframes for main user flow',
        description: 'Create detailed wireframes for onboarding, main dashboard, and key user actions',
        status: 'in-progress',
        priority: 'high',
        assigneeId: 'dev-user-1',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        tags: ['design', 'wireframes', 'ux'],
        seriesId: null,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        id: nanoid(),
        projectId,
        noteId: null,
        title: 'Set up analytics tracking',
        description: 'Implement Google Analytics and custom event tracking for user behavior analysis',
        status: 'pending',
        priority: 'medium',
        assigneeId: 'dev-user-1',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        tags: ['analytics', 'tracking', 'implementation'],
        seriesId: null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: nanoid(),
        projectId,
        noteId: null,
        title: 'Weekly progress review',
        description: 'Review project progress, update stakeholders, and plan next week priorities',
        status: 'pending',
        priority: 'medium',
        assigneeId: 'dev-user-1',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now (recurring weekly)
        tags: ['meeting', 'review', 'planning'],
        seriesId: 'weekly-review-series-1',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      }
    ];

    for (const task of demoTasks) {
      try {
        await storage.createTask(task);
        console.log(`Created task: ${task.title}`);
      } catch (error) {
        console.error(`Failed to create task ${task.title}:`, error);
      }
    }
  }

  private async seedTimeEntries() {
    // Create some realistic time entries for the last week
    const timeEntries = [
      {
        id: nanoid(),
        taskId: 'placeholder-task-1', // Would be actual task IDs in real implementation
        description: 'Research and competitive analysis',
        startTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 4 days ago, 9 AM
        endTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), // 4 days ago, 12 PM
        duration: 3 * 60 * 60, // 3 hours in seconds
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
      },
      {
        id: nanoid(),
        taskId: 'placeholder-task-2',
        description: 'Wireframe design and prototyping',
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // 2 days ago, 2 PM
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 17.5 * 60 * 60 * 1000), // 2 days ago, 5:30 PM
        duration: 3.5 * 60 * 60, // 3.5 hours in seconds
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 17.5 * 60 * 60 * 1000),
      },
      {
        id: nanoid(),
        taskId: 'placeholder-task-3',
        description: 'Project planning and documentation',
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // Yesterday, 10 AM
        endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 11.5 * 60 * 60 * 1000), // Yesterday, 11:30 AM
        duration: 1.5 * 60 * 60, // 1.5 hours in seconds
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 11.5 * 60 * 60 * 1000),
      }
    ];

    for (const entry of timeEntries) {
      try {
        await storage.createTimeEntry(entry);
        console.log(`Created time entry: ${entry.description}`);
      } catch (error) {
        console.error(`Failed to create time entry:`, error);
      }
    }
  }

  private async seedWorkspaces(userId: string) {
    // Only seed workspace if user has premium subscription
    const user = await storage.getUser(userId);
    if (user?.subscriptionPlan === 'premium') {
      try {
        // Create a demo workspace
        const demoWorkspace = {
          id: nanoid(),
          spaceId: 'demo-space-1',
          name: 'Marketing Team Workspace',
          policyManagerNoteAccess: true,
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        };

        await storage.createWorkspace(demoWorkspace);
        console.log(`Created demo workspace: ${demoWorkspace.name}`);

        // Create membership for the user
        const membership = {
          id: nanoid(),
          workspaceId: demoWorkspace.id,
          userId,
          role: 'owner',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        };

        await storage.createMembership(membership);
        console.log(`Created workspace membership for user`);
      } catch (error) {
        console.error('Failed to create demo workspace:', error);
      }
    }
  }

  async clearAllData(): Promise<void> {
    console.log('Clearing all demo data...');
    // In a real implementation, would delete all demo data
    // For now, just log the intention
    console.log('Demo data clearing completed (mock implementation)');
  }

  async isDemoDataSeeded(): Promise<boolean> {
    try {
      const projects = await storage.getProjects();
      return projects.length > 0;
    } catch (error) {
      console.error('Error checking demo data:', error);
      return false;
    }
  }
}

export const databaseSeedingService = new DatabaseSeedingService();