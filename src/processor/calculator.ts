import { CoreKpiKey, TargetComparison, StatusLevel, MonthlyTabData } from '../types';
import { KPI_TARGETS } from '../config/targets';
import { findMonthlyMetric, getLatestMonthlyValue } from '../parser/monthly';

/**
 * Calculate target achievement for all 4 core KPIs.
 * Uses monthly tab data for current values and config targets.
 */
export function calculateTargetComparisons(
  monthlyData: MonthlyTabData | null,
): TargetComparison[] {
  return KPI_TARGETS.map((target) => {
    let currentValue: number | null = null;

    if (monthlyData) {
      const metric = findMonthlyMetric(monthlyData, target.key);
      if (metric) {
        const latest = getLatestMonthlyValue(metric);
        if (latest) {
          currentValue = latest.value;
        }
        // Use target from spreadsheet if available, otherwise fall back to config
        if (metric.target !== null) {
          // Spreadsheet target exists; we still use our config targets for consistency
        }
      }
    }

    const achievementRate = currentValue !== null
      ? (currentValue / target.target) * 100
      : null;

    const status = getStatus(achievementRate);
    const delta = currentValue !== null ? currentValue - target.target : null;

    return {
      metricKey: target.key,
      displayName: target.displayName,
      currentValue,
      targetValue: target.target,
      achievementRate,
      status,
      delta,
    };
  });
}

function getStatus(achievementRate: number | null): StatusLevel {
  if (achievementRate === null) return 'critical';
  if (achievementRate >= 100) return 'on_track';
  if (achievementRate >= 80) return 'at_risk';
  return 'critical';
}
