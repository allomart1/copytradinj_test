#!/bin/bash

# CopyTradinj Deployment Script
# This script deploys the application to production

set -e

echo "Starting deployment..."

# Pull latest changes
echo "Pulling latest changes from git..."
git pull origin main

# Install dependencies
echo "Installing frontend dependencies..."
pnpm install

echo "Installing backend dependencies..."
cd backend
pnpm install
cd ..

# Build frontend
echo "Building frontend..."
pnpm build

# Build backend
echo "Building backend..."
cd backend
pnpm build
cd ..

# Restart backend service
echo "Restarting backend service..."
sudo systemctl restart copytradinj-backend

# Reload nginx
echo "Reloading nginx..."
sudo systemctl reload nginx

# Check service status
echo "Checking service status..."
sudo systemctl status copytradinj-backend --no-pager

echo "Deployment completed successfully!"
echo "Frontend: https://yourdomain.com"
echo "Backend: https://api.yourdomain.com"
