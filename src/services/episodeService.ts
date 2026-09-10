import { Episode, EpisodeStatus, CharacterVersion, GlobalStyleVersion } from '../types';
import { storageService } from './storageService';
import { CharacterService } from './characterService';
import { StyleService } from './styleService';

export interface EpisodeSnapshotDetail {
  characterSnapshots: Array<{
    characterId: string;
    characterName: string;
    vietnameseName: string;
    role: string;
    versionId: string;
    version: string;
    versionData?: CharacterVersion;
  }>;
  styleSnapshot?: {
    styleVersionId: string;
    version: string;
    styleData?: GlobalStyleVersion;
  };
}

export class EpisodeService {
  public static getAllEpisodes(): Episode[] {
    return storageService
      .getDatabase()
      .episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
  }

  public static getEpisodesForSeason(seasonId: string): Episode[] {
    return storageService
      .getDatabase()
      .episodes.filter((ep) => ep.seasonId === seasonId)
      .sort((a, b) => a.episodeNumber - b.episodeNumber);
  }

  public static getEpisodeById(id: string): Episode | undefined {
    return storageService.getDatabase().episodes.find((ep) => ep.id === id);
  }

  /**
   * Creates a new episode with strict historical snapshot locking.
   * Ensures the exact CharacterVersion and StyleVersion are saved at episode creation time.
   */
  public static createEpisode(params: {
    seasonId: string;
    episodeNumber: number;
    title: string;
    storyIdea: string;
    theme: string;
    educationalMessage: string;
    characterIds: string[];
    supportingCharacterIds: string[];
    location: string;
    duration: string;
    targetPlatform: string;
    status?: EpisodeStatus;
    customCharacterVersionSnapshots?: Record<string, string>;
    styleVersionSnapshotId?: string;
  }): Episode {
    const db = storageService.getDatabase();

    // Compile character version snapshots
    const characterVersionSnapshots: Record<string, string> = {};
    const allParticipatingCharacters = [
      ...params.characterIds,
      ...params.supportingCharacterIds,
    ];

    for (const charId of allParticipatingCharacters) {
      if (params.customCharacterVersionSnapshots && params.customCharacterVersionSnapshots[charId]) {
        characterVersionSnapshots[charId] = params.customCharacterVersionSnapshots[charId];
      } else {
        const char = CharacterService.getCharacterById(charId);
        if (char) {
          characterVersionSnapshots[charId] = char.activeVersionId;
        }
      }
    }

    const activeStyle = StyleService.getActiveStyleVersion();
    const resolvedStyleVersionId =
      params.styleVersionSnapshotId || (activeStyle ? activeStyle.id : 'style_ver_1_0');

    const newEpisode: Episode = {
      id: `ep_${String(params.episodeNumber).padStart(3, '0')}`,
      seasonId: params.seasonId,
      episodeNumber: params.episodeNumber,
      title: params.title,
      storyIdea: params.storyIdea,
      theme: params.theme,
      educationalMessage: params.educationalMessage,
      characterIds: params.characterIds,
      supportingCharacterIds: params.supportingCharacterIds,
      location: params.location,
      duration: params.duration,
      targetPlatform: params.targetPlatform,
      status: params.status || 'Draft',
      characterVersionSnapshots,
      styleVersionSnapshotId: resolvedStyleVersionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storageService.saveDatabase({ episodes: [...db.episodes, newEpisode] });
    return newEpisode;
  }

  public static updateEpisode(id: string, updates: Partial<Episode>): Episode {
    const db = storageService.getDatabase();
    const index = db.episodes.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error(`Episode with id ${id} not found`);
    }

    const current = db.episodes[index];
    const updated: Episode = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const newEpisodes = [...db.episodes];
    newEpisodes[index] = updated;
    storageService.saveDatabase({ episodes: newEpisodes });
    return updated;
  }

  public static deleteEpisode(id: string): void {
    const db = storageService.getDatabase();
    const filtered = db.episodes.filter((e) => e.id !== id);
    storageService.saveDatabase({ episodes: filtered });
  }

  /**
   * Resolves the full historical snapshot metadata for an episode.
   * This proves the Episode retains its exact historical character DNA version
   * even if the character subsequently evolved to v2, v3, etc.
   */
  public static getEpisodeSnapshotDetails(episodeId: string): EpisodeSnapshotDetail {
    const ep = this.getEpisodeById(episodeId);
    if (!ep) {
      return { characterSnapshots: [] };
    }

    const db = storageService.getDatabase();
    const characterSnapshots = Object.entries(ep.characterVersionSnapshots).map(
      ([charId, verId]) => {
        const char = db.characters.find((c) => c.id === charId);
        const ver = db.characterVersions.find((v) => v.id === verId);
        return {
          characterId: charId,
          characterName: char?.displayName || charId,
          vietnameseName: char?.vietnameseName || '',
          role: char?.role || '',
          versionId: verId,
          version: ver?.version || 'Unknown',
          versionData: ver,
        };
      },
    );

    const styleVer = db.globalStyleVersions.find(
      (s) => s.id === ep.styleVersionSnapshotId,
    );

    return {
      characterSnapshots,
      styleSnapshot: styleVer
        ? {
            styleVersionId: styleVer.id,
            version: styleVer.version,
            styleData: styleVer,
          }
        : undefined,
    };
  }
}
