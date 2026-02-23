/**
 * Format a decimal ratio as a percentage string.
 * e.g., 0.752 → "75.2%"
 */
export function formatPercent(value: number | null, decimals = 1): string {
  if (value === null) return 'N/A';
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a percentage-point delta.
 * e.g., 0.032 → "+3.2%p"
 */
export function formatPercentDelta(value: number | null, decimals = 1): string {
  if (value === null) return 'N/A';
  const pp = value * 100;
  const sign = pp >= 0 ? '+' : '';
  return `${sign}${pp.toFixed(decimals)}%p`;
}

/**
 * Format a number as KRW currency.
 * e.g., 29400 → "₩29,400"
 */
export function formatCurrency(value: number | null): string {
  if (value === null) return 'N/A';
  return `₩${Math.round(value).toLocaleString('ko-KR')}`;
}

/**
 * Format a currency delta.
 * e.g., 1400 → "+₩1,400"
 */
export function formatCurrencyDelta(value: number | null): string {
  if (value === null) return 'N/A';
  const rounded = Math.round(value);
  const sign = rounded >= 0 ? '+' : '-';
  return `${sign}₩${Math.abs(rounded).toLocaleString('ko-KR')}`;
}

/**
 * Format a number with commas.
 * e.g., 1267 → "1,267"
 */
export function formatNumber(value: number | null, decimals = 0): string {
  if (value === null) return 'N/A';
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a percentage change with arrow.
 * e.g., 0.032 → "▲ +3.2%", -0.019 → "▼ -1.9%"
 */
export function formatChangeWithArrow(value: number | null, decimals = 1): string {
  if (value === null) return 'N/A';
  const pct = value * 100;
  const arrow = pct >= 0 ? '▲' : '▼';
  const sign = pct >= 0 ? '+' : '';
  return `${arrow} ${sign}${pct.toFixed(decimals)}%`;
}

/**
 * Get status emoji based on achievement level.
 */
export function getStatusEmoji(status: 'on_track' | 'at_risk' | 'critical'): string {
  switch (status) {
    case 'on_track': return '🟢';
    case 'at_risk': return '🟡';
    case 'critical': return '🔴';
  }
}

/**
 * Format a KPI value based on its unit type.
 */
export function formatKpiValue(
  value: number | null,
  unit: 'percent' | 'currency' | 'number',
): string {
  if (value === null) return 'N/A';
  switch (unit) {
    case 'percent': return formatPercent(value);
    case 'currency': return formatCurrency(value);
    case 'number': return formatNumber(value);
  }
}

/**
 * Format a KPI delta based on its unit type.
 */
export function formatKpiDelta(
  value: number | null,
  unit: 'percent' | 'currency' | 'number',
): string {
  if (value === null) return 'N/A';
  switch (unit) {
    case 'percent': return formatPercentDelta(value);
    case 'currency': return formatCurrencyDelta(value);
    case 'number': {
      const sign = value >= 0 ? '+' : '';
      return `${sign}${formatNumber(value)}`;
    }
  }
}
