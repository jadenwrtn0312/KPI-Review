import { TabConfig, MetricTimeSeries, TimeSeriesTabData } from '../types';
import { parseValue, parseDateHeader } from './valueParser';

/**
 * Parse a Daily or Weekly tab into time series data.
 * Uses TabConfig to handle ZZEM (2-col offset) vs 사주 (3-col offset).
 */
export function parseDailyWeekly(
  rawData: string[][],
  tabConfig: TabConfig,
): TimeSeriesTabData {
  // Extract date headers
  const headerRow = rawData[tabConfig.dateHeaderRow] ?? [];
  const dates: string[] = [];
  for (let col = tabConfig.dataStartColumn; col < headerRow.length; col++) {
    dates.push(parseDateHeader(headerRow[col]));
  }

  // Parse metric rows
  const metrics: MetricTimeSeries[] = [];

  for (let i = tabConfig.dataStartRow; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row) continue;

    const metricKey = String(row[tabConfig.metricKeyColumn] ?? '').trim();
    const displayName = String(row[tabConfig.displayNameColumn] ?? '').trim();

    // Skip empty separator rows
    if (!metricKey && !displayName) continue;

    const values: (number | null)[] = [];
    for (let col = tabConfig.dataStartColumn; col < Math.max(row.length, tabConfig.dataStartColumn + dates.length); col++) {
      values.push(parseValue(row[col]));
    }

    metrics.push({
      metricKey,
      displayName,
      dates,
      values,
    });
  }

  return {
    service: tabConfig.service,
    granularity: tabConfig.granularity,
    metrics,
  };
}

/**
 * Find a metric by key in time series data.
 */
export function findMetric(
  data: TimeSeriesTabData,
  metricKey: string,
): MetricTimeSeries | undefined {
  return data.metrics.find((m) => m.metricKey === metricKey);
}

/**
 * Get the last N non-null values from a metric time series.
 * Returns values in chronological order (oldest first).
 */
export function getLastNValues(
  metric: MetricTimeSeries,
  n: number,
): { date: string; value: number }[] {
  const result: { date: string; value: number }[] = [];

  for (let i = metric.values.length - 1; i >= 0 && result.length < n; i--) {
    const value = metric.values[i];
    if (value !== null) {
      result.unshift({
        date: metric.dates[i] ?? `idx:${i}`,
        value,
      });
    }
  }

  return result;
}
