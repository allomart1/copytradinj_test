# CopyTradinj Architecture

## System Overview

CopyTradinj is a copy trading platform that bridges Hyperliquid and Injective networks, allowing users to automatically replicate trades from master traders.

## Architecture Components

### Frontend (React + Vite)
- **Technology**: React 18, TypeScript, Vite
- **State Management**: React hooks and context
- **Styling**: Tailwind CSS
- **Key Features**:
  - Wallet connection (Injective wallets)
  - Real-time trade monitoring
  - Master trader selection
  - Position management
  - Performance analytics

### Backend (Node.js + Express)
- **Technology**: Node.js, Express, TypeScript
- **Key Responsibilities**:
  - WebSocket connections to Hyperliquid
  - Trade monitoring and execution
  - Position synchronization
  - Risk management
  - Database operations

### Database (Supabase/PostgreSQL)
- **Tables**:
  - `users`: User accounts and settings
  - `master_traders`: Tracked master traders
  - `copy_settings`: User copy trading configurations
  - `trades`: Trade history
  - `positions`: Current positions

### Blockchain Integration
- **Hyperliquid**: Source of master trader data
- **Injective**: Execution layer for copy trades
- **SDKs**:
  - @injectivelabs/sdk-ts for Injective integration
  - Custom Hyperliquid API client

## Data Flow

1. **Trade Detection**:
   - Backend monitors Hyperliquid via WebSocket
   - Detects new trades from master traders
   - Validates trade data

2. **Trade Execution**:
   - Calculates position size based on user settings
   - Applies risk management rules
   - Executes trade on Injective
   - Records trade in database

3. **Position Management**:
   - Syncs positions between Hyperliquid and Injective
   - Monitors for position updates
   - Handles position closures

## Security Considerations

- Private keys stored securely (encrypted)
- API keys in environment variables
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Error handling and logging

## Scalability

- WebSocket connection pooling
- Database connection pooling
- Caching for frequently accessed data
- Horizontal scaling capability
- Load balancing ready

## Monitoring & Logging

- Sentry for error tracking
- LogRocket for session replay
- Custom logging for trade execution
- Performance metrics
- Health check endpoints
