import { PrivateKey } from '@injectivelabs/sdk-ts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface SessionKey {
  id: string;
  wallet_address: string;
  expires_at: string;
  created_at: string;
}

export class SessionKeyService {
  /**
   * Create a new session key for automated trading
   */
  static async createSessionKey(
    walletAddress: string,
    walletType: 'keplr' | 'leap',
    expirationDays: number = 7
  ): Promise<SessionKey> {
    try {
      // Generate a new private key for the session
      const { privateKey } = PrivateKey.generate();
      const sessionPrivateKey = privateKey;

      console.log('🔑 Generated session private key');

      // Get user signature to authorize session key creation
      const message = `Create session key for automated trading\n\nWallet: ${walletAddress}\nExpiration: ${expirationDays} days\n\nThis key will be encrypted and stored securely.`;
      
      const walletInstance = walletType === 'keplr' ? window.keplr : window.leap;
      if (!walletInstance) {
        throw new Error(`${walletType} wallet not found`);
      }

      const signature = await walletInstance.signArbitrary(
        'injective-1',
        walletAddress,
        message
      );

      console.log('✍️ User signed authorization');

      // Send to backend for encryption and storage
      const response = await fetch(`${API_URL}/api/session-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          sessionPrivateKey,
          expirationDays,
          signature: signature.signature,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create session key');
      }

      const sessionKey = await response.json();
      console.log('✅ Session key created:', sessionKey.id);

      return sessionKey;
    } catch (error: any) {
      console.error('Failed to create session key:', error);
      throw new Error(error.message || 'Failed to create session key');
    }
  }

  /**
   * Check if wallet has an active session key
   */
  static async hasActiveSessionKey(walletAddress: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_URL}/api/session-keys/${walletAddress}/active`
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.hasActiveKey;
    } catch (error) {
      console.error('Failed to check session key:', error);
      return false;
    }
  }

  /**
   * Get active session key for wallet
   */
  static async getActiveSessionKey(walletAddress: string): Promise<SessionKey | null> {
    try {
      const response = await fetch(
        `${API_URL}/api/session-keys/${walletAddress}`
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get session key:', error);
      return null;
    }
  }

  /**
   * Revoke (delete) session key
   */
  static async revokeSessionKey(walletAddress: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_URL}/api/session-keys/${walletAddress}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to revoke session key');
      }

      console.log('✅ Session key revoked');
    } catch (error: any) {
      console.error('Failed to revoke session key:', error);
      throw new Error(error.message || 'Failed to revoke session key');
    }
  }
}
