#!/bin/bash

# CopyTradinj Setup Script
# This script sets up the development environment

set -e

echo "Setting up CopyTradinj development environment..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js 18 or higher is required"
    exit 1
fi

# Install pnpm if not installed
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
pnpm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pnpm install
cd ..

# Create .env files if they don't exist
if [ ! -f .env ]; then
    echo "Creating frontend .env file..."
    cp .env.example .env
    echo "Please update .env with your configuration"
fi

if [ ! -f backend/.env ]; then
    echo "Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "Please update backend/.env with your configuration"
fi

echo "Setup completed!"
echo ""
echo "Next steps:"
echo "1. Update .env files with your configuration"
echo "2. Set up Supabase database (run migrations from supabase/migrations/schema.sql)"
echo "3. Start development servers:"
echo "   - Frontend: pnpm dev"
echo "   - Backend: cd backend && pnpm dev"
