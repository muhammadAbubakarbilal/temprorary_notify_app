from backend.celery_app import celery_app
from backend.database import SessionLocal
from backend.models import Task, TimeEntry, User, Project
from datetime import datetime, timedelta
from sqlalchemy import func

@celery_app.task(name="backend.tasks.report_tasks.generate_weekly_reports")
def generate_weekly_reports():
    """
    Generate weekly productivity reports for all users
    """
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.subscription_status == 'active').all()
        reports_generated = 0
        
        for user in users:
            # Generate report for this user
            report = generate_user_weekly_report(user.id, db)
            if report:
                reports_generated += 1
        
        return {"reports_generated": reports_generated}
    finally:
        db.close()

def generate_user_weekly_report(user_id: str, db):
    """
    Generate weekly report for a specific user
    """
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    # Get completed tasks
    completed_tasks = db.query(Task).filter(
        Task.assignee_id == user_id,
        Task.status == 'done',
        Task.updated_at >= week_ago
    ).count()
    
    # Get time entries
    time_entries = db.query(func.sum(TimeEntry.duration)).filter(
        TimeEntry.start_time >= week_ago
    ).scalar() or 0
    
    # Get active projects
    active_projects = db.query(Project).filter(
        Project.status == 'active'
    ).count()
    
    return {
        "user_id": user_id,
        "period_start": week_ago.isoformat(),
        "period_end": datetime.utcnow().isoformat(),
        "completed_tasks": completed_tasks,
        "total_time_minutes": time_entries,
        "active_projects": active_projects
    }

@celery_app.task(name="backend.tasks.report_tasks.generate_project_analytics")
def generate_project_analytics(project_id: str):
    """
    Generate detailed analytics for a project
    """
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return {"error": "Project not found"}
        
        # Calculate various metrics
        total_tasks = db.query(Task).filter(Task.project_id == project_id).count()
        completed_tasks = db.query(Task).filter(
            Task.project_id == project_id,
            Task.status == 'done'
        ).count()
        
        return {
            "project_id": project_id,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        }
    finally:
        db.close()
