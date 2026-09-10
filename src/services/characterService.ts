import { Character, CharacterReference, ReferenceType } from '../types';
import { storageService } from './storageService';
import { CharacterReferenceService } from './characterReferenceService';

export class CharacterService {
  public static getAllCharacters(): Character[] {
    return storageService.getDatabase().characters;
  }

  public static getMainCharacters(): Character[] {
    return storageService.getDatabase().characters.filter((c) => !c.isSupporting);
  }

  public static getSupportingCharacters(): Character[] {
    return storageService.getDatabase().characters.filter((c) => c.isSupporting);
  }

  public static getCharacterById(id: string): Character | undefined {
    return storageService.getDatabase().characters.find((c) => c.id === id);
  }

  public static updateCharacter(id: string, updates: Partial<Character>): Character {
    const chars = storageService.getDatabase().characters;
    const index = chars.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Character with id ${id} not found`);
    }

    const updated = {
      ...chars[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const newChars = [...chars];
    newChars[index] = updated;
    storageService.saveDatabase({ characters: newChars });
    return updated;
  }

  public static getAllReferences(): CharacterReference[] {
    return CharacterReferenceService.getAllReferences();
  }

  public static getReferencesForVersion(versionId: string): CharacterReference[] {
    return CharacterReferenceService.getReferencesForVersion(versionId);
  }

  public static getReferencesForCharacter(characterId: string): CharacterReference[] {
    return CharacterReferenceService.getAllReferences().filter(
      (r) => r.characterId === characterId,
    );
  }

  public static getReferencesForCharacterAndVersion(
    characterId: string,
    versionId: string,
  ): CharacterReference[] {
    return CharacterReferenceService.getReferencesForCharacterAndVersion(
      characterId,
      versionId,
    );
  }

  public static getPrimaryReference(versionId: string): CharacterReference | undefined {
    return CharacterReferenceService.getPrimaryReference(versionId);
  }

  public static addReference(
    ref: Partial<CharacterReference> & {
      characterId: string;
      characterVersionId: string;
      type: ReferenceType;
      image: string;
      description?: string;
    },
  ): CharacterReference {
    return CharacterReferenceService.addReference({
      characterId: ref.characterId,
      characterVersionId: ref.characterVersionId,
      type: ref.type,
      image: ref.image,
      description: ref.description || '',
      isPrimary: ref.isPrimary,
      fileSize: ref.fileSize,
      mimeType: ref.mimeType,
      width: ref.width,
      height: ref.height,
    });
  }

  public static setPrimaryReference(refId: string): void {
    CharacterReferenceService.setPrimaryReference(refId);
  }

  public static deleteReference(refId: string): void {
    CharacterReferenceService.deleteReference(refId);
  }

  public static toggleReferenceActive(refId: string): void {
    const refs = storageService.getDatabase().characterReferences.map((r) => {
      if (r.id === refId) {
        return { ...r, active: !r.active };
      }
      return r;
    });
    storageService.saveDatabase({ characterReferences: refs });
  }
}
