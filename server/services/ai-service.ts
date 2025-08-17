import OpenAI from 'openai';
import type { AITaskSuggestion } from '@shared/schema';

let openai: OpenAI | null = null;

// Initialize OpenAI client if API key is available
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function extractTasksFromNote(
  noteContent: string,
  noteTitle: string,
  projectContext?: string
): Promise<AITaskSuggestion[]> {
  if (!openai) {
    // Return empty array if no OpenAI key configured
    return [];
  }

  try {
    const prompt = `
Analyze the following note content and extract actionable tasks. Return a JSON array of task objects.

Note Title: "${noteTitle}"
Project Context: ${projectContext || 'General'}

Note Content:
${noteContent}

For each task, provide:
- title: Clear, actionable task title
- description: Optional brief description  
- priority: one of "low", "medium", "high", "urgent"
- dueDate: ISO date string if mentioned, null otherwise
- tags: array of relevant tags/categories

Only extract tasks that are clearly actionable. Ignore general notes, ideas, or completed items.
Return empty array if no actionable tasks found.

Respond with valid JSON only:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that extracts actionable tasks from note content. Always respond with valid JSON array format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return [];

    try {
      const tasks = JSON.parse(response);
      return Array.isArray(tasks) ? tasks : [];
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return [];
    }
  } catch (error) {
    console.error('AI task extraction failed:', error);
    return [];
  }
}

export async function isAIServiceAvailable(): Promise<boolean> {
  return !!openai;
}