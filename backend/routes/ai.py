from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from pydantic import BaseModel
from typing import List
import os
try:
    from openai import OpenAI
except Exception:
    OpenAI = None  # type: ignore

router = APIRouter(prefix="/api/ai", tags=["ai"])

# Do not instantiate the OpenAI client at import time so the app can
# start without an API key. We'll create a client lazily when needed.
def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or OpenAI is None:
        return None
    return OpenAI(api_key=api_key)

class ExtractTasksRequest(BaseModel):
    content: str

class ExtractedTask(BaseModel):
    title: str
    description: str
    priority: str
    dueDate: str | None = None

class EstimateTimeRequest(BaseModel):
    taskDescription: str

class AnalyzePriorityRequest(BaseModel):
    taskDescription: str
    context: str | None = None

@router.post("/extract-tasks", response_model=List[ExtractedTask])
async def extract_tasks(request: ExtractTasksRequest):
    # If no API key is present, return a mock response so the app can run
    client = get_openai_client()
    if client is None:
        return [
            {
                "title": "Review and implement suggestions from content",
                "description": "Based on the note content provided",
                "priority": "medium",
                "dueDate": None
            }
        ]

    try:
        # Use OpenAI to extract tasks from content
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an AI assistant that extracts actionable tasks from text. Return tasks as a JSON array with title, description, priority (low/medium/high/urgent), and dueDate fields."},
                {"role": "user", "content": f"Extract tasks from this content:\n\n{request.content}"}
            ],
            temperature=0.7
        )

        # In production, parse the response.choices[0].message.content
        # For now, keep the same mock as fallback
        return [
            {
                "title": "Review and implement suggestions from content",
                "description": "Based on the note content provided",
                "priority": "medium",
                "dueDate": None
            }
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract tasks: {str(e)}")

@router.post("/estimate-time")
async def estimate_time(request: EstimateTimeRequest):
    try:
        # Use OpenAI to estimate time for task
        return {
            "estimatedMinutes": 60,
            "confidence": "medium"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to estimate time: {str(e)}")

@router.post("/analyze-priority")
async def analyze_priority(request: AnalyzePriorityRequest):
    try:
        # Use OpenAI to analyze task priority
        return {
            "priority": "medium",
            "reasoning": "Based on the task description and context"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze priority: {str(e)}")
