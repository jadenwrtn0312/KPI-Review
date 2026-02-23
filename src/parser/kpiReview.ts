import { KpiReviewData, KpiReviewMetric, ServiceName } from '../types';
import { KPI_REVIEW_CONFIG } from '../config/sheets';
import { parseValue } from './valueParser';

/**
 * Parse the KPI Review tab for a given service.
 * Returns WoW/MoM comparison data.
 */
export function parseKpiReview(
  rawData: string[][],
  service: ServiceName,
): KpiReviewData {
  const config = KPI_REVIEW_CONFIG;
  const cols = config.serviceColumns[service];
  const metrics: KpiReviewMetric[] = [];

  for (let i = config.dataStartRow; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row) continue;

    const metricKeyWeekly = String(row[config.metricKeyColumnWeekly] ?? '').trim();
    const metricKeyMonthly = String(row[config.metricKeyColumnMonthly] ?? '').trim();
    const displayName = String(row[config.displayNameColumn] ?? '').trim();

    // Skip empty separator rows
    if (!metricKeyWeekly && !metricKeyMonthly && !displayName) continue;

    metrics.push({
      metricKeyWeekly,
      metricKeyMonthly,
      displayName,
      wMinus2: parseValue(row[cols.wMinus2]),
      wMinus1: parseValue(row[cols.wMinus1]),
      wow: parseValue(row[cols.wow]),
      mMinus1: parseValue(row[cols.mMinus1]),
      m0: parseValue(row[cols.m0]),
      mom: parseValue(row[cols.mom]),
    });
  }

  return { service, metrics };
}

/**
 * Find a specific metric in KPI Review data by SQL metric key.
 * Searches both weekly and monthly key columns.
 */
export function findKpiReviewMetric(
  data: KpiReviewData,
  metricKey: string,
): KpiReviewMetric | undefined {
  return data.metrics.find(
    (m) => m.metricKeyWeekly === metricKey || m.metricKeyMonthly === metricKey,
  );
}
