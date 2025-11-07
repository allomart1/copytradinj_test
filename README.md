# CopyTradinj

Copy trading platform that mirrors trades from Hyperliquid to Injective.

## Features

- 🔄 Real-time trade monitoring from Hyperliquid
- 📊 Automatic position mirroring on Injective
- 💰 Proportional position sizing
- 🔐 Non-custodial (your keys, your funds)
- ⚡ WebSocket-based instant execution

## Setup

### Frontend

```bash
pnpm install
pnpm dev
```

### Backend

```bash
cd backend
pnpm install
cp .env.example .env
# Edit .env with your Supabase credentials
pnpm dev
```

## Environment Variables

### Backend (.env)

```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## Architecture

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Blockchain**: Injective SDK
- **Data Source**: Hyperliquid API + WebSocket
- **Database**: Supabase (PostgreSQL)

## How It Works

1. Connect your Injective wallet (Keplr or Leap)
2. Enter the Hyperliquid wallet address you want to copy
3. Set your copy trading amount
4. Select which assets to copy
5. Sign authorization message
6. Trades are automatically mirrored when detected

## License

MIT
