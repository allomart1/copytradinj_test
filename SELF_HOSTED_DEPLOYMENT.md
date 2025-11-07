# Self-Hosted Deployment Guide

This guide covers deploying CopyTradinj on your own infrastructure.

## Server Requirements

### Minimum Specifications
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- OS: Ubuntu 20.04+ or similar Linux distribution
- Network: Static IP address

### Recommended Specifications
- CPU: 4 cores
- RAM: 8GB
- Storage: 50GB SSD
- OS: Ubuntu 22.04 LTS
- Network: Static IP with domain name

## Prerequisites

1. Domain name pointed to your server
2. SSL certificate (Let's Encrypt recommended)
3. PostgreSQL database (or Supabase)
4. Node.js 18+ installed
5. pnpm installed
6. Nginx or similar reverse proxy

## Installation Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/allomart1/copytradinj.git
cd copytradinj
sudo chown -R $USER:$USER /var/www/copytradinj
```

### 3. Install Dependencies

```bash
# Frontend
pnpm install

# Backend
cd backend
pnpm install
cd ..
```

### 4. Configure Environment

Frontend `.env`:
```env
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SENTRY_DSN=your-sentry-dsn
VITE_LOGROCKET_APP_ID=your-logrocket-id
VITE_BACKEND_URL=https://api.yourdomain.com
```

Backend `backend/.env`:
```env
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### 5. Build Applications

```bash
# Build frontend
pnpm build

# Build backend
cd backend
pnpm build
cd ..
```

### 6. Configure Nginx

Create `/etc/nginx/sites-available/copytradinj`:

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/copytradinj/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/copytradinj /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Set Up SSL

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

### 8. Create Systemd Service

Create `/etc/systemd/system/copytradinj-backend.service`:

```ini
[Unit]
Description=CopyTradinj Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/copytradinj/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable copytradinj-backend
sudo systemctl start copytradinj-backend
sudo systemctl status copytradinj-backend
```

## Database Setup

### Option 1: Supabase (Recommended)

1. Create Supabase project
2. Run migrations from `supabase/migrations/schema.sql`
3. Configure environment variables

### Option 2: Self-Hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE copytradinj;
CREATE USER copytradinj_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE copytradinj TO copytradinj_user;
\q

# Run migrations
psql -U copytradinj_user -d copytradinj -f supabase/migrations/schema.sql
```

## Monitoring

### 1. Set Up Log Rotation

Create `/etc/logrotate.d/copytradinj`:

```
/var/www/copytradinj/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload copytradinj-backend > /dev/null 2>&1 || true
    endscript
}
```

### 2. Monitor Service

```bash
# View logs
sudo journalctl -u copytradinj-backend -f

# Check status
sudo systemctl status copytradinj-backend

# Restart service
sudo systemctl restart copytradinj-backend
```

### 3. Set Up Monitoring Tools

Install monitoring tools:
```bash
# Install htop for system monitoring
sudo apt install -y htop

# Install pm2 for process management (alternative to systemd)
npm install -g pm2
```

## Backup Strategy

### 1. Database Backup

Create backup script `/usr/local/bin/backup-copytradinj.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/copytradinj"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database (if using PostgreSQL)
pg_dump -U copytradinj_user copytradinj > $BACKUP_DIR/db_$DATE.sql

# Backup environment files
cp /var/www/copytradinj/.env $BACKUP_DIR/env_$DATE
cp /var/www/copytradinj/backend/.env $BACKUP_DIR/backend_env_$DATE

# Remove backups older than 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
```

Make executable and schedule:
```bash
sudo chmod +x /usr/local/bin/backup-copytradinj.sh
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-copytradinj.sh
```

### 2. Code Backup

```bash
# Backup code
cd /var/www
tar -czf copytradinj_backup_$(date +%Y%m%d).tar.gz copytradinj/
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Install UFW
sudo apt install -y ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. Fail2Ban

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Configure for Nginx
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Regular Updates

```bash
# Create update script
cat > /usr/local/bin/update-copytradinj.sh << 'EOF'
#!/bin/bash
cd /var/www/copytradinj
git pull
pnpm install
pnpm build
cd backend
pnpm install
pnpm build
sudo systemctl restart copytradinj-backend
sudo systemctl reload nginx
EOF

sudo chmod +x /usr/local/bin/update-copytradinj.sh
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u copytradinj-backend -n 50

# Check permissions
ls -la /var/www/copytradinj/backend

# Verify environment variables
sudo -u www-data cat /var/www/copytradinj/backend/.env
```

### High Memory Usage

```bash
# Monitor memory
htop

# Restart service
sudo systemctl restart copytradinj-backend

# Check for memory leaks in logs
sudo journalctl -u copytradinj-backend | grep -i memory
```

### Database Connection Issues

```bash
# Test database connection
psql -U copytradinj_user -d copytradinj -c "SELECT 1;"

# Check PostgreSQL status
sudo systemctl status postgresql
```

## Maintenance

### Regular Tasks

1. **Daily**
   - Monitor error logs
   - Check service status
   - Review system resources

2. **Weekly**
   - Review backup integrity
   - Update dependencies
   - Check security updates

3. **Monthly**
   - Review and rotate logs
   - Update system packages
   - Review performance metrics

### Update Procedure

```bash
# 1. Backup current version
/usr/local/bin/backup-copytradinj.sh

# 2. Pull latest changes
cd /var/www/copytradinj
git pull

# 3. Update dependencies and rebuild
pnpm install
pnpm build
cd backend
pnpm install
pnpm build

# 4. Restart services
sudo systemctl restart copytradinj-backend
sudo systemctl reload nginx

# 5. Verify deployment
curl https://yourdomain.com
curl https://api.yourdomain.com/health
```

## Performance Optimization

### 1. Enable Caching

Update Nginx configuration:
```nginx
# Add to server block
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Enable HTTP/2

```nginx
# Update server block
listen 443 ssl http2;
```

### 3. Optimize Node.js

```bash
# Increase Node.js memory limit
# Update systemd service file
Environment=NODE_OPTIONS=--max-old-space-size=4096
```

## Scaling

### Horizontal Scaling

1. Set up load balancer (Nginx or HAProxy)
2. Deploy multiple backend instances
3. Use shared database (Supabase or PostgreSQL cluster)
4. Implement session management (Redis)

### Vertical Scaling

1. Upgrade server resources
2. Optimize database queries
3. Implement caching layer
4. Use CDN for static assets
