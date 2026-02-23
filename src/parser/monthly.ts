import { TabConfig, MonthlyMetric, MonthlyTabData } from '../types';
import { parseValue, parseDateHeader } from './valueParser';

/**
 * Parse a Monthly tab into monthly data with target values.
 * Monthly tabs have additional target and crack benchmark columns.
 */
export function parseMonthly(
  rawData: string[][],
  tabConfig: TabConfig,
): MonthlyTabData {
  // Extract date headers
  const headerRow = rawData[tabConfig.dateHeaderRow] ?? [];
  const dates: string[] = [];
  for (let col = tabConfig.dataStartColumn; col < headerRow.length; col++) {
    dates.push(parseDateHeader(headerRow[col]));
  }

  // Parse metric rows
  const metrics: MonthlyMetric[] = [];

  for (let i = tabConfig.dataStartRow; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row) continue;

    const metricKey = String(row[tabConfig.metricKeyColumn] ?? '').trim();
    const displayName = String(row[tabConfig.displayNameColumn] ?? '').trim();

    // Skip empty separator rows
    if (!metricKey && !displayName) continue;

    // Parse target and crack values
    const target = tabConfig.targetColumn !== undefined
      ? parseValue(row[tabConfig.targetColumn])
      : null;
    const crack = tabConfig.crackColumn !== undefined
      ? parseValue(row[tabConfig.crackColumn])
      : null;

    // Parse monthly data values
    const values: (number | null)[] = [];
    for (let col = tabConfig.dataStartColumn; col < Math.max(row.length, tabConfig.dataStartColumn + dates.length); col++) {
      values.push(parseValue(row[col]));
    }

    metrics.push({
      metricKey,
      displayName,
      dates,
      values,
      target,
      crack,
    });
  }

  return {
    service: tabConfig.service,
    metrics,
  };
}

/**
 * Find a monthly metric by key.
 */
export function findMonthlyMetric(
  data: MonthlyTabData,
  metricKey: string,
): MonthlyMetric | undefined {
  return data.metrics.find((m) => m.metricKey === metricKey);
}

/**
 * Get the latest non-null monthly value.
 */
export function getLatestMonthlyValue(metric: MonthlyMetric): {
  date: string;
  value: number;
} | null {
  for (let i = metric.values.length - 1; i >= 0; i--) {
    if (metric.values[i] !== null) {
      return {
        date: metric.dates[i] ?? `idx:${i}`,
        value: metric.values[i]!,
      };
    }
  }
  return null;
}
