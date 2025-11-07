# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Supabase account
- Injective wallet
- Domain name (for production)

## Environment Setup

### Frontend (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SENTRY_DSN=your_sentry_dsn
VITE_LOGROCKET_APP_ID=your_logrocket_app_id
```

### Backend (backend/.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=3001
```

## Local Development

1. Install dependencies:
```bash
pnpm install
cd backend && pnpm install
```

2. Start development servers:
```bash
# Frontend
pnpm dev

# Backend (in separate terminal)
cd backend && pnpm dev
```

## Production Deployment

### Frontend (Vercel/Netlify)

1. Build the frontend:
```bash
pnpm build
```

2. Deploy to Vercel:
```bash
vercel --prod
```

Or Netlify:
```bash
netlify deploy --prod
```

### Backend (Railway/Render/DigitalOcean)

1. Build the backend:
```bash
cd backend
pnpm build
```

2. Deploy to Railway:
```bash
railway up
```

Or use Docker:
```bash
docker build -t copytradinj-backend .
docker run -p 3001:3001 copytradinj-backend
```

## Database Setup

1. Create Supabase project
2. Run migrations from `supabase/migrations/`
3. Set up Row Level Security policies
4. Configure environment variables

## Post-Deployment

1. Verify all environment variables
2. Test wallet connections
3. Monitor error logs
4. Set up alerts
5. Configure CDN (if applicable)

## Monitoring

- Sentry: Error tracking
- LogRocket: Session replay
- Supabase: Database monitoring
- Custom health checks

## Backup & Recovery

- Database: Automated Supabase backups
- Code: Git repository
- Environment variables: Secure vault
- User data: Regular exports

## Scaling

- Frontend: CDN + edge caching
- Backend: Horizontal scaling with load balancer
- Database: Supabase auto-scaling
- WebSocket: Connection pooling
