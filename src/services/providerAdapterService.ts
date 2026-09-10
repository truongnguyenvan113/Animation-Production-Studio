import { ProviderAdapterSpec } from '../types';
import { SEED_PROVIDER_ADAPTERS } from './seedData';

export class ProviderAdapterService {
  public static getSupportedAdapters(): ProviderAdapterSpec[] {
    return SEED_PROVIDER_ADAPTERS;
  }

  public static getAllAdapters(): ProviderAdapterSpec[] {
    return SEED_PROVIDER_ADAPTERS;
  }

  public static getAdapterById(id: string): ProviderAdapterSpec | undefined {
    return SEED_PROVIDER_ADAPTERS.find((a) => a.id === id);
  }

  /**
   * Explains how the Character DNA abstraction decouples providers.
   */
  public static getDecouplingArchitecturePrinciples(): string[] {
    return [
      'Character DNA is the single source of truth: No provider adapter may mutate persistent character parameters.',
      'Immutable version snapshots: When dispatching a render job, the adapter receives frozen Character DNA vX and Global Style vY.',
      'Swappable video engines: Switching between Google Flow, Veo, Runway, Luma, or Kling never triggers schema changes in Character, Episode, or Storyboard repositories.',
      'No simulated video generation: Render pipelines require authenticated cloud credentials and provider SDK bridges.',
    ];
  }
}
