import { google } from 'googleapis';
import { EnvConfig } from '../config/env';
import { ALL_TAB_NAMES } from '../config/sheets';
import { AllRawData } from '../types';
import { withRetry } from '../utils/retry';

const FETCH_DELAY_MS = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchAllSheetData(config: EnvConfig): Promise<AllRawData> {
  const auth = new google.auth.JWT({
    email: config.googleServiceAccountEmail,
    key: config.googlePrivateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const results: Record<string, string[][]> = {};

  for (const tabName of ALL_TAB_NAMES) {
    const data = await withRetry(
      async () => {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: config.spreadsheetId,
          range: `'${tabName}'`,
          valueRenderOption: 'UNFORMATTED_VALUE',
          dateTimeRenderOption: 'FORMATTED_STRING',
        });
        return (response.data.values ?? []) as string[][];
      },
      { maxRetries: 3, baseDelayMs: 1000, multiplier: 3, label: `Fetch ${tabName}` },
    );

    results[tabName] = data;
    console.log(`[Sheets] Fetched "${tabName}": ${data.length} rows`);

    await sleep(FETCH_DELAY_MS);
  }

  return {
    kpiReview: results['KPI Review'] ?? [],
    dailyZzem: results['[Daily] ZZEM'] ?? [],
    weeklyZzem: results['[Weekly] ZZEM'] ?? [],
    monthlyZzem: results['[Monthly] ZZEM'] ?? [],
    dailySaju: results['[Daily] 사주'] ?? [],
    weeklySaju: results['[Weekly] 사주'] ?? [],
    monthlySaju: results['[Monthly] 사주'] ?? [],
  };
}
