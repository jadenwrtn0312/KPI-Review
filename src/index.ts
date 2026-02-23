import { format, isWeekend } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { loadEnv } from './config/env';
import { TAB_CONFIGS } from './config/sheets';
import { fetchAllSheetData } from './fetcher/sheets';
import { parseKpiReview } from './parser/kpiReview';
import { parseDailyWeekly } from './parser/dailyWeekly';
import { parseMonthly } from './parser/monthly';
import { calculateTargetComparisons } from './processor/calculator';
import { getMomComparisons, getWowComparisons, getDodComparisons } from './processor/comparator';
import { detectAnomalies, detectTrends } from './processor/anomaly';
import { generateInsight } from './analyzer/claude';
import { buildFullMessage } from './notifier/blocks';
import { sendSlackMessage, sendErrorMessage } from './notifier/slack';
import {
  ServiceName,
  ServiceAnalysis,
  AllRawData,
  TimeSeriesTabData,
  MonthlyTabData,
  KpiReviewData,
  CoreKpiKey,
} from './types';

const SERVICES: ServiceName[] = ['ZZEM', '사주'];
const CORE_KPI_KEYS: CoreKpiKey[] = ['Paid_Cohort_Retention', 'CVR', 'ARPPU', 'Margin_Rate'];
const KST = 'Asia/Seoul';

async function main() {
  console.log('[KPI Bot] Starting...');
  const env = loadEnv();

  const now = toZonedTime(new Date(), KST);
  const dateStr = format(now, 'yyyy-MM-dd');
  const weekend = isWeekend(now);

  console.log(`[KPI Bot] Date: ${dateStr}, Weekend: ${weekend}, DryRun: ${env.dryRun}`);

  // Step 1: Fetch all sheet data
  let rawData: AllRawData;
  try {
    rawData = await fetchAllSheetData(env);
    console.log('[KPI Bot] Sheet data fetched successfully');
  } catch (error) {
    const msg = `Google Sheets 데이터 조회 실패: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[KPI Bot] ${msg}`);
    if (!env.dryRun) {
      await sendErrorMessage(env.slackBotToken, env.slackChannelId, msg);
    }
    process.exit(1);
  }

  // Step 2: Process each service independently
  const analyses: ServiceAnalysis[] = [];

  for (const service of SERVICES) {
    try {
      console.log(`[KPI Bot] Processing ${service}...`);
      const analysis = await processService(service, rawData, dateStr, env.anthropicApiKey);
      analyses.push(analysis);
      console.log(`[KPI Bot] ${service} processed successfully`);
    } catch (error) {
      console.error(`[KPI Bot] ${service} processing failed:`, error);
      // Continue with other services
    }
  }

  if (analyses.length === 0) {
    const msg = '모든 서비스 분석 실패';
    console.error(`[KPI Bot] ${msg}`);
    if (!env.dryRun) {
      await sendErrorMessage(env.slackBotToken, env.slackChannelId, msg);
    }
    process.exit(1);
  }

  // Step 3: Build and send Slack message
  const message = buildFullMessage(analyses, weekend);

  if (env.dryRun) {
    console.log('\n[DRY RUN] Slack message payload:');
    console.log(JSON.stringify(message, null, 2));
  } else {
    try {
      await sendSlackMessage(
        env.slackBotToken,
        env.slackChannelId,
        message.text,
        message.blocks,
      );
      console.log('[KPI Bot] Slack message sent successfully');
    } catch (error) {
      console.error('[KPI Bot] Failed to send Slack message:', error);
      process.exit(1);
    }
  }

  console.log('[KPI Bot] Done!');
}

async function processService(
  service: ServiceName,
  rawData: AllRawData,
  dateStr: string,
  anthropicApiKey: string,
): Promise<ServiceAnalysis> {
  // Get raw data for this service
  const dailyRaw = service === 'ZZEM' ? rawData.dailyZzem : rawData.dailySaju;
  const weeklyRaw = service === 'ZZEM' ? rawData.weeklyZzem : rawData.weeklySaju;
  const monthlyRaw = service === 'ZZEM' ? rawData.monthlyZzem : rawData.monthlySaju;

  // Get tab configs for this service
  const dailyConfig = TAB_CONFIGS.find((c) => c.service === service && c.granularity === 'daily');
  const weeklyConfig = TAB_CONFIGS.find((c) => c.service === service && c.granularity === 'weekly');
  const monthlyConfig = TAB_CONFIGS.find((c) => c.service === service && c.granularity === 'monthly');

  // Parse data
  let dailyData: TimeSeriesTabData | null = null;
  let weeklyData: TimeSeriesTabData | null = null;
  let monthlyData: MonthlyTabData | null = null;
  let kpiReviewData: KpiReviewData | null = null;

  if (dailyConfig && dailyRaw.length > 0) {
    dailyData = parseDailyWeekly(dailyRaw, dailyConfig);
  }
  if (weeklyConfig && weeklyRaw.length > 0) {
    weeklyData = parseDailyWeekly(weeklyRaw, weeklyConfig);
  }
  if (monthlyConfig && monthlyRaw.length > 0) {
    monthlyData = parseMonthly(monthlyRaw, monthlyConfig);
  }
  if (rawData.kpiReview.length > 0) {
    kpiReviewData = parseKpiReview(rawData.kpiReview, service);
  }

  // Process
  const targetComparisons = calculateTargetComparisons(monthlyData);
  const momComparisons = getMomComparisons(kpiReviewData);
  const wowComparisons = getWowComparisons(kpiReviewData);
  const dodComparisons = getDodComparisons(dailyData);
  const anomalies = detectAnomalies(dailyData);
  const trends = detectTrends(dailyData, CORE_KPI_KEYS);

  // Build analysis object (before AI)
  const analysis: ServiceAnalysis = {
    service,
    date: dateStr,
    targetComparisons,
    momComparisons,
    wowComparisons,
    dodComparisons,
    anomalies,
    trends,
    aiInsight: null,
    dailyData,
    weeklyData,
    monthlyData,
    kpiReviewData,
  };

  // Generate AI insight
  analysis.aiInsight = await generateInsight(analysis, anthropicApiKey);

  return analysis;
}

main().catch((error) => {
  console.error('[KPI Bot] Unhandled error:', error);
  process.exit(1);
});
