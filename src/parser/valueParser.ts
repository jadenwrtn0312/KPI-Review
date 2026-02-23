/**
 * Parse a raw cell value from Google Sheets into a number or null.
 *
 * Handles:
 * - Raw numbers (already numeric from UNFORMATTED_VALUE): 0.496, 18171
 * - Percentage strings: "46.28%", "-19.96%"
 * - Currency strings: "₩18,171", "₩5,923,600"
 * - Comma-separated integers: "1,267"
 * - Empty/null/N/A: "", null, undefined, "N/A", "-", "#N/A", "#DIV/0!"
 */
export function parseValue(raw: unknown): number | null {
  // Already a number
  if (typeof raw === 'number') {
    if (isNaN(raw) || !isFinite(raw)) return null;
    return raw;
  }

  if (raw === null || raw === undefined) return null;

  const str = String(raw).trim();

  // Empty or error values
  if (
    str === '' ||
    str === '-' ||
    str === 'N/A' ||
    str === '#N/A' ||
    str === '#DIV/0!' ||
    str === '#REF!' ||
    str === '#VALUE!'
  ) {
    return null;
  }

  // Percentage string: "46.28%" or "-19.96%"
  if (str.endsWith('%')) {
    const num = parseFloat(str.replace('%', ''));
    if (isNaN(num)) return null;
    return num / 100;
  }

  // Currency string: "₩18,171"
  if (str.startsWith('₩')) {
    const num = parseFloat(str.replace(/[₩,\s]/g, ''));
    if (isNaN(num)) return null;
    return num;
  }

  // Comma-separated number: "1,267" or "-1,267"
  const cleaned = str.replace(/,/g, '');
  const num = parseFloat(cleaned);
  if (!isNaN(num)) return num;

  return null;
}

/**
 * Parse a date header string into a normalized label.
 * Handles: "11월 24일", "2025-11-24 00:00:00", "W1", "W10", etc.
 */
export function parseDateHeader(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  return String(raw).trim();
}
