import { CoreKpiKey } from '../types';

export interface KpiTarget {
  key: CoreKpiKey;
  displayName: string;
  target: number;
  unit: 'percent' | 'currency' | 'number';
  // For display formatting
  formatLabel: string;
}

export const KPI_TARGETS: KpiTarget[] = [
  {
    key: 'Paid_Cohort_Retention',
    displayName: 'Paid Cohort Retention',
    target: 0.75,     // 75%
    unit: 'percent',
    formatLabel: '75%',
  },
  {
    key: 'CVR',
    displayName: 'CVR',
    target: 0.15,     // 15%
    unit: 'percent',
    formatLabel: '15%',
  },
  {
    key: 'ARPPU',
    displayName: 'ARPPU',
    target: 28000,    // ₩28,000
    unit: 'currency',
    formatLabel: '₩28,000',
  },
  {
    key: 'Margin_Rate',
    displayName: '마진율',
    target: 0.30,     // 30%
    unit: 'percent',
    formatLabel: '30%',
  },
];

export function getTarget(key: CoreKpiKey): KpiTarget | undefined {
  return KPI_TARGETS.find((t) => t.key === key);
}
