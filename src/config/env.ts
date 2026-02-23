import dotenv from 'dotenv';

dotenv.config();

export interface EnvConfig {
  googleServiceAccountEmail: string;
  googlePrivateKey: string;
  spreadsheetId: string;
  anthropicApiKey: string;
  slackBotToken: string;
  slackChannelId: string;
  dryRun: boolean;
}

export function loadEnv(): EnvConfig {
  const required = [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'SPREADSHEET_ID',
    'ANTHROPIC_API_KEY',
    'SLACK_BOT_TOKEN',
    'SLACK_CHANNEL_ID',
  ] as const;

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    googleServiceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    spreadsheetId: process.env.SPREADSHEET_ID!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    slackBotToken: process.env.SLACK_BOT_TOKEN!,
    slackChannelId: process.env.SLACK_CHANNEL_ID!,
    dryRun: process.env.DRY_RUN === 'true',
  };
}
