/**
 * Phase 4.7 — Google Flow Director & Production Pack Types
 */

import { Shot, OutputMimeType } from './index';

export type ProviderExecutionMode =
  | 'REAL_API'
  | 'ASSISTED_FLOW'
  | 'LOCAL_ASSET'
  | 'SIMULATED';

export type FlowJobStatus =
  | 'DRAFT'
  | 'READY'
  | 'WAITING_FOR_FLOW'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'IMPORTED';

export type ReferencePurpose =
  | 'CHARACTER'
  | 'STYLE'
  | 'LOCATION'
  | 'PROP'
  | 'CONTINUITY'
  | 'STORYBOARD_REFERENCE';

export interface CameraTimelineEntry {
  timeRange: string; // e.g. "0-2s", "2-5s"
  description: string;
  movement?: string;
  framing?: string;
  focus?: string;
}

export interface SceneBrief {
  sceneTitle?: string;
  sceneIntent?: string;
  action: string;
  dialogue?: string;
  emotion: string;
  soundIntent?: string;
  specialNotes?: string;
  cameraTimeline?: CameraTimelineEntry[];
}

export interface TraceableReference {
  reference_id: string;
  reference_type: ReferencePurpose;
  version: string;
  source: string;
  purpose: string;
  url: string;
  thumbnailUrl?: string;
  characterId?: string;
  shotId?: string;
  isLocked?: boolean;
}

export interface EffectiveSettingsSnapshot {
  appliedHierarchy: string[]; // e.g. ["SYSTEM", "PROJECT", "EPISODE", "SCENE", "SHOT"]
  aspectRatio: string; // e.g. "16:9"
  shortsCropSafe: boolean; // true
  safeArea: 'CENTER' | 'RULE_OF_THIRDS';
  defaultResolution: string; // "1376x768"
  executionMode: ProviderExecutionMode;
  targetProvider: string; // "Google Flow"
  targetModel: string; // "Google Flow / Imagen 3 / Veo"
  enforceDnaLock: boolean; // true - IMMUTABLE
  enforceStyleLock: boolean; // true - IMMUTABLE
  enforceContinuity: boolean;
  autoSendToQA: boolean;
  uiLanguage: 'vi-VN' | 'en-US';
}

export interface ProductionPack {
  pack_id: string;
  canonical_input_hash: string;
  project_id: string;
  episode_id: string;
  scene_id: string;
  shot_id: string;
  created_at: string;
  canon_snapshot: {
    canonVersion: string;
    episodeTitle: string;
    sceneNumber: number;
    shotNumber: number;
    sceneCanon: {
      location: string;
      lighting: string;
      timeOfDay: string;
      weather?: string;
    };
  };
  effective_settings: EffectiveSettingsSnapshot;
  shot: Shot;
  scene_brief?: SceneBrief;
  camera_timeline?: CameraTimelineEntry[];
  characters: Array<{
    characterId: string;
    displayName: string;
    activeVersionId: string;
    versionNumber: string;
    dnaConstraints: string[];
    outfit: string;
    facialFeatures: string;
    hairStyle: string;
    skinTone: string;
    primaryReferenceAssetUrl?: string;
  }>;
  style: {
    styleVersionId: string;
    versionNumber: string;
    name: string;
    positivePrompt: string;
    negativePrompt: string;
    colorPaletteRule: string;
    lightingRule: string;
  };
  continuity: {
    previousShotId?: string;
    previousAction?: string;
    characterPositions?: string;
    propContinuity?: string;
    environmentContinuity?: string;
    allowedCharacters?: string[];
    excludedCharacters?: string[];
    characterAppearanceLocks?: string[];
    outfitLocks?: string[];
    props?: string[];
    location?: string;
    environment?: string;
    lighting?: string;
    language?: string;
    dialogueRequirements?: string;
    durationLimit?: string | number;
    continuityRules?: string[];
    relevantExclusions?: string[];
  };
  references: TraceableReference[];
  constraints: {
    aspectRatio: '16:9';
    shortsCropSafe: boolean;
    safeArea: 'CENTER';
    compositionRules: string[];
  };
  negative_constraints: string[];
}

export interface FlowGenerationJob {
  job_id: string;
  production_pack_id: string;
  shot_id: string;
  episode_id: string;
  storyboard_id: string;
  provider: string; // "Google Flow"
  provider_version: string;
  execution_mode: ProviderExecutionMode;
  status: FlowJobStatus;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  input_hash: string;
  request_id?: string;
  external_job_id?: string;
  output_asset_id?: string;
  error?: string | null;
}

export interface ProductionAsset {
  asset_id: string;
  shot_id: string;
  production_pack_id: string;
  job_id: string;
  provider: string;
  execution_mode: ProviderExecutionMode;
  model: string;
  canon_version: string;
  character_versions: Record<string, string>;
  style_version: string;
  reference_ids: string[];
  prompt: string;
  imageUrl: string;
  mimeType: OutputMimeType | string;
  width: number;
  height: number;
  fileSize: number;
  durationSeconds?: number;
  created_at: string;
  qa_status: 'PENDING_QA' | 'PASSED' | 'FLAGGED' | 'REJECTED';
  qa_notes?: string;
  isRealGoogleExecution: boolean; // STRICT: false unless real authenticated Google API call was made
  provenanceDetails: {
    importedAt?: string;
    importedBy?: string;
    sourceFileName?: string;
    validationPassed: boolean;
    integrityChecksum: string;
  };
}

export interface SystemSettings {
  general: {
    studioName: string;
    projectName: string;
    defaultLanguage: 'vi-VN' | 'en-US';
    timezone: string;
    autoSave: boolean;
  };
  language: {
    language?: 'vi' | 'en' | 'bilingual';
    activeLanguage?: 'vi' | 'en' | 'bilingual';
    locale?: string;
    primaryLocale: 'vi-VN' | 'en-US';
    bilingualMode: boolean;
    fallbackLocale: 'en-US' | 'vi-VN';
    showLanguageSwitcher?: boolean;
  };
  aiModel: {
    imageProvider?: 'gemini' | 'pollinations' | 'auto';
    pollinationsModel?: 'flux' | 'flux-3d' | 'turbo' | 'flux-anime' | 'flux-realism';
    geminiApiKey?: string;
    defaultImageModel: string;
    defaultVideoModel: string;
    fallbackModel: string;
    enableSafetyFilters: boolean;
    timeoutSeconds: number;
  };
  googleFlow: {
    defaultExecutionMode: ProviderExecutionMode;
    flowStudioUrl: string;
    autoExportPackage: boolean;
    autoValidateMime: boolean;
    autoSendToQA: boolean;
  };
  image: {
    defaultAspectRatio: '16:9' | '9:16' | '1:1';
    defaultResolution: '1376x768' | '1920x1080' | '1080x1920';
    defaultSteps: number;
    guidanceScale: number;
    defaultSampler: string;
  };
  video: {
    defaultFormat: 'mp4';
    frameRate: number;
    durationPerShot: number;
    maxVideoDuration: number;
  };
  audioVoice: {
    audioSampleRate: number;
    voiceModel: string;
    defaultTone: string;
  };
  characterConsistency: {
    enforceDnaLock: boolean; // Immutable Source of Truth guarantee
    enforceOutfitLock: boolean;
    strictHairConsistency: boolean;
    enableReferenceInjection: boolean;
  };
  continuity: {
    crossShotContinuityCheck: boolean;
    propTracking: boolean;
    positionPreservation: boolean;
  };
  composition: {
    defaultAspectRatio: '16:9';
    shortsSafeMode: boolean; // 9:16 crop safe
    safeAreaRatio: 'CENTER';
    framingPreference: string;
  };
  references: {
    maxReferencesPerShot: number;
    allowProjectReferences: boolean;
    enforceReferenceProvenance: boolean;
  };
  qa: {
    autoQAHandoff: boolean;
    requireManualApproval: boolean;
    rejectOnMimeMismatch: boolean;
    rejectOnDimensionMismatch: boolean;
  };
  storage: {
    localPersistenceKey: string;
    maxHistorySnapshots: number;
    autoPruneTemporaryAssets: boolean;
  };
  modules: {
    storyboard: boolean;
    promptCompiler: boolean;
    googleFlowDirector: boolean;
    qaEngine: boolean;
  };
}
