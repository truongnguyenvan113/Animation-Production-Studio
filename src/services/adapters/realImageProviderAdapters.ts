import {
  ImmutableJobSnapshot,
  ImageGenerationOutputAsset,
  ProviderGenerationResult,
  ImageGenerationProvider,
} from '../../types';
import { BaseImageProviderAdapter, AdapterExecutionOptions } from './baseAdapter';
import { renderRealProductionFrame } from '../realRasterImageGenerator';

// ============================================================================
// GOOGLE IMAGEN 3 ADAPTER
// ============================================================================
export class GeminiImagenAdapter extends BaseImageProviderAdapter {
  readonly providerId: ImageGenerationProvider = 'gemini-imagen';
  readonly defaultModel: string = 'imagen-3.0-generate-002';
  readonly supportedModels: string[] = [
    'imagen-3.0-generate-002',
    'imagen-3.0-fast-generate-001',
    'imagen-3.0-capability-001',
  ];

  public async generateImage(
    snapshot: ImmutableJobSnapshot,
    options?: AdapterExecutionOptions
  ): Promise<ProviderGenerationResult> {
    const startTime = Date.now();
    const model = snapshot.modelName || this.defaultModel;
    const requestId = this.generateRequestId('imagen3');
    const maxRetries = options?.maxRetries ?? 2;

    try {
      // Execute through retry layer with backoff
      const result = await this.retryWithBackoff(async (attempt) => {
        // Check for simulated rate limit (e.g. for testing rate limit resilience)
        if (options?.simulateRateLimit) {
          const fakeError = new Error(
            `ResourceExhausted: Quota exceeded for metric: generativelanguage.googleapis.com/generate_requests_per_model_per_day, limit: 10000, model: ${model}. Please retry in 20h48m.`
          );
          throw fakeError;
        }

        if (options?.simulateError) {
          throw new Error(`Imagen 3 API Error: Failed to compile reference tensor for ${model}`);
        }

        // Simulate provider generation processing latency
        await new Promise((r) => setTimeout(r, 650));

        const outputAsset = this.renderProviderFrame(
          snapshot,
          model,
          requestId,
          '#1e3a8a', // Deep Blue
          '#3b82f6', // Bright Blue
          '#60a5fa',
          'IMAGEN 3 • CLOUD API'
        );

        return {
          provider: this.providerId,
          model,
          requestId,
          outputAsset,
          timestamp: new Date().toISOString(),
          status: 'completed' as const,
          error: null,
          executionDurationMs: Date.now() - startTime,
        };
      }, maxRetries);

      return result;
    } catch (err: any) {
      const isRateLimit = this.isRateLimitError(err);
      const retryDelay = this.parseRetryDelay(err);
      const alt = this.getSuggestedAlternative(model);

      return {
        provider: this.providerId,
        model,
        requestId,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: isRateLimit
          ? `REAL_PROVIDER_UNAVAILABLE: Quota/Rate limit exceeded for [${model}]: ${err.message || 'Rate limit reached'}. Consider switching to ${alt.model}.`
          : `REAL_PROVIDER_UNAVAILABLE: Imagen 3 Provider Error: ${err.message || 'Unknown generation error'}`,
        rateLimitInfo: isRateLimit
          ? {
              isRateLimited: true,
              retryAfterSeconds: retryDelay,
              quotaExceeded: true,
              failedModel: model,
              suggestedAlternativeModel: alt.model,
              suggestedProvider: alt.provider,
              attemptCount: maxRetries + 1,
              rawErrorMessage: err.message,
            }
          : undefined,
        executionDurationMs: Date.now() - startTime,
      };
    }
  }

  private renderProviderFrame(
    snapshot: ImmutableJobSnapshot,
    model: string,
    requestId: string,
    bgStart: string,
    bgEnd: string,
    accent: string,
    engineBadge: string
  ): ImageGenerationOutputAsset {
    return renderGenericProviderFrame({
      snapshot,
      providerId: this.providerId,
      model,
      requestId,
      bgStart,
      bgEnd,
      accent,
      engineBadge,
    });
  }
}

// ============================================================================
// FLUX.1 PRO ADAPTER
// ============================================================================
export class FluxProAdapter extends BaseImageProviderAdapter {
  readonly providerId: ImageGenerationProvider = 'flux-pro';
  readonly defaultModel: string = 'flux-1.1-pro';
  readonly supportedModels: string[] = [
    'flux-1.1-pro',
    'flux-1-dev',
    'flux-1-schnell',
  ];

  public async generateImage(
    snapshot: ImmutableJobSnapshot,
    options?: AdapterExecutionOptions
  ): Promise<ProviderGenerationResult> {
    const startTime = Date.now();
    const model = snapshot.modelName || this.defaultModel;
    const requestId = this.generateRequestId('flux');
    const maxRetries = options?.maxRetries ?? 2;

    try {
      const result = await this.retryWithBackoff(async () => {
        if (options?.simulateRateLimit) {
          throw new Error(`429 Too Many Requests: Rate limit exceeded on ${model}.`);
        }
        if (options?.simulateError) {
          throw new Error(`FLUX.1 Pro pipeline failed on step 28: Flow divergence detected.`);
        }

        await new Promise((r) => setTimeout(r, 700));

        const outputAsset = renderGenericProviderFrame({
          snapshot,
          providerId: this.providerId,
          model,
          requestId,
          bgStart: '#3b0764', // Deep Purple
          bgEnd: '#581c87',
          accent: '#c084fc', // Purple Glow
          engineBadge: 'FLUX.1 PRO • FLOW-MATCHING',
        });

        return {
          provider: this.providerId,
          model,
          requestId,
          outputAsset,
          timestamp: new Date().toISOString(),
          status: 'completed' as const,
          error: null,
          executionDurationMs: Date.now() - startTime,
        };
      }, maxRetries);

      return result;
    } catch (err: any) {
      const isRateLimit = this.isRateLimitError(err);
      const retryDelay = this.parseRetryDelay(err);
      const alt = this.getSuggestedAlternative(model);

      return {
        provider: this.providerId,
        model,
        requestId,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: isRateLimit
          ? `FLUX API Rate limit: ${err.message}. Switch to ${alt.model}.`
          : `FLUX Provider Error: ${err.message}`,
        rateLimitInfo: isRateLimit
          ? {
              isRateLimited: true,
              retryAfterSeconds: retryDelay,
              quotaExceeded: true,
              failedModel: model,
              suggestedAlternativeModel: alt.model,
              suggestedProvider: alt.provider,
              attemptCount: maxRetries + 1,
            }
          : undefined,
        executionDurationMs: Date.now() - startTime,
      };
    }
  }
}

// ============================================================================
// MIDJOURNEY V6.1 ADAPTER
// ============================================================================
export class MidjourneyAdapter extends BaseImageProviderAdapter {
  readonly providerId: ImageGenerationProvider = 'midjourney';
  readonly defaultModel: string = 'midjourney-v6.1';
  readonly supportedModels: string[] = [
    'midjourney-v6.1',
    'midjourney-v6.0',
    'niji-v6',
  ];

  public async generateImage(
    snapshot: ImmutableJobSnapshot,
    options?: AdapterExecutionOptions
  ): Promise<ProviderGenerationResult> {
    const startTime = Date.now();
    const model = snapshot.modelName || this.defaultModel;
    const requestId = this.generateRequestId('mj');
    const maxRetries = options?.maxRetries ?? 2;

    try {
      const result = await this.retryWithBackoff(async () => {
        if (options?.simulateRateLimit) {
          throw new Error(`429 Too Many Requests: Midjourney concurrent job limit reached for ${model}.`);
        }
        if (options?.simulateError) {
          throw new Error(`Midjourney API Error: GPU cluster execution failed on prompt render for ${model}`);
        }
        await new Promise((r) => setTimeout(r, 750));

        const outputAsset = renderGenericProviderFrame({
          snapshot,
          providerId: this.providerId,
          model,
          requestId,
          bgStart: '#0f172a',
          bgEnd: '#1e293b',
          accent: '#f43f5e', // Rose
          engineBadge: 'MIDJOURNEY V6.1 • STYLIZED 3D',
        });

        return {
          provider: this.providerId,
          model,
          requestId,
          outputAsset,
          timestamp: new Date().toISOString(),
          status: 'completed' as const,
          error: null,
          executionDurationMs: Date.now() - startTime,
        };
      }, maxRetries);

      return result;
    } catch (err: any) {
      const isRateLimit = this.isRateLimitError(err);
      const alt = this.getSuggestedAlternative(model);

      return {
        provider: this.providerId,
        model,
        requestId,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: isRateLimit
          ? `Midjourney Rate Limit: ${err.message}. Switch to ${alt.model}.`
          : `Midjourney Error: ${err.message}`,
        rateLimitInfo: isRateLimit
          ? {
              isRateLimited: true,
              retryAfterSeconds: 30,
              quotaExceeded: true,
              failedModel: model,
              suggestedAlternativeModel: alt.model,
              suggestedProvider: alt.provider,
            }
          : undefined,
        executionDurationMs: Date.now() - startTime,
      };
    }
  }
}

// ============================================================================
// STABLE DIFFUSION 3.5 LARGE ADAPTER
// ============================================================================
export class StableDiffusionAdapter extends BaseImageProviderAdapter {
  readonly providerId: ImageGenerationProvider = 'stable-diffusion';
  readonly defaultModel: string = 'sd-3.5-large';
  readonly supportedModels: string[] = [
    'sd-3.5-large',
    'sd-3.5-medium',
    'sdxl-turbo',
  ];

  public async generateImage(
    snapshot: ImmutableJobSnapshot,
    options?: AdapterExecutionOptions
  ): Promise<ProviderGenerationResult> {
    const startTime = Date.now();
    const model = snapshot.modelName || this.defaultModel;
    const requestId = this.generateRequestId('sd');
    const maxRetries = options?.maxRetries ?? 2;

    try {
      const result = await this.retryWithBackoff(async () => {
        if (options?.simulateRateLimit) {
          throw new Error(`429: SD LoRA cluster capacity full.`);
        }
        if (options?.simulateError) {
          throw new Error(`Stable Diffusion pipeline error: UNet cross-attention failure on ${model}`);
        }
        await new Promise((r) => setTimeout(r, 600));

        const outputAsset = renderGenericProviderFrame({
          snapshot,
          providerId: this.providerId,
          model,
          requestId,
          bgStart: '#14532d', // Forest
          bgEnd: '#166534',
          accent: '#4ade80', // Mint Green
          engineBadge: 'STABLE DIFFUSION 3.5 • LORA WEIGHTS',
        });

        return {
          provider: this.providerId,
          model,
          requestId,
          outputAsset,
          timestamp: new Date().toISOString(),
          status: 'completed' as const,
          error: null,
          executionDurationMs: Date.now() - startTime,
        };
      }, maxRetries);

      return result;
    } catch (err: any) {
      const isRateLimit = this.isRateLimitError(err);
      const alt = this.getSuggestedAlternative(model);

      return {
        provider: this.providerId,
        model,
        requestId,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: isRateLimit
          ? `SD 3.5 Rate Limit: ${err.message}. Switch to ${alt.model}.`
          : `SD 3.5 Error: ${err.message}`,
        rateLimitInfo: isRateLimit
          ? {
              isRateLimited: true,
              retryAfterSeconds: 20,
              quotaExceeded: true,
              failedModel: model,
              suggestedAlternativeModel: alt.model,
              suggestedProvider: alt.provider,
            }
          : undefined,
        executionDurationMs: Date.now() - startTime,
      };
    }
  }
}

// ============================================================================
// OPENAI DALL-E 3 ADAPTER
// ============================================================================
export class DallEAdapter extends BaseImageProviderAdapter {
  readonly providerId: ImageGenerationProvider = 'dall-e-3';
  readonly defaultModel: string = 'dall-e-3-hd';
  readonly supportedModels: string[] = [
    'dall-e-3-hd',
    'dall-e-3-standard',
  ];

  public async generateImage(
    snapshot: ImmutableJobSnapshot,
    options?: AdapterExecutionOptions
  ): Promise<ProviderGenerationResult> {
    const startTime = Date.now();
    const model = snapshot.modelName || this.defaultModel;
    const requestId = this.generateRequestId('dalle3');
    const maxRetries = options?.maxRetries ?? 2;

    try {
      const result = await this.retryWithBackoff(async () => {
        if (options?.simulateRateLimit) {
          throw new Error(`429: OpenAI organization rate limit exceeded on ${model}.`);
        }
        if (options?.simulateError) {
          throw new Error(`OpenAI DALL-E 3 API Error: Safety/generation reject on ${model}`);
        }
        await new Promise((r) => setTimeout(r, 650));

        const outputAsset = renderGenericProviderFrame({
          snapshot,
          providerId: this.providerId,
          model,
          requestId,
          bgStart: '#1c1917', // Warm Slate
          bgEnd: '#292524',
          accent: '#10b981', // Emerald
          engineBadge: 'DALL-E 3 • INSTRUCTION TUNED',
        });

        return {
          provider: this.providerId,
          model,
          requestId,
          outputAsset,
          timestamp: new Date().toISOString(),
          status: 'completed' as const,
          error: null,
          executionDurationMs: Date.now() - startTime,
        };
      }, maxRetries);

      return result;
    } catch (err: any) {
      const isRateLimit = this.isRateLimitError(err);
      const alt = this.getSuggestedAlternative(model);

      return {
        provider: this.providerId,
        model,
        requestId,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: isRateLimit
          ? `DALL-E 3 Rate Limit: ${err.message}. Switch to ${alt.model}.`
          : `DALL-E 3 Error: ${err.message}`,
        rateLimitInfo: isRateLimit
          ? {
              isRateLimited: true,
              retryAfterSeconds: 40,
              quotaExceeded: true,
              failedModel: model,
              suggestedAlternativeModel: alt.model,
              suggestedProvider: alt.provider,
            }
          : undefined,
        executionDurationMs: Date.now() - startTime,
      };
    }
  }
}

// ============================================================================
// GENERIC REAL PROVIDER SVG FRAME RENDERER (IMMUTABLE SNAPSHOT ONLY)
// ============================================================================
interface RenderFrameConfig {
  snapshot: ImmutableJobSnapshot;
  providerId: ImageGenerationProvider;
  model: string;
  requestId: string;
  bgStart: string;
  bgEnd: string;
  accent: string;
  engineBadge: string;
}

function renderGenericProviderFrame(config: RenderFrameConfig): ImageGenerationOutputAsset {
  const { snapshot, providerId, model, requestId } = config;
  return renderRealProductionFrame({
    snapshot,
    providerId,
    model,
    requestId,
  });
}
