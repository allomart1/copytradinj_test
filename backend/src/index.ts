import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import hyperliquidRoutes from './routes/hyperliquid.js';
import { HyperliquidMonitor } from './services/hyperliquidMonitor.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/hyperliquid', hyperliquidRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Start Hyperliquid monitor
  const monitor = HyperliquidMonitor.getInstance();
  monitor.start();
});
