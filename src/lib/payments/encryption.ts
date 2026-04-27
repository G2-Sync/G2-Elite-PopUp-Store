import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * AES-256-GCM token encryption for at-rest payment provider tokens.
 *
 * For production, Supabase Vault (pgsodium) is the canonical solution,
 * but this gives equivalent security (AES-256-GCM is the industry standard
 * for symmetric encryption) with much less infrastructure complexity.
 *
 * Key is read from PAYMENT_TOKEN_ENCRYPTION_KEY (base64-encoded, 32 bytes
 * decoded). Generate one with: `openssl rand -base64 32`.
 *
 * Ciphertext format: {iv-hex}:{authtag-hex}:{ciphertext-hex}
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard

function getKey(): Buffer {
  const keyB64 = process.env.PAYMENT_TOKEN_ENCRYPTION_KEY;
  if (!keyB64) {
    throw new Error(
      'PAYMENT_TOKEN_ENCRYPTION_KEY env var is required to encrypt/decrypt payment tokens'
    );
  }
  const key = Buffer.from(keyB64, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `PAYMENT_TOKEN_ENCRYPTION_KEY must decode to 32 bytes (got ${key.length}). Generate with "openssl rand -base64 32".`
    );
  }
  return key;
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptToken(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
