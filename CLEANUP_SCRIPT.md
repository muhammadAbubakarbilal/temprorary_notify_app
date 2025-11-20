# Cleanup Script - Remove Old Code

## ⚠️ IMPORTANT: Run this ONLY after verifying new frontend works!

## Pre-Cleanup Checklist

Before running cleanup, verify:
- [ ] New frontend runs: `cd frontend && npm run dev`
- [ ] Backend runs: `cd backend && uvicorn main:app --reload`
- [ ] Can login/register
- [ ] Can create projects
- [ ] Can create tasks
- [ ] All critical features work
- [ ] Created backup: `git tag pre-cleanup`

## Cleanup Commands

### Step 1: Create Backup
```bash
# Commit current state
git add .
git commit -m "Pre-cleanup: All features verified working"

# Create tag for easy rollback
git tag pre-cleanup

# Push tag
git push origin pre-cleanup
```

### Step 2: Remove Old Directories
```bash
# Remove old client (Vite + React)
rm -rf client/

# Remove old server (Express.js)
rm -rf server/

# Remove shared if not used
rm -rf shared/

# Remove old node_modules (will reinstall for frontend only)
rm -rf node_modules/
```

### Step 3: Remove Old Config Files
```bash
# Remove Vite config
rm vite.config.ts

# Remove old TypeScript config (keep frontend/tsconfig.json)
rm tsconfig.json

# Remove old package files (keep frontend/package.json and backend/requirements.txt)
rm package.json
rm package-lock.json

# Remove Drizzle config (using Alembic now)
rm drizzle.config.ts

# Remove old components config (keep frontend/components.json)
rm components.json

# Remove old PostCSS config (keep frontend/postcss.config.mjs)
rm postcss.config.js

# Remove old Tailwind config (keep frontend/tailwind.config.ts)
rm tailwind.config.ts
```

### Step 4: Clean Up Documentation
```bash
# Remove old migration docs (keep FINAL_MIGRATION_SUMMARY.md)
rm MIGRATION_STATUS.md
rm MIGRATION_STATUS_FINAL.md
rm MIGRATION_COMPLETE.md
rm MIGRATION_COMPLETE_SUMMARY.md
rm MIGRATION_FINAL_SUMMARY.md

# Keep these:
# - README.md
# - QUICK_START.md
# - DEPLOYMENT_CHECKLIST.md
# - ENTERPRISE_MIGRATION_GUIDE.md
# - FINAL_MIGRATION_SUMMARY.md
# - WHAT_WAS_BUILT.md
```

### Step 5: Update .gitignore
```bash
# Add to .gitignore if not already there:
echo "
# Old migration artifacts
client/
server/
shared/
migrate_ui_components.py
CLEANUP_SCRIPT.md
MIGRATION_COMPLETION_PLAN.md
" >> .gitignore
```

### Step 6: Commit Cleanup
```bash
git add .
git commit -m "Clean up: Remove old client/server code after successful migration"
git push origin main
```

## Rollback Instructions (If Needed)

If something goes wrong:

```bash
# Rollback to pre-cleanup state
git reset --hard pre-cleanup

# Or restore specific directory
git checkout pre-cleanup -- client/
git checkout pre-cleanup -- server/
```

## Disk Space Savings

Expected space freed:
- `client/` directory: ~50 MB
- `server/` directory: ~5 MB
- `node_modules/` (old): ~500 MB
- Old config files: ~1 MB
- **Total: ~556 MB**

## What to Keep

### Keep These Directories:
- ✅ `frontend/` - New Next.js app
- ✅ `backend/` - New FastAPI app
- ✅ `k8s/` - Kubernetes configs
- ✅ `.github/` - CI/CD workflows
- ✅ `attached_assets/` - Project assets

### Keep These Files:
- ✅ `README.md` - Main documentation
- ✅ `QUICK_START.md` - Setup guide
- ✅ `DEPLOYMENT_CHECKLIST.md` - Deployment guide
- ✅ `ENTERPRISE_MIGRATION_GUIDE.md` - Migration reference
- ✅ `FINAL_MIGRATION_SUMMARY.md` - Completion status
- ✅ `WHAT_WAS_BUILT.md` - Feature list
- ✅ `docker-compose.yml` - Docker setup
- ✅ `docker-compose.prod.yml` - Production Docker
- ✅ `Makefile` - Common commands
- ✅ `.env` - Environment variables
- ✅ `.gitignore` - Git ignore rules

### Remove These:
- ❌ `client/` - Old Vite app
- ❌ `server/` - Old Express app
- ❌ `shared/` - Old shared code
- ❌ `vite.config.ts` - Old Vite config
- ❌ Old `package.json` - Old dependencies
- ❌ Old `tsconfig.json` - Old TypeScript config
- ❌ `drizzle.config.ts` - Old ORM config
- ❌ Old migration status docs

## Verification After Cleanup

```bash
# Check directory structure
ls -la

# Should see:
# - frontend/
# - backend/
# - k8s/
# - .github/
# - README.md
# - docker-compose.yml
# - etc.

# Should NOT see:
# - client/
# - server/
# - shared/
# - vite.config.ts
# - old package.json

# Test frontend
cd frontend
npm run dev
# Visit http://localhost:3000

# Test backend
cd backend
uvicorn main:app --reload
# Visit http://localhost:8000/docs
```

## Final Checklist

After cleanup:
- [ ] Old directories removed
- [ ] Old config files removed
- [ ] Frontend still works
- [ ] Backend still works
- [ ] Git committed
- [ ] Backup tag created
- [ ] Documentation updated
- [ ] Team notified (if applicable)

## Notes

- **Don't rush cleanup** - Verify everything works first
- **Keep backup tag** - Easy rollback if needed
- **Update team** - Let others know about structure change
- **Update CI/CD** - May need to update build paths
- **Update documentation** - Remove references to old structure

---

**Remember: You can always rollback to `pre-cleanup` tag if needed!**
