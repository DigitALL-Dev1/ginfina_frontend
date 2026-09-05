/**
 * Auto-generate a code with a given prefix.
 * Format: PREFIX-YYYYMMDD-XXXX  (XXXX = 4 random uppercase hex chars)
 * Example: SITE-20260904-A3F2
 */
export function autoCode(prefix) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `${prefix}-${date}-${rand}`;
}
