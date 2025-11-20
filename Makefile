.PHONY: help install dev test clean docker-up docker-down migrate

help:
	@echo "Available commands:"
	@echo "  make install       - Install all dependencies"
	@echo "  make dev          - Start development servers"
	@echo "  make test         - Run all tests"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-up    - Start Docker services"
	@echo "  make docker-down  - Stop Docker services"
	@echo "  make migrate      - Run database migrations"
	@echo "  make lint         - Run linters"

install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

dev:
	@echo "Starting development servers..."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	docker-compose up

test:
	@echo "Running backend tests..."
	cd backend && pytest tests/ -v --cov=backend
	@echo "Running frontend tests..."
	cd frontend && npm test

clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf backend/dist backend/build
	rm -rf frontend/.next frontend/out

docker-up:
	docker-compose up -d
	@echo "Services started. Access:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend: http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"

docker-down:
	docker-compose down

migrate:
	@echo "Running database migrations..."
	cd backend && alembic upgrade head

lint:
	@echo "Running backend linter..."
	cd backend && pylint backend/
	@echo "Running frontend linter..."
	cd frontend && npm run lint

format:
	@echo "Formatting backend code..."
	cd backend && black backend/
	@echo "Formatting frontend code..."
	cd frontend && npm run format

k8s-deploy:
	@echo "Deploying to Kubernetes..."
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/secrets.yaml
	kubectl apply -f k8s/postgres.yaml
	kubectl apply -f k8s/redis.yaml
	kubectl apply -f k8s/backend.yaml
	kubectl apply -f k8s/celery.yaml
	kubectl apply -f k8s/frontend.yaml
	kubectl apply -f k8s/ingress.yaml
	@echo "Deployment complete!"

k8s-status:
	kubectl get all -n productivity-platform

k8s-logs:
	kubectl logs -f -n productivity-platform -l app=backend

backup-db:
	@echo "Backing up database..."
	docker-compose exec postgres pg_dump -U postgres productivity_db > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup complete!"
