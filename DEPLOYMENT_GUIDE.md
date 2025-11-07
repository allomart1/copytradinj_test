# Detailed Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Frontend Deployment](#frontend-deployment)
5. [Backend Deployment](#backend-deployment)
6. [Monitoring Setup](#monitoring-setup)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts
- GitHub account
- Supabase account
- Vercel/Netlify account (frontend)
- Railway/Render account (backend)
- Sentry account (error tracking)
- LogRocket account (session replay)

### Required Tools
- Node.js 18+
- pnpm 8+
- Git
- Docker (optional)

## Environment Configuration

### Frontend Environment Variables

Create `.env` file in root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_LOGROCKET_APP_ID=your-logrocket-id
VITE_BACKEND_URL=https://your-backend-url.com
```

### Backend Environment Variables

Create `backend/.env` file:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.com
```

## Database Setup

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Note your project URL and keys

### 2. Run Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 3. Set Up Row Level Security

The migrations include RLS policies, but verify:
- Users can only read their own data
- Service role can perform all operations
- Public access is restricted

## Frontend Deployment

### Option 1: Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Configure environment variables in Vercel dashboard

### Option 2: Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
netlify deploy --prod
```

3. Configure environment variables in Netlify dashboard

### Build Configuration

Ensure `vite.config.ts` is properly configured:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from '@bangjelkoski/vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

## Backend Deployment

### Option 1: Railway

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and deploy:
```bash
railway login
cd backend
railway up
```

3. Configure environment variables in Railway dashboard

### Option 2: Render

1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: copytradinj-backend
    env: node
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
    envVars:
      - key: NODE_ENV
        value: production
```

2. Connect GitHub repository to Render
3. Configure environment variables

### Option 3: Docker

1. Build image:
```bash
cd backend
docker build -t copytradinj-backend .
```

2. Run container:
```bash
docker run -p 3001:3001 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  copytradinj-backend
```

## Monitoring Setup

### Sentry Configuration

1. Create Sentry project
2. Add DSN to environment variables
3. Verify error tracking in Sentry dashboard

### LogRocket Configuration

1. Create LogRocket project
2. Add App ID to environment variables
3. Verify session recording

### Health Checks

Backend includes health check endpoint:
```
GET /health
```

Configure monitoring service to ping this endpoint.

## Troubleshooting

### Common Issues

**Build Fails**
- Verify Node.js version (18+)
- Clear node_modules and reinstall
- Check for TypeScript errors

**Database Connection Issues**
- Verify Supabase URL and keys
- Check network connectivity
- Verify RLS policies

**WebSocket Connection Fails**
- Check CORS configuration
- Verify backend URL
- Check firewall rules

**Wallet Connection Issues**
- Verify Injective network configuration
- Check wallet extension installation
- Clear browser cache

### Logs

**Frontend Logs**
- Browser console
- Sentry dashboard
- LogRocket sessions

**Backend Logs**
- Railway/Render logs
- Sentry dashboard
- Custom logging output

### Performance Optimization

**Frontend**
- Enable CDN
- Configure caching headers
- Optimize bundle size
- Use code splitting

**Backend**
- Enable connection pooling
- Configure rate limiting
- Use caching for frequent queries
- Optimize database queries

## Security Checklist

- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] RLS policies enabled
- [ ] API rate limiting configured
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Input validation implemented
- [ ] Error messages sanitized

## Post-Deployment Verification

1. Test wallet connection
2. Verify trade monitoring
3. Test copy trading functionality
4. Check error tracking
5. Verify database operations
6. Test WebSocket connections
7. Monitor performance metrics

## Maintenance

### Regular Tasks
- Monitor error rates
- Review logs
- Update dependencies
- Backup database
- Review security policies
- Monitor performance metrics

### Updates
```bash
# Update dependencies
pnpm update

# Run tests
pnpm test

# Deploy updates
vercel --prod  # or your deployment method
```
