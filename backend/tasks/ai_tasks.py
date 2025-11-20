from backend.celery_app import celery_app
from backend.database import SessionLocal
from backend.models import User, Task, Note
from datetime import datetime, timedelta
import os
from openai import OpenAI

@celery_app.task(name="backend.tasks.ai_tasks.extract_tasks_async")
def extract_tasks_async(note_id: str, content: str, user_id: str):
    """
    Async task to extract tasks from note content using AI
    """
    db = SessionLocal()
    try:
        # Check user's daily limit
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
        
        # Check if limit needs reset
        if user.last_task_extraction_reset < datetime.utcnow() - timedelta(days=1):
            user.daily_task_extraction_count = 0
            user.last_task_extraction_reset = datetime.utcnow()
            db.commit()
        
        # Check limits based on subscription
        limits = {
            "free": 5,
            "pro": 50,
            "enterprise": 1000
        }
        limit = limits.get(user.subscription_plan, 5)
        
        if user.daily_task_extraction_count >= limit:
            return {"error": "Daily task extraction limit reached"}
        
        # Call OpenAI API
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return {"error": "OpenAI API key not configured"}
        
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI assistant that extracts actionable tasks from text. Return tasks as a JSON array with title, description, priority (low/medium/high/urgent), and dueDate fields."
                },
                {
                    "role": "user",
                    "content": f"Extract tasks from this content:\n\n{content}"
                }
            ],
            temperature=0.7
        )
        
        # Update user's extraction count
        user.daily_task_extraction_count += 1
        db.commit()
        
        # Parse and return tasks
        # In production, properly parse the JSON response
        return {
            "tasks": [],
            "note_id": note_id,
            "extracted_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@celery_app.task(name="backend.tasks.ai_tasks.reset_daily_limits")
def reset_daily_limits():
    """
    Reset daily task extraction limits for all users
    """
    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(days=1)
        users = db.query(User).filter(User.last_task_extraction_reset < cutoff).all()
        
        for user in users:
            user.daily_task_extraction_count = 0
            user.last_task_extraction_reset = datetime.utcnow()
        
        db.commit()
        return {"reset_count": len(users)}
    finally:
        db.close()

@celery_app.task(name="backend.tasks.ai_tasks.analyze_note_backlinks")
def analyze_note_backlinks(note_id: str):
    """
    Analyze note content and suggest backlinks to other notes
    """
    db = SessionLocal()
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            return {"error": "Note not found"}
        
        # AI-powered backlink analysis
        # This would use embeddings or semantic search
        return {"suggested_backlinks": []}
    finally:
        db.close()
