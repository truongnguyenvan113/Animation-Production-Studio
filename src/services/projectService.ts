import { Project } from '../types';
import { storageService } from './storageService';

export class ProjectService {
  public static getProject(): Project {
    return storageService.getDatabase().project;
  }

  public static updateProject(updates: Partial<Project>): Project {
    const current = this.getProject();
    const updated: Project = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    storageService.saveDatabase({ project: updated });
    return updated;
  }
}
