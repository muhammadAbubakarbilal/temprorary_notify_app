import { GoogleGenAI } from "@google/genai";

// Make Gemini optional - only initialize if API key is provided
const gemini = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export interface ExtractedTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
}

// Simple fallback task extraction without AI
function extractTasksWithoutAI(content: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  
  // Simple patterns to identify potential tasks
  const taskPatterns = [
    /(?:^|\n)\s*[-*]\s+(.+?)(?:\n|$)/g, // Bullet points
    /(?:^|\n)\s*\d+\.\s+(.+?)(?:\n|$)/g, // Numbered lists
    /(?:need to|should|must|have to|will|going to|plan to|todo:?)\s+(.+?)(?:\.|$)/gi, // Action words
    /(?:^|\n)\s*(?:TODO:?|TASK:?|ACTION:?)\s*(.+?)(?:\n|$)/gi, // Explicit task markers
  ];

  taskPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const taskText = match[1].trim();
      if (taskText.length > 3 && taskText.length < 200 && 
          !taskText.endsWith(':') && 
          !taskText.toLowerCase().includes('action items') &&
          !taskText.toLowerCase().includes('additional tasks') &&
          !taskText.toLowerCase().includes('meeting notes') &&
          !/^(here are|these are|following)/i.test(taskText)) {
        // Simple priority detection based on keywords
        let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
        if (taskText.toLowerCase().includes('urgent') || taskText.toLowerCase().includes('asap')) {
          priority = 'urgent';
        } else if (taskText.toLowerCase().includes('important') || taskText.toLowerCase().includes('critical')) {
          priority = 'high';
        } else if (taskText.toLowerCase().includes('later') || taskText.toLowerCase().includes('eventually')) {
          priority = 'low';
        }

        // Simple due date extraction
        const dateMatch = taskText.match(/(?:by|due|before|until)\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i);
        let dueDate: string | undefined;
        if (dateMatch) {
          // For now, just set a future date - could be enhanced with proper date parsing
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);
          dueDate = futureDate.toISOString().split('T')[0];
        }

        tasks.push({
          title: taskText.replace(/^(TODO:?|TASK:?|ACTION:?)\s*/i, '').trim(),
          description: `Extracted from note content`,
          priority,
          dueDate
        });
      }
    }
  });

  return tasks;
}

export async function extractTasksFromNote(content: string): Promise<ExtractedTask[]> {
  if (!gemini) {
    console.log('Using fallback task extraction (no Gemini API key)');
    return extractTasksWithoutAI(content);
  }

  try {
    const systemPrompt = `You are an expert at analyzing text and extracting actionable tasks. Look for:
- Action verbs (schedule, create, review, meet, call, etc.)
- Deadlines or time references  
- Specific deliverables or outcomes
- Meeting requests or appointments

For each task found, determine:
- A clear, specific title
- A brief description
- Priority level (low, medium, high, urgent) based on context and deadlines
- Due date if mentioned (format as YYYY-MM-DD)

Only extract genuine, actionable items that require specific action or follow-up.
Return JSON in this format: { "tasks": [{ "title": "Task title", "description": "Task description", "priority": "medium", "dueDate": "2024-11-01" }] }`;

    const prompt = `Analyze this note content and extract actionable tasks:\n\n${content}`;

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                  dueDate: { type: "string" }
                },
                required: ["title", "description", "priority"]
              }
            }
          },
          required: ["tasks"]
        },
        temperature: 0.3,
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const result = JSON.parse(rawJson);
      return result.tasks || [];
    } else {
      throw new Error("Empty response from Gemini model");
    }
  } catch (error) {
    console.error('Error extracting tasks from note with Gemini:', error);
    // Fall back to pattern matching if AI fails
    console.log('Falling back to pattern-based task extraction');
    return extractTasksWithoutAI(content);
  }
}

export async function generateTaskSuggestions(noteTitle: string, noteContent: string): Promise<string[]> {
  if (!gemini) {
    console.warn('Gemini API key not provided, skipping task suggestions');
    return [];
  }

  try {
    const systemPrompt = `You are a helpful project management assistant that suggests logical next steps based on note content. Focus on actionable items that would help move the project forward.

Return JSON in this format: { "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"] }`;

    const prompt = `Based on this note title "${noteTitle}" and content, suggest 3-5 relevant next steps or related tasks:\n\n${noteContent}`;

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["suggestions"]
        },
        temperature: 0.7,
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const result = JSON.parse(rawJson);
      return result.suggestions || [];
    } else {
      throw new Error("Empty response from Gemini model");
    }
  } catch (error) {
    console.error('Error generating task suggestions with Gemini:', error);
    return [];
  }
}
