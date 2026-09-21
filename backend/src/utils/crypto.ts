import * as crypto from 'crypto';

/**
 * Deterministically sorts all keys of an object recursively to produce
 * a canonical JSON string for cryptographic hashing.
 */
export function canonicalizeJson(obj: any): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }

  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => {
    const val = canonicalizeJson(obj[key]);
    return JSON.stringify(key) + ':' + val;
  });

  return '{' + pairs.join(',') + '}';
}

/**
 * Computes the SHA-256 hash of canonicalized JSON data.
 */
export function calculateCanonicalSha256(data: any): string {
  const canonicalString = typeof data === 'string' ? data : canonicalizeJson(data);
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

/**
 * Generates a mock or standard 6-digit numeric OTP.
 */
export function generateSixDigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generates a mock transaction hash for EVM proofs when in fallback mode.
 */
export function generateTxHash(): string {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

/**
 * Generates a secure random temporary password (e.g. A7xP#29LmQ).
 * Guaranteed to have uppercase, lowercase, digit, and special character.
 */
export function generateSecureRandomPassword(length: number = 10): string {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const specials = '#@!$%&*?';
  const all = uppers + lowers + digits + specials;

  const getRandomChar = (charset: string) => {
    const byte = crypto.randomBytes(1)[0];
    return charset[byte % charset.length];
  };

  // Guarantee at least one of each required character type
  const pwdChars = [
    getRandomChar(uppers),
    getRandomChar(lowers),
    getRandomChar(digits),
    getRandomChar(specials),
  ];

  while (pwdChars.length < length) {
    pwdChars.push(getRandomChar(all));
  }

  // Shuffle array securely
  for (let i = pwdChars.length - 1; i > 0; i--) {
    const j = crypto.randomBytes(1)[0] % (i + 1);
    [pwdChars[i], pwdChars[j]] = [pwdChars[j], pwdChars[i]];
  }

  return pwdChars.join('');
}

/**
 * Validates password strength:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required.' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (!@#$%^&*...).' };
  }
  return { valid: true };
}

