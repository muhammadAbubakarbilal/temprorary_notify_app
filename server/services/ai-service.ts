import OpenAI from 'openai';
import type { AITaskSuggestion } from '@shared/schema';

let openai: OpenAI | null = null;

// Initialize OpenAI client if API key is available
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Mock implementation for development - will use real OpenAI when API key is provided
function generateMockTasks(noteContent: string, noteTitle: string): AITaskSuggestion[] {
  const actionWords = ['implement', 'create', 'build', 'design', 'test', 'review', 'update', 'fix', 'add', 'remove', 'deploy', 'setup', 'configure'];
  const sentences = noteContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const tasks: AITaskSuggestion[] = [];
  
  sentences.forEach((sentence, index) => {
    const lowerSentence = sentence.toLowerCase();
    const hasActionWord = actionWords.some(word => lowerSentence.includes(word));
    
    if (hasActionWord && sentence.trim().length > 20) {
      const priorityOptions = ['low', 'medium', 'high', 'urgent'] as const;
      const priority = priorityOptions[Math.floor(Math.random() * priorityOptions.length)];
      
      // Extract potential due dates
      let dueDate = null;
      const dateMatches = sentence.match(/\b(today|tomorrow|next week|this week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
      if (dateMatches) {
        const now = new Date();
        if (dateMatches[0].toLowerCase() === 'today') {
          dueDate = now.toISOString();
        } else if (dateMatches[0].toLowerCase() === 'tomorrow') {
          dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        } else if (dateMatches[0].toLowerCase() === 'next week') {
          dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        }
      }
      
      // Generate relevant tags
      const tags: string[] = [];
      if (lowerSentence.includes('ui') || lowerSentence.includes('interface')) tags.push('ui');
      if (lowerSentence.includes('backend') || lowerSentence.includes('server')) tags.push('backend');
      if (lowerSentence.includes('test') || lowerSentence.includes('testing')) tags.push('testing');
      if (lowerSentence.includes('bug') || lowerSentence.includes('fix')) tags.push('bugfix');
      if (lowerSentence.includes('feature') || lowerSentence.includes('new')) tags.push('feature');
      
      tasks.push({
        title: sentence.trim().replace(/^(and |or |also |then )/i, '').slice(0, 100),
        description: `Extracted from: "${noteTitle}"`,
        priority,
        dueDate,
        tags,
        estimatedHours: Math.floor(Math.random() * 8) + 1 // 1-8 hours
      });
    }
  });
  
  return tasks.slice(0, 5); // Limit to 5 tasks max
}

export async function extractTasksFromNote(
  noteContent: string,
  noteTitle: string,
  projectContext?: string
): Promise<AITaskSuggestion[]> {
  // Use mock implementation for development
  if (!openai) {
    console.log('Using mock AI task extraction - will use real OpenAI when API key is provided');
    return generateMockTasks(noteContent, noteTitle);
  }

  try {
    const prompt = `
Analyze the following note content and extract actionable tasks with advanced priority analysis and time estimation.

Note Title: "${noteTitle}"
Project Context: ${projectContext || 'General'}

Note Content:
${noteContent}

For each task, provide:
- title: Clear, actionable task title (max 100 chars)
- description: Brief description with context
- priority: Analyze urgency and importance to assign "low", "medium", "high", or "urgent"
- dueDate: ISO date string if mentioned or can be inferred, null otherwise
- tags: array of relevant tags/categories (ui, backend, testing, bugfix, feature, etc.)
- estimatedHours: Realistic time estimate in hours (1-40 hours)

Advanced Priority Analysis Rules:
- "urgent": Blocking issues, security vulnerabilities, production failures
- "high": Important features, deadlines within 3 days, critical bugs
- "medium": Regular features, moderate deadlines, non-critical improvements
- "low": Nice-to-have features, documentation, cleanup tasks

Only extract tasks that are clearly actionable. Ignore general notes, ideas, or completed items.
Return empty array if no actionable tasks found.

Respond with valid JSON only:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that extracts actionable tasks with advanced priority analysis and time estimation. Always respond with valid JSON array format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return [];

    try {
      const parsed = JSON.parse(response);
      const tasks = parsed.tasks || parsed;
      return Array.isArray(tasks) ? tasks : [];
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return generateMockTasks(noteContent, noteTitle); // Fallback to mock
    }
  } catch (error) {
    console.error('AI task extraction failed:', error);
    return generateMockTasks(noteContent, noteTitle); // Fallback to mock
  }
}

export async function estimateTaskTime(
  taskTitle: string,
  taskDescription: string,
  complexity?: 'simple' | 'medium' | 'complex'
): Promise<number> {
  if (!openai) {
    // Mock time estimation based on complexity and description length
    const baseHours = complexity === 'simple' ? 2 : complexity === 'complex' ? 8 : 4;
    const lengthFactor = Math.min(taskDescription.length / 100, 2);
    return Math.round(baseHours * (1 + lengthFactor));
  }

  try {
    const prompt = `
Estimate the time required to complete this task. Consider complexity, scope, and typical development practices.

Task: ${taskTitle}
Description: ${taskDescription}
Complexity: ${complexity || 'medium'}

Provide a realistic time estimate in hours (0.5 to 40 hours). Consider:
- Planning and research time
- Implementation time
- Testing and debugging
- Documentation
- Code review

Respond with just a number representing hours:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert project manager that provides accurate time estimates for development tasks."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 50,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    const hours = parseFloat(response || '4');
    return isNaN(hours) ? 4 : Math.max(0.5, Math.min(40, hours));
  } catch (error) {
    console.error('AI time estimation failed:', error);
    return 4; // Default fallback
  }
}

export async function analyzePriority(
  taskTitle: string,
  taskDescription: string,
  projectContext?: string,
  deadline?: string
): Promise<'low' | 'medium' | 'high' | 'urgent'> {
  if (!openai) {
    // Mock priority analysis
    const urgentWords = ['urgent', 'critical', 'emergency', 'blocking', 'broken', 'security'];
    const highWords = ['important', 'deadline', 'needed', 'required', 'bug', 'issue'];
    
    const text = `${taskTitle} ${taskDescription}`.toLowerCase();
    
    if (urgentWords.some(word => text.includes(word))) return 'urgent';
    if (highWords.some(word => text.includes(word))) return 'high';
    if (deadline && new Date(deadline) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) return 'high';
    
    return Math.random() > 0.5 ? 'medium' : 'low';
  }

  try {
    const prompt = `
Analyze the priority of this task using advanced priority matrix principles.

Task: ${taskTitle}
Description: ${taskDescription}
Project Context: ${projectContext || 'General'}
Deadline: ${deadline || 'Not specified'}

Priority Analysis Framework:
- URGENT: Security issues, production failures, blocking dependencies, legal compliance
- HIGH: Important features with near deadlines (≤3 days), critical bugs affecting users
- MEDIUM: Regular features, moderate deadlines, performance improvements
- LOW: Nice-to-have features, documentation, code cleanup, distant deadlines

Consider:
1. Impact on users/business
2. Urgency of deadline
3. Dependencies blocking other work
4. Risk if delayed
5. Effort vs value ratio

Respond with only one word: urgent, high, medium, or low`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert project manager that analyzes task priorities using strategic priority frameworks."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 10,
    });

    const response = completion.choices[0]?.message?.content?.trim().toLowerCase();
    const validPriorities = ['urgent', 'high', 'medium', 'low'] as const;
    
    return validPriorities.includes(response as any) ? response as any : 'medium';
  } catch (error) {
    console.error('AI priority analysis failed:', error);
    return 'medium';
  }
}

export async function generateTaskSuggestions(
  projectContext: string,
  completedTasks: string[],
  currentNotes: string[]
): Promise<AITaskSuggestion[]> {
  if (!openai) {
    // Mock task suggestions
    const suggestions = [
      {
        title: "Review project documentation",
        description: "Ensure all documentation is up to date and comprehensive",
        priority: 'medium' as const,
        dueDate: null,
        tags: ['documentation'],
        estimatedHours: 2
      },
      {
        title: "Optimize database queries",
        description: "Review and optimize slow-running database queries for better performance",
        priority: 'high' as const,
        dueDate: null,
        tags: ['performance', 'backend'],
        estimatedHours: 4
      },
      {
        title: "Add unit tests for core features",
        description: "Increase test coverage for critical application features",
        priority: 'medium' as const,
        dueDate: null,
        tags: ['testing', 'quality'],
        estimatedHours: 6
      }
    ];
    return suggestions;
  }

  try {
    const prompt = `
Based on the project context and completed work, suggest 3-5 actionable next tasks.

Project Context: ${projectContext}
Recently Completed: ${completedTasks.join(', ')}
Current Notes Topics: ${currentNotes.join(', ')}

Generate strategic task suggestions that:
1. Build on completed work
2. Address potential gaps or improvements
3. Advance project goals
4. Follow best practices

For each suggestion, provide:
- title: Clear, actionable task title
- description: Brief description with reasoning
- priority: Strategic priority level
- tags: Relevant categories
- estimatedHours: Realistic time estimate

Respond with valid JSON array:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an AI project assistant that suggests strategic next tasks based on project context."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return [];

    try {
      const parsed = JSON.parse(response);
      const suggestions = parsed.suggestions || parsed.tasks || parsed;
      return Array.isArray(suggestions) ? suggestions : [];
    } catch (parseError) {
      console.error('Failed to parse AI suggestions:', parseError);
      return [];
    }
  } catch (error) {
    console.error('AI task suggestions failed:', error);
    return [];
  }
}

export async function isAIServiceAvailable(): Promise<boolean> {
  return !!openai;
}