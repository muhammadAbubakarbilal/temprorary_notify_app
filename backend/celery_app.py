from celery import Celery
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "productivity_platform",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["backend.tasks.ai_tasks", "backend.tasks.report_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
)

# Celery beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    "reset-daily-task-extraction-limits": {
        "task": "backend.tasks.ai_tasks.reset_daily_limits",
        "schedule": 86400.0,  # Every 24 hours
    },
    "generate-weekly-reports": {
        "task": "backend.tasks.report_tasks.generate_weekly_reports",
        "schedule": 604800.0,  # Every 7 days
    },
}
