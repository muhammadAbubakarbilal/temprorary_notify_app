from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from pydantic import BaseModel
from typing import List
import os
from openai import OpenAI

router = APIRouter(prefix="/api/ai", tags=["ai"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
        
        # For now, return a mock response
        # In production, parse the response.choices[0].message.content
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
