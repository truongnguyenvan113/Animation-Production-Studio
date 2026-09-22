import { CharacterReference, CharacterVersion, ReferenceType, Shot } from '../types';
import { storageService } from './storageService';
import {
  resolveCanonicalCharacterId,
  resolveCanonicalVersionId,
  getAssociatedVersionIds,
  getAssociatedCharacterIds,
} from './characterAliasMap';

export const CANONICAL_REFERENCE_TYPES: ReferenceType[] = [
  'front',
  '3/4',
  'side',
  'expression',
  'full-body',
  'custom',
];

export const REFERENCE_TYPE_LABELS: Record<
  string,
  { en: string; vi: string; description: string; angle: string }
> = {
  front: {
    en: 'Front Orthographic',
    vi: 'Chiếu diện trực giao (0°)',
    description: 'Neutral full-body stance, facing camera directly for blueprint proportions',
    angle: '0° Frontal',
  },
  '3/4': {
    en: '3/4 Angle / Beauty',
    vi: 'Góc nghiêng 3/4 (45°)',
    description: 'Hero beauty angle showing cheek volume, facial curvature, and silhouette',
    angle: '45° Semi-profile',
  },
  side: {
    en: 'Side Profile',
    vi: 'Hình chiếu cạnh (90°)',
    description: '90-degree orthogonal side view for nose, ear depth, and posture contour',
    angle: '90° Profile',
  },
  expression: {
    en: 'Expression Sheet',
    vi: 'Bảng biểu cảm khuôn mặt',
    description: 'Emotional range, joyful reactions, mouth shapes, and key facial expressions',
    angle: 'Emotional Array',
  },
  'full-body': {
    en: 'Full Body / Stance',
    vi: 'Toàn thân & Dáng đứng',
    description: 'Full turnaround posture, anatomy, footwear, and costume silhouette',
    angle: '360° Turnaround',
  },
  custom: {
    en: 'Custom / Turnaround',
    vi: 'Tùy biến / Phụ kiện & Chi tiết',
    description: 'Costume turnaround, signature props, hairstyle close-ups, or custom angles',
    angle: 'Signature Detail',
  },
};

export class CharacterReferenceService {
  /**
   * Generates the canonical storage path for an asset:
   * characters/{characterId}/{versionId}/{filename}
   */
  public static getCanonicalStoragePath(
    characterId: string,
    versionId: string,
    filenameOrId: string,
    ext: string = 'png',
  ): string {
    const basename = filenameOrId.replace(/^.*[\\/]/, '');
    const dotIndex = basename.lastIndexOf('.');
    let nameWithoutExt = basename;
    let actualExt = ext;
    if (dotIndex > 0) {
      nameWithoutExt = basename.substring(0, dotIndex);
      actualExt = basename.substring(dotIndex + 1);
    }
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const cleanExt = (actualExt || ext).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'png';
    return `characters/${characterId}/${versionId}/${cleanName}.${cleanExt}`;
  }

  /**
   * Returns all persistent character references from database.
   */
  public static getAllReferences(): CharacterReference[] {
    return storageService.getDatabase().characterReferences || [];
  }

  /**
   * Strictly returns reference assets belonging to a specific Character Version.
   * ARCHITECTURAL RULE: Never mix assets between Character Versions.
   */
  public static getReferencesForVersion(versionId: string): CharacterReference[] {
    const associated = getAssociatedVersionIds(versionId);
    return this.getAllReferences().filter((r) => associated.includes(r.characterVersionId));
  }

  /**
   * Strictly returns reference assets belonging to a canonical Character AND specific Version.
   * Scoped to characters/{characterId}/{versionId}/
   */
  public static getReferencesForCharacterAndVersion(
    characterId: string,
    versionId: string,
  ): CharacterReference[] {
    const associatedVersions = getAssociatedVersionIds(versionId);
    const associatedChars = getAssociatedCharacterIds(characterId);
    return this.getAllReferences().filter(
      (r) =>
        associatedChars.includes(r.characterId) &&
        associatedVersions.includes(r.characterVersionId),
    );
  }

  /**
   * Retrieves the designated primary reference asset for a Character Version.
   */
  public static getPrimaryReference(versionId: string): CharacterReference | undefined {
    const refs = this.getReferencesForVersion(versionId);
    return refs.find((r) => r.isPrimary) || refs[0];
  }

  /**
   * Returns a reference asset by its unique persistent ID.
   */
  public static getReferenceById(id: string): CharacterReference | undefined {
    return this.getAllReferences().find((r) => r.id === id);
  }

  /**
   * Adds and persists a new reference image asset strictly attached to a Character Version.
   * Path: characters/{characterId}/{versionId}/{id}.png
   */
  public static addReference(params: {
    characterId: string;
    characterVersionId: string;
    type: ReferenceType;
    image: string;
    description: string;
    isPrimary?: boolean;
    customFilename?: string;
    storagePath?: string;
    thumbnail?: string;
    fileSize?: number;
    mimeType?: string;
    width?: number;
    height?: number;
  }): CharacterReference {
    const db = storageService.getDatabase();
    
    const canonicalCharId = resolveCanonicalCharacterId(params.characterId) || params.characterId;
    let versionId = resolveCanonicalVersionId(params.characterVersionId) || params.characterVersionId;
    const associatedVersionIds = getAssociatedVersionIds(versionId);

    let targetVer = db.characterVersions.find((v) => associatedVersionIds.includes(v.id));
    if (!targetVer) {
      const associatedChars = getAssociatedCharacterIds(canonicalCharId);
      const char = db.characters.find((c) => associatedChars.includes(c.id));
      targetVer =
        db.characterVersions.find((v) => v.id === char?.activeVersionId) ||
        db.characterVersions.find((v) => associatedChars.includes(v.characterId));
      if (targetVer) {
        versionId = targetVer.id;
      }
    }

    const existingVersionRefs = this.getReferencesForVersion(versionId);

    // Generate stable persistent asset ID with random suffix to prevent collisions on rapid uploads
    const shortChar = canonicalCharId.replace('char_', '');
    const shortVer = versionId.replace('ver_', '');
    const cleanType = String(params.type || 'ref').toLowerCase().replace(/[^a-z0-9]/g, '');
    const timestamp = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const assetId = `ref_${shortChar}_${shortVer}_${cleanType}_${timestamp}`;

    const filename = params.customFilename
      ? params.customFilename
      : `${assetId}.png`;

    const storagePath =
      params.storagePath ||
      this.getCanonicalStoragePath(
        canonicalCharId,
        versionId,
        filename,
      );

    // If first asset for this version, or explicitly requested, set as primary
    const willBePrimary =
      params.isPrimary === true || existingVersionRefs.length === 0;

    const newRef: CharacterReference = {
      id: assetId,
      characterId: canonicalCharId,
      characterVersionId: versionId,
      storagePath,
      type: params.type,
      image: params.image,
      thumbnail: params.thumbnail || params.image,
      description: params.description || `${params.type} reference asset`,
      isPrimary: willBePrimary,
      active: true,
      createdAt: new Date().toISOString(),
      fileSize: params.fileSize,
      mimeType: params.mimeType,
      width: params.width,
      height: params.height,
    };

    // If primary, toggle existing references of this version to false
    let updatedRefs = [...db.characterReferences];
    if (willBePrimary) {
      updatedRefs = updatedRefs.map((r) => {
        if (associatedVersionIds.includes(r.characterVersionId)) {
          return { ...r, isPrimary: false };
        }
        return r;
      });
    }

    updatedRefs = [newRef, ...updatedRefs];

    // Synchronize Character DNA (CharacterVersion references) across associated version IDs
    const updatedVersions = db.characterVersions.map((v) => {
      if (associatedVersionIds.includes(v.id)) {
        const existingIds = v.referenceAssetIds || [];
        const newRefIds = Array.from(new Set([...existingIds, newRef.id]));
        const verRefs = updatedRefs.filter((r) => associatedVersionIds.includes(r.characterVersionId));
        return {
          ...v,
          references: verRefs,
          primaryReferenceAssetId: willBePrimary
            ? newRef.id
            : v.primaryReferenceAssetId || newRef.id,
          referenceAssetIds: newRefIds,
        };
      }
      return v;
    });

    storageService.saveDatabase({
      characterReferences: updatedRefs,
      characterVersions: updatedVersions,
    });

    return newRef;
  }

  /**
   * Adds multiple reference assets atomically in a single persistence call.
   */
  public static addMultipleReferences(
    items: Array<{
      characterId: string;
      characterVersionId: string;
      type: ReferenceType;
      image: string;
      thumbnail?: string;
      description?: string;
      isPrimary?: boolean;
      customFilename?: string;
      fileSize?: number;
      mimeType?: string;
      width?: number;
      height?: number;
    }>,
  ): CharacterReference[] {
    if (!items || items.length === 0) return [];
    const db = storageService.getDatabase();
    let currentRefs = [...db.characterReferences];
    let currentVersions = [...db.characterVersions];
    const created: CharacterReference[] = [];

    for (let i = 0; i < items.length; i++) {
      const params = items[i];
      const canonicalCharId = resolveCanonicalCharacterId(params.characterId) || params.characterId;
      let versionId = resolveCanonicalVersionId(params.characterVersionId) || params.characterVersionId;
      const associatedVersionIds = getAssociatedVersionIds(versionId);

      let targetVer = currentVersions.find((v) => associatedVersionIds.includes(v.id));
      if (!targetVer) {
        const associatedChars = getAssociatedCharacterIds(canonicalCharId);
        const char = db.characters.find((c) => associatedChars.includes(c.id));
        targetVer =
          currentVersions.find((v) => v.id === char?.activeVersionId) ||
          currentVersions.find((v) => associatedChars.includes(v.characterId));
        if (targetVer) {
          versionId = targetVer.id;
        }
      }

      const existingVersionRefs = currentRefs.filter((r) =>
        associatedVersionIds.includes(r.characterVersionId),
      );

      const shortChar = canonicalCharId.replace('char_', '');
      const shortVer = versionId.replace('ver_', '');
      const cleanType = String(params.type || 'ref').toLowerCase().replace(/[^a-z0-9]/g, '');
      const timestamp = `${Date.now().toString(36)}_${i}_${Math.random().toString(36).substring(2, 6)}`;
      const assetId = `ref_${shortChar}_${shortVer}_${cleanType}_${timestamp}`;

      const filename = params.customFilename || `${assetId}.png`;
      const storagePath = this.getCanonicalStoragePath(canonicalCharId, versionId, filename);

      const willBePrimary =
        params.isPrimary === true || (existingVersionRefs.length === 0 && i === 0);

      const newRef: CharacterReference = {
        id: assetId,
        characterId: canonicalCharId,
        characterVersionId: versionId,
        storagePath,
        type: params.type,
        image: params.image,
        thumbnail: params.thumbnail || params.image,
        description: params.description || `${params.type} reference asset`,
        isPrimary: willBePrimary,
        active: true,
        createdAt: new Date().toISOString(),
        fileSize: params.fileSize,
        mimeType: params.mimeType,
        width: params.width,
        height: params.height,
      };

      if (willBePrimary) {
        currentRefs = currentRefs.map((r) => {
          if (associatedVersionIds.includes(r.characterVersionId)) {
            return { ...r, isPrimary: false };
          }
          return r;
        });
      }

      currentRefs.unshift(newRef);
      created.push(newRef);

      currentVersions = currentVersions.map((v) => {
        if (associatedVersionIds.includes(v.id)) {
          const existingIds = v.referenceAssetIds || [];
          const newRefIds = Array.from(new Set([...existingIds, newRef.id]));
          const verRefs = currentRefs.filter((r) => associatedVersionIds.includes(r.characterVersionId));
          return {
            ...v,
            references: verRefs,
            primaryReferenceAssetId: willBePrimary
              ? newRef.id
              : v.primaryReferenceAssetId || newRef.id,
            referenceAssetIds: newRefIds,
          };
        }
        return v;
      });
    }

    storageService.saveDatabase({
      characterReferences: currentRefs,
      characterVersions: currentVersions,
    });

    return created;
  }

  /**
   * Sets a specific reference asset as Primary for its Character Version.
   * Updates all other references of the same version to non-primary.
   */
  public static setPrimaryReference(referenceId: string): void {
    const db = storageService.getDatabase();
    const targetRef = db.characterReferences.find((r) => r.id === referenceId);
    if (!targetRef) return;

    const associatedVersionIds = getAssociatedVersionIds(targetRef.characterVersionId);

    const updatedRefs = db.characterReferences.map((r) => {
      if (associatedVersionIds.includes(r.characterVersionId)) {
        return {
          ...r,
          isPrimary: r.id === referenceId,
        };
      }
      return r;
    });

    const updatedVersions = db.characterVersions.map((v) => {
      if (associatedVersionIds.includes(v.id)) {
        const verRefs = updatedRefs.filter((r) => associatedVersionIds.includes(r.characterVersionId));
        return {
          ...v,
          references: verRefs,
          primaryReferenceAssetId: referenceId,
        };
      }
      return v;
    });

    storageService.saveDatabase({
      characterReferences: updatedRefs,
      characterVersions: updatedVersions,
    });
  }

  /**
   * Deletes a reference asset and ensures Character DNA links remain consistent.
   */
  public static deleteReference(referenceId: string): void {
    const db = storageService.getDatabase();
    const targetRef = db.characterReferences.find((r) => r.id === referenceId);
    if (!targetRef) return;

    const associatedVersionIds = getAssociatedVersionIds(targetRef.characterVersionId);
    const remainingRefs = db.characterReferences.filter((r) => r.id !== referenceId);

    // If target was primary, pick another reference in the same version as primary
    let newPrimaryId: string | undefined = undefined;
    if (targetRef.isPrimary) {
      const versionSiblings = remainingRefs.filter((r) =>
        associatedVersionIds.includes(r.characterVersionId),
      );
      if (versionSiblings.length > 0) {
        versionSiblings[0].isPrimary = true;
        newPrimaryId = versionSiblings[0].id;
      }
    }

    const updatedVersions = db.characterVersions.map((v) => {
      if (associatedVersionIds.includes(v.id)) {
        const existingIds = (v.referenceAssetIds || []).filter((id) => id !== referenceId);
        const verRefs = remainingRefs.filter((r) => associatedVersionIds.includes(r.characterVersionId));
        return {
          ...v,
          references: verRefs,
          primaryReferenceAssetId:
            v.primaryReferenceAssetId === referenceId
              ? newPrimaryId
              : v.primaryReferenceAssetId,
          referenceAssetIds: existingIds,
        };
      }
      return v;
    });

    storageService.saveDatabase({
      characterReferences: remainingRefs,
      characterVersions: updatedVersions,
    });
  }

  /**
   * Clears all reference assets for a specific Character Version.
   */
  public static clearReferencesForVersion(versionId: string): void {
    const db = storageService.getDatabase();
    const associatedVersionIds = getAssociatedVersionIds(versionId);
    const remainingRefs = db.characterReferences.filter(
      (r) => !associatedVersionIds.includes(r.characterVersionId),
    );

    const updatedVersions = db.characterVersions.map((v) => {
      if (associatedVersionIds.includes(v.id)) {
        return {
          ...v,
          references: [],
          primaryReferenceAssetId: undefined,
          referenceAssetIds: [],
        };
      }
      return v;
    });

    storageService.saveDatabase({
      characterReferences: remainingRefs,
      characterVersions: updatedVersions,
    });
  }

  /**
   * Updates an existing reference asset's metadata.
   */
  public static updateReference(
    referenceId: string,
    updates: Partial<CharacterReference>,
  ): CharacterReference {
    const db = storageService.getDatabase();
    const index = db.characterReferences.findIndex((r) => r.id === referenceId);
    if (index === -1) {
      throw new Error(`Reference asset with ID ${referenceId} not found.`);
    }

    // Prohibit changing canonical characterId or characterVersionId to prevent cross-contamination
    const sanitized = { ...updates };
    delete (sanitized as any).characterId;
    delete (sanitized as any).characterVersionId;
    delete (sanitized as any).storagePath;

    const updated: CharacterReference = {
      ...db.characterReferences[index],
      ...sanitized,
    };

    const newRefs = [...db.characterReferences];
    newRefs[index] = updated;

    storageService.saveDatabase({ characterReferences: newRefs });
    return updated;
  }

  /**
   * Inherits locked Character Version reference assets for a Shot.
   * Maps characterId -> CharacterReference[] resolved strictly from locked version snapshot.
   */
  public static getReferencesForShot(
    shot: Shot,
  ): Record<string, CharacterReference[]> {
    const result: Record<string, CharacterReference[]> = {};

    shot.characterIds.forEach((charId) => {
      const lockedVerId = shot.characterDnaReferences[charId];
      if (lockedVerId) {
        result[charId] = this.getReferencesForCharacterAndVersion(charId, lockedVerId);
      }
    });

    return result;
  }

  /**
   * Clones reference assets when creating a new Character Version, ensuring strict version isolation.
   * Stored under: characters/{characterId}/{targetVersionId}/
   */
  public static cloneReferencesForNewVersion(
    sourceVersionId: string,
    targetCharacterId: string,
    targetVersionId: string,
  ): CharacterReference[] {
    const sourceRefs = this.getReferencesForVersion(sourceVersionId);
    if (sourceRefs.length === 0) return [];

    const db = storageService.getDatabase();
    const cloned: CharacterReference[] = sourceRefs.map((src, idx) => {
      const cleanType = src.type.toLowerCase().replace(/[^a-z0-9]/g, '');
      const newAssetId = `ref_${targetCharacterId.replace('char_', '')}_${targetVersionId.replace('ver_', '')}_${cleanType}_${Date.now().toString(36)}_${idx}`;
      const newStoragePath = this.getCanonicalStoragePath(
        targetCharacterId,
        targetVersionId,
        `${newAssetId}.png`,
      );

      return {
        ...src,
        id: newAssetId,
        characterId: targetCharacterId,
        characterVersionId: targetVersionId,
        storagePath: newStoragePath,
        createdAt: new Date().toISOString(),
      };
    });

    const updatedRefs = [...cloned, ...db.characterReferences];
    const primaryRef = cloned.find((c) => c.isPrimary) || cloned[0];

    const updatedVersions = db.characterVersions.map((v) => {
      if (v.id === targetVersionId) {
        return {
          ...v,
          primaryReferenceAssetId: primaryRef?.id,
          referenceAssetIds: cloned.map((c) => c.id),
        };
      }
      return v;
    });

    storageService.saveDatabase({
      characterReferences: updatedRefs,
      characterVersions: updatedVersions,
    });

    return cloned;
  }
}
