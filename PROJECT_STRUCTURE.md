# Project Structure - Enterprise Stack

## Complete Directory Tree

```
productivity-platform/
├── .github/
│   └── workflows/
│       └── ci-cd.yml                    # GitHub Actions CI/CD pipeline
│
├── backend/                             # FastAPI Backend
│   ├── alembic/                         # Database migrations
│   │   ├── versions/                    # Migration files
│   │   ├── env.py                       # Alembic environment
│   │   └── script.py.mako              # Migration template
│   │
│   ├── routes/                          # API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py                      # Authentication (register, login, JWT)
│   │   ├── projects.py                  # Project CRUD
│   │   ├── tasks.py                     # Task management
│   │   ├── notes.py                     # Note CRUD
│   │   ├── workspaces.py               # Multi-workspace support
│   │   ├── timer.py                     # Time tracking
│   │   ├── reports.py                   # Analytics & reporting
│   │   └── ai.py                        # OpenAI GPT-4 integration
│   │
│   ├── tasks/                           # Celery async tasks
│   │   ├── __init__.py
│   │   ├── ai_tasks.py                  # AI processing, task extraction
│   │   └── report_tasks.py              # Report generation
│   │
│   ├── tests/                           # Backend tests
│   │   ├── __init__.py
│   │   ├── conftest.py                  # Test fixtures
│   │   ├── test_auth.py                 # Auth tests
│   │   ├── test_projects.py             # Project tests
│   │   └── test_tasks.py                # Task tests
│   │
│   ├── utils/                           # Utility functions
│   │   ├── __init__.py
│   │   └── permissions.py               # RBAC helpers
│   │
│   ├── __init__.py
│   ├── .env.example                     # Environment template
│   ├── alembic.ini                      # Alembic configuration
│   ├── cache.py                         # Redis caching layer
│   ├── celery_app.py                    # Celery configuration
│   ├── database.py                      # Database setup
│   ├── dependencies.py                  # FastAPI dependencies (JWT, RBAC)
│   ├── Dockerfile                       # Backend Docker image
│   ├── main.py                          # FastAPI application
│   ├── models.py                        # SQLAlchemy models (18 tables)
│   └── requirements.txt                 # Python dependencies
│
├── frontend/                            # Next.js Frontend
│   ├── app/
│   │   ├── components/                  # React components
│   │   ├── dashboard/                   # Dashboard pages
│   │   ├── hooks/                       # Custom React hooks
│   │   ├── lib/
│   │   │   └── api.ts                   # Centralized API client
│   │   ├── signin/                      # Sign-in page
│   │   ├── subscribe/                   # Subscription page
│   │   ├── favicon.ico
│   │   ├── globals.css                  # Global styles
│   │   ├── layout.tsx                   # Root layout
│   │   ├── page.tsx                     # Home page
│   │   └── providers.tsx                # React Query provider
│   │
│   ├── public/                          # Static assets
│   ├── .env.example                     # Environment template
│   ├── Dockerfile                       # Frontend Docker image
│   ├── next.config.ts                   # Next.js configuration
│   ├── package.json                     # Node dependencies
│   ├── postcss.config.mjs              # PostCSS config
│   └── tsconfig.json                    # TypeScript config
│
├── k8s/                                 # Kubernetes manifests
│   ├── namespace.yaml                   # Namespace definition
│   ├── secrets-example.yaml            # Secrets template
│   ├── postgres.yaml                    # PostgreSQL deployment
│   ├── redis.yaml                       # Redis deployment
│   ├── backend.yaml                     # Backend + HPA
│   ├── celery.yaml                      # Celery worker & beat
│   ├── frontend.yaml                    # Frontend deployment
│   └── ingress.yaml                     # NGINX ingress + TLS
│
├── .dockerignore                        # Docker ignore rules
├── .gitignore                           # Git ignore rules
├── docker-compose.yml                   # Development stack
├── docker-compose.prod.yml             # Production stack with Traefik
├── Makefile                             # Common commands
├── README.md                            # Main documentation
├── DEPLOYMENT_CHECKLIST.md             # Production deployment guide
├── ENTERPRISE_MIGRATION_GUIDE.md       # Migration instructions
├── MIGRATION_COMPLETE_SUMMARY.md       # What was delivered
└── PROJECT_STRUCTURE.md                # This file
```

## File Counts

- **Backend Python files**: 20+
- **Frontend TypeScript files**: 10+ (base structure)
- **Kubernetes manifests**: 8
- **Docker files**: 3
- **Test files**: 4
- **Documentation files**: 5

## Key Components

### Backend (FastAPI)

#### Core Files
- `main.py` - Application entry point, CORS, route registration
- `models.py` - 18 SQLAlchemy models covering entire schema
- `database.py` - Database connection and session management
- `dependencies.py` - JWT authentication, RBAC decorators

#### API Routes (8 modules)
1. **auth.py** - User registration, login, JWT tokens, OAuth2
2. **projects.py** - Project CRUD with workspace filtering
3. **tasks.py** - Task management with permissions
4. **notes.py** - Note CRUD with visibility scopes
5. **workspaces.py** - Multi-workspace support, memberships
6. **timer.py** - Time tracking, active timers
7. **reports.py** - Analytics, task stats, time stats
8. **ai.py** - OpenAI integration, task extraction

#### Async Tasks (Celery)
- `celery_app.py` - Celery configuration, beat schedule
- `ai_tasks.py` - AI task extraction, daily limits, backlinks
- `report_tasks.py` - Weekly reports, project analytics

#### Utilities
- `permissions.py` - RBAC helper functions
- `cache.py` - Redis caching with decorators

#### Testing
- `conftest.py` - Test fixtures, database setup
- `test_auth.py` - Authentication flow tests
- `test_projects.py` - Project CRUD tests
- `test_tasks.py` - Task management tests

### Frontend (Next.js)

#### Core Files
- `layout.tsx` - Root layout with providers
- `page.tsx` - Home page
- `providers.tsx` - React Query setup
- `next.config.ts` - API proxy, standalone output

#### API Client
- `app/lib/api.ts` - Centralized API client with:
  - Type-safe requests
  - Automatic token handling
  - Error handling
  - All endpoints organized by domain

### Infrastructure

#### Docker
- `Dockerfile` (backend) - Production Python image
- `Dockerfile` (frontend) - Multi-stage Next.js build
- `docker-compose.yml` - Development stack (6 services)
- `docker-compose.prod.yml` - Production with Traefik

#### Kubernetes (8 manifests)
- `namespace.yaml` - Namespace isolation
- `secrets-example.yaml` - Secret management
- `postgres.yaml` - PostgreSQL with PVC
- `redis.yaml` - Redis deployment
- `backend.yaml` - Backend with HPA (3-10 replicas)
- `celery.yaml` - Worker and beat scheduler
- `frontend.yaml` - Frontend (2 replicas)
- `ingress.yaml` - NGINX ingress with TLS

#### CI/CD
- `.github/workflows/ci-cd.yml` - Complete pipeline:
  - Backend tests with PostgreSQL/Redis
  - Frontend linting and build
  - Docker image building
  - Container registry push
  - Deployment automation

## Database Schema (18 Tables)

### Core Tables
1. **users** - User accounts, subscriptions, API limits
2. **sessions** - Session management
3. **spaces** - Personal/team spaces
4. **workspaces** - Workspace organization
5. **memberships** - User-workspace relationships

### Content Tables
6. **projects** - Project management
7. **notes** - Rich text notes
8. **tasks** - Task tracking
9. **subtasks** - Task breakdown
10. **attachments** - File uploads

### Time Tracking
11. **time_entries** - Completed time entries
12. **active_timers** - Currently running timers

### Kanban
13. **board_columns** - Custom board columns
14. **task_board_positions** - Task positions on board

### Recurring Tasks
15. **recurrence_rules** - Recurrence patterns

### System
16. **feature_flags** - Feature toggles
17. **audit_logs** - Audit trail
18. **sessions** - Session storage

## Technology Stack

### Backend
- **FastAPI** 0.115.5 - Modern async web framework
- **SQLAlchemy** 2.0.36 - ORM
- **Alembic** 1.14.0 - Database migrations
- **Pydantic** 2.10.3 - Data validation
- **Celery** 5.4.0 - Async task processing
- **Redis** 5.2.0 - Caching and message broker
- **PostgreSQL** 15 - Primary database
- **OpenAI** 1.57.0 - AI integration
- **Stripe** 11.2.0 - Payment processing
- **pytest** 8.3.4 - Testing framework

### Frontend
- **Next.js** 16.0.3 - React framework
- **React** 18.3.1 - UI library
- **TypeScript** 5 - Type safety
- **Tailwind CSS** 4 - Styling
- **shadcn/ui** - Component library
- **TiptapJS** 3.1.0 - Rich text editor
- **React Query** 5.60.5 - Data fetching
- **React Hook Form** 7.55.0 - Form management
- **@hello-pangea/dnd** 18.0.1 - Drag and drop
- **Recharts** 2.15.2 - Charts
- **Stripe** 7.8.0 - Payment UI

### Infrastructure
- **Docker** - Containerization
- **Kubernetes** - Orchestration
- **NGINX** - Ingress controller
- **Traefik** - Load balancer (prod)
- **GitHub Actions** - CI/CD

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### Projects
- `GET /api/projects/` - List projects
- `POST /api/projects/` - Create project
- `GET /api/projects/{id}` - Get project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Tasks
- `GET /api/projects/{id}/tasks` - List tasks
- `POST /api/projects/{id}/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### Notes
- `GET /api/projects/{id}/notes` - List notes
- `POST /api/projects/{id}/notes` - Create note
- `PUT /api/notes/{id}` - Update note
- `DELETE /api/notes/{id}` - Delete note

### AI
- `POST /api/ai/extract-tasks` - Extract tasks from text
- `POST /api/ai/estimate-time` - Estimate task time
- `POST /api/ai/analyze-priority` - Analyze priority

### Timer
- `GET /api/timer/active` - Get active timer
- `POST /api/timer/start/{task_id}` - Start timer
- `POST /api/timer/stop/{task_id}` - Stop timer
- `GET /api/timer/entries/{task_id}` - Get time entries

### Reports
- `GET /api/reports/tasks/stats` - Task statistics
- `GET /api/reports/time/stats` - Time statistics
- `GET /api/reports/productivity` - Productivity report

### Workspaces
- `GET /api/workspaces/` - List workspaces
- `POST /api/workspaces/` - Create workspace
- `GET /api/workspaces/{id}` - Get workspace
- `PUT /api/workspaces/{id}` - Update workspace
- `GET /api/workspaces/{id}/members` - List members

## Environment Variables

### Backend
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_...
FRONTEND_URL=http://localhost:3000
ENV=development|production
```

### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

## Development Commands

```bash
# Start development stack
docker-compose up -d

# Run backend tests
cd backend && pytest tests/ -v --cov=backend

# Run frontend dev server
cd frontend && npm run dev

# Run migrations
cd backend && alembic upgrade head

# Create new migration
cd backend && alembic revision --autogenerate -m "description"

# Start Celery worker
celery -A backend.celery_app worker --loglevel=info

# Start Celery beat
celery -A backend.celery_app beat --loglevel=info
```

## Production Deployment

```bash
# Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Kubernetes
kubectl apply -f k8s/

# Check status
kubectl get all -n productivity-platform
```

## Monitoring & Observability

### Health Checks
- Backend: `GET /health`
- Frontend: `GET /`

### Metrics
- Prometheus metrics endpoint (add to backend)
- Kubernetes resource metrics
- Application performance monitoring

### Logging
- Structured JSON logs
- Log aggregation (ELK/CloudWatch)
- Error tracking (Sentry)

## Security Features

- ✅ JWT authentication with HTTP-only cookies
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Workspace-level permissions
- ✅ CORS configuration
- ✅ SQL injection prevention (SQLAlchemy)
- ✅ XSS protection (React)
- ✅ Environment variable secrets
- ✅ TLS/HTTPS support
- ✅ Security headers

## Performance Features

- ✅ Redis caching layer
- ✅ Database connection pooling
- ✅ Async endpoints (FastAPI)
- ✅ Server-side rendering (Next.js)
- ✅ Image optimization
- ✅ Code splitting
- ✅ Horizontal pod autoscaling
- ✅ CDN-ready static assets

## Next Steps

1. **Frontend Migration**: Copy pages from old structure to Next.js App Router
2. **Testing**: Add more comprehensive tests
3. **Monitoring**: Set up Sentry, Datadog, or similar
4. **Documentation**: Add API documentation with examples
5. **Performance**: Load testing and optimization
6. **Security**: Security audit and penetration testing

## Support

- **Documentation**: See README.md and other guides
- **Issues**: GitHub Issues
- **API Docs**: http://localhost:8000/docs (when running)
