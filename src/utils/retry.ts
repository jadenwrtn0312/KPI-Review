export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  multiplier: number;
  label?: string;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  multiplier: 3,
  label: 'operation',
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < opts.maxRetries) {
        const delay = opts.baseDelayMs * Math.pow(opts.multiplier, attempt);
        console.warn(
          `[Retry] ${opts.label} failed (attempt ${attempt + 1}/${opts.maxRetries + 1}), retrying in ${delay}ms: ${lastError.message}`,
        );
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
