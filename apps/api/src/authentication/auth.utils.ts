import crypto from 'crypto';

// Formato v1 (legado): iv:authTag:encrypted  — salt hardcoded
// Formato v2 (atual):  salt:iv:authTag:encrypted — salt aleatório por registro
const LEGACY_SALT = 'ccapisalt';
const V2_PARTS = 4;

function deriveKey(secret: string, salt: string): Buffer {
  return crypto.scryptSync(secret, salt, 32);
}

export function encryptValue(plainText: string): string {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) throw new Error('ENCRYPTION_KEY not configured');
  const salt = crypto.randomBytes(16).toString('hex');
  const key = deriveKey(secret, salt);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${salt}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptValue(cipherText: string): string {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) throw new Error('ENCRYPTION_KEY not configured');
  const parts = cipherText.split(':');
  return parts.length === V2_PARTS
    ? decryptV2(secret, parts)
    : decryptLegacy(secret, parts);
}

function decryptV2(secret: string, parts: string[]): string {
  const [salt, ivHex, authTagHex, encryptedHex] = parts;
  const key = deriveKey(secret, salt);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

// Mantido para descriptografar valores existentes no banco (formato antigo)
function decryptLegacy(secret: string, parts: string[]): string {
  const key = deriveKey(secret, LEGACY_SALT);
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = Buffer.from(parts[2], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
