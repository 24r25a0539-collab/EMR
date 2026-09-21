/**
 * Shared mobile phone normalization and formatting utility.
 * Standardizes Indian mobile numbers into canonical 10-digit strings.
 */

/**
 * Normalizes an Indian mobile phone number into a canonical 10-digit string.
 * Supports:
 * - 9876543210 -> "9876543210"
 * - +919876543210 -> "9876543210"
 * - +91 9876543210 -> "9876543210"
 * - 09876543210 -> "9876543210"
 * - 919876543210 -> "9876543210"
 *
 * Returns null if the number cannot be resolved to a valid 10-digit Indian mobile.
 */
export function normalizeMobileNumber(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  // Strip all non-digit characters
  const digits = raw.replace(/\D/g, '');

  // Exact 10 digits
  if (digits.length === 10) {
    return digits;
  }

  // 12 digits starting with country code 91
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  // 11 digits starting with trunk prefix 0
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }

  return null;
}

/**
 * Masks a mobile number for safe display, showing only the last 4 digits.
 * Example: "1234567890" -> "+91 ******7890"
 */
export function maskMobileNumber(raw: string | null | undefined): string {
  const normalized = normalizeMobileNumber(raw);
  if (!normalized) {
    return '******0000';
  }
  const last4 = normalized.slice(-4);
  return `+91 ******${last4}`;
}
