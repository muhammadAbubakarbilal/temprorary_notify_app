from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from backend.routes import auth, projects, notes, tasks, ai, workspaces, timer, reports

load_dotenv()

app = FastAPI(
    title="AI Productivity Platform API",
    description="FastAPI backend for AI-powered productivity and note-taking platform",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
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
    # Use the import string for the module so the reloader can import
    # the app correctly when running with `-m` or in reload mode.
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
