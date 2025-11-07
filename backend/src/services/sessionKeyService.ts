import crypto from 'crypto';
import { supabase } from '../config/supabase.js';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.SESSION_KEY_ENCRYPTION_SECRET;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error('SESSION_KEY_ENCRYPTION_SECRET must be a 64-character hex string (32 bytes)');
}

interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

export class SessionKeyService {
  /**
   * Encrypt a private key using AES-256-GCM
   */
  private static encrypt(privateKey: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY!, 'hex'),
      iv
    );

    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt a private key using AES-256-GCM
   */
  private static decrypt(encryptedData: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY!, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Store encrypted session key in database
   */
  static async createSessionKey(
    walletAddress: string,
    sessionPrivateKey: string,
    expirationDays: number
  ): Promise<any> {
    try {
      // Encrypt the private key
      const encryptedData = this.encrypt(sessionPrivateKey);

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      // Delete any existing session keys for this wallet
      await supabase
        .from('session_keys')
        .delete()
        .eq('wallet_address', walletAddress);

      // Insert new session key
      const { data, error } = await supabase
        .from('session_keys')
        .insert({
          wallet_address: walletAddress,
          encrypted_key: encryptedData.encrypted,
          iv: encryptedData.iv,
          auth_tag: encryptedData.authTag,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Session key stored for:', walletAddress);
      return data;
    } catch (error) {
      console.error('Failed to create session key:', error);
      throw error;
    }
  }

  /**
   * Get decrypted session key for wallet
   */
  static async getSessionKey(walletAddress: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('session_keys')
        .select('*')
        .eq('wallet_address', walletAddress)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      // Decrypt the private key
      const decrypted = this.decrypt({
        encrypted: data.encrypted_key,
        iv: data.iv,
        authTag: data.auth_tag,
      });

      return decrypted;
    } catch (error) {
      console.error('Failed to get session key:', error);
      return null;
    }
  }

  /**
   * Check if wallet has active session key
   */
  static async hasActiveSessionKey(walletAddress: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('session_keys')
        .select('id')
        .eq('wallet_address', walletAddress)
        .gt('expires_at', new Date().toISOString())
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete session key
   */
  static async deleteSessionKey(walletAddress: string): Promise<void> {
    try {
      await supabase
        .from('session_keys')
        .delete()
        .eq('wallet_address', walletAddress);

      console.log('✅ Session key deleted for:', walletAddress);
    } catch (error) {
      console.error('Failed to delete session key:', error);
      throw error;
    }
  }

  /**
   * Clean up expired session keys
   */
  static async cleanupExpiredKeys(): Promise<void> {
    try {
      const { error } = await supabase
        .from('session_keys')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        throw error;
      }

      console.log('✅ Cleaned up expired session keys');
    } catch (error) {
      console.error('Failed to cleanup expired keys:', error);
    }
  }
}
