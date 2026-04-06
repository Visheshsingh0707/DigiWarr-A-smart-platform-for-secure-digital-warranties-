import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT_LENGTH = 32;

/**
 * Derives a unique encryption key for each user using PBKDF2.
 * The master key + user-specific salt ensures each user has a unique key.
 */
export function deriveUserKey(masterKey: string, userSalt: string): Buffer {
  return crypto.pbkdf2Sync(masterKey, userSalt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Generates a random salt for a new user.
 */
export function generateUserSalt(): string {
  return crypto.randomBytes(SALT_LENGTH).toString('hex');
}

/**
 * Encrypts a buffer using AES-256-GCM.
 * Returns the encrypted buffer, IV, and authentication tag.
 */
export function encryptBuffer(
  buffer: Buffer,
  key: Buffer
): { encrypted: Buffer; iv: string; authTag: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypts a buffer using AES-256-GCM.
 * Requires the IV and authentication tag from encryption.
 */
export function decryptBuffer(
  encryptedBuffer: Buffer,
  key: Buffer,
  ivHex: string,
  authTagHex: string
): Buffer {
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

/**
 * Gets the master encryption key from environment.
 */
export function getMasterKey(): string {
  const key = process.env.ENCRYPTION_MASTER_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_MASTER_KEY environment variable is not set');
  }
  return key;
}
