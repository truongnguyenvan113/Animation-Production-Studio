import {
  ImageGenerationProvider,
  ImageProviderAdapter,
  ImmutableJobSnapshot,
  ProviderGenerationResult,
} from '../../types';
import { AdapterExecutionOptions } from './baseAdapter';
import { MockStudioAdapter } from './mockStudioAdapter';
import {
  GeminiImagenAdapter,
  FluxProAdapter,
  MidjourneyAdapter,
  StableDiffusionAdapter,
  DallEAdapter,
} from './realImageProviderAdapters';

/**
 * Central Registry for Image Generation Provider Adapters.
 * 
 * STRICT ARCHITECTURAL CONTRACT:
 * - Adapters receive ONLY the immutable Job Snapshot.
 * - Active Character/Style state repositories are NEVER accessed by adapters.
 * - Decouples render engines cleanly from persistent storyboard & character records.
 */
export class ImageAdapterRegistry {
  private static instance: ImageAdapterRegistry;
  private adapters: Map<ImageGenerationProvider, ImageProviderAdapter> = new Map();
  private selectedModels: Map<ImageGenerationProvider, string> = new Map();

  private constructor() {
    this.registerAdapter(new MockStudioAdapter());
    this.registerAdapter(new GeminiImagenAdapter());
    this.registerAdapter(new FluxProAdapter());
    this.registerAdapter(new MidjourneyAdapter());
    this.registerAdapter(new StableDiffusionAdapter());
    this.registerAdapter(new DallEAdapter());

    // Load persisted model choices if available in browser
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('pikem_selected_provider_models');
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.entries(parsed).forEach(([p, m]) => {
            this.selectedModels.set(p as ImageGenerationProvider, m as string);
          });
        }
      }
    } catch {
      // safe fallback
    }
  }

  public static getInstance(): ImageAdapterRegistry {
    if (!ImageAdapterRegistry.instance) {
      ImageAdapterRegistry.instance = new ImageAdapterRegistry();
    }
    return ImageAdapterRegistry.instance;
  }

  public registerAdapter(adapter: ImageProviderAdapter): void {
    this.adapters.set(adapter.providerId, adapter);
  }

  public getAdapter(providerId: ImageGenerationProvider): ImageProviderAdapter {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      // Fallback to Mock Studio if unknown provider
      return this.adapters.get('mock-studio')!;
    }
    return adapter;
  }

  public getAllAdapters(): ImageProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get active model for a provider (user selected or default)
   */
  public getActiveModel(providerId: ImageGenerationProvider): string {
    if (this.selectedModels.has(providerId)) {
      return this.selectedModels.get(providerId)!;
    }
    const adapter = this.getAdapter(providerId);
    return adapter.defaultModel;
  }

  /**
   * Set active model for a provider (e.g. when user toggles model on rate limit)
   */
  public setActiveModel(providerId: ImageGenerationProvider, model: string): void {
    this.selectedModels.set(providerId, model);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const obj: Record<string, string> = {};
        this.selectedModels.forEach((m, p) => {
          obj[p] = m;
        });
        window.localStorage.setItem('pikem_selected_provider_models', JSON.stringify(obj));
      }
    } catch {
      // safe fallback
    }
  }

  /**
   * Primary entry point: Executes generation through the target provider adapter.
   * STRICT CONTRACT: Pass ONLY the immutable snapshot.
   */
  public async executeGeneration(
    snapshot: ImmutableJobSnapshot,
    options?: AdapterExecutionOptions
  ): Promise<ProviderGenerationResult> {
    const adapter = this.getAdapter(snapshot.provider);
    
    // Ensure snapshot has the configured active model if not explicitly specified
    const activeModel = snapshot.modelName || this.getActiveModel(snapshot.provider);
    const enrichedSnapshot: ImmutableJobSnapshot = {
      ...snapshot,
      modelName: activeModel,
    };

    return adapter.generateImage(enrichedSnapshot, options);
  }
}
