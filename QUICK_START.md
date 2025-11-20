# Quick Start Guide

Get your enterprise-ready productivity platform running in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- Git installed
- 8GB RAM minimum
- 10GB free disk space

## Step 1: Clone and Setup (1 minute)

```bash
# Clone the repository
git clone <your-repo-url>
cd productivity-platform

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

## Step 2: Configure Environment (1 minute)

Edit `backend/.env`:

```env
# Required - Generate with: openssl rand -hex 32
SECRET_KEY=your-generated-secret-key-here

# Optional - Add if you want AI features
OPENAI_API_KEY=sk-your-openai-key

# Optional - Add if you want payments
STRIPE_SECRET_KEY=sk_test_your-stripe-key
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional - Add if you want payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
```

## Step 3: Start Services (2 minutes)

```bash
# Start all services
docker-compose up -d

# Wait for services to be healthy (about 30 seconds)
docker-compose ps

# Run database migrations
docker-compose exec backend alembic upgrade head
```

## Step 4: Verify Installation (1 minute)

Open your browser and check:

- ✅ Frontend: http://localhost:3000
- ✅ Backend API: http://localhost:8000
- ✅ API Documentation: http://localhost:8000/docs
- ✅ Health Check: http://localhost:8000/health

## Step 5: Create Your First User

### Option A: Using the Frontend

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Fill in your details
4. Start using the platform!

### Option B: Using the API

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

## What's Running?

After `docker-compose up`, you have:

1. **PostgreSQL** (port 5432) - Your database
2. **Redis** (port 6379) - Caching and message broker
3. **Backend API** (port 8000) - FastAPI application
4. **Celery Worker** - Async task processing
5. **Celery Beat** - Scheduled tasks
6. **Frontend** (port 3000) - Next.js application

## Common Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Restart a service
docker-compose restart backend

# Run backend tests
docker-compose exec backend pytest tests/ -v

# Access database
docker-compose exec postgres psql -U postgres -d productivity_db

# Access Redis CLI
docker-compose exec redis redis-cli

# Create a new migration
docker-compose exec backend alembic revision --autogenerate -m "description"
```

## Troubleshooting

### Services won't start

```bash
# Check if ports are already in use
netstat -an | grep -E "3000|8000|5432|6379"

# Check Docker logs
docker-compose logs
```

### Database connection errors

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Recreate database
docker-compose down -v
docker-compose up -d
docker-compose exec backend alembic upgrade head
```

### Frontend can't connect to backend

```bash
# Verify backend is running
curl http://localhost:8000/health

# Check CORS settings in backend/.env
# Ensure FRONTEND_URL=http://localhost:3000
```

### Celery tasks not processing

```bash
# Check Celery worker logs
docker-compose logs celery_worker

# Verify Redis is running
docker-compose exec redis redis-cli ping
```

## Next Steps

### 1. Explore the API

Visit http://localhost:8000/docs to see all available endpoints and try them out.

### 2. Create Your First Project

```bash
# Login first to get a token
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePassword123!"}' \
  | jq -r '.access_token')

# Create a space (required for projects)
SPACE_ID=$(curl -X POST http://localhost:8000/api/spaces/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"personal"}' \
  | jq -r '.id')

# Create a project
curl -X POST http://localhost:8000/api/projects/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"My First Project\",
    \"description\": \"Getting started with the platform\",
    \"color\": \"#6366F1\",
    \"spaceId\": \"$SPACE_ID\",
    \"status\": \"active\"
  }"
```

### 3. Try AI Features

If you configured an OpenAI API key:

```bash
curl -X POST http://localhost:8000/api/ai/extract-tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "I need to finish the project report by Friday, review the code changes, and schedule a team meeting for next week."
  }'
```

### 4. Explore the Frontend

1. Go to http://localhost:3000
2. Sign in with your credentials
3. Create a project
4. Add some notes
5. Create tasks
6. Try the time tracker
7. View analytics

## Development Workflow

### Backend Development

```bash
# Make changes to backend code
# The container will auto-reload

# Run tests
docker-compose exec backend pytest tests/ -v

# Check code coverage
docker-compose exec backend pytest tests/ --cov=backend --cov-report=html

# View coverage report
open backend/htmlcov/index.html
```

### Frontend Development

```bash
# Make changes to frontend code
# Next.js will hot-reload automatically

# Run linter
cd frontend && npm run lint

# Build for production
cd frontend && npm run build
```

### Database Changes

```bash
# 1. Modify models in backend/models.py

# 2. Create migration
docker-compose exec backend alembic revision --autogenerate -m "add new field"

# 3. Review migration in backend/alembic/versions/

# 4. Apply migration
docker-compose exec backend alembic upgrade head

# 5. Rollback if needed
docker-compose exec backend alembic downgrade -1
```

## Production Deployment

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for complete production deployment guide.

Quick production start:

```bash
# 1. Update environment variables for production
# 2. Build production images
docker-compose -f docker-compose.prod.yml build

# 3. Start production stack
docker-compose -f docker-compose.prod.yml up -d

# 4. Run migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Getting Help

- **Documentation**: See README.md for comprehensive docs
- **API Reference**: http://localhost:8000/docs
- **Migration Guide**: See ENTERPRISE_MIGRATION_GUIDE.md
- **Project Structure**: See PROJECT_STRUCTURE.md
- **Issues**: Create a GitHub issue

## Features Overview

### ✅ Available Now

- User authentication (JWT)
- Project management
- Task tracking
- Rich text notes (TiptapJS)
- Time tracking
- Analytics and reports
- Multi-workspace support
- AI task extraction (with OpenAI key)
- Async task processing (Celery)
- Redis caching
- Comprehensive API

### 🚧 Requires Frontend Migration

- Kanban boards (drag & drop)
- Recurring tasks UI
- Advanced analytics dashboards
- User settings pages
- Subscription management UI

### 🔜 Coming Soon

- Real-time collaboration
- Mobile app
- Advanced AI features
- Integrations (Slack, GitHub, etc.)

## Performance Tips

1. **Enable Redis caching**: Already configured, just ensure Redis is running
2. **Use connection pooling**: Already configured in SQLAlchemy
3. **Optimize queries**: Use `select_related` and `joinedload` in SQLAlchemy
4. **Enable CDN**: Configure for static assets in production
5. **Scale horizontally**: Use Kubernetes for auto-scaling

## Security Tips

1. **Change default secrets**: Generate new SECRET_KEY
2. **Use HTTPS**: Configure TLS certificates in production
3. **Enable rate limiting**: Add nginx or traefik rate limiting
4. **Regular updates**: Keep dependencies updated
5. **Monitor logs**: Set up log aggregation and alerting

## Success Checklist

- [ ] All services running (`docker-compose ps`)
- [ ] Health check passing (http://localhost:8000/health)
- [ ] Can register a user
- [ ] Can login
- [ ] Can create a project
- [ ] Can create a task
- [ ] Can create a note
- [ ] API docs accessible (http://localhost:8000/docs)
- [ ] Frontend loads (http://localhost:3000)

## Congratulations! 🎉

You now have a fully functional enterprise-ready productivity platform running locally.

**What's next?**
1. Explore the API documentation
2. Create your first project
3. Try the AI features
4. Customize the frontend
5. Deploy to production

Happy coding! 🚀
