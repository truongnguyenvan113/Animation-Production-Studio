import {
  Project,
  Character,
  CharacterVersion,
  CharacterReference,
  GlobalStyle,
  GlobalStyleVersion,
  Season,
  Episode,
  Storyboard,
  ImageGenerationJob,
  ProjectReference,
  SystemSettings,
  ProductionPack,
  FlowGenerationJob,
  ProductionAsset,
} from '../types';
import {
  SEED_PROJECT,
  SEED_CHARACTERS,
  SEED_CHARACTER_VERSIONS,
  SEED_CHARACTER_REFERENCES,
  SEED_GLOBAL_STYLE,
  SEED_GLOBAL_STYLE_VERSIONS,
  SEED_SEASONS,
  SEED_EPISODES,
  SEED_STORYBOARDS,
} from './seedData';
import { SEED_PROJECT_REFERENCES } from './projectReferenceService';

const STORAGE_KEY = 'pikem_animation_studio_v2';

function sanitizeImageUri(uri?: string): string | undefined {
  if (!uri) return uri;
  if (typeof uri !== 'string') return uri;
  if (uri.includes('&bull;') || uri.includes('%26bull%3B')) {
    return uri.replaceAll('%26bull%3B', '%E2%80%A2').replaceAll('&bull;', '•');
  }
  return uri;
}

export interface StudioDatabase {
  project: Project;
  characters: Character[];
  characterVersions: CharacterVersion[];
  characterReferences: CharacterReference[];
  globalStyle: GlobalStyle;
  globalStyleVersions: GlobalStyleVersion[];
  seasons: Season[];
  episodes: Episode[];
  storyboards: Storyboard[];
  imageGenerationJobs: ImageGenerationJob[];
  projectReferences: ProjectReference[];
  systemSettings?: SystemSettings;
  productionPacks?: ProductionPack[];
  flowGenerationJobs?: FlowGenerationJob[];
  productionAssets?: ProductionAsset[];
  updatedAt: string;
}

export class StorageService {
  private static instance: StorageService;
  private db: StudioDatabase;
  private listeners: Array<() => void> = [];

  private constructor() {
    this.db = this.loadFromStorage();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private loadFromStorage(): StudioDatabase {
    try {
      if (typeof localStorage === 'undefined') {
        return this.getInitialSeedDatabase();
      }
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.project && parsed.characters && parsed.characterVersions) {
          // Verify canonical character compliance
          const ethanVer = parsed.characterVersions.find((v: CharacterVersion) => v.characterId === 'char_ethan');
          const mochiVer = parsed.characterVersions.find((v: CharacterVersion) => v.characterId === 'char_mochi');
          const isEthanValid = ethanVer?.occupation?.includes('Programmer') || ethanVer?.occupation?.includes('Software');
          const isMochiPuppy = mochiVer?.species?.toLowerCase().includes('puppy') || mochiVer?.visualIdentity?.toLowerCase().includes('puppy');
          
          if (isEthanValid && isMochiPuppy) {
            // Ensure Episode 9 has canonical storyDraft & scenes if missing
            const ep9 = parsed.episodes?.find((e: Episode) => e.id === 'ep_009');
            if (ep9) {
              const seedEp9 = SEED_EPISODES.find((e) => e.id === 'ep_009');
              if (seedEp9) {
                if (!ep9.storyDraft) ep9.storyDraft = seedEp9.storyDraft;
                if (!ep9.scenes) ep9.scenes = seedEp9.scenes;
                if (!ep9.targetAudience) ep9.targetAudience = seedEp9.targetAudience;
                if (!ep9.targetDuration) ep9.targetDuration = seedEp9.targetDuration;
                if (!ep9.additionalNotes) ep9.additionalNotes = seedEp9.additionalNotes;
                if (!ep9.duration || ep9.duration.trim() === '') ep9.duration = seedEp9.duration;
                if (!ep9.storyboardId) ep9.storyboardId = seedEp9.storyboardId;
              }
            }

            // Ensure characterReferences array exists and contains seed data if empty
            if (!Array.isArray(parsed.characterReferences) || parsed.characterReferences.length === 0) {
              parsed.characterReferences = SEED_CHARACTER_REFERENCES;
            }

            // Ensure storyboards array exists and contains seed storyboards if empty
            if (!Array.isArray(parsed.storyboards) || parsed.storyboards.length === 0) {
              parsed.storyboards = SEED_STORYBOARDS;
            } else {
              // Ensure ep_009 storyboard is present
              const hasEp9Sb = parsed.storyboards.some((sb: Storyboard) => sb.episodeId === 'ep_009');
              if (!hasEp9Sb) {
                const seedSb9 = SEED_STORYBOARDS.find((sb) => sb.episodeId === 'ep_009');
                if (seedSb9) parsed.storyboards.push(seedSb9);
              }
            }

            // Ensure imageGenerationJobs array exists
            if (!Array.isArray(parsed.imageGenerationJobs)) {
              parsed.imageGenerationJobs = [];
            }

            // Sanitize all stored image URLs in jobs
            if (Array.isArray(parsed.imageGenerationJobs)) {
              for (const job of parsed.imageGenerationJobs) {
                if (Array.isArray(job.outputAssets)) {
                  for (const asset of job.outputAssets) {
                    if (asset.imageUrl) asset.imageUrl = sanitizeImageUri(asset.imageUrl) || asset.imageUrl;
                    if (asset.thumbnailUrl) asset.thumbnailUrl = sanitizeImageUri(asset.thumbnailUrl) || asset.thumbnailUrl;
                  }
                }
              }
            }

            // Sanitize all activeImageOutputUrl in storyboards
            if (Array.isArray(parsed.storyboards)) {
              for (const sb of parsed.storyboards) {
                if (Array.isArray(sb.scenes)) {
                  for (const sc of sb.scenes) {
                    if (Array.isArray(sc.shots)) {
                      for (const shot of sc.shots) {
                        if (shot.activeImageOutputUrl) {
                          shot.activeImageOutputUrl = sanitizeImageUri(shot.activeImageOutputUrl);
                        }
                      }
                    }
                  }
                }
              }
            }

            // Audit and heal orphan / broken references
            if (Array.isArray(parsed.characterVersions) && Array.isArray(parsed.characterReferences)) {
              const validVersionIds = new Set(parsed.characterVersions.map((v: CharacterVersion) => v.id));
              const validCharIds = new Set(parsed.characters.map((c: Character) => c.id));

              // Filter out references pointing to non-existent versions or characters
              parsed.characterReferences = parsed.characterReferences.filter(
                (ref: CharacterReference) => ref && ref.id && validCharIds.has(ref.characterId) && validVersionIds.has(ref.characterVersionId)
              );

              const existingRefIds = new Set(parsed.characterReferences.map((r: CharacterReference) => r.id));

              // Clean broken reference IDs from versions
              parsed.characterVersions = parsed.characterVersions.map((ver: CharacterVersion) => {
                const validRefIds = (ver.referenceAssetIds || []).filter((id: string) => existingRefIds.has(id));
                let primaryId = ver.primaryReferenceAssetId;
                if (primaryId && !existingRefIds.has(primaryId)) {
                  primaryId = validRefIds[0];
                }
                return {
                  ...ver,
                  referenceAssetIds: validRefIds,
                  primaryReferenceAssetId: primaryId,
                };
              });
            }

            // Ensure projectReferences array exists and contains seed data if empty
            if (!Array.isArray(parsed.projectReferences) || parsed.projectReferences.length === 0) {
              parsed.projectReferences = SEED_PROJECT_REFERENCES;
            } else {
              // Sanitize all image & thumbnail URIs in projectReferences
              for (const pref of parsed.projectReferences) {
                if (pref.uri) pref.uri = sanitizeImageUri(pref.uri) || pref.uri;
                if (pref.thumbnail) pref.thumbnail = sanitizeImageUri(pref.thumbnail) || pref.thumbnail;
              }

              // Audit orphan character links in projectReferences
              const validCharIds = new Set(parsed.characters.map((c: Character) => c.id));
              const validVersionIds = new Set(parsed.characterVersions.map((v: CharacterVersion) => v.id));
              
              parsed.projectReferences = parsed.projectReferences.map((pref: ProjectReference) => {
                if (pref.characterId && !validCharIds.has(pref.characterId)) {
                  const { characterId, characterVersionId, ...rest } = pref;
                  return rest as ProjectReference;
                }
                if (pref.characterVersionId && !validVersionIds.has(pref.characterVersionId)) {
                  const { characterVersionId, ...rest } = pref;
                  return rest as ProjectReference;
                }
                return pref;
              });
            }

            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Could not load existing studio database from localStorage, initializing with seed data.', e);
    }
    return this.getInitialSeedDatabase();
  }

  public getInitialSeedDatabase(): StudioDatabase {
    return {
      project: SEED_PROJECT,
      characters: SEED_CHARACTERS,
      characterVersions: SEED_CHARACTER_VERSIONS,
      characterReferences: SEED_CHARACTER_REFERENCES,
      globalStyle: SEED_GLOBAL_STYLE,
      globalStyleVersions: SEED_GLOBAL_STYLE_VERSIONS,
      seasons: SEED_SEASONS,
      episodes: SEED_EPISODES,
      storyboards: SEED_STORYBOARDS,
      imageGenerationJobs: [],
      projectReferences: SEED_PROJECT_REFERENCES,
      productionPacks: [],
      flowGenerationJobs: [],
      productionAssets: [],
      updatedAt: new Date().toISOString(),
    };
  }

  public getDatabase(): StudioDatabase {
    return this.db;
  }

  public saveDatabase(db: Partial<StudioDatabase>): void {
    this.db = {
      ...this.db,
      ...db,
      updatedAt: new Date().toISOString(),
    };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    this.notify();
  }

  public resetToSeed(): void {
    this.db = this.getInitialSeedDatabase();
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
      }
    } catch (e) {
      console.error('Failed to reset localStorage:', e);
    }
    this.notify();
  }

  public exportDatabaseJson(): string {
    return JSON.stringify(this.db, null, 2);
  }

  public exportState(): StudioDatabase {
    return this.db;
  }

  public importState(data: any): boolean {
    try {
      if (data && data.project && Array.isArray(data.characters)) {
        this.saveDatabase(data);
        return true;
      }
    } catch (e) {
      console.error('Failed to import state:', e);
    }
    return false;
  }

  public importDatabaseJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.project && parsed.characters && Array.isArray(parsed.characters)) {
        this.saveDatabase(parsed);
        return true;
      }
    } catch (e) {
      console.error('Failed to parse import JSON:', e);
    }
    return false;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('Error notifying storage listener:', err);
      }
    }
  }
}

export const storageService = StorageService.getInstance();
