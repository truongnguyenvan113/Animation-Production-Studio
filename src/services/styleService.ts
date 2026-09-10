import { GlobalStyle, GlobalStyleVersion } from '../types';
import { storageService } from './storageService';

export class StyleService {
  public static getGlobalStyle(): GlobalStyle {
    return storageService.getDatabase().globalStyle;
  }

  public static getAllStyleVersions(): GlobalStyleVersion[] {
    return storageService
      .getDatabase()
      .globalStyleVersions.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  public static getActiveStyleVersion(): GlobalStyleVersion | undefined {
    const style = this.getGlobalStyle();
    return this.getStyleVersionById(style.activeVersionId);
  }

  public static getStyleVersionById(id: string): GlobalStyleVersion | undefined {
    return storageService.getDatabase().globalStyleVersions.find((v) => v.id === id);
  }

  public static updateStyleVersion(
    versionId: string,
    updates: Partial<GlobalStyleVersion>,
  ): GlobalStyleVersion {
    const db = storageService.getDatabase();
    const index = db.globalStyleVersions.findIndex((v) => v.id === versionId);
    if (index === -1) {
      throw new Error(`GlobalStyleVersion ${versionId} not found`);
    }

    const updated = {
      ...db.globalStyleVersions[index],
      ...updates,
    };

    const newVersions = [...db.globalStyleVersions];
    newVersions[index] = updated;
    storageService.saveDatabase({ globalStyleVersions: newVersions });
    return updated;
  }

  public static createNewStyleVersion(
    baseVersionId: string,
    newVersionLabel: string,
    changes: Partial<GlobalStyleVersion>,
    changeNotes: string,
    setAsActive: boolean = true,
  ): GlobalStyleVersion {
    const db = storageService.getDatabase();
    const base = this.getStyleVersionById(baseVersionId);
    if (!base) {
      throw new Error(`Base style version ${baseVersionId} not found`);
    }

    const newId = `style_ver_${newVersionLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const newVersion: GlobalStyleVersion = {
      ...base,
      ...changes,
      id: newId,
      styleId: base.styleId,
      version: newVersionLabel,
      changeNotes,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    const newVersions = [newVersion, ...db.globalStyleVersions];
    storageService.saveDatabase({ globalStyleVersions: newVersions });

    if (setAsActive) {
      const style = db.globalStyle;
      storageService.saveDatabase({
        globalStyle: { ...style, activeVersionId: newId, updatedAt: new Date().toISOString() },
      });
    }

    return newVersion;
  }

  public static setActiveStyleVersion(versionId: string): void {
    const style = this.getGlobalStyle();
    storageService.saveDatabase({
      globalStyle: { ...style, activeVersionId: versionId, updatedAt: new Date().toISOString() },
    });
  }
}
