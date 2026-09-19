import {
  ImageGenerationProvider,
  ImageGenerationOutputAsset,
  ImmutableJobSnapshot,
  ProviderGenerationResult,
  ProviderRateLimitInfo,
  ImageProviderAdapter,
} from '../../types';

export interface AdapterExecutionOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  simulateRateLimit?: boolean;
  simulateError?: boolean;
}

/**
 * Base abstract class for all Image Generation Provider Adapters.
 * 
 * STRICT IMMUTABILITY MANDATE:
 * Provider adapters receive ONLY the immutable Job Snapshot.
 * Provider adapters are FORBIDDEN from importing or accessing active Character/Style state repositories.
 */
export abstract class BaseImageProviderAdapter implements ImageProviderAdapter {
  abstract readonly providerId: ImageGenerationProvider;
  abstract readonly defaultModel: string;
  abstract readonly supportedModels: string[];

  /**
   * Generates an image using ONLY the immutable job snapshot.
   */
  abstract generateImage(
    jobSnapshot: ImmutableJobSnapshot,
    options?: AdapterExecutionOptions
  ): Promise<ProviderGenerationResult>;

  /**
   * Detects whether an error is a Rate Limit / Quota Exhaustion error.
   */
  public isRateLimitError(error: any): boolean {
    if (!error) return false;
    const msg = typeof error === 'string' ? error : error.message || JSON.stringify(error);
    const lower = msg.toLowerCase();
    return (
      lower.includes('resource_exhausted') ||
      lower.includes('quota') ||
      lower.includes('rate limit') ||
      lower.includes('rate-limit') ||
      lower.includes('too many requests') ||
      lower.includes('429') ||
      lower.includes('generate_requests_per_model_per_day') ||
      lower.includes('tokens_per_model_per_user')
    );
  }

  /**
   * Parses recommended retry-after delay in seconds from error details.
   */
  public parseRetryDelay(error: any): number {
    if (!error) return 30;
    const msg = typeof error === 'string' ? error : error.message || '';
    
    // Pattern: retry in 20h48m or retry after 30s
    const secMatch = msg.match(/retry (?:in|after) (\d+)\s*s/i);
    if (secMatch) return parseInt(secMatch[1], 10);

    const minMatch = msg.match(/retry in (\d+)m/i);
    if (minMatch) return parseInt(minMatch[1], 10) * 60;

    const hourMatch = msg.match(/retry in (\d+)h(?:(\d+)m)?/i);
    if (hourMatch) {
      const h = parseInt(hourMatch[1], 10);
      const m = hourMatch[2] ? parseInt(hourMatch[2], 10) : 0;
      return h * 3600 + m * 60;
    }

    return 45; // Default fallback delay
  }

  /**
   * Exponential backoff retry handler for transient API calls.
   */
  protected async retryWithBackoff<T>(
    operation: (attempt: number) => Promise<T>,
    maxRetries: number = 2,
    baseDelayMs: number = 500
  ): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await operation(attempt);
      } catch (err: any) {
        lastError = err;
        if (attempt > maxRetries || !this.isTransientError(err)) {
          throw err;
        }
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 150;
        await new Promise((res) => setTimeout(res, delay));
      }
    }
    throw lastError;
  }

  /**
   * Checks if an error is transient (temporary network/timeout vs hard permanent fail)
   */
  protected isTransientError(error: any): boolean {
    if (!error) return false;
    const msg = (error.message || '').toLowerCase();
    return (
      msg.includes('network') ||
      msg.includes('timeout') ||
      msg.includes('econnreset') ||
      msg.includes('503') ||
      msg.includes('502') ||
      msg.includes('504')
    );
  }

  /**
   * Builds suggested alternative model when rate limited
   */
  public getSuggestedAlternative(currentModel: string): {
    provider: ImageGenerationProvider;
    model: string;
  } {
    const nextModel = this.supportedModels.find((m) => m !== currentModel);
    if (nextModel) {
      return { provider: this.providerId, model: nextModel };
    }
    // Fallback to local QA engine if provider exhausted
    return { provider: 'mock-studio', model: 'mock-engine-v2' };
  }

  /**
   * Generates a unique provider request ID
   */
  protected generateRequestId(prefix: string): string {
    const rand = Math.random().toString(36).substring(2, 10);
    return `req_${prefix}_${Date.now()}_${rand}`;
  }

  /**
   * Encapsulates safe XML escaping for SVG generation
   */
  protected escapeXml(unsafe: string): string {
    return (unsafe || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
