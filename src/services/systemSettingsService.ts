/**
 * System Settings Service
 * Manages global studio configuration, settings precedence, and effective snapshot resolution.
 */

import {
  SystemSettings,
  EffectiveSettingsSnapshot,
  ProviderExecutionMode,
  Shot,
  LanguageMode,
} from '../types';
import { storageService } from './storageService';

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  general: {
    studioName: 'Pi & Kem Animation Studio',
    projectName: 'Pi & Kem và Những Cuộc Phiêu Lưu Kỳ Thú',
    defaultLanguage: 'vi-VN',
    timezone: 'Asia/Ho_Chi_Minh',
    autoSave: true,
  },
  language: {
    language: 'vi',
    activeLanguage: 'vi',
    locale: 'vi-VN',
    primaryLocale: 'vi-VN',
    bilingualMode: true,
    fallbackLocale: 'en-US',
  },
  aiModel: {
    defaultImageModel: 'imagen-3.0-generate-002',
    defaultVideoModel: 'veo-3.1-generate-preview',
    fallbackModel: 'imagen-3.0-fast-generate-001',
    enableSafetyFilters: true,
    timeoutSeconds: 60,
  },
  googleFlow: {
    defaultExecutionMode: 'ASSISTED_FLOW',
    flowStudioUrl: 'https://labs.google/flow',
    autoExportPackage: true,
    autoValidateMime: true,
    autoSendToQA: true,
  },
  image: {
    defaultAspectRatio: '16:9',
    defaultResolution: '1376x768',
    defaultSteps: 30,
    guidanceScale: 7.5,
    defaultSampler: 'DPM++ 2M Karras',
  },
  video: {
    defaultFormat: 'mp4',
    frameRate: 24,
    durationPerShot: 4,
    maxVideoDuration: 120,
  },
  audioVoice: {
    audioSampleRate: 48000,
    voiceModel: 'gemini-voice-studio-vi',
    defaultTone: 'Ấm áp, tự nhiên, mang âm hưởng tuổi thơ Việt Nam',
  },
  characterConsistency: {
    enforceDnaLock: true,
    enforceOutfitLock: true,
    strictHairConsistency: true,
    enableReferenceInjection: true,
  },
  continuity: {
    crossShotContinuityCheck: true,
    propTracking: true,
    positionPreservation: true,
  },
  composition: {
    defaultAspectRatio: '16:9',
    shortsSafeMode: true,
    safeAreaRatio: 'CENTER',
    framingPreference: 'Rule of Thirds with Center Action Lock',
  },
  references: {
    maxReferencesPerShot: 5,
    allowProjectReferences: true,
    enforceReferenceProvenance: true,
  },
  qa: {
    autoQAHandoff: true,
    requireManualApproval: true,
    rejectOnMimeMismatch: true,
    rejectOnDimensionMismatch: true,
  },
  storage: {
    localPersistenceKey: 'pikem_animation_studio_v2',
    maxHistorySnapshots: 50,
    autoPruneTemporaryAssets: false,
  },
  modules: {
    storyboard: true,
    promptCompiler: true,
    googleFlowDirector: true,
    qaEngine: true,
  },
};

export class SystemSettingsService {
  private static instance: SystemSettingsService;
  private listeners: Set<(settings: SystemSettings) => void> = new Set();

  private constructor() {}

  public static getInstance(): SystemSettingsService {
    if (!SystemSettingsService.instance) {
      SystemSettingsService.instance = new SystemSettingsService();
    }
    return SystemSettingsService.instance;
  }

  public subscribe(listener: (settings: SystemSettings) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(settings: SystemSettings) {
    this.listeners.forEach((fn) => {
      try {
        fn(settings);
      } catch (err) {
        console.error('Error notifying system settings listener:', err);
      }
    });
  }

  /**
   * Resolves the active UI language mode from system settings.
   * Priority:
   * 1. settings.language.activeLanguage
   * 2. settings.language.language
   * 3. settings.language.primaryLocale ('vi-VN' -> 'vi', 'en-US' -> 'en')
   * 4. settings.general.defaultLanguage ('vi-VN' -> 'vi', 'en-US' -> 'en')
   * Default is 'vi'
   */
  public getActiveLanguageMode(): LanguageMode {
    const settings = this.getSettings();
    if (settings.language?.activeLanguage) {
      return settings.language.activeLanguage;
    }
    if (settings.language?.language) {
      return settings.language.language;
    }
    if (settings.language?.primaryLocale === 'vi-VN') {
      return 'vi';
    }
    if (settings.language?.primaryLocale === 'en-US') {
      return 'en';
    }
    if (settings.general?.defaultLanguage === 'vi-VN') {
      return 'vi';
    }
    if (settings.general?.defaultLanguage === 'en-US') {
      return 'en';
    }
    return 'vi';
  }

  /**
   * Retrieves the current system settings from database or defaults
   */
  public getSettings(): SystemSettings {
    const db = storageService.getDatabase();
    if (db.systemSettings) {
      // Merge with defaults to ensure all keys exist
      return {
        ...DEFAULT_SYSTEM_SETTINGS,
        ...db.systemSettings,
        general: { ...DEFAULT_SYSTEM_SETTINGS.general, ...(db.systemSettings.general || {}) },
        language: { ...DEFAULT_SYSTEM_SETTINGS.language, ...(db.systemSettings.language || {}) },
        aiModel: { ...DEFAULT_SYSTEM_SETTINGS.aiModel, ...(db.systemSettings.aiModel || {}) },
        googleFlow: { ...DEFAULT_SYSTEM_SETTINGS.googleFlow, ...(db.systemSettings.googleFlow || {}) },
        image: { ...DEFAULT_SYSTEM_SETTINGS.image, ...(db.systemSettings.image || {}) },
        video: { ...DEFAULT_SYSTEM_SETTINGS.video, ...(db.systemSettings.video || {}) },
        audioVoice: { ...DEFAULT_SYSTEM_SETTINGS.audioVoice, ...(db.systemSettings.audioVoice || {}) },
        characterConsistency: { ...DEFAULT_SYSTEM_SETTINGS.characterConsistency, ...(db.systemSettings.characterConsistency || {}) },
        continuity: { ...DEFAULT_SYSTEM_SETTINGS.continuity, ...(db.systemSettings.continuity || {}) },
        composition: { ...DEFAULT_SYSTEM_SETTINGS.composition, ...(db.systemSettings.composition || {}) },
        references: { ...DEFAULT_SYSTEM_SETTINGS.references, ...(db.systemSettings.references || {}) },
        qa: { ...DEFAULT_SYSTEM_SETTINGS.qa, ...(db.systemSettings.qa || {}) },
        storage: { ...DEFAULT_SYSTEM_SETTINGS.storage, ...(db.systemSettings.storage || {}) },
        modules: { ...DEFAULT_SYSTEM_SETTINGS.modules, ...(db.systemSettings.modules || {}) },
      };
    }
    return DEFAULT_SYSTEM_SETTINGS;
  }

  /**
   * Updates global system settings
   */
  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    const current = this.getSettings();
    const newSettings: SystemSettings = {
      ...current,
      ...updates,
    };
    storageService.saveDatabase({ systemSettings: newSettings });
    this.notify(newSettings);
    return newSettings;
  }

  /**
   * Resets settings to default
   */
  public resetToDefaults(): SystemSettings {
    storageService.saveDatabase({ systemSettings: DEFAULT_SYSTEM_SETTINGS });
    this.notify(DEFAULT_SYSTEM_SETTINGS);
    return DEFAULT_SYSTEM_SETTINGS;
  }

  /**
   * Resolves the Effective Settings Snapshot following strict precedence:
   * SYSTEM SETTINGS -> PROJECT SETTINGS -> EPISODE SETTINGS -> SCENE SETTINGS -> SHOT SETTINGS
   * 
   * INVARIANT: Character DNA and Style DNA remain controlled by their respective
   * Source of Truth systems. Settings MUST NOT override Character DNA.
   */
  public resolveEffectiveSettings(
    shot: Shot,
    customExecutionMode?: ProviderExecutionMode
  ): EffectiveSettingsSnapshot {
    const settings = this.getSettings();
    const appliedHierarchy = ['SYSTEM SETTINGS', 'PROJECT SETTINGS', 'EPISODE SETTINGS', 'SCENE SETTINGS', 'SHOT SETTINGS'];

    // Execution mode: custom > settings default (ASSISTED_FLOW)
    const executionMode: ProviderExecutionMode = customExecutionMode || settings.googleFlow.defaultExecutionMode;

    return {
      appliedHierarchy,
      aspectRatio: '16:9', // Default production canvas
      shortsCropSafe: settings.composition.shortsSafeMode, // 9:16 safe area
      safeArea: 'CENTER',
      defaultResolution: settings.image.defaultResolution,
      executionMode,
      targetProvider: 'Google Flow',
      targetModel: settings.aiModel.defaultImageModel,
      // INVARIANT LOCKS:
      enforceDnaLock: true,
      enforceStyleLock: true,
      enforceContinuity: settings.continuity.crossShotContinuityCheck,
      autoSendToQA: settings.googleFlow.autoSendToQA,
      uiLanguage: settings.language.primaryLocale,
    };
  }
}

export const systemSettingsService = SystemSettingsService.getInstance();
