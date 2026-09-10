import {
  Project,
  Character,
  CharacterVersion,
  CharacterReference,
  GlobalStyle,
  GlobalStyleVersion,
  Season,
  Episode,
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
} from './seedData';

const STORAGE_KEY = 'pikem_animation_studio_v2';

export interface StudioDatabase {
  project: Project;
  characters: Character[];
  characterVersions: CharacterVersion[];
  characterReferences: CharacterReference[];
  globalStyle: GlobalStyle;
  globalStyleVersions: GlobalStyleVersion[];
  seasons: Season[];
  episodes: Episode[];
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
            if (ep9 && !ep9.storyDraft) {
              const seedEp9 = SEED_EPISODES.find((e) => e.id === 'ep_009');
              if (seedEp9) {
                ep9.storyDraft = seedEp9.storyDraft;
                ep9.scenes = seedEp9.scenes;
                ep9.status = seedEp9.status;
              }
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    this.notify();
  }

  public resetToSeed(): void {
    this.db = this.getInitialSeedDatabase();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
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
