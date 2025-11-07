import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { createClient } from '@supabase/supabase-js';
import { CopyTradingService } from './services/copyTradingService.js';
dotenv.config();
const app = express();
const port = process.env.PORT || 3001;
// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
// Initialize copy trading service
const copyTradingService = new CopyTradingService();
// Middleware
app.use(cors());
app.use(express.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API routes
app.get('/api/status', (req, res) => {
    res.json({
        message: 'CopyTradinj Backend API',
        version: '1.0.0',
        status: 'running',
        mode: 'non-custodial'
    });
});
// Get user configuration
app.get('/api/user-config/:address', async (req, res) => {
    try {
        const { address } = req.params;
        if (!address) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }
        const { data, error } = await supabase
            .from('copy_trading_configs')
            .select('*')
            .eq('wallet_address', address)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return res.json({ config: null });
            }
            console.error('❌ Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch user config' });
        }
        res.json({ config: data });
    }
    catch (error) {
        console.error('❌ Error fetching user config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Start copy trading
app.post('/api/start-copy-trading', async (req, res) => {
    try {
        const { walletAddress, targetWallet, amount, selectedAssets, signature } = req.body;
        console.log('📝 Received start copy trading request:', {
            walletAddress,
            targetWallet,
            amount,
            selectedAssets: selectedAssets?.length,
            hasSignature: !!signature
        });
        if (!walletAddress || !targetWallet || !amount || !selectedAssets || !signature) {
            console.error('❌ Missing required fields');
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['walletAddress', 'targetWallet', 'amount', 'selectedAssets', 'signature']
            });
        }
        // Store configuration in Supabase
        const { data, error } = await supabase
            .from('copy_trading_configs')
            .upsert({
            wallet_address: walletAddress,
            target_wallet: targetWallet,
            amount: parseFloat(amount),
            selected_assets: selectedAssets,
            signature,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'wallet_address'
        })
            .select()
            .single();
        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(500).json({
                error: 'Failed to save configuration',
                details: error.message
            });
        }
        console.log('✅ Configuration saved:', data);
        // Start monitoring
        await copyTradingService.startMonitoring(data);
        res.json({
            success: true,
            message: 'Copy trading started successfully',
            config: data
        });
    }
    catch (error) {
        console.error('❌ Error starting copy trading:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Stop copy trading
app.post('/api/stop-copy-trading', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        console.log('🛑 Received stop copy trading request:', { walletAddress });
        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }
        // Update configuration to inactive
        const { error } = await supabase
            .from('copy_trading_configs')
            .update({
            is_active: false,
            updated_at: new Date().toISOString()
        })
            .eq('wallet_address', walletAddress);
        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(500).json({
                error: 'Failed to stop copy trading',
                details: error.message
            });
        }
        // Stop monitoring
        copyTradingService.stopMonitoring(walletAddress);
        console.log('✅ Copy trading stopped for:', walletAddress);
        res.json({
            success: true,
            message: 'Copy trading stopped successfully'
        });
    }
    catch (error) {
        console.error('❌ Error stopping copy trading:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get copy trading status
app.get('/api/copy-trading-status/:address', async (req, res) => {
    try {
        const { address } = req.params;
        if (!address) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }
        const { data, error } = await supabase
            .from('copy_trading_configs')
            .select('*')
            .eq('wallet_address', address)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return res.json({ isActive: false, config: null });
            }
            console.error('❌ Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch status' });
        }
        res.json({
            isActive: data?.is_active || false,
            config: data
        });
    }
    catch (error) {
        console.error('❌ Error fetching status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get pending trades for user approval
app.get('/api/pending-trades/:address', async (req, res) => {
    try {
        const { address } = req.params;
        if (!address) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }
        const { data, error } = await supabase
            .from('pending_trades')
            .select('*')
            .eq('wallet_address', address)
            .eq('status', 'pending_approval')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch pending trades' });
        }
        res.json({ pendingTrades: data || [] });
    }
    catch (error) {
        console.error('❌ Error fetching pending trades:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Approve pending trade (user has signed)
app.post('/api/approve-trade', async (req, res) => {
    try {
        const { tradeId, txHash, walletAddress } = req.body;
        if (!tradeId || !txHash || !walletAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Update pending trade to approved
        const { data: pendingTrade, error: fetchError } = await supabase
            .from('pending_trades')
            .select('*')
            .eq('id', tradeId)
            .eq('wallet_address', walletAddress)
            .single();
        if (fetchError || !pendingTrade) {
            return res.status(404).json({ error: 'Pending trade not found' });
        }
        // Update pending trade status
        const { error: updateError } = await supabase
            .from('pending_trades')
            .update({
            status: 'approved',
            tx_hash: txHash,
            approved_at: new Date().toISOString()
        })
            .eq('id', tradeId);
        if (updateError) {
            console.error('❌ Failed to update pending trade:', updateError);
            return res.status(500).json({ error: 'Failed to approve trade' });
        }
        // Create trade history record
        const { error: historyError } = await supabase
            .from('trade_history')
            .insert({
            wallet_address: walletAddress,
            symbol: pendingTrade.symbol,
            side: pendingTrade.side,
            size: pendingTrade.size,
            entry_price: pendingTrade.entry_price,
            leverage: pendingTrade.leverage,
            status: 'open',
            tx_hash: txHash,
            created_at: new Date().toISOString(),
        });
        if (historyError) {
            console.error('❌ Failed to create trade history:', historyError);
        }
        res.json({
            success: true,
            message: 'Trade approved and executed'
        });
    }
    catch (error) {
        console.error('❌ Error approving trade:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get user's open positions
app.get('/api/positions/:address', async (req, res) => {
    try {
        const { address } = req.params;
        if (!address) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }
        const { data, error } = await supabase
            .from('trade_history')
            .select('*')
            .eq('wallet_address', address)
            .eq('status', 'open')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Supabase error fetching positions:', error);
            return res.status(500).json({ error: 'Failed to fetch positions' });
        }
        const positions = (data || []).map(trade => ({
            id: trade.id,
            asset: trade.symbol,
            side: trade.side,
            size: trade.size,
            entryPrice: trade.entry_price,
            currentPrice: trade.entry_price,
            pnl: trade.pnl || 0,
            pnlPercentage: 0,
            leverage: trade.leverage,
            liquidationPrice: trade.entry_price * 0.9,
        }));
        res.json({ positions });
    }
    catch (error) {
        console.error('Error fetching positions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get user's trade history
app.get('/api/trade-history/:address', async (req, res) => {
    try {
        const { address } = req.params;
        if (!address) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }
        const { data, error } = await supabase
            .from('trade_history')
            .select('*')
            .eq('wallet_address', address)
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) {
            console.error('Supabase error fetching trade history:', error);
            return res.status(500).json({ error: 'Failed to fetch trade history' });
        }
        res.json({ trades: data || [] });
    }
    catch (error) {
        console.error('Error fetching trade history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Close a position
app.post('/api/positions/:id/close', async (req, res) => {
    try {
        const { id } = req.params;
        const { walletAddress } = req.body;
        if (!id || !walletAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const { error } = await supabase
            .from('trade_history')
            .update({
            status: 'closed',
            closed_at: new Date().toISOString()
        })
            .eq('id', id)
            .eq('wallet_address', walletAddress);
        if (error) {
            console.error('Supabase error closing position:', error);
            return res.status(500).json({ error: 'Failed to close position' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error closing position:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create HTTP server
const server = createServer(app);
// WebSocket server for real-time updates
const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
    console.log('📡 New WebSocket connection established');
    ws.on('message', (message) => {
        console.log('📨 Received message:', message.toString());
    });
    ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
    });
    ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to CopyTradinj Backend (Non-Custodial Mode)'
    }));
});
// Start server
server.listen(port, async () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🗄️  Supabase connected: ${supabaseUrl ? 'Yes' : 'No'}`);
    console.log(`🔐 Mode: NON-CUSTODIAL (User wallet signatures)`);
    // Load and start monitoring for active configs
    console.log('📋 Loading active copy trading configurations...');
    await copyTradingService.loadActiveConfigs();
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('⚠️ SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map