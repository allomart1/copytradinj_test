# Backup & Recovery Instructions

## 🎯 Quick Backup (5 minutes)

### Option 1: Git Commit (Recommended)
```bash
# Save current state
git add .
git commit -m "Working state: $(date +%Y-%m-%d)"

# Create backup branch
git branch backup-$(date +%Y%m%d-%H%M%S)

# Push to GitHub (if configured)
git push origin main
```

### Option 2: Create Archive
```bash
# Create compressed backup (excludes node_modules)
tar -czf copytradinj-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  --exclude=node_modules \
  --exclude=backend/node_modules \
  --exclude=dist \
  --exclude=backend/dist \
  --exclude=.git \
  .

# Download the .tar.gz file to safe location
```

### Option 3: Manual File Copy
Copy these critical files to safe location:
- `src/App.tsx`
- `src/components/SessionKeyManager.tsx`
- `src/services/sessionKey.ts`
- `backend/src/services/sessionKeyService.ts`
- `backend/src/routes/sessionKeys.ts`
- `supabase/migrations/*.sql`
- `.env` (IMPORTANT: Keep secure!)
- `backend/.env` (IMPORTANT: Keep secure!)
- `SESSION_STATE.md`

## 🔄 Recovery Process

### From Git Backup
```bash
# List available backups
git branch -a

# Restore from backup branch
git checkout backup-YYYYMMDD-HHMMSS

# Or restore specific commit
git log --oneline
git checkout <commit-hash>
```

### From Archive
```bash
# Extract backup
tar -xzf copytradinj-backup-YYYYMMDD-HHMMSS.tar.gz

# Reinstall dependencies
pnpm install
cd backend && pnpm install && cd ..

# Rebuild
cd frontend && pnpm build && cd ..
cd backend && pnpm build && cd ..
```

### From Manual Files
1. Copy files back to project directory
2. Restore `.env` files
3. Run `pnpm install` in root and backend
4. Run `pnpm build` in frontend and backend

## 📋 Pre-Testing Checklist

Before testing new changes:
- [ ] Create git commit or backup archive
- [ ] Document current working state in SESSION_STATE.md
- [ ] Note any environment variables changed
- [ ] Save database migration state
- [ ] Record any API endpoints modified

## 🆘 Emergency Contacts

- **Documentation**: README.md, SETUP.md, DEPLOYMENT_GUIDE.md
- **Session State**: SESSION_STATE.md
- **Git History**: `git log --oneline`
- **Backup Archives**: `ls -lh copytradinj-backup-*.tar.gz`

## 🔐 Security Notes

**NEVER commit to public repo**:
- `.env` files
- Private keys
- API secrets
- Database credentials
- Encryption keys

**Always encrypt backups containing**:
- Environment variables
- Configuration files with secrets
- Database dumps

## 📅 Backup Schedule Recommendation

- **Before major changes**: Create git commit
- **Daily**: Git commit at end of work session
- **Weekly**: Create archive backup
- **Before deployment**: Full backup + git tag
- **After successful testing**: Git commit with descriptive message
