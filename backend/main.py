"""
FastAPI backend server for Notify App.
- Serves API endpoints for task/note/project/workspace management
- Integrates with SQLAlchemy ORM + Alembic migrations
- Handles CORS for Next.js frontend (localhost:3000)
- Provides session-based authentication via cookies
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from backend.routes import auth, projects, notes, tasks, ai, workspaces, timer, reports

load_dotenv()

app = FastAPI(
    title="Notify App API",
    description="Backend API for task management, notes, and project tracking",
    version="1.0.0"
)

# Configure CORS for Next.js frontend
# Allows cookies and credentials to be sent with requests
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(notes.router)
app.include_router(tasks.router)
app.include_router(ai.router)
app.include_router(workspaces.router)
app.include_router(timer.router)
app.include_router(reports.router)

@app.get("/")
async def root():
    return {"message": "AI Productivity Platform API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    # Development server settings
    # --reload: Auto-restart on file changes
    # --host: Bind to localhost only (security)
    # --port: Run on port 8000
    # --log-level: Set to 'info' for verbose logs, 'warning' for less verbose
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True, log_level="info")
