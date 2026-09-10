import { Season } from '../types';
import { storageService } from './storageService';

export class SeasonService {
  public static getAllSeasons(): Season[] {
    return storageService
      .getDatabase()
      .seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
  }

  public static getSeasonById(id: string): Season | undefined {
    return storageService.getDatabase().seasons.find((s) => s.id === id);
  }

  public static updateSeason(id: string, updates: Partial<Season>): Season {
    const db = storageService.getDatabase();
    const index = db.seasons.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Season ${id} not found`);
    }

    const updated = {
      ...db.seasons[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const newSeasons = [...db.seasons];
    newSeasons[index] = updated;
    storageService.saveDatabase({ seasons: newSeasons });
    return updated;
  }

  public static createSeason(
    data: Omit<Season, 'id' | 'createdAt' | 'updatedAt'>,
  ): Season {
    const db = storageService.getDatabase();
    const newSeason: Season = {
      ...data,
      id: `season_${String(data.seasonNumber).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storageService.saveDatabase({ seasons: [...db.seasons, newSeason] });
    return newSeason;
  }
}
