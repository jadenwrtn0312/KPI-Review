import Anthropic from '@anthropic-ai/sdk';
import { ServiceAnalysis } from '../types';
import { buildAnalysisPrompt } from './prompt';
import { withRetry } from '../utils/retry';

const FALLBACK_MESSAGE = '[AI 분석 일시 불가 - 데이터만 표시합니다]';

/**
 * Call Claude API to generate KPI insights.
 * Falls back to a placeholder message on failure.
 */
export async function generateInsight(
  analysis: ServiceAnalysis,
  apiKey: string,
): Promise<string> {
  const prompt = buildAnalysisPrompt(analysis);

  try {
    const insight = await withRetry(
      async () => {
        const client = new Anthropic({ apiKey });
        const message = await client.messages.create({
          model: 'claude-opus-4-6',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          system: `당신은 뤼튼 X본부 서바이벌 프로젝트의 KPI 분석 전문가입니다.
주어진 데이터를 바탕으로 간결하고 실행 가능한 인사이트를 한국어로 제공합니다.
숫자와 트렌드를 정확히 인용하며, 추측보다는 데이터 기반 분석을 합니다.`,
        });

        const textBlock = message.content.find((b) => b.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
          throw new Error('No text response from Claude');
        }
        return textBlock.text;
      },
      { maxRetries: 2, baseDelayMs: 1000, multiplier: 3, label: 'Claude API' },
    );

    return insight;
  } catch (error) {
    console.error('[Claude] Failed to generate insight:', error);
    return FALLBACK_MESSAGE;
  }
}
