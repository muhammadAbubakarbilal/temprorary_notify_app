# Production Deployment Checklist

Use this checklist to ensure a smooth production deployment.

## Pre-Deployment

### 1. Code & Configuration

- [ ] All code committed to version control
- [ ] No sensitive data in code (API keys, passwords)
- [ ] Environment variables configured for production
- [ ] Database connection strings updated
- [ ] CORS origins configured correctly
- [ ] Frontend API URL points to production backend
- [ ] All feature flags reviewed

### 2. Security

- [ ] Generate new SECRET_KEY: `openssl rand -hex 32`
- [ ] Use strong database passwords
- [ ] Enable HTTPS/TLS certificates
- [ ] Configure security headers
- [ ] Review CORS settings
- [ ] Enable rate limiting
- [ ] Set up WAF (Web Application Firewall)
- [ ] Configure CSP (Content Security Policy)
- [ ] Review file upload restrictions
- [ ] Enable audit logging

### 3. Database

- [ ] Database backups configured
- [ ] Backup retention policy set
- [ ] Point-in-time recovery enabled
- [ ] Connection pooling configured
- [ ] Indexes optimized
- [ ] Run migrations: `alembic upgrade head`
- [ ] Verify data integrity
- [ ] Set up read replicas (if needed)

### 4. External Services

- [ ] OpenAI API key configured
- [ ] Stripe keys (live, not test)
- [ ] Stripe webhooks configured
- [ ] Email service configured (if applicable)
- [ ] CDN configured for static assets
- [ ] DNS records updated
- [ ] SSL certificates installed

### 5. Infrastructure

- [ ] Docker images built and tagged
- [ ] Container registry configured
- [ ] Kubernetes cluster ready
- [ ] Persistent volumes configured
- [ ] Load balancer configured
- [ ] Auto-scaling rules set
- [ ] Health checks configured
- [ ] Resource limits set

### 6. Monitoring & Logging

- [ ] Error tracking (Sentry) configured
- [ ] Application monitoring (Datadog/New Relic)
- [ ] Log aggregation (ELK/CloudWatch)
- [ ] Metrics collection (Prometheus)
- [ ] Alerting rules configured
- [ ] Uptime monitoring
- [ ] Performance monitoring

### 7. Testing

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] End-to-end tests passing
- [ ] Load testing completed
- [ ] Security scanning completed
- [ ] Penetration testing (if required)
- [ ] User acceptance testing

## Deployment Steps

### Option A: Docker Compose (Small Scale)

```bash
# 1. Pull latest code
git pull origin main

# 2. Build images
docker-compose -f docker-compose.prod.yml build

# 3. Run migrations
docker-compose -f docker-compose.prod.yml run backend alembic upgrade head

# 4. Start services
docker-compose -f docker-compose.prod.yml up -d

# 5. Verify health
curl http://localhost:8000/health
curl http://localhost:3000
```

### Option B: Kubernetes (Enterprise Scale)

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create secrets (update with real values first!)
kubectl create secret generic app-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=secret-key="..." \
  --from-literal=openai-api-key="sk-..." \
  --from-literal=stripe-secret-key="sk_live_..." \
  -n productivity-platform

# 3. Deploy database
kubectl apply -f k8s/postgres.yaml
kubectl wait --for=condition=ready pod -l app=postgres -n productivity-platform --timeout=300s

# 4. Deploy Redis
kubectl apply -f k8s/redis.yaml
kubectl wait --for=condition=ready pod -l app=redis -n productivity-platform --timeout=300s

# 5. Run migrations
kubectl run migration --rm -i --tty \
  --image=ghcr.io/your-org/productivity-platform-backend:latest \
  --env="DATABASE_URL=..." \
  --command -- alembic upgrade head \
  -n productivity-platform

# 6. Deploy backend
kubectl apply -f k8s/backend.yaml
kubectl wait --for=condition=ready pod -l app=backend -n productivity-platform --timeout=300s

# 7. Deploy Celery
kubectl apply -f k8s/celery.yaml

# 8. Deploy frontend
kubectl apply -f k8s/frontend.yaml
kubectl wait --for=condition=ready pod -l app=frontend -n productivity-platform --timeout=300s

# 9. Configure ingress
kubectl apply -f k8s/ingress.yaml

# 10. Verify deployment
kubectl get all -n productivity-platform
```

## Post-Deployment

### 1. Verification

- [ ] Health endpoints responding
  - Backend: `curl https://api.your-domain.com/health`
  - Frontend: `curl https://your-domain.com`
- [ ] API documentation accessible: `https://api.your-domain.com/docs`
- [ ] User registration works
- [ ] User login works
- [ ] Database queries working
- [ ] Redis caching working
- [ ] Celery tasks processing
- [ ] File uploads working (if applicable)
- [ ] Email sending working (if applicable)
- [ ] Payment processing working

### 2. Monitoring Setup

- [ ] Error tracking receiving events
- [ ] Metrics being collected
- [ ] Logs being aggregated
- [ ] Alerts configured and tested
- [ ] Dashboard created
- [ ] On-call rotation set up

### 3. Performance

- [ ] Response times acceptable
- [ ] Database query performance good
- [ ] Cache hit rate acceptable
- [ ] No memory leaks
- [ ] CPU usage normal
- [ ] Disk usage monitored

### 4. Security

- [ ] SSL/TLS working correctly
- [ ] Security headers present
- [ ] CORS working as expected
- [ ] Rate limiting active
- [ ] No exposed secrets
- [ ] Audit logs working

### 5. Documentation

- [ ] Deployment documented
- [ ] Runbook created
- [ ] Incident response plan ready
- [ ] Team trained on new system
- [ ] User documentation updated
- [ ] API documentation published

## Rollback Plan

If issues occur:

### Quick Rollback (Docker Compose)

```bash
# 1. Stop current version
docker-compose down

# 2. Checkout previous version
git checkout <previous-tag>

# 3. Start previous version
docker-compose up -d
```

### Quick Rollback (Kubernetes)

```bash
# 1. Rollback deployment
kubectl rollout undo deployment/backend -n productivity-platform
kubectl rollout undo deployment/frontend -n productivity-platform

# 2. Verify rollback
kubectl rollout status deployment/backend -n productivity-platform
kubectl rollout status deployment/frontend -n productivity-platform
```

### Database Rollback

```bash
# If migrations need to be rolled back
docker-compose exec backend alembic downgrade -1

# Or in Kubernetes
kubectl run migration --rm -i --tty \
  --image=ghcr.io/your-org/productivity-platform-backend:previous-tag \
  --command -- alembic downgrade -1 \
  -n productivity-platform
```

## Maintenance

### Daily

- [ ] Check error rates
- [ ] Review logs for issues
- [ ] Monitor resource usage
- [ ] Check backup status

### Weekly

- [ ] Review performance metrics
- [ ] Check for security updates
- [ ] Review and rotate logs
- [ ] Test backup restoration
- [ ] Review cost/usage

### Monthly

- [ ] Security audit
- [ ] Dependency updates
- [ ] Performance optimization
- [ ] Capacity planning
- [ ] Disaster recovery drill

## Common Issues & Solutions

### Issue: Database connection timeout

**Solution:**
```bash
# Check database status
kubectl get pods -l app=postgres -n productivity-platform

# Check logs
kubectl logs -l app=postgres -n productivity-platform

# Verify connection string
kubectl get secret app-secrets -o jsonpath='{.data.database-url}' | base64 -d
```

### Issue: Backend pods crashing

**Solution:**
```bash
# Check pod status
kubectl describe pod -l app=backend -n productivity-platform

# Check logs
kubectl logs -l app=backend -n productivity-platform --tail=100

# Common causes:
# - Missing environment variables
# - Database connection issues
# - Out of memory
```

### Issue: Frontend not loading

**Solution:**
```bash
# Check if backend is accessible
curl https://api.your-domain.com/health

# Check frontend logs
kubectl logs -l app=frontend -n productivity-platform

# Verify environment variables
kubectl exec -it <frontend-pod> -- env | grep NEXT_PUBLIC
```

### Issue: Celery tasks not processing

**Solution:**
```bash
# Check Celery worker status
kubectl logs -l app=celery-worker -n productivity-platform

# Check Redis connection
kubectl exec -it <redis-pod> -- redis-cli ping

# Verify task queue
kubectl exec -it <redis-pod> -- redis-cli llen celery
```

## Emergency Contacts

- **DevOps Lead**: [Name] - [Email] - [Phone]
- **Backend Lead**: [Name] - [Email] - [Phone]
- **Frontend Lead**: [Name] - [Email] - [Phone]
- **Database Admin**: [Name] - [Email] - [Phone]
- **Security Team**: [Email] - [Phone]

## Support Resources

- **Documentation**: https://docs.your-domain.com
- **Status Page**: https://status.your-domain.com
- **Incident Management**: [Tool/URL]
- **Team Chat**: [Slack/Teams channel]
- **On-Call Schedule**: [PagerDuty/Opsgenie]

## Success Criteria

Deployment is successful when:

- ✅ All services are running
- ✅ Health checks passing
- ✅ No critical errors in logs
- ✅ Response times < 500ms (p95)
- ✅ Error rate < 0.1%
- ✅ All features working
- ✅ Monitoring active
- ✅ Backups running
- ✅ Team notified

## Sign-Off

- [ ] Technical Lead approval
- [ ] Security review completed
- [ ] Product Owner approval
- [ ] Operations team ready
- [ ] Support team trained
- [ ] Stakeholders notified

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Version**: _______________
**Notes**: _______________
