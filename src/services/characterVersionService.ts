import { CharacterVersion } from '../types';
import { storageService } from './storageService';
import { CharacterService } from './characterService';
import { CharacterReferenceService } from './characterReferenceService';
import { getAssociatedVersionIds } from './characterAliasMap';

export class CharacterVersionService {
  public static getAllVersions(): CharacterVersion[] {
    return storageService.getDatabase().characterVersions;
  }

  public static getVersionsForCharacter(characterId: string): CharacterVersion[] {
    return storageService
      .getDatabase()
      .characterVersions.filter((v) => v.characterId === characterId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static getVersionById(id: string): CharacterVersion | undefined {
    return storageService.getDatabase().characterVersions.find((v) => v.id === id);
  }

  public static getActiveVersionForCharacter(characterId: string): CharacterVersion | undefined {
    const character = CharacterService.getCharacterById(characterId);
    if (!character) return undefined;
    return this.getVersionById(character.activeVersionId);
  }

  public static updateVersion(
    versionId: string,
    updates: Partial<CharacterVersion>,
  ): CharacterVersion {
    const db = storageService.getDatabase();
    const index = db.characterVersions.findIndex((v) => v.id === versionId);
    if (index === -1) {
      throw new Error(`CharacterVersion with id ${versionId} not found`);
    }

    const current = db.characterVersions[index];
    const associatedVersionIds = getAssociatedVersionIds(versionId);

    // Guarantee that references always preserves all actual references belonging to this version or aliases
    const actualRefs = (db.characterReferences || []).filter((r) =>
      associatedVersionIds.includes(r.characterVersionId),
    );
    const actualRefIds = actualRefs.map((r) => r.id);
    const mergedRefIds = Array.from(new Set([
      ...actualRefIds,
      ...(current.referenceAssetIds || []),
      ...(updates.referenceAssetIds || []),
    ]));

    let primaryId = updates.primaryReferenceAssetId || current.primaryReferenceAssetId;
    if (!primaryId || !mergedRefIds.includes(primaryId)) {
      primaryId = actualRefs.find((r) => r.isPrimary)?.id || mergedRefIds[0];
    }

    // Explicitly enforce references: actualRefs so that DNA updates never overwrite or drop reference images
    const updated: CharacterVersion = {
      ...current,
      ...updates,
      references: actualRefs,
      referenceAssetIds: mergedRefIds,
      primaryReferenceAssetId: primaryId,
    };

    const newVersions = db.characterVersions.map((v) => {
      if (v.id === versionId) {
        return updated;
      }
      if (associatedVersionIds.includes(v.id)) {
        return {
          ...v,
          references: actualRefs,
          referenceAssetIds: mergedRefIds,
          primaryReferenceAssetId: primaryId,
        };
      }
      return v;
    });

    storageService.saveDatabase({ characterVersions: newVersions });
    return updated;
  }

  /**
   * Creates a brand-new immutable version from an existing version.
   * Ensures previous versions remain frozen for historical episodes.
   */
  public static createNewVersion(
    characterId: string,
    baseVersionId: string,
    newVersionLabel: string,
    changes: Partial<CharacterVersion>,
    changeNotes: string,
    setAsActive: boolean = true,
  ): CharacterVersion {
    const db = storageService.getDatabase();
    const baseVersion = this.getVersionById(baseVersionId);
    if (!baseVersion) {
      throw new Error(`Base version ${baseVersionId} not found`);
    }

    const newVersionId = `ver_${characterId.replace('char_', '')}_${newVersionLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;

    const newVersion: CharacterVersion = {
      ...baseVersion,
      ...changes,
      id: newVersionId,
      characterId,
      version: newVersionLabel,
      changeNotes,
      status: 'Active',
      primaryReferenceAssetId: undefined,
      referenceAssetIds: [],
      createdAt: new Date().toISOString(),
    };

    const updatedVersions = [newVersion, ...db.characterVersions];
    storageService.saveDatabase({ characterVersions: updatedVersions });

    // Clone isolated reference assets strictly under characters/{characterId}/{newVersionId}/
    CharacterReferenceService.cloneReferencesForNewVersion(
      baseVersionId,
      characterId,
      newVersionId,
    );

    if (setAsActive) {
      CharacterService.updateCharacter(characterId, {
        activeVersionId: newVersionId,
      });
    }

    return this.getVersionById(newVersionId) || newVersion;
  }

  public static setActiveVersion(characterId: string, versionId: string): void {
    CharacterService.updateCharacter(characterId, {
      activeVersionId: versionId,
    });
  }

  /**
   * Audit helper: returns list of episode IDs referencing this version snapshot
   */
  public static getReferencingEpisodes(characterVersionId: string): string[] {
    const episodes = storageService.getDatabase().episodes;
    return episodes
      .filter((ep) => Object.values(ep.characterVersionSnapshots).includes(characterVersionId))
      .map((ep) => ep.title);
  }
}
