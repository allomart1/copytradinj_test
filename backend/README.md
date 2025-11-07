# CopyTradinj Backend

Backend service for CopyTradinj - A Web3 copy trading platform that monitors Hyperliquid wallets and replicates trades proportionally on Injective blockchain.

## 🎯 Core Functionality

1. **Hyperliquid Monitoring**: Real-time WebSocket connection to monitor master trader wallets
2. **Proportional Trade Calculation**: Calculates position sizes based on:
   - Master trader's position size relative to their account balance
   - Follower's copy percentage setting
   - Follower's available balance
3. **Injective Execution**: Executes trades on Injective with:
   - Same proportional position size
   - Same Stop Loss (SL) levels
   - Same Take Profit (TP) levels
4. **Database Storage**: Stores all trade data, positions, and user settings in Supabase

## 🏗️ Architecture

```
Hyperliquid Wallet (Master)
         ↓
   WebSocket Monitor
         ↓
  Proportional Calculator
         ↓
   Injective Executor
         ↓
Injective Blockchain (Follower)
         ↓
   Supabase Database
```

## 📦 Installation

```bash
cd backend
pnpm install
```

## ⚙️ Configuration

Create `.env` file:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server
PORT=3001
NODE_ENV=production

# Injective (optional - uses mainnet by default)
INJECTIVE_NETWORK=mainnet
```

## 🚀 Usage

### Development
```bash
pnpm dev
```

### Production
```bash
pnpm build
pnpm start
```

## 📡 API Endpoints

### Health Check
```http
GET /health
```

### Status
```http
GET /api/status
```

### Add Wallet to Monitor
```http
POST /api/monitor/add
Content-Type: application/json

{
  "masterAddress": "0x...",
  "userId": "user-uuid"
}
```

### Remove Wallet from Monitor
```http
POST /api/monitor/remove
Content-Type: application/json

{
  "masterAddress": "0x...",
  "userId": "user-uuid"
}
```

## 🔄 Trade Replication Flow

1. **Monitor**: WebSocket listens for new fills on master wallet
2. **Filter**: Ignores existing positions (only new trades)
3. **Calculate**: 
   ```
   Master Position % = (Master Position Value / Master Account Balance) × 100
   User Position % = Master Position % × Copy Percentage
   User Position Size = (User Balance × User Position %) / Entry Price
   ```
4. **Execute**: Creates market order on Injective
5. **Set TP/SL**: Places limit orders for take profit and stop loss
6. **Record**: Stores trade in database

## 🗄️ Database Schema

### Tables
- `users`: User wallet addresses and settings
- `master_traders`: Hyperliquid wallets being monitored
- `copy_settings`: User copy configurations (percentage, max size, etc.)
- `trades`: All executed trades (master and copy)
- `positions`: Current open positions

## 🔐 Security

- Service role key for Supabase (server-side only)
- No private keys stored (uses wallet strategy)
- Input validation on all endpoints
- Error handling and logging

## 📊 Monitoring

The service logs:
- ✅ Successful operations
- ⚠️ Warnings (position size limits, etc.)
- ❌ Errors (failed trades, connection issues)
- 📡 WebSocket events
- 🔄 Trade executions

## 🛠️ Development

### File Structure
```
backend/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── types/
│   │   └── index.ts               # TypeScript types
│   └── services/
│       ├── supabase.ts            # Database client
│       ├── hyperliquidMonitor.ts  # Hyperliquid WebSocket
│       └── injectiveExecutor.ts   # Injective trade execution
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Features

1. **New Market Support**: Update symbol mapping in `injectiveExecutor.ts`
2. **Custom Order Types**: Extend `ExecuteOrderParams` interface
3. **Additional Filters**: Modify `processFill()` in `hyperliquidMonitor.ts`

## 🚢 Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for production deployment instructions.

### Systemd Service

```bash
sudo cp copytrader-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable copytrader-backend
sudo systemctl start copytrader-backend
```

## 🐛 Troubleshooting

### WebSocket Connection Issues
- Check Hyperliquid API status
- Verify network connectivity
- Review firewall rules

### Trade Execution Failures
- Verify Injective network status
- Check user balance
- Review market availability
- Check gas fees

### Database Errors
- Verify Supabase credentials
- Check table schemas
- Review RLS policies

## 📝 License

MIT
