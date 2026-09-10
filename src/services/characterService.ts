import { Character, CharacterReference } from '../types';
import { storageService } from './storageService';

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
    return storageService.getDatabase().characterReferences;
  }

  public static getReferencesForVersion(versionId: string): CharacterReference[] {
    return storageService.getDatabase().characterReferences.filter(
      (r) => r.characterVersionId === versionId,
    );
  }

  public static getReferencesForCharacter(characterId: string): CharacterReference[] {
    return storageService.getDatabase().characterReferences.filter(
      (r) => r.characterId === characterId,
    );
  }

  public static addReference(
    ref: Omit<CharacterReference, 'id' | 'createdAt'>,
  ): CharacterReference {
    const newRef: CharacterReference = {
      ...ref,
      id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    };

    const refs = storageService.getDatabase().characterReferences;
    storageService.saveDatabase({ characterReferences: [newRef, ...refs] });
    return newRef;
  }

  public static deleteReference(refId: string): void {
    const refs = storageService.getDatabase().characterReferences.filter((r) => r.id !== refId);
    storageService.saveDatabase({ characterReferences: refs });
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
