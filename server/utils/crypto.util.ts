import crypto from 'crypto';
import { envConfig } from '../config/env.config';

const ALGORITHM = 'aes-256-cbc';

export class CryptoUtil {
  /**
   * Encrypts a plaintext string into a hex:hex format containing the IV and ciphertext.
   */
  public static encrypt(text: string | null | undefined): string | null {
    if (!text) return null;
    
    // Fallback secret if ENCRYPTION_KEY is not defined in environment
    const key = process.env.ENCRYPTION_KEY || envConfig.sessionSecret || 'reelpilot-default-encryption-secret-32';
    const hash = crypto.createHash('sha256').update(key).digest();
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(ALGORITHM, hash, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts an encrypted hex:hex format back into plaintext.
   * Gracefully returns the original string if it is not encrypted (backward compatibility).
   */
  public static decrypt(encryptedText: string | null | undefined): string | null {
    if (!encryptedText) return null;
    
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      // Returns plaintext directly if it wasn't encrypted
      return encryptedText;
    }

    try {
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const key = process.env.ENCRYPTION_KEY || envConfig.sessionSecret || 'reelpilot-default-encryption-secret-32';
      const hash = crypto.createHash('sha256').update(key).digest();
      
      const decipher = crypto.createDecipheriv(ALGORITHM, hash, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (err) {
      // Return original text if decryption fails
      return encryptedText;
    }
  }
}
