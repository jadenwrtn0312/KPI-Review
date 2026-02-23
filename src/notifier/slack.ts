import { WebClient } from '@slack/web-api';
import { withRetry } from '../utils/retry';

type Block = Record<string, unknown>;

/**
 * Send a Block Kit message to Slack.
 */
export async function sendSlackMessage(
  token: string,
  channelId: string,
  text: string,
  blocks: Block[],
): Promise<void> {
  const client = new WebClient(token);

  await withRetry(
    async () => {
      const result = await client.chat.postMessage({
        channel: channelId,
        text,
        blocks: blocks as any,
      });
      if (!result.ok) {
        throw new Error(`Slack API error: ${result.error}`);
      }
      console.log(`[Slack] Message sent to ${channelId}, ts: ${result.ts}`);
    },
    { maxRetries: 3, baseDelayMs: 1000, multiplier: 3, label: 'Slack API' },
  );
}

/**
 * Send an error notification to Slack.
 */
export async function sendErrorMessage(
  token: string,
  channelId: string,
  errorMessage: string,
): Promise<void> {
  const client = new WebClient(token);

  try {
    await withRetry(
      async () => {
        await client.chat.postMessage({
          channel: channelId,
          text: `⚠️ KPI Review Bot Error: ${errorMessage}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*⚠️ KPI Review Bot Error*\n${errorMessage}`,
              },
            },
          ],
        });
      },
      { maxRetries: 3, baseDelayMs: 1000, multiplier: 3, label: 'Slack Error Notification' },
    );
  } catch (error) {
    console.error('[Slack] Failed to send error notification:', error);
  }
}
