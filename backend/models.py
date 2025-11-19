from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, JSON, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from database import Base
import uuid

class Session(Base):
    __tablename__ = "sessions"
    
    sid = Column(String, primary_key=True)
    sess = Column(JSON, nullable=False)
    expire = Column(DateTime, nullable=False)
    
    __table_args__ = (Index('IDX_session_expire', 'expire'),)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True)
    first_name = Column(String, name="first_name")
    last_name = Column(String, name="last_name")
    profile_image_url = Column(String, name="profile_image_url")
    password = Column(Text)
    subscription_plan = Column(Text, nullable=False, default='free')
    subscription_status = Column(Text, nullable=False, default='active')
    stripe_customer_id = Column(String, name="stripe_customer_id")
    stripe_subscription_id = Column(String, name="stripe_subscription_id")
    personal_key_ref = Column(Text, name="personal_key_ref")
    daily_task_extraction_count = Column(Integer, nullable=False, default=0, name="daily_task_extraction_count")
    last_task_extraction_reset = Column(DateTime, default=func.now(), name="last_task_extraction_reset")
    created_at = Column(DateTime, default=func.now(), nullable=False, name="created_at")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False, name="updated_at")

class Space(Base):
    __tablename__ = "spaces"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False, name="created_at")

class Workspace(Base):
    __tablename__ = "workspaces"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    space_id = Column(String, ForeignKey('spaces.id'), nullable=False, name="space_id")
    name = Column(Text, nullable=False)
    policy_manager_note_access = Column(Boolean, nullable=False, default=False, name="policy_manager_note_access")
    created_at = Column(DateTime, default=func.now(), nullable=False, name="created_at")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False, name="updated_at")

class Membership(Base):
    __tablename__ = "memberships"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String, ForeignKey('workspaces.id'), nullable=False, name="workspace_id")
    user_id = Column(String, ForeignKey('users.id'), nullable=False, name="user_id")
    role = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False, name="created_at")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(Text, nullable=False)
    description = Column(Text)
    color = Column(Text, nullable=False, default='#6366F1')
    space_id = Column(String, ForeignKey('spaces.id'), name="space_id")
    workspace_id = Column(String, ForeignKey('workspaces.id'), name="workspace_id")
    status = Column(Text, nullable=False, default='active')
    created_at = Column(DateTime, default=func.now(), nullable=False, name="created_at")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False, name="updated_at")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    space_id = Column(String, ForeignKey('spaces.id'), name="space_id")
    workspace_id = Column(String, ForeignKey('workspaces.id'), name="workspace_id")
    project_id = Column(String, ForeignKey('projects.id'), name="project_id")
    author_id = Column(String, ForeignKey('users.id'), name="author_id")
    title = Column(Text, nullable=False)
    content = Column(Text, nullable=False, default='')
    tags = Column(JSON, default=list)
    backlinks = Column(JSON, default=list)
    visibility_scope = Column(Text, nullable=False, default='private', name="visibility_scope")
    last_processed_length = Column(Integer, nullable=False, default=0, name="last_processed_length")
    created_at = Column(DateTime, default=func.now(), nullable=False, name="created_at")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False, name="updated_at")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey('projects.id'), nullable=False, name="project_id")
    note_id = Column(String, ForeignKey('notes.id'), name="note_id")
    title = Column(Text, nullable=False)
    description = Column(Text)
    status = Column(Text, nullable=False, default='todo')
    priority = Column(Text, nullable=False, default='medium')
    assignee_id = Column(String, ForeignKey('users.id'), name="assignee_id")
    due_date = Column(DateTime, name="due_date")
    tags = Column(JSON, default=list)
    series_id = Column(String, name="series_id")
    created_at = Column(DateTime, default=func.now(), nullable=False, name="created_at")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False, name="updated_at")

class TimeEntry(Base):
    __tablename__ = "time_entries"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, ForeignKey('tasks.id'), nullable=False, name="task_id")
    start_time = Column(DateTime, nullable=False, name="start_time")
    end_time = Column(DateTime, name="end_time")
    duration = Column(Integer, nullable=False, default=0)
    description = Column(Text)
    created_at = Column(DateTime, default=func.now(), nullable=False, name="created_at")

class ActiveTimer(Base):
    __tablename__ = "active_timers"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, ForeignKey('tasks.id'), nullable=False, name="task_id")
    start_time = Column(DateTime, nullable=False, name="start_time")
    created_at = Column(DateTime, default=func.now(), nullable=False, name="created_at")

class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    file_name = Column(Text, nullable=False, name="file_name")
    original_name = Column(Text, nullable=False, name="original_name")
    mime_type = Column(Text, nullable=False, name="mime_type")
    size = Column(Integer, nullable=False)
    storage_path = Column(Text, nullable=False, name="storage_path")
    note_id = Column(String, ForeignKey('notes.id'), name="note_id")
    task_id = Column(String, ForeignKey('tasks.id'), name="task_id")
    uploaded_by = Column(String, ForeignKey('users.id'), name="uploaded_by")
    created_at = Column(DateTime, default=func.now(), nullable=False, name="created_at")

class RecurringTask(Base):
    __tablename__ = "recurring_tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    series_id = Column(String, nullable=False, name="series_id")
    template_task_id = Column(String, ForeignKey('tasks.id'), nullable=False, name="template_task_id")
    recurrence_pattern = Column(Text, nullable=False, name="recurrence_pattern")
    interval_value = Column(Integer, name="interval_value")
    interval_unit = Column(Text, name="interval_unit")
    days_of_week = Column(JSON, name="days_of_week")
    day_of_month = Column(Integer, name="day_of_month")
    month_of_year = Column(Integer, name="month_of_year")
    end_date = Column(DateTime, name="end_date")
    max_occurrences = Column(Integer, name="max_occurrences")
    current_occurrence = Column(Integer, nullable=False, default=0, name="current_occurrence")
    last_generated_date = Column(DateTime, name="last_generated_date")
    is_active = Column(Boolean, nullable=False, default=True, name="is_active")
    created_at = Column(DateTime, default=func.now(), nullable=False, name="created_at")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False, name="updated_at")
