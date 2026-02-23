import {
  ServiceAnalysis,
  TargetComparison,
  PeriodComparison,
  AnomalyAlert,
  TrendAlert,
} from '../types';
import { formatPercent, formatCurrency, formatNumber } from '../utils/format';
import { getTarget } from '../config/targets';

/**
 * Build a structured prompt for Claude to analyze KPI data.
 */
export function buildAnalysisPrompt(analysis: ServiceAnalysis): string {
  const sections: string[] = [];

  sections.push(`# ${analysis.service} KPI 분석 요청`);
  sections.push(`날짜: ${analysis.date}`);
  sections.push('');

  // Section 1: Target Achievement
  sections.push('## 1. 목표 달성률');
  for (const tc of analysis.targetComparisons) {
    sections.push(formatTargetLine(tc));
  }
  sections.push('');

  // Section 2: MoM Comparison
  sections.push('## 2. MoM (전월 대비)');
  for (const mc of analysis.momComparisons) {
    sections.push(formatComparisonLine(mc));
  }
  sections.push('');

  // Section 3: WoW Comparison
  sections.push('## 3. WoW (전주 대비)');
  for (const wc of analysis.wowComparisons) {
    sections.push(formatComparisonLine(wc));
  }
  sections.push('');

  // Section 4: DoD Comparison
  sections.push('## 4. DoD (전일 대비)');
  for (const dc of analysis.dodComparisons) {
    sections.push(formatComparisonLine(dc));
  }
  sections.push('');

  // Section 5: Anomalies
  if (analysis.anomalies.length > 0) {
    sections.push('## 5. 이상치 감지');
    for (const a of analysis.anomalies) {
      sections.push(formatAnomalyLine(a));
    }
    sections.push('');
  }

  // Section 6: Trends
  if (analysis.trends.length > 0) {
    sections.push('## 6. 트렌드 경고');
    for (const t of analysis.trends) {
      sections.push(formatTrendLine(t));
    }
    sections.push('');
  }

  // Section 7: Funnel data (as context)
  if (analysis.dailyData) {
    sections.push('## 7. 퍼널 데이터 (참고용)');
    sections.push(formatFunnelContext(analysis));
    sections.push('');
  }

  // Instructions
  sections.push('---');
  sections.push('');
  sections.push('위 데이터를 분석하여 다음 형식으로 한국어 인사이트를 작성해주세요:');
  sections.push('');
  sections.push('**강점 (Strengths):** 목표 대비 좋은 성과, 긍정적 트렌드 (1-2개)');
  sections.push('**개선 필요 (Improvements):** 목표 미달 영역, 하락 트렌드 (1-2개)');
  sections.push('**주시 필요 (Watch List):** 이상치, 변동성 큰 지표 (1-2개)');
  sections.push('**권장 액션 (Actions):** 구체적인 다음 단계 (1-3개)');
  sections.push('');
  sections.push('각 항목은 간결하게 1-2문장으로 작성하세요. 전체 300자 이내.');

  return sections.join('\n');
}

function formatTargetLine(tc: TargetComparison): string {
  const target = getTarget(tc.metricKey);
  const unit = target?.unit ?? 'number';
  const currentStr = unit === 'percent'
    ? formatPercent(tc.currentValue)
    : unit === 'currency'
      ? formatCurrency(tc.currentValue)
      : formatNumber(tc.currentValue);
  const targetStr = target?.formatLabel ?? String(tc.targetValue);
  const rate = tc.achievementRate !== null ? `${tc.achievementRate.toFixed(1)}%` : 'N/A';
  return `- ${tc.displayName}: ${currentStr} (목표 ${targetStr}, 달성률 ${rate}, 상태: ${tc.status})`;
}

function formatComparisonLine(pc: PeriodComparison): string {
  const change = pc.percentChange !== null
    ? `${(pc.percentChange * 100).toFixed(1)}%`
    : 'N/A';
  return `- ${pc.displayName}: 이전 ${pc.previousValue ?? 'N/A'} → 현재 ${pc.currentValue ?? 'N/A'} (변화: ${change})`;
}

function formatAnomalyLine(a: AnomalyAlert): string {
  const type = a.type === 'spike' ? '급등' : '급락';
  return `- [${type}] ${a.displayName}: ${a.date} - ${(a.changePercent * 100).toFixed(1)}% 변화 (${a.previousValue} → ${a.value})`;
}

function formatTrendLine(t: TrendAlert): string {
  return `- [연속 하락] ${t.displayName}: ${t.days}일 연속 하락 (${t.startDate}~${t.endDate}, 총 ${t.totalDecline.toFixed(1)}% 감소)`;
}

function formatFunnelContext(analysis: ServiceAnalysis): string {
  if (!analysis.dailyData) return '데이터 없음';

  const lines: string[] = [];
  const funnelKeys = [
    'Install_User_New', 'Sign_Up_User_New', 'Main_View_User_New',
    'Product_View_User_New', 'Gen_Done_User_New', 'Paywall_View_User_New',
    'Purchase_Done_User_New', 'Main_View_User_Normal', 'Gen_Done_User_Normal',
    'Purchase_Done_User_Normal',
  ];

  for (const metric of analysis.dailyData.metrics) {
    if (funnelKeys.includes(metric.metricKey)) {
      const lastValues = metric.values
        .filter((v): v is number => v !== null)
        .slice(-3);
      if (lastValues.length > 0) {
        lines.push(`- ${metric.displayName} (${metric.metricKey}): 최근값 ${lastValues.join(', ')}`);
      }
    }
  }

  return lines.length > 0 ? lines.join('\n') : '퍼널 데이터 없음';
}
