# AI-Powered Productivity Platform

Enterprise-ready full-stack application for AI-powered project management, note-taking, and task tracking.

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **TiptapJS** - Rich text editor
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **@hello-pangea/dnd** - Drag and drop

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **PostgreSQL** - Primary database
- **Redis** - Caching and message broker
- **Celery** - Async task processing
- **JWT** - Authentication
- **Pydantic** - Data validation

### External Services
- **OpenAI GPT-4** - AI task extraction and analysis
- **Stripe** - Payment processing

## Features

- 🤖 AI-powered task extraction from notes
- 📝 Rich text note-taking with TiptapJS
- 📊 Kanban boards with drag-and-drop
- ⏱️ Time tracking
- 📈 Analytics and reporting
- 👥 Multi-workspace collaboration
- 🔄 Recurring tasks
- 💳 Subscription management with Stripe
- 🔐 JWT authentication with RBAC
- 🐳 Fully Dockerized

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Create environment files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

3. Update the `.env` files with your credentials

4. Start all services:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
docker-compose exec backend alembic upgrade head
```

6. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Local Development

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start the server
uvicorn backend.main:app --reload

# Start Celery worker (in another terminal)
celery -A backend.celery_app worker --loglevel=info

# Start Celery beat (in another terminal)
celery -A backend.celery_app beat --loglevel=info
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
.
├── backend/
│   ├── routes/          # API endpoints
│   ├── models.py        # SQLAlchemy models
│   ├── database.py      # Database configuration
│   ├── dependencies.py  # FastAPI dependencies
│   ├── celery_app.py    # Celery configuration
│   ├── cache.py         # Redis caching utilities
│   ├── tasks/           # Celery tasks
│   ├── utils/           # Utility functions
│   ├── tests/           # Backend tests
│   ├── alembic/         # Database migrations
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # Utilities and API client
│   │   ├── dashboard/   # Dashboard pages
│   │   └── layout.tsx
│   ├── public/          # Static assets
│   └── Dockerfile
├── docker-compose.yml
└── .github/
    └── workflows/
        └── ci-cd.yml    # CI/CD pipeline
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v --cov=backend
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Database Migrations

Create a new migration:
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
```

Apply migrations:
```bash
alembic upgrade head
```

Rollback:
```bash
alembic downgrade -1
```

## Deployment

### Docker Production Build

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

See `.env.example` files for required environment variables.

Critical production variables:
- `SECRET_KEY` - JWT secret (generate with `openssl rand -hex 32`)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `OPENAI_API_KEY` - OpenAI API key
- `STRIPE_SECRET_KEY` - Stripe secret key

## CI/CD

The project includes a GitHub Actions workflow that:
- Runs tests on push/PR
- Builds Docker images
- Pushes to container registry
- Deploys to production (configure deployment step)

## Architecture Decisions

### Why FastAPI?
- Async support for high performance
- Automatic API documentation
- Built-in data validation with Pydantic
- Modern Python features

### Why Next.js?
- Server-side rendering for better SEO
- API routes for BFF pattern
- Excellent developer experience
- Production-ready out of the box

### Why Celery + Redis?
- Offload heavy AI processing
- Scheduled tasks (reports, cleanup)
- Scalable task queue
- Reliable message delivery

### Why PostgreSQL?
- ACID compliance
- JSON support for flexible schemas
- Excellent performance
- Rich ecosystem

## Security

- JWT tokens with HTTP-only cookies
- CORS configuration
- SQL injection prevention (SQLAlchemy)
- XSS protection (React)
- CSRF tokens
- Rate limiting (add nginx/traefik)
- Environment variable secrets

## Performance Optimization

- Redis caching for frequent queries
- Database query optimization
- CDN for static assets
- Image optimization (Next.js)
- Code splitting
- Lazy loading

## Monitoring & Logging

Add these services for production:
- **Sentry** - Error tracking
- **Prometheus + Grafana** - Metrics
- **ELK Stack** - Log aggregation
- **Datadog** - APM

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Documentation: [docs-url]
- Email: support@example.com
