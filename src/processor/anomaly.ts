import { AnomalyAlert, TrendAlert, TimeSeriesTabData } from '../types';
import { findMetric, getLastNValues } from '../parser/dailyWeekly';

const ANOMALY_THRESHOLD = 0.20; // ±20% daily change
const CONSECUTIVE_DECLINE_DAYS = 3;
const LOOKBACK_DAYS = 14; // Check last 14 days for anomalies

/**
 * Detect anomalies (±20% daily change) in all metrics from daily data.
 */
export function detectAnomalies(
  dailyData: TimeSeriesTabData | null,
): AnomalyAlert[] {
  if (!dailyData) return [];

  const alerts: AnomalyAlert[] = [];

  for (const metric of dailyData.metrics) {
    const recentValues = getLastNValues(metric, LOOKBACK_DAYS);

    for (let i = 1; i < recentValues.length; i++) {
      const prev = recentValues[i - 1];
      const curr = recentValues[i];

      if (prev.value === 0) continue;

      const changePercent = (curr.value - prev.value) / Math.abs(prev.value);

      if (Math.abs(changePercent) >= ANOMALY_THRESHOLD) {
        alerts.push({
          metricKey: metric.metricKey,
          displayName: metric.displayName,
          type: changePercent > 0 ? 'spike' : 'drop',
          date: curr.date,
          value: curr.value,
          previousValue: prev.value,
          changePercent,
        });
      }
    }
  }

  // Sort by date descending, then by absolute change
  alerts.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return Math.abs(b.changePercent) - Math.abs(a.changePercent);
  });

  // Return top 5 most recent anomalies
  return alerts.slice(0, 5);
}

/**
 * Detect consecutive declining trends (3+ days) in core metrics.
 */
export function detectTrends(
  dailyData: TimeSeriesTabData | null,
  metricKeys: string[],
): TrendAlert[] {
  if (!dailyData) return [];

  const alerts: TrendAlert[] = [];

  for (const key of metricKeys) {
    const metric = findMetric(dailyData, key);
    if (!metric) continue;

    const recentValues = getLastNValues(metric, LOOKBACK_DAYS);
    if (recentValues.length < CONSECUTIVE_DECLINE_DAYS) continue;

    // Check for consecutive declines at the end of the series
    let consecutiveDeclines = 0;
    let startIdx = recentValues.length - 1;

    for (let i = recentValues.length - 1; i > 0; i--) {
      if (recentValues[i].value < recentValues[i - 1].value) {
        consecutiveDeclines++;
        startIdx = i - 1;
      } else {
        break;
      }
    }

    if (consecutiveDeclines >= CONSECUTIVE_DECLINE_DAYS) {
      const startValue = recentValues[startIdx].value;
      const endValue = recentValues[recentValues.length - 1].value;
      const totalDecline = startValue !== 0
        ? ((endValue - startValue) / Math.abs(startValue)) * 100
        : 0;

      alerts.push({
        metricKey: metric.metricKey,
        displayName: metric.displayName,
        type: 'consecutive_decline',
        days: consecutiveDeclines,
        startDate: recentValues[startIdx].date,
        endDate: recentValues[recentValues.length - 1].date,
        totalDecline,
      });
    }
  }

  return alerts;
}
