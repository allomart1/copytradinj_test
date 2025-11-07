import express from 'express';
import { SessionKeyService } from '../services/sessionKeyService.js';

const router = express.Router();

/**
 * Create new session key
 */
router.post('/', async (req, res) => {
  try {
    const { walletAddress, sessionPrivateKey, expirationDays, signature } = req.body;

    if (!walletAddress || !sessionPrivateKey || !expirationDays || !signature) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // TODO: Verify signature to ensure user authorized this action

    const sessionKey = await SessionKeyService.createSessionKey(
      walletAddress,
      sessionPrivateKey,
      expirationDays
    );

    res.json(sessionKey);
  } catch (error: any) {
    console.error('Failed to create session key:', error);
    res.status(500).json({ message: error.message || 'Failed to create session key' });
  }
});

/**
 * Check if wallet has active session key
 */
router.get('/:walletAddress/active', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const hasActiveKey = await SessionKeyService.hasActiveSessionKey(walletAddress);
    res.json({ hasActiveKey });
  } catch (error: any) {
    console.error('Failed to check session key:', error);
    res.status(500).json({ message: error.message || 'Failed to check session key' });
  }
});

/**
 * Get active session key info (without private key)
 */
router.get('/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // This endpoint returns session key metadata, not the actual private key
    const hasActiveKey = await SessionKeyService.hasActiveSessionKey(walletAddress);
    
    if (!hasActiveKey) {
      return res.status(404).json({ message: 'No active session key found' });
    }

    res.json({ walletAddress, hasActiveKey: true });
  } catch (error: any) {
    console.error('Failed to get session key:', error);
    res.status(500).json({ message: error.message || 'Failed to get session key' });
  }
});

/**
 * Delete session key
 */
router.delete('/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    await SessionKeyService.deleteSessionKey(walletAddress);
    res.json({ message: 'Session key deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete session key:', error);
    res.status(500).json({ message: error.message || 'Failed to delete session key' });
  }
});

export default router;
