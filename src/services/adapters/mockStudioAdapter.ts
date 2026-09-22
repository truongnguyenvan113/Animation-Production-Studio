import {
  ImmutableJobSnapshot,
  ImageGenerationOutputAsset,
  ProviderGenerationResult,
  ImageGenerationProvider,
} from '../../types';
import { BaseImageProviderAdapter, AdapterExecutionOptions } from './baseAdapter';

/**
 * Pi & Kem Mock Studio Adapter (Local / Offline QA)
 * 
 * STRICT CONTRACT:
 * Receives ONLY the immutable Job Snapshot.
 * Never accesses active Character or Style state.
 * Preserves 100% deterministic local QA capability without external API dependencies.
 */
export class MockStudioAdapter extends BaseImageProviderAdapter {
  readonly providerId: ImageGenerationProvider = 'mock-studio';
  readonly defaultModel: string = 'mock-engine-v2.5';
  readonly supportedModels: string[] = [
    'mock-engine-v2.5',
    'mock-engine-turbo',
    'mock-storyboard-sketch',
  ];

  public async generateImage(
    snapshot: ImmutableJobSnapshot,
    options?: AdapterExecutionOptions
  ): Promise<ProviderGenerationResult> {
    const startTime = Date.now();
    const model = snapshot.modelName || this.defaultModel;
    const requestId = this.generateRequestId('mock');

    // Simulate execution latency for smooth progress UI
    await new Promise((r) => setTimeout(r, 450));

    // Handle simulated error if requested in options
    if (options?.simulateError) {
      return {
        provider: this.providerId,
        model,
        requestId,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: 'Mock Studio Pipeline Error: Cross-attention alignment failed for reference assets.',
        executionDurationMs: Date.now() - startTime,
      };
    }

    // Handle simulated rate limit if requested
    if (options?.simulateRateLimit) {
      const retryDelay = 30;
      const alt = this.getSuggestedAlternative(model);
      return {
        provider: this.providerId,
        model,
        requestId,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: `Rate limit reached on ${model}. Please switch model or retry.`,
        rateLimitInfo: {
          isRateLimited: true,
          retryAfterSeconds: retryDelay,
          quotaExceeded: true,
          failedModel: model,
          suggestedAlternativeModel: alt.model,
          suggestedProvider: alt.provider,
          attemptCount: 1,
        },
        executionDurationMs: Date.now() - startTime,
      };
    }

    // Generate deterministic high-fidelity SVG preview using snapshot ONLY
    const outputAsset = this.renderMockFrame(snapshot, model, requestId);

    return {
      provider: this.providerId,
      model,
      requestId,
      outputAsset,
      timestamp: new Date().toISOString(),
      status: 'completed',
      error: null,
      executionDurationMs: Date.now() - startTime,
    };
  }

  /**
   * Generates the SVG frame using ONLY data inside the immutable snapshot.
   */
  private renderMockFrame(
    snapshot: ImmutableJobSnapshot,
    model: string,
    requestId: string
  ): ImageGenerationOutputAsset {
    const location = snapshot.composition.location || 'Home Studio';
    const action = snapshot.composition.action || 'Scene Animation Frame';
    const lighting = snapshot.lighting || 'Warm Soft 3D Lighting';
    const cameraAngle = snapshot.camera.cameraAngle || snapshot.camera.shotType || 'Cinematic Wide';
    const dialogue = snapshot.composition.dialogue ? `"${snapshot.composition.dialogue}"` : '';
    const speaker = snapshot.composition.speakerCharacterName || '';

    let bgGradientStart = '#1e1b4b'; // deep indigo
    let bgGradientEnd = '#312e81';
    let accentColor = '#f59e0b'; // amber

    if (location.toLowerCase().includes('kitchen') || location.toLowerCase().includes('bếp')) {
      bgGradientStart = '#451a03';
      bgGradientEnd = '#78350f';
      accentColor = '#fbbf24';
    } else if (location.toLowerCase().includes('living') || location.toLowerCase().includes('khách')) {
      bgGradientStart = '#0f172a';
      bgGradientEnd = '#1e293b';
      accentColor = '#38bdf8';
    } else if (location.toLowerCase().includes('garden') || location.toLowerCase().includes('vườn')) {
      bgGradientStart = '#064e3b';
      bgGradientEnd = '#047857';
      accentColor = '#a7f3d0';
    }

    // Locked DNA labels
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
            : charId === 'char_mochi'
            ? 'Mochi'
            : charId;
        return `${charName}:${verId}`;
      })
      .join(' • ');

    const refCount = snapshot.referenceAssetIds.length;
    const seed = snapshot.params.seed || 49281;
    const iterationNumber = snapshot.iterationNumber || 1;
    const hash = snapshot.deterministicPayloadHash;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad_${requestId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGradientStart}" />
      <stop offset="50%" stop-color="${bgGradientEnd}" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="glowGrad_${requestId}" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.0" />
    </linearGradient>
    <pattern id="grid_${requestId}" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background Environment -->
  <rect width="1280" height="720" fill="url(#bgGrad_${requestId})" />
  <rect width="1280" height="720" fill="url(#grid_${requestId})" />

  <!-- Ambient Light Volume -->
  <ellipse cx="640" cy="300" rx="550" ry="260" fill="url(#glowGrad_${requestId})" />

  <!-- Rule of Thirds Guides -->
  <line x1="426" y1="0" x2="426" y2="720" stroke="rgba(255,255,255,0.08)" stroke-dasharray="6,6" />
  <line x1="854" y1="0" x2="854" y2="720" stroke="rgba(255,255,255,0.08)" stroke-dasharray="6,6" />
  <line x1="0" y1="240" x2="1280" y2="240" stroke="rgba(255,255,255,0.08)" stroke-dasharray="6,6" />
  <line x1="0" y1="480" x2="1280" y2="480" stroke="rgba(255,255,255,0.08)" stroke-dasharray="6,6" />

  <!-- Camera HUD Crosshairs -->
  <path d="M 620 360 L 660 360 M 640 340 L 640 380" stroke="${accentColor}" stroke-width="1.5" stroke-opacity="0.6" />
  <circle cx="640" cy="360" r="40" fill="none" stroke="${accentColor}" stroke-width="1" stroke-opacity="0.3" stroke-dasharray="4,4" />

  <!-- Safety Margins -->
  <rect x="40" y="40" width="1200" height="640" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1" />

  <!-- Stylized Character Representation Stage -->
  <g transform="translate(640, 420)">
    <ellipse cx="0" cy="110" rx="360" ry="32" fill="#000000" fill-opacity="0.4" />
    <rect x="-300" y="-180" width="600" height="260" rx="20" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" />

    <g transform="translate(0, -60)">
      <!-- Pi Character Avatar -->
      <circle cx="-100" cy="0" r="44" fill="#0284c7" stroke="#38bdf8" stroke-width="3" />
      <text x="-100" y="8" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">PI</text>
      <text x="-100" y="24" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#bae6fd" text-anchor="middle">5 TUỔI</text>

      <!-- Kem Character Avatar -->
      <circle cx="100" cy="5" r="38" fill="#e11d48" stroke="#fb7185" stroke-width="3" />
      <text x="100" y="11" font-family="system-ui, sans-serif" font-size="15" font-weight="900" fill="#ffffff" text-anchor="middle">KEM</text>
      <text x="100" y="26" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#fecdd3" text-anchor="middle">3 TUỔI</text>

      <!-- Center Sparkle / Action Connector -->
      <circle cx="0" cy="-10" r="26" fill="${accentColor}" fill-opacity="0.2" stroke="${accentColor}" stroke-width="2" />
      <polygon points="0,-22 4,-12 14,-10 6,-3 8,7 0,2 -8,7 -6,-3 -14,-10 -4,-12" fill="${accentColor}" />
    </g>

    <text x="0" y="20" font-family="system-ui, sans-serif" font-size="15" font-weight="700" fill="#ffffff" text-anchor="middle">
      ${this.escapeXml(action.slice(0, 75))}
    </text>
    <text x="0" y="44" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#94a3b8" text-anchor="middle">
      ${this.escapeXml(location)} • ${this.escapeXml(lighting)} • ${this.escapeXml(cameraAngle)}
    </text>

    ${
      dialogue
        ? `
      <rect x="-260" y="80" width="520" height="34" rx="17" fill="rgba(245, 158, 11, 0.15)" stroke="rgba(245, 158, 11, 0.4)" stroke-width="1" />
      <text x="0" y="102" font-family="system-ui, sans-serif" font-size="12" font-style="italic" font-weight="600" fill="#fef3c7" text-anchor="middle">
        ${speaker ? `${this.escapeXml(speaker)}: ` : ''}${this.escapeXml(dialogue.slice(0, 65))}
      </text>
    `
        : ''
    }
  </g>

  <!-- Top Left HUD: Scene & Shot Metadata -->
  <g transform="translate(60, 85)">
    <rect x="0" y="0" width="340" height="52" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255, 255, 255, 0.15)" />
    <text x="14" y="22" font-family="monospace" font-size="12" font-weight="bold" fill="#38bdf8">
      SCENE ${snapshot.sceneNumber} • SHOT #${snapshot.shotNumber} (${snapshot.shotId})
    </text>
    <text x="14" y="40" font-family="system-ui, sans-serif" font-size="11" fill="#cbd5e1">
      RUN #${iterationNumber} • HASH #${hash.slice(0, 8)} • 16:9
    </text>
  </g>

  <!-- Top Right HUD: Provider & Seed -->
  <g transform="translate(880, 85)">
    <rect x="0" y="0" width="340" height="52" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255, 255, 255, 0.15)" />
    <text x="326" y="22" font-family="monospace" font-size="12" font-weight="bold" fill="${accentColor}" text-anchor="end">
      MOCK STUDIO • ${String(model || 'STUDIO').toUpperCase()}
    </text>
    <text x="326" y="40" font-family="monospace" font-size="10" fill="#94a3b8" text-anchor="end">
      REQ: ${requestId.slice(-10)} • SEED: #${seed} • OFFLINE QA
    </text>
  </g>

  <!-- Bottom Bar: IMMUTABILITY AUDIT WATERMARK -->
  <g transform="translate(60, 620)">
    <rect x="0" y="0" width="1160" height="40" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(52, 211, 153, 0.3)" />
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
    const outputId = `out_mock_${snapshot.jobId}_${Date.now()}`;
    const storagePath = `renders/episodes/${snapshot.episodeId}/shots/${snapshot.shotId}/frame_mock_${requestId}.svg`;

    return {
      id: outputId,
      outputId,
      jobId: snapshot.jobId,
      shotId: snapshot.shotId,
      iterationNumber,
      imageUrl: dataUrl,
      thumbnailUrl: dataUrl,
      storagePath,
      outputType: 'mock',
      mimeType: 'image/svg+xml',
      isApproved: false,
      approvalStatus: 'pending',
      deterministicHash: hash,
      aspectRatio: snapshot.params.aspectRatio || '16:9',
      width: 1920,
      height: 1080,
      fileSize: Math.floor(Math.random() * 800000 + 1200000),
      seed,
      provider: this.providerId,
      model,
      requestId,
      createdAt: new Date().toISOString(),
      isProductionReady: false,
      isMock: true,
    };
  }
}
