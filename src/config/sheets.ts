import { TabConfig, KpiReviewConfig } from '../types';

// ─── Daily/Weekly/Monthly Tab Configs ───

export const TAB_CONFIGS: TabConfig[] = [
  // ZZEM tabs (2-column offset: metricKey=colA, displayName=colB, data=colC+)
  {
    tabName: '[Daily] ZZEM',
    service: 'ZZEM',
    granularity: 'daily',
    metricKeyColumn: 0,
    displayNameColumn: 1,
    dataStartColumn: 2,
    dateHeaderRow: 2,
    dataStartRow: 3,
  },
  {
    tabName: '[Weekly] ZZEM',
    service: 'ZZEM',
    granularity: 'weekly',
    metricKeyColumn: 0,
    displayNameColumn: 1,
    dataStartColumn: 2,
    dateHeaderRow: 1,
    dataStartRow: 2,
  },
  {
    tabName: '[Monthly] ZZEM',
    service: 'ZZEM',
    granularity: 'monthly',
    metricKeyColumn: 0,
    displayNameColumn: 1,
    dataStartColumn: 4,
    dateHeaderRow: 0,
    dataStartRow: 1,
    targetColumn: 2,
    crackColumn: 3,
  },
  // 사주 tabs (3-column offset: colA empty, metricKey=colB, displayName=colC, data=colD+)
  {
    tabName: '[Daily] 사주',
    service: '사주',
    granularity: 'daily',
    metricKeyColumn: 1,
    displayNameColumn: 2,
    dataStartColumn: 3,
    dateHeaderRow: 1,
    dataStartRow: 2,
  },
  {
    tabName: '[Weekly] 사주',
    service: '사주',
    granularity: 'weekly',
    metricKeyColumn: 1,
    displayNameColumn: 2,
    dataStartColumn: 3,
    dateHeaderRow: 1,
    dataStartRow: 2,
  },
  {
    tabName: '[Monthly] 사주',
    service: '사주',
    granularity: 'monthly',
    metricKeyColumn: 1,
    displayNameColumn: 2,
    dataStartColumn: 5,
    dateHeaderRow: 1,
    dataStartRow: 2,
    targetColumn: 3,
    crackColumn: 4,
  },
];

// ─── KPI Review Tab Config ───

export const KPI_REVIEW_CONFIG: KpiReviewConfig = {
  tabName: 'KPI Review',
  metricKeyColumnWeekly: 0,   // col A
  metricKeyColumnMonthly: 1,  // col B
  displayNameColumn: 2,       // col C
  dataStartRow: 2,            // 0-indexed (row 3 in spreadsheet)
  serviceColumns: {
    ZZEM: {
      wMinus2: 3,   // col D
      wMinus1: 4,   // col E
      wow: 5,       // col F
      mMinus1: 6,   // col G
      m0: 7,        // col H
      mom: 8,       // col I
    },
    '사주': {
      wMinus2: 9,   // col J
      wMinus1: 10,  // col K
      wow: 11,      // col L
      mMinus1: 12,  // col M
      m0: 13,       // col N
      mom: 14,      // col O
    },
  },
};

// All tab names for fetching
export const ALL_TAB_NAMES = [
  'KPI Review',
  ...TAB_CONFIGS.map((c) => c.tabName),
];

export function getTabConfig(tabName: string): TabConfig | undefined {
  return TAB_CONFIGS.find((c) => c.tabName === tabName);
}

export function getTabConfigsForService(service: 'ZZEM' | '사주'): TabConfig[] {
  return TAB_CONFIGS.filter((c) => c.service === service);
}
