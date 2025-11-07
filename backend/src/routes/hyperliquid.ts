import express from 'express';
import { HyperliquidMonitor } from '../services/hyperliquidMonitor.js';

const router = express.Router();

// Get positions for a wallet
router.get('/positions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const monitor = HyperliquidMonitor.getInstance();
    
    const positions = await monitor.getPositions(address);
    
    res.json({
      success: true,
      positions,
    });
  } catch (error: any) {
    console.error('Failed to fetch positions:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get trade history for a wallet
router.get('/history/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const monitor = HyperliquidMonitor.getInstance();
    
    const history = await monitor.getTradeHistory(address);
    
    res.json({
      success: true,
      history,
    });
  } catch (error: any) {
    console.error('Failed to fetch history:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
