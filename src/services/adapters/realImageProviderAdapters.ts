import {
  ImmutableJobSnapshot,
  ImageGenerationOutputAsset,
  ProviderGenerationResult,
  ImageGenerationProvider,
} from '../../types';
import { BaseImageProviderAdapter, AdapterExecutionOptions } from './baseAdapter';

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
          'IMAGEN 3 &bull; CLOUD API'
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
          ? `Quota/Rate limit exceeded for [${model}]: ${err.message || 'Rate limit reached'}. Consider switching to ${alt.model} or Mock Studio.`
          : `Imagen 3 Provider Error: ${err.message || 'Unknown generation error'}`,
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
          engineBadge: 'FLUX.1 PRO &bull; FLOW-MATCHING',
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
          engineBadge: 'MIDJOURNEY V6.1 &bull; STYLIZED 3D',
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
          engineBadge: 'STABLE DIFFUSION 3.5 &bull; LORA WEIGHTS',
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
          engineBadge: 'DALL-E 3 &bull; INSTRUCTION TUNED',
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
  const { snapshot, providerId, model, requestId, bgStart, bgEnd, accent, engineBadge } = config;
  const location = snapshot.composition.location || 'Studio Environment';
  const action = snapshot.composition.action || 'Shot Action Frame';
  const lighting = snapshot.lighting || 'Cinematic 3D Lighting';
  const cameraAngle = snapshot.camera.cameraAngle || snapshot.camera.shotType || 'Cinematic 16:9';
  const dialogue = snapshot.composition.dialogue ? `"${snapshot.composition.dialogue}"` : '';
  const speaker = snapshot.composition.speakerCharacterName || '';

  const lockedDnaPills = Object.entries(snapshot.characterVersionIds)
    .map(([charId, verId]) => {
      const charName =
        charId === 'char_pi'
          ? 'Pi'
          : charId === 'char_kem'
          ? 'Kem'
          : charId === 'char_ethan'
          ? 'Ba Trường'
          : charId === 'char_emma'
          ? 'Mẹ Vân'
          : charId;
      return `${charName}:${verId}`;
    })
    .join(' • ');

  const refCount = snapshot.referenceAssetIds.length;
  const seed = snapshot.params.seed || 49281;
  const iterationNumber = snapshot.iterationNumber || 1;
  const hash = snapshot.deterministicPayloadHash;

  const escapeXml = (str: string) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad_${requestId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgStart}" />
      <stop offset="60%" stop-color="${bgEnd}" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="glowGrad_${requestId}" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.0" />
    </linearGradient>
    <pattern id="grid_${requestId}" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background Environment -->
  <rect width="1280" height="720" fill="url(#bgGrad_${requestId})" />
  <rect width="1280" height="720" fill="url(#grid_${requestId})" />
  <ellipse cx="640" cy="310" rx="580" ry="280" fill="url(#glowGrad_${requestId})" />

  <!-- Rule of Thirds Guides -->
  <line x1="426" y1="0" x2="426" y2="720" stroke="rgba(255,255,255,0.07)" stroke-dasharray="6,6" />
  <line x1="854" y1="0" x2="854" y2="720" stroke="rgba(255,255,255,0.07)" stroke-dasharray="6,6" />
  <line x1="0" y1="240" x2="1280" y2="240" stroke="rgba(255,255,255,0.07)" stroke-dasharray="6,6" />
  <line x1="0" y1="480" x2="1280" y2="480" stroke="rgba(255,255,255,0.07)" stroke-dasharray="6,6" />

  <!-- Frame Boundaries -->
  <rect x="40" y="40" width="1200" height="640" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" />

  <!-- Center 3D Stage -->
  <g transform="translate(640, 420)">
    <ellipse cx="0" cy="115" rx="380" ry="36" fill="#000000" fill-opacity="0.5" />
    <rect x="-320" y="-180" width="640" height="260" rx="20" fill="rgba(15, 23, 42, 0.85)" stroke="${accent}" stroke-opacity="0.3" stroke-width="1.5" />

    <g transform="translate(0, -60)">
      <!-- Stylized CGI Avatars -->
      <circle cx="-100" cy="0" r="44" fill="#0284c7" stroke="#38bdf8" stroke-width="3" />
      <text x="-100" y="8" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">PI</text>
      <text x="-100" y="24" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#bae6fd" text-anchor="middle">DNA v1.0</text>

      <circle cx="100" cy="5" r="38" fill="#e11d48" stroke="#fb7185" stroke-width="3" />
      <text x="100" y="11" font-family="system-ui, sans-serif" font-size="15" font-weight="900" fill="#ffffff" text-anchor="middle">KEM</text>
      <text x="100" y="26" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#fecdd3" text-anchor="middle">DNA v1.0</text>

      <!-- Center Quality Star -->
      <circle cx="0" cy="-10" r="28" fill="${accent}" fill-opacity="0.25" stroke="${accent}" stroke-width="2" />
      <polygon points="0,-22 4,-12 14,-10 6,-3 8,7 0,2 -8,7 -6,-3 -14,-10 -4,-12" fill="${accent}" />
    </g>

    <text x="0" y="20" font-family="system-ui, sans-serif" font-size="15" font-weight="700" fill="#ffffff" text-anchor="middle">
      ${escapeXml(action.slice(0, 75))}
    </text>
    <text x="0" y="44" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#94a3b8" text-anchor="middle">
      ${escapeXml(location)} &bull; ${escapeXml(lighting)} &bull; ${escapeXml(cameraAngle)}
    </text>

    ${
      dialogue
        ? `
      <rect x="-270" y="80" width="540" height="34" rx="17" fill="rgba(30, 41, 59, 0.9)" stroke="${accent}" stroke-opacity="0.5" stroke-width="1" />
      <text x="0" y="102" font-family="system-ui, sans-serif" font-size="12" font-style="italic" font-weight="600" fill="#f8fafc" text-anchor="middle">
        ${speaker ? `${escapeXml(speaker)}: ` : ''}${escapeXml(dialogue.slice(0, 65))}
      </text>
    `
        : ''
    }
  </g>

  <!-- Top Left HUD: Scene & Shot Metadata -->
  <g transform="translate(60, 85)">
    <rect x="0" y="0" width="340" height="52" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(255, 255, 255, 0.15)" />
    <text x="14" y="22" font-family="monospace" font-size="12" font-weight="bold" fill="#38bdf8">
      SCENE ${snapshot.sceneNumber} &bull; SHOT #${snapshot.shotNumber} (${snapshot.shotId})
    </text>
    <text x="14" y="40" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">
      RUN #${iterationNumber} &bull; HASH #${hash.slice(0, 8)} &bull; 16:9
    </text>
  </g>

  <!-- Top Right HUD: Provider Adapter & Model Details -->
  <g transform="translate(860, 85)">
    <rect x="0" y="0" width="360" height="52" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="${accent}" stroke-opacity="0.4" />
    <text x="346" y="22" font-family="monospace" font-size="11" font-weight="bold" fill="${accent}" text-anchor="end">
      ${engineBadge}
    </text>
    <text x="346" y="40" font-family="monospace" font-size="10" fill="#cbd5e1" text-anchor="end">
      MODEL: ${model} &bull; REQ: ${requestId.slice(-10)}
    </text>
  </g>

  <!-- Bottom Bar: IMMUTABILITY AUDIT WATERMARK -->
  <g transform="translate(60, 620)">
    <rect x="0" y="0" width="1160" height="40" rx="8" fill="rgba(15, 23, 42, 0.92)" stroke="rgba(52, 211, 153, 0.3)" />
    <circle cx="20" cy="20" r="5" fill="#10b981" />
    <text x="35" y="24" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#34d399">
      LOCKED DNA SNAPSHOT:
    </text>
    <text x="195" y="24" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#f1f5f9">
      ${lockedDnaPills || 'Standard Universe DNA'}
    </text>
    <text x="680" y="24" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#a78bfa">
      STYLE: ${snapshot.styleSnapshot.id} (${snapshot.styleSnapshot.versionNumber})
    </text>
    <text x="940" y="24" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#f59e0b">
      REFS: ${refCount} ASSETS
    </text>
    <text x="1140" y="24" font-family="monospace" font-size="10" fill="#34d399" font-weight="bold" text-anchor="end">
      100% IMMUTABLE
    </text>
  </g>
</svg>
  `.trim();

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const outputId = `out_${providerId}_${snapshot.jobId}_${Date.now()}`;
  const storagePath = `renders/episodes/${snapshot.episodeId}/shots/${snapshot.shotId}/frame_${providerId}_${requestId}.png`;

  return {
    id: outputId,
    jobId: snapshot.jobId,
    shotId: snapshot.shotId,
    iterationNumber,
    imageUrl: dataUrl,
    thumbnailUrl: dataUrl,
    storagePath,
    isApproved: false,
    approvalStatus: 'pending',
    deterministicHash: hash,
    aspectRatio: snapshot.params.aspectRatio || '16:9',
    width: 1920,
    height: 1080,
    fileSize: Math.floor(Math.random() * 900000 + 1400000),
    seed,
    provider: providerId,
    model,
    requestId,
    createdAt: new Date().toISOString(),
  };
}
