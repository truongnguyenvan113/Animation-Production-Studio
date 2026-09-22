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
import {
  resolveCanonicalCharacterId,
  resolveCanonicalVersionId,
  getAssociatedVersionIds,
  getAssociatedCharacterIds,
} from './characterAliasMap';
import { isVisualImage } from './characterImageResolver';

const STORAGE_KEY = 'pi_kem_animation_studio_db';
const ALT_STORAGE_KEY = 'pikem_animation_studio_v2';

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
  private diskSyncStatus: {
    connected: boolean;
    syncing: boolean;
    lastSaved: string | null;
    error: string | null;
  } = {
    connected: false,
    syncing: false,
    lastSaved: null,
    error: null,
  };
  private diskDebounceTimer: any = null;

  private constructor() {
    this.db = this.loadFromStorage();
    this.initDiskSync();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public getDiskSyncStatus() {
    return { ...this.diskSyncStatus };
  }

  /**
   * Initializes synchronization with local project folder (data/database.json).
   * If the file exists on disk, it hydrates and updates local memory & cache.
   * If not, it saves current state to seed data/database.json on disk.
   */
  public async initDiskSync(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/storage/database');
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'ok' && json.data) {
          console.info('[StorageService] 📁 Hydrated studio database from project folder (data/database.json)');
          this.db = this.normalizeLoadedDatabase(json.data);
          this.syncVersionsAndReferences();
          this.diskSyncStatus = {
            connected: true,
            syncing: false,
            lastSaved: this.db.updatedAt || new Date().toISOString(),
            error: null,
          };
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
            }
          } catch {}
          this.notify();
          return;
        } else if (json.status === 'not_found') {
          console.info('[StorageService] 📁 data/database.json not found on disk. Initializing file on disk...');
          await this.saveToDisk(this.db);
        }
      }
    } catch (err: any) {
      console.warn('[StorageService] Local disk backend not available or offline, operating in client mode:', err.message);
      this.diskSyncStatus.connected = false;
    }
  }

  /**
   * Directly persists the current database to the project folder data/database.json
   */
  public async saveToDisk(databaseToSave?: StudioDatabase): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const target = databaseToSave || this.db;
    try {
      this.diskSyncStatus.syncing = true;
      const res = await fetch('/api/storage/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: target }),
      });
      if (res.ok) {
        const json = await res.json();
        this.diskSyncStatus = {
          connected: true,
          syncing: false,
          lastSaved: json.timestamp || new Date().toISOString(),
          error: null,
        };
        return true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        this.diskSyncStatus.syncing = false;
        this.diskSyncStatus.error = errJson.message || 'Error writing to project folder';
        return false;
      }
    } catch (err: any) {
      this.diskSyncStatus.syncing = false;
      this.diskSyncStatus.connected = false;
      this.diskSyncStatus.error = err.message;
      return false;
    }
  }

  /**
   * Debounced sync to disk so rapid UI keystrokes don't flood disk I/O
   */
  public triggerDebouncedDiskSave(): void {
    if (typeof window === 'undefined') return;
    if (this.diskDebounceTimer) {
      clearTimeout(this.diskDebounceTimer);
    }
    this.diskDebounceTimer = setTimeout(() => {
      this.saveToDisk(this.db).then(() => {
        this.notify();
      });
    }, 600);
  }

  /**
   * Manually reload database state from data/database.json
   */
  public async reloadFromDisk(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/storage/database');
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'ok' && json.data) {
          this.db = this.normalizeLoadedDatabase(json.data);
          this.syncVersionsAndReferences();
          this.diskSyncStatus = {
            connected: true,
            syncing: false,
            lastSaved: this.db.updatedAt || new Date().toISOString(),
            error: null,
          };
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
            }
          } catch {}
          this.notify();
          return { success: true, message: 'Đã nạp lại cơ sở dữ liệu từ tệp data/database.json thành công!' };
        }
      }
      return { success: false, message: 'Không thể đọc tệp data/database.json từ máy chủ.' };
    } catch (err: any) {
      return { success: false, message: `Lỗi kết nối tệp: ${err.message}` };
    }
  }

  /**
   * Uploads reference image to public/storage/references folder and returns the static URL
   */
  public async uploadReferenceToDisk(
    characterId: string,
    versionId: string,
    filename: string,
    base64Data: string
  ): Promise<string | null> {
    try {
      const res = await fetch('/api/storage/upload-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, versionId, filename, base64Data }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.fileUrl || null;
      }
    } catch (err) {
      console.warn('Failed to upload reference image to disk, falling back to data URL:', err);
    }
    return null;
  }

  public normalizeLoadedDatabase(parsed: any): StudioDatabase {
    if (parsed && parsed.project && Array.isArray(parsed.characters) && Array.isArray(parsed.characterVersions)) {
          // Verify canonical character compliance and gently guarantee defaults without destroying database
          const ethanVer = parsed.characterVersions.find((v: CharacterVersion) => v.characterId === 'char_ethan');
          if (ethanVer && (!ethanVer.occupation || !ethanVer.occupation.includes('Programmer'))) {
            ethanVer.occupation = 'Senior Lead Software Architect & Full-Stack Programmer';
          }
          const mochiVer = parsed.characterVersions.find((v: CharacterVersion) => v.characterId === 'char_mochi');
          if (mochiVer && (!mochiVer.species || !mochiVer.species.toLowerCase().includes('puppy'))) {
            mochiVer.species = 'Golden-cream fluffy puppy dog (CANONICAL PUPPY DOG, NOT A CAT)';
          }

          // Ensure Episode 9 has canonical storyDraft, scenes, and continuity fields if missing
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
              if (!ep9.allowedCharacters || ep9.allowedCharacters.length === 0) ep9.allowedCharacters = seedEp9.allowedCharacters;
              if (!ep9.excludedCharacters) ep9.excludedCharacters = seedEp9.excludedCharacters;
              if (!ep9.props || ep9.props.length === 0) ep9.props = seedEp9.props;
              if (!ep9.language) ep9.language = seedEp9.language;
              if (!ep9.durationLimit) ep9.durationLimit = seedEp9.durationLimit;
              if (!ep9.continuityRules || ep9.continuityRules.length === 0) ep9.continuityRules = seedEp9.continuityRules;
            }
          }

          // Ensure storyboards array exists and contains seed storyboards if empty
          if (!Array.isArray(parsed.storyboards) || parsed.storyboards.length === 0) {
            parsed.storyboards = SEED_STORYBOARDS;
          } else {
            // Ensure ep_009 storyboard has latest shot brief and keyframe data synced
            const ep9Sb = parsed.storyboards.find((sb: Storyboard) => sb.episodeId === 'ep_009');
            const seedSb9 = SEED_STORYBOARDS.find((sb) => sb.episodeId === 'ep_009');
            if (!ep9Sb && seedSb9) {
              parsed.storyboards.push(seedSb9);
            } else if (ep9Sb && seedSb9) {
              // Sync shot_ep009_s01_01 brief and keyframe if missing
              const storedShot = ep9Sb.scenes?.[0]?.shots?.find((s: any) => s.id === 'shot_ep009_s01_01');
              const seedShot = seedSb9.scenes?.[0]?.shots?.find((s: any) => s.id === 'shot_ep009_s01_01');
              if (storedShot && seedShot) {
                if (!storedShot.cameraTimeline) storedShot.cameraTimeline = seedShot.cameraTimeline;
                if (!storedShot.sceneIntent) storedShot.sceneIntent = seedShot.sceneIntent;
                if (!storedShot.soundIntent) storedShot.soundIntent = seedShot.soundIntent;
                if (!storedShot.specialNotes) storedShot.specialNotes = seedShot.specialNotes;
                if (!storedShot.activeImageOutputUrl) storedShot.activeImageOutputUrl = seedShot.activeImageOutputUrl;
                if (!storedShot.activeImageJobId) storedShot.activeImageJobId = seedShot.activeImageJobId;
                if (!storedShot.activeOutputAssetId) storedShot.activeOutputAssetId = seedShot.activeOutputAssetId;
                if (storedShot.isProductionReadyKeyframe === undefined) storedShot.isProductionReadyKeyframe = seedShot.isProductionReadyKeyframe;
              }
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

          // Ensure characterReferences is initialized without overwriting user-authored empty states or uploads
          if (!Array.isArray(parsed.characterReferences)) {
            parsed.characterReferences = [...SEED_CHARACTER_REFERENCES];
          }

          // Ensure canonical versions exist (including alias versions ver_nancy_v1 and ver_leo_v1)
          if (Array.isArray(parsed.characterVersions)) {
            const currentVerIds = new Set(parsed.characterVersions.map((v: CharacterVersion) => v.id));
            for (const seedVer of SEED_CHARACTER_VERSIONS) {
              if (!currentVerIds.has(seedVer.id)) {
                parsed.characterVersions.push({ ...seedVer });
              }
            }
          } else {
            parsed.characterVersions = [...SEED_CHARACTER_VERSIONS];
          }

          const validVersionIds = new Set(parsed.characterVersions.map((v: CharacterVersion) => v.id));
          validVersionIds.add('ver_nancy_v1');
          validVersionIds.add('ver_leo_v1');
          validVersionIds.add('ver_pi_v1');
          validVersionIds.add('ver_kem_v1');

          const validCharIds = new Set(parsed.characters.map((c: Character) => c.id));
          validCharIds.add('char_nancy');
          validCharIds.add('char_leo');
          validCharIds.add('char_pi');
          validCharIds.add('char_kem');

          // Normalize and retain all valid character references without silent loss
          parsed.characterReferences = parsed.characterReferences
            .filter((ref: CharacterReference) => ref && ref.id)
            .map((ref: CharacterReference) => {
              const canonChar = resolveCanonicalCharacterId(ref.characterId);
              let img = ref.image;
              let thumb = ref.thumbnail;
              if (ref.id === 'ref_pi_front' && (!img || img === 'pi_front')) {
                img = '/assets/aistudio/references/images/char_pi_turnaround.jpg';
                thumb = '/assets/aistudio/references/images/char_pi_turnaround.jpg';
              }
              return {
                ...ref,
                characterId: canonChar || ref.characterId,
                image: img,
                thumbnail: thumb || img,
              };
            });

          const existingRefIds = new Set(parsed.characterReferences.map((r: CharacterReference) => r.id));

          // Clean, synchronize, and strictly populate references array and referenceAssetIds on versions
          parsed.characterVersions = parsed.characterVersions.map((ver: CharacterVersion) => {
            const associatedVersionIds = getAssociatedVersionIds(ver.id);
            // Find all actual references belonging to this version or its alias
            const verRefs = parsed.characterReferences.filter((r: CharacterReference) =>
              associatedVersionIds.includes(r.characterVersionId),
            );
            const verRefIds = verRefs.map((r: CharacterReference) => r.id);

            let primaryId: string | undefined = undefined;

            if (verRefs.length > 0) {
              // 1. Check existing primary ID if still valid
              if (ver.primaryReferenceAssetId && existingRefIds.has(ver.primaryReferenceAssetId)) {
                primaryId = ver.primaryReferenceAssetId;
              }
              // 2. Check explicit isPrimary flag
              if (!primaryId) {
                primaryId = verRefs.find((r: CharacterReference) => r.isPrimary)?.id;
              }
              // 3. Prefer real visual images over placeholder token strings
              const visualRef = verRefs.find((r: CharacterReference) => isVisualImage(r.image));
              const currentRefObj = primaryId ? verRefs.find((r: CharacterReference) => r.id === primaryId) : undefined;
              if (visualRef && (!currentRefObj || !isVisualImage(currentRefObj.image))) {
                primaryId = visualRef.id;
              }
              // 4. Default to first reference
              if (!primaryId) {
                primaryId = verRefIds[0];
              }

              // Synchronize isPrimary flags strictly on references for this version
              verRefs.forEach((r: CharacterReference) => {
                r.isPrimary = r.id === primaryId;
              });
            }

            // Authoritative Master DNA Outfit Synchronization for Canonical v1.0 Locks
            let clothing = ver.clothing;
            if (ver.id === 'ver_ethan_v1') {
              clothing = 'Light blue polo shirt and grey shorts';
            } else if (ver.id === 'ver_emma_v1') {
              clothing = 'PURPLE FLORAL COLLARED SHIRT and blue jeans';
            }

            return {
              ...ver,
              clothing,
              references: verRefs,
              referenceAssetIds: verRefIds,
              primaryReferenceAssetId: primaryId,
            };
          });

          // Ensure projectReferences array exists and contains seed data if empty
          if (!Array.isArray(parsed.projectReferences) || parsed.projectReferences.length === 0) {
            parsed.projectReferences = SEED_PROJECT_REFERENCES;
          } else {
            for (const pref of parsed.projectReferences) {
              if (pref.uri) pref.uri = sanitizeImageUri(pref.uri) || pref.uri;
              if (pref.thumbnail) pref.thumbnail = sanitizeImageUri(pref.thumbnail) || pref.thumbnail;
            }

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
    return this.getInitialSeedDatabase();
  }

  private loadFromStorage(): StudioDatabase {
    try {
      if (typeof localStorage === 'undefined') {
        return this.getInitialSeedDatabase();
      }
      const data = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(ALT_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return this.normalizeLoadedDatabase(parsed);
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

  public syncVersionsAndReferences(): void {
    if (!this.db || !Array.isArray(this.db.characterVersions)) return;
    const refs = this.db.characterReferences || [];
    this.db.characterVersions = this.db.characterVersions.map((ver) => {
      const associated = getAssociatedVersionIds(ver.id);
      const verRefs = refs.filter((r) => associated.includes(r.characterVersionId));
      const verRefIds = verRefs.map((r) => r.id);
      let primaryId = ver.primaryReferenceAssetId;
      if (!primaryId || !verRefIds.includes(primaryId)) {
        primaryId = verRefs.find((r) => r.isPrimary)?.id || verRefIds[0] || undefined;
      }
      return {
        ...ver,
        references: verRefs,
        referenceAssetIds: verRefIds,
        primaryReferenceAssetId: primaryId,
      };
    });
  }

  public getDatabase(): StudioDatabase {
    this.syncVersionsAndReferences();
    return this.db;
  }

  public saveDatabase(db: Partial<StudioDatabase>): void {
    this.db = {
      ...this.db,
      ...db,
      updatedAt: new Date().toISOString(),
    };

    this.syncVersionsAndReferences();

    if (typeof localStorage !== 'undefined') {
      try {
        const payload = JSON.stringify(this.db);
        localStorage.setItem(STORAGE_KEY, payload);
        try {
          // Remove duplicate legacy key to free up 50% storage quota
          localStorage.removeItem(ALT_STORAGE_KEY);
        } catch {}
      } catch (e: any) {
        console.warn('First attempt to save database threw an error (likely quota exceeded). Pruning transient jobs cache...', e);
        try {
          try {
            localStorage.removeItem(ALT_STORAGE_KEY);
          } catch {}
          // Prune transient large outputs from imageGenerationJobs and flowGenerationJobs without losing references
          if (Array.isArray(this.db.imageGenerationJobs) && this.db.imageGenerationJobs.length > 3) {
            this.db.imageGenerationJobs = this.db.imageGenerationJobs.slice(0, 3).map((job) => ({
              ...job,
              outputAssets: (job.outputAssets || []).slice(0, 1),
            }));
          }
          if (Array.isArray(this.db.flowGenerationJobs) && this.db.flowGenerationJobs.length > 3) {
            this.db.flowGenerationJobs = this.db.flowGenerationJobs.slice(0, 3);
          }

          const prunedPayload = JSON.stringify(this.db);
          localStorage.setItem(STORAGE_KEY, prunedPayload);
          console.info('Database successfully persisted after pruning transient render history.');
        } catch (retryErr) {
          console.error('Critical: Failed to save database to localStorage even after pruning:', retryErr);
        }
      }
    }
    // Asynchronously synchronize with project folder (data/database.json)
    this.triggerDebouncedDiskSave();
    this.notify();
  }

  public resetToSeed(): void {
    this.db = this.getInitialSeedDatabase();
    try {
      if (typeof localStorage !== 'undefined') {
        const payload = JSON.stringify(this.db);
        localStorage.setItem(STORAGE_KEY, payload);
        try {
          localStorage.setItem(ALT_STORAGE_KEY, payload);
        } catch {}
      }
    } catch (e) {
      console.error('Failed to reset localStorage:', e);
    }
    this.saveToDisk(this.db);
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

  public hasLocalStorageData(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return !!(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(ALT_STORAGE_KEY));
  }

  public getLocalStorageRawData(): any | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(ALT_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse localStorage data:', e);
    }
    return null;
  }

  public async migrateLegacyData(legacyData?: any): Promise<{ success: boolean; message: string; stats?: any }> {
    try {
      const dataToMigrate = legacyData || this.getLocalStorageRawData() || this.db;
      const res = await fetch('/api/storage/migrate-legacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataToMigrate }),
      });
      const json = await res.json();
      if (res.ok && json.status === 'ok') {
        if (json.data) {
          this.db = this.normalizeLoadedDatabase(json.data);
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
            }
          } catch {}
          this.notify();
        }
        return {
          success: true,
          message: json.message || 'Đã chuyển đổi và ánh xạ dữ liệu sang cấu trúc thư mục mới thành công!',
          stats: json.stats,
        };
      }
      return {
        success: false,
        message: json.message || 'Lỗi khi gọi API chuyển đổi dữ liệu.',
      };
    } catch (err: any) {
      console.error('Error invoking migrateLegacyData:', err);
      return {
        success: false,
        message: `Lỗi kết nối máy chủ: ${err.message}`,
      };
    }
  }

  public async getStorageStructure(): Promise<any> {
    try {
      const res = await fetch('/api/storage/structure');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch storage structure:', e);
    }
    return null;
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
