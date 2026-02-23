import {
  PeriodComparison,
  KpiReviewData,
  TimeSeriesTabData,
  CoreKpiKey,
} from '../types';
import { findKpiReviewMetric } from '../parser/kpiReview';
import { findMetric, getLastNValues } from '../parser/dailyWeekly';

const CORE_KPI_KEYS: CoreKpiKey[] = [
  'Paid_Cohort_Retention',
  'CVR',
  'ARPPU',
  'Margin_Rate',
];

/**
 * Extract MoM comparisons from KPI Review tab (4 core KPIs).
 */
export function getMomComparisons(
  kpiReviewData: KpiReviewData | null,
): PeriodComparison[] {
  if (!kpiReviewData) return [];

  return CORE_KPI_KEYS.map((key) => {
    const metric = findKpiReviewMetric(kpiReviewData, key);
    if (!metric) {
      return {
        metricKey: key,
        displayName: key,
        previousValue: null,
        currentValue: null,
        absoluteDelta: null,
        percentChange: null,
      };
    }

    return {
      metricKey: key,
      displayName: metric.displayName,
      previousValue: metric.mMinus1,
      currentValue: metric.m0,
      absoluteDelta: metric.m0 !== null && metric.mMinus1 !== null
        ? metric.m0 - metric.mMinus1
        : null,
      percentChange: metric.mom,
    };
  });
}

/**
 * Extract WoW comparisons from KPI Review tab (4 core KPIs).
 */
export function getWowComparisons(
  kpiReviewData: KpiReviewData | null,
): PeriodComparison[] {
  if (!kpiReviewData) return [];

  return CORE_KPI_KEYS.map((key) => {
    const metric = findKpiReviewMetric(kpiReviewData, key);
    if (!metric) {
      return {
        metricKey: key,
        displayName: key,
        previousValue: null,
        currentValue: null,
        absoluteDelta: null,
        percentChange: null,
      };
    }

    return {
      metricKey: key,
      displayName: metric.displayName,
      previousValue: metric.wMinus2,
      currentValue: metric.wMinus1,
      absoluteDelta: metric.wMinus1 !== null && metric.wMinus2 !== null
        ? metric.wMinus1 - metric.wMinus2
        : null,
      percentChange: metric.wow,
    };
  });
}

/**
 * Calculate DoD (Day-over-Day) comparisons from Daily tab (4 core KPIs).
 */
export function getDodComparisons(
  dailyData: TimeSeriesTabData | null,
): PeriodComparison[] {
  if (!dailyData) return [];

  return CORE_KPI_KEYS.map((key) => {
    const metric = findMetric(dailyData, key);
    if (!metric) {
      return {
        metricKey: key,
        displayName: key,
        previousValue: null,
        currentValue: null,
        absoluteDelta: null,
        percentChange: null,
      };
    }

    const lastTwo = getLastNValues(metric, 2);
    if (lastTwo.length < 2) {
      return {
        metricKey: key,
        displayName: metric.displayName,
        previousValue: lastTwo.length > 0 ? lastTwo[0].value : null,
        currentValue: null,
        absoluteDelta: null,
        percentChange: null,
      };
    }

    const [prev, curr] = lastTwo;
    const absoluteDelta = curr.value - prev.value;
    const percentChange = prev.value !== 0
      ? absoluteDelta / prev.value
      : null;

    return {
      metricKey: key,
      displayName: metric.displayName,
      previousValue: prev.value,
      currentValue: curr.value,
      absoluteDelta,
      percentChange,
    };
  });
}
