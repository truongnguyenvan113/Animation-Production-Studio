/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shot, CharacterReference, ProjectReference, StudioDatabase } from '../types';
import { storageService } from './storageService';

/**
 * Checks whether a given string is a real, renderable visual image URI.
 * Rejects empty values, non-strings, or placeholder token strings (e.g. 'pi_front', 'ethan_front').
 */
export function isVisualImage(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;

  // Base64 data URL
  if (trimmed.startsWith('data:image/')) return true;

  // Standard web URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;

  // Root or relative paths
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('blob:')) {
    return true;
  }

  // File extension check (e.g. filename ending in image extension)
  if (/\.(png|jpg|jpeg|webp|gif|svg|bmp)(\?.*)?$/i.test(trimmed)) {
    return true;
  }

  return false;
}

export interface CharacterVisualResult {
  imageUrl?: string;
  characterId?: string;
  lockedVersionId?: string;
  versionNumber?: string;
  isInShot?: boolean;
  isAllowed?: boolean;
  isLocked?: boolean;
  isFallback: boolean;
  sourceRefId?: string;
  sourceStoragePath?: string;
  sourceType?: string;
}

export class CharacterImageResolver {
  /**
   * Resolves the visual image asset for a specific Character Version strictly by its versionId.
   * Priority:
   * 1. Primary Character Reference (from characterReferences)
   * 2. Any active Character Reference for that version
   * 3. Any matching Project Reference (type === 'character' | 'image') for that version
   * 4. Fallback (undefined imageUrl)
   */
  public static resolveVersionVisual(
    versionId?: string | null,
    db?: StudioDatabase
  ): CharacterVisualResult {
    if (!versionId) {
      return { isFallback: true };
    }

    const database = db || storageService.getDatabase();
    const version = database.characterVersions.find((v) => v.id === versionId);
    const characterId = version?.characterId;
    const versionNumber = version?.version;

    // 1. Check designated primary reference
    if (version?.primaryReferenceAssetId) {
      const primaryRef = database.characterReferences.find(
        (r) => r.id === version.primaryReferenceAssetId && r.active !== false
      );
      if (primaryRef) {
        if (isVisualImage(primaryRef.image)) {
          return {
            imageUrl: primaryRef.image,
            characterId,
            lockedVersionId: versionId,
            versionNumber,
            isFallback: false,
            sourceRefId: primaryRef.id,
            sourceStoragePath: primaryRef.storagePath,
            sourceType: primaryRef.type,
          };
        }
        if (isVisualImage(primaryRef.thumbnail)) {
          return {
            imageUrl: primaryRef.thumbnail,
            characterId,
            lockedVersionId: versionId,
            versionNumber,
            isFallback: false,
            sourceRefId: primaryRef.id,
            sourceStoragePath: primaryRef.storagePath,
            sourceType: primaryRef.type,
          };
        }
      }
    }

    // 2. Check all active character references for this version (primary first, then newest)
    const versionRefs = database.characterReferences
      .filter((r) => r.characterVersionId === versionId && r.active !== false)
      .sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });

    for (const ref of versionRefs) {
      if (isVisualImage(ref.image)) {
        return {
          imageUrl: ref.image,
          characterId,
          lockedVersionId: versionId,
          versionNumber,
          isFallback: false,
          sourceRefId: ref.id,
          sourceStoragePath: ref.storagePath,
          sourceType: ref.type,
        };
      }
      if (isVisualImage(ref.thumbnail)) {
        return {
          imageUrl: ref.thumbnail,
          characterId,
          lockedVersionId: versionId,
          versionNumber,
          isFallback: false,
          sourceRefId: ref.id,
          sourceStoragePath: ref.storagePath,
          sourceType: ref.type,
        };
      }
    }

    // 3. Check project references matching this characterVersionId
    const projRefs = (database.projectReferences || []).filter(
      (r) =>
        r.characterVersionId === versionId &&
        (r.type === 'character' || r.type === 'image')
    );

    for (const pref of projRefs) {
      const candidate = pref.uri || pref.thumbnail;
      if (isVisualImage(candidate)) {
        return {
          imageUrl: candidate,
          characterId,
          lockedVersionId: versionId,
          versionNumber,
          isFallback: false,
          sourceRefId: pref.id,
          sourceStoragePath: pref.storagePath,
          sourceType: pref.type,
        };
      }
    }

    return {
      imageUrl: undefined,
      characterId,
      lockedVersionId: versionId,
      versionNumber,
      isFallback: true,
    };
  }

  /**
   * Resolves the visual image asset for a character within the context of a Shot.
   * STRICT INTEGRITY RULE: Always resolves through the Shot's immutable version lock (characterDnaReferences / characterVersionSnapshots),
   * NEVER through the global mutable activeVersionId!
   */
  public static resolveShotCharacterVisual(
    shot: Shot,
    characterId: string,
    db?: StudioDatabase
  ): CharacterVisualResult {
    const database = db || storageService.getDatabase();
    const isInShot = Array.isArray(shot.characterIds) && shot.characterIds.includes(characterId);

    // Check exclusion in shot continuity notes or metadata
    const excludedCharacters = (shot.continuityNotes as any)?.excludedCharacters || [];
    const isExcluded = Array.isArray(excludedCharacters) && excludedCharacters.includes(characterId);

    // Look up version lock on the shot
    const anyShot = shot as any;
    let lockedVersionId: string | undefined =
      shot.characterDnaReferences?.[characterId] ||
      anyShot.characterVersionSnapshots?.[characterId];

    // Fallback: If not on shot directly, check episode-level snapshot
    if (!lockedVersionId && anyShot.episodeId) {
      const ep = database.episodes.find((e) => e.id === anyShot.episodeId);
      if (ep?.characterVersionSnapshots) {
        lockedVersionId = ep.characterVersionSnapshots[characterId];
      }
    }

    if (lockedVersionId) {
      const res = this.resolveVersionVisual(lockedVersionId, database);
      return {
        ...res,
        characterId,
        lockedVersionId,
        isInShot,
        isAllowed: !isExcluded,
        isLocked: true,
      };
    }

    // If character has no lock for this shot
    return {
      imageUrl: undefined,
      characterId,
      lockedVersionId: undefined,
      isInShot,
      isAllowed: !isExcluded,
      isLocked: false,
      isFallback: true,
    };
  }

  /**
   * Resolves the visual image asset for a character ONLY in non-shot global contexts (e.g. global character card/list).
   * Do NOT use this for shots.
   */
  public static resolveActiveVisual(
    characterId: string,
    db?: StudioDatabase
  ): CharacterVisualResult {
    const database = db || storageService.getDatabase();
    const character = database.characters.find((c) => c.id === characterId);
    if (character?.activeVersionId) {
      return this.resolveVersionVisual(character.activeVersionId, database);
    }
    return { characterId, isFallback: true };
  }
}
