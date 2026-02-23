// ─── Service & KPI Types ───

export type ServiceName = 'ZZEM' | '사주';

export type CoreKpiKey =
  | 'Paid_Cohort_Retention'
  | 'CVR'
  | 'ARPPU'
  | 'Margin_Rate';

export type TimeGranularity = 'daily' | 'weekly' | 'monthly';

// ─── Sheet Configuration ───

export interface TabConfig {
  tabName: string;
  service: ServiceName;
  granularity: TimeGranularity;
  metricKeyColumn: number;      // 0-indexed column for SQL metric key
  displayNameColumn: number;    // 0-indexed column for display name
  dataStartColumn: number;      // 0-indexed first data column
  dateHeaderRow: number;        // 0-indexed row containing date headers
  dataStartRow: number;         // 0-indexed first data row
  // Monthly-specific
  targetColumn?: number;        // column for 목표 KPI
  crackColumn?: number;         // column for Crack benchmark
}

export interface KpiReviewConfig {
  tabName: string;
  metricKeyColumnWeekly: number;  // col A: weekly SQL key
  metricKeyColumnMonthly: number; // col B: monthly SQL key
  displayNameColumn: number;      // col C: display name
  dataStartRow: number;           // first data row (0-indexed)
  serviceColumns: Record<ServiceName, ServiceColumnRange>;
}

export interface ServiceColumnRange {
  wMinus2: number;  // W-2 column
  wMinus1: number;  // W-1 column
  wow: number;      // WoW 변화 column
  mMinus1: number;  // M-1 column
  m0: number;       // M0 column
  mom: number;      // MoM 변화 column
}

// ─── Parsed Data Structures ───

export interface MetricTimeSeries {
  metricKey: string;
  displayName: string;
  dates: string[];            // date labels from header row
  values: (number | null)[];  // parsed numeric values
}

export interface TimeSeriesTabData {
  service: ServiceName;
  granularity: TimeGranularity;
  metrics: MetricTimeSeries[];
}

export interface MonthlyMetric extends MetricTimeSeries {
  target: number | null;      // 목표 KPI
  crack: number | null;       // Crack benchmark
}

export interface MonthlyTabData {
  service: ServiceName;
  metrics: MonthlyMetric[];
}

export interface KpiReviewMetric {
  metricKeyWeekly: string;
  metricKeyMonthly: string;
  displayName: string;
  wMinus2: number | null;
  wMinus1: number | null;
  wow: number | null;         // WoW 변화
  mMinus1: number | null;
  m0: number | null;
  mom: number | null;         // MoM 변화
}

export interface KpiReviewData {
  service: ServiceName;
  metrics: KpiReviewMetric[];
}

// ─── Processing Results ───

export type StatusLevel = 'on_track' | 'at_risk' | 'critical';

export interface TargetComparison {
  metricKey: CoreKpiKey;
  displayName: string;
  currentValue: number | null;
  targetValue: number;
  achievementRate: number | null;  // percentage (e.g., 104.3)
  status: StatusLevel;
  delta: number | null;            // current - target
}

export interface PeriodComparison {
  metricKey: string;
  displayName: string;
  previousValue: number | null;
  currentValue: number | null;
  absoluteDelta: number | null;
  percentChange: number | null;    // percentage change
}

export interface AnomalyAlert {
  metricKey: string;
  displayName: string;
  type: 'spike' | 'drop';
  date: string;
  value: number;
  previousValue: number;
  changePercent: number;           // e.g., +25.3 or -22.1
}

export interface TrendAlert {
  metricKey: string;
  displayName: string;
  type: 'consecutive_decline';
  days: number;
  startDate: string;
  endDate: string;
  totalDecline: number;            // percentage total decline
}

// ─── Service Analysis (final aggregation) ───

export interface ServiceAnalysis {
  service: ServiceName;
  date: string;
  targetComparisons: TargetComparison[];
  momComparisons: PeriodComparison[];
  wowComparisons: PeriodComparison[];
  dodComparisons: PeriodComparison[];
  anomalies: AnomalyAlert[];
  trends: TrendAlert[];
  aiInsight: string | null;
  // Raw data for Claude context
  dailyData: TimeSeriesTabData | null;
  weeklyData: TimeSeriesTabData | null;
  monthlyData: MonthlyTabData | null;
  kpiReviewData: KpiReviewData | null;
}

// ─── Raw Sheet Data ───

export interface RawSheetData {
  tabName: string;
  values: string[][];  // 2D array of raw string values
}

export interface AllRawData {
  kpiReview: string[][];
  dailyZzem: string[][];
  weeklyZzem: string[][];
  monthlyZzem: string[][];
  dailySaju: string[][];
  weeklySaju: string[][];
  monthlySaju: string[][];
}
