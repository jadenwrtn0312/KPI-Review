import { ServiceAnalysis, TargetComparison, PeriodComparison, AnomalyAlert, TrendAlert } from '../types';
import { getStatusEmoji, formatKpiValue, formatKpiDelta, formatChangeWithArrow } from '../utils/format';
import { getTarget } from '../config/targets';

type Block = Record<string, unknown>;

/**
 * Build Slack Block Kit message for a service's KPI report.
 */
export function buildServiceBlocks(analysis: ServiceAnalysis, isWeekend: boolean): Block[] {
  const blocks: Block[] = [];
  const weekendTag = isWeekend ? ' [Weekend]' : '';

  // Header
  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: `📊 [${analysis.date}] X본부 서바이벌 KPI Daily Report${weekendTag}`,
      emoji: true,
    },
  });

  // Service divider
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*🔷 ${analysis.service}*`,
    },
  });

  // Target Achievement Dashboard
  blocks.push(buildTargetDashboard(analysis.targetComparisons));

  blocks.push({ type: 'divider' });

  // MoM Comparison
  if (analysis.momComparisons.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: buildComparisonSection('📅 MoM (전월 대비)', analysis.momComparisons),
      },
    });
  }

  // WoW Comparison
  if (analysis.wowComparisons.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: buildComparisonSection('📆 WoW (전주 대비)', analysis.wowComparisons),
      },
    });
  }

  // DoD Comparison
  if (analysis.dodComparisons.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: buildComparisonSection('📈 DoD (전일 대비)', analysis.dodComparisons),
      },
    });
  }

  // Anomaly Alerts
  if (analysis.anomalies.length > 0) {
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: buildAnomalySection(analysis.anomalies),
      },
    });
  }

  // Trend Alerts
  if (analysis.trends.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: buildTrendSection(analysis.trends),
      },
    });
  }

  // AI Insight
  if (analysis.aiInsight) {
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🤖 AI 인사이트*\n${truncateText(analysis.aiInsight, 2800)}`,
      },
    });
  }

  return blocks;
}

function buildTargetDashboard(comparisons: TargetComparison[]): Block {
  const lines = comparisons.map((tc) => {
    const target = getTarget(tc.metricKey);
    const unit = target?.unit ?? 'number';
    const emoji = getStatusEmoji(tc.status);
    const current = formatKpiValue(tc.currentValue, unit);
    const targetLabel = target?.formatLabel ?? String(tc.targetValue);
    const delta = formatKpiDelta(tc.delta, unit);

    const warningIcon = tc.status === 'critical' ? ' ⚠️' : '';
    return `${emoji} *${tc.displayName}*: ${current} (목표 ${targetLabel}) ${delta}${warningIcon}`;
  });

  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: lines.join('\n'),
    },
  };
}

function buildComparisonSection(
  title: string,
  comparisons: PeriodComparison[],
): string {
  const lines = [`*${title}*`];

  for (const pc of comparisons) {
    const change = formatChangeWithArrow(pc.percentChange);
    lines.push(`  • ${pc.displayName}: ${change}`);
  }

  return lines.join('\n');
}

function buildAnomalySection(anomalies: AnomalyAlert[]): string {
  const lines = ['*⚠️ 이상치 감지*'];

  for (const a of anomalies) {
    const icon = a.type === 'spike' ? '📈' : '📉';
    const pct = (a.changePercent * 100).toFixed(1);
    lines.push(`  ${icon} ${a.displayName}: ${a.date} ${pct}% 변화`);
  }

  return lines.join('\n');
}

function buildTrendSection(trends: TrendAlert[]): string {
  const lines = ['*📉 트렌드 경고*'];

  for (const t of trends) {
    lines.push(`  🔻 ${t.displayName}: ${t.days}일 연속 하락 (총 ${t.totalDecline.toFixed(1)}% 감소)`);
  }

  return lines.join('\n');
}

/**
 * Build the complete message payload for all services.
 */
export function buildFullMessage(
  analyses: ServiceAnalysis[],
  isWeekend: boolean,
): { text: string; blocks: Block[] } {
  const allBlocks: Block[] = [];

  for (let i = 0; i < analyses.length; i++) {
    if (i > 0) {
      allBlocks.push({ type: 'divider' });
      allBlocks.push({ type: 'divider' });
    }
    allBlocks.push(...buildServiceBlocks(analyses[i], isWeekend));
  }

  // Trim to 50 blocks max (Slack limit)
  const trimmedBlocks = allBlocks.slice(0, 50);

  return {
    text: `📊 X본부 서바이벌 KPI Daily Report - ${analyses.map((a) => a.service).join(', ')}`,
    blocks: trimmedBlocks,
  };
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}
