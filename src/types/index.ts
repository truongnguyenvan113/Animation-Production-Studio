import { ProviderExecutionMode, CameraTimelineEntry, SceneBrief } from './flowTypes';

export type ReferenceType =
  | 'front'
  | '3/4'
  | 'side'
  | 'expression'
  | 'expressions'
  | 'full-body'
  | 'custom'
  | 'Front'
  | 'Side'
  | 'Full Body'
  | 'Face'
  | 'Expression'
  | 'Expressions'
  | 'Clothing'
  | 'Pose'
  | 'Custom'
  | 'Other';

export type CharacterStatus = 'Active' | 'Draft' | 'Archived' | 'Deprecated';

export type SeasonStatus = 'Planning' | 'In Production' | 'Completed' | 'Post-Production';

export type EpisodeStatus =
  | 'Idea'
  | 'Draft'
  | 'Story Generated'
  | 'Storyboard Generated'
  | 'Prompts Ready'
  | 'Rendering'
  | 'Editing'
  | 'Completed'
  | 'Published';

export interface Project {
  id: string;
  name: string;
  vietnameseName: string;
  description: string;
  universe: string;
  targetAudience: string;
  aspectRatio: string;
  defaultLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  projectId: string;
  displayName: string;
  englishName: string;
  vietnameseName: string;
  role: string;
  isSupporting: boolean;
  activeVersionId: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    bgGradients: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CharacterVersion {
  id: string;
  characterId: string;
  version: string; // e.g. "v1.0", "v1.1", "v2.0"
  changeNotes?: string;
  occupation?: string; // Canonical occupation
  likes?: string; // Canonical hobbies / likes
  species?: string; // e.g. Small fluffy cream-colored puppy (Dog)
  visualIdentity?: string; // Canonical visual identity statement
  age: string;
  gender: string;
  height: string;
  bodyProportions: string;
  faceShape: string;
  skinTone: string;
  hair: string;
  eyes: string;
  nose: string;
  mouth: string;
  facialExpression: string;
  clothing: string;
  shoes: string;
  accessories: string;
  personality: string;
  behavior: string;
  voiceDescription: string;
  typicalEmotions: string;
  typicalGestures: string;
  relationships: string;
  visualKeywords: string[];
  characterPrompt: string;
  negativePrompt: string;
  status: CharacterStatus;
  primaryReferenceAssetId?: string; // Canonical primary reference asset ID
  referenceAssetIds?: string[]; // IDs of reference assets attached to this version
  createdAt: string;
}

export interface CharacterReference {
  id: string; // Persistent unique asset ID e.g. "ref_pi_v1_front_01"
  characterId: string; // Canonical Character ID
  characterVersionId: string; // Canonical Character Version ID
  storagePath: string; // Canonical path: "characters/{characterId}/{versionId}/{id}.png"
  type: ReferenceType; // front, 3/4, side, expressions, full-body, custom
  image: string; // Data URL, file path, or image URL
  thumbnail?: string;
  description: string;
  isPrimary: boolean; // Primary reference flag
  active: boolean;
  createdAt: string;
  fileSize?: number; // File size in bytes
  mimeType?: string;
  width?: number;
  height?: number;
}

export type ProjectReferenceType =
  | 'image'
  | 'video'
  | 'character'
  | 'style'
  | 'location'
  | 'prop';

export type ProjectReferenceSource =
  | 'uploaded_image'
  | 'generated_image'
  | 'uploaded_video'
  | 'generated_video'
  | 'character_sheet'
  | 'style_guide';

export interface ProjectReference {
  id: string; // Persistent unique asset ID e.g. "pref_img_001", "pref_vid_001"
  name: string;
  description?: string;
  type: ProjectReferenceType; // image | video | character | style | location | prop
  source: ProjectReferenceSource; // uploaded_image | generated_image | uploaded_video | generated_video | character_sheet | style_guide
  uri: string; // Data URL, SVG URI, video path, or canonical URI
  storagePath: string; // Canonical storage path: "references/images/{id}.png", etc.
  thumbnail?: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;

  // Exact character + version link (Character DNA integrity)
  characterId?: string;
  characterVersionId?: string;

  // Visual/style & shot provenance
  styleVersionId?: string;
  episodeId?: string;
  shotId?: string;
  jobId?: string;
  outputAssetId?: string;

  // Media dimensions & format
  aspectRatio?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  fileSize?: number;
  mimeType?: string;
  isFavorite?: boolean;
}

export interface GlobalStyle {
  id: string;
  projectId: string;
  name: string;
  activeVersionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalStyleVersion {
  id: string;
  styleId: string;
  version: string;
  changeNotes?: string;
  animationStyle: string;
  lighting: string;
  colorPalette: string;
  cameraStyle: string;
  environmentStyle: string;
  characterRendering: string;
  texture: string;
  cinematography: string;
  aspectRatio: string;
  resolution: string;
  fps: number;
  targetPlatform: string;
  globalPrompt: string;
  negativePrompt: string;
  status: 'Active' | 'Draft' | 'Archived';
  createdAt: string;
}

export interface Season {
  id: string;
  projectId: string;
  seasonNumber: number;
  title: string;
  vietnameseTitle?: string;
  description: string;
  theme: string;
  audience: string;
  startDate: string;
  endDate: string;
  episodeCount: number;
  styleVersionId: string;
  seasonCharacters: string[]; // Character IDs
  notes: string;
  status: SeasonStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DialogueLine {
  characterId: string;
  characterName: string;
  line: string;
  emotion?: string;
  deliveryNote?: string;
}

export interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  location: string;
  timeOfDay: string;
  lighting: string;
  characterIds: string[];
  characterDnaReferences: Record<string, string>; // Maps characterId -> specific CharacterVersionId snapshot
  action: string;
  dialogue: DialogueLine[];
  emotion: string;
  storyPurpose: string;
  educationalPurpose: string;
  cameraDirection?: string;
  soundIntent?: string;
  specialNotes?: string;
  estimatedDurationSeconds?: number;
}

export interface StoryDraft {
  id: string;
  episodeId: string;
  title: string;
  premise: string;
  theme?: string;
  educationalLesson: string;
  targetAudience: string;
  targetDuration: string;
  additionalNotes?: string;
  targetPlatform?: string;
  beginning: string;
  middle: string;
  ending: string;
  emotionalArc: string;
  location: string;
  characterParticipation: Array<{
    characterId: string;
    characterName: string;
    characterRole: string;
    versionSnapshotId: string;
    participationRole: string;
  }>;
  styleVersionSnapshotId: string;
  scenes: Scene[];
  createdAt: string;
  updatedAt: string;
}

export interface Episode {
  id: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  storyIdea: string;
  theme: string;
  educationalMessage: string;
  targetAudience?: string;
  targetDuration?: string;
  additionalNotes?: string;
  characterIds: string[];
  supportingCharacterIds: string[];
  allowedCharacters?: string[];
  excludedCharacters?: string[];
  props?: string[];
  language?: string;
  durationLimit?: string | number;
  continuityRules?: string[];
  location: string;
  duration: string;
  targetPlatform: string;
  status: EpisodeStatus;
  // HISTORICAL SNAPSHOT RULE:
  // Maps characterId -> specific characterVersionId used for this episode
  characterVersionSnapshots: Record<string, string>;
  // Exact GlobalStyleVersion used for this episode
  styleVersionSnapshotId: string;
  storyDraft?: StoryDraft;
  scenes?: Scene[];
  storyboardId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ShotType =
  | 'Establishing Shot'
  | 'Wide Shot'
  | 'Medium Shot'
  | 'Medium Close-Up'
  | 'Close-Up'
  | 'Extreme Close-Up'
  | 'Over-the-Shoulder'
  | 'Two-Shot'
  | 'Tracking Shot'
  | 'Insert Shot';

export type ShotGenerationStatus =
  | 'Not Generated'
  | 'Queued'
  | 'Generating'
  | 'Generated'
  | 'Approved'
  | 'Flagged';

export interface ShotContinuityNotes {
  characterPositions?: string;
  objectPositions?: string;
  environmentContinuity?: string;
  propContinuity?: string;
  actionContinuity?: string;
  previousShotRelationship?: string;
}

export interface Shot {
  id: string; // e.g. "shot_ep009_s01_01"
  storyboardSceneId: string;
  sceneNumber: number;
  shotNumber: number;
  shotType: ShotType;
  durationSeconds: number;
  cameraDirection: string;
  framing: string;
  cameraMovement: string;
  cameraAngle?: string;
  subject?: string;
  visualFocus?: string;
  action: string;
  characterIds: string[];
  // INHERITED FROM EPISODE SNAPSHOT - IMMUTABLE PER SHOT
  characterDnaReferences: Record<string, string>;
  // INHERITED FROM EPISODE SNAPSHOT - IMMUTABLE PER SHOT
  styleVersionSnapshotId: string;
  // INHERITED LOCKED REFERENCE ASSETS PER CHARACTER (maps characterId -> reference asset IDs)
  characterReferenceAssetIds?: Record<string, string[]>;
  characterPrimaryReferenceAssets?: Record<string, string>;
  location: string;
  timeOfDay: string;
  lighting: string;
  dialogue?: string;
  speakerCharacterId?: string;
  speakerCharacterName?: string;
  emotion: string;
  visualPurpose: string;
  sceneIntent?: string;
  soundIntent?: string;
  specialNotes?: string;
  cameraTimeline?: CameraTimelineEntry[];
  continuityNotes: ShotContinuityNotes;
  generationStatus: ShotGenerationStatus;
  activeImageOutputUrl?: string;
  activeImageJobId?: string;
  activeOutputAssetId?: string;
  isMockOutput?: boolean;
  isProductionReadyKeyframe?: boolean;
  outputMimeType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoryboardScene {
  id: string; // e.g. "sb_scene_ep009_01"
  episodeSceneId: string; // references Scene.id (e.g. "scene_ep9_01")
  sceneNumber: number;
  title?: string;
  location?: string;
  timeOfDay?: string;
  lighting?: string;
  shots: Shot[];
}

export type StoryboardStatus =
  | 'Draft'
  | 'In Review'
  | 'Approved'
  | 'Ready for Video';

export interface StoryboardRevision {
  id: string; // e.g. "rev_sb_ep009_v1"
  revisionNumber: number;
  episodeVersion: string | number;
  scenes: StoryboardScene[];
  totalShots: number;
  totalDurationSeconds: number;
  status: StoryboardStatus;
  createdAt: string;
  archivedAt: string;
  note?: string;
}

export interface Storyboard {
  id: string; // e.g. "sb_ep009"
  episodeId: string;
  episodeVersion?: string | number;
  revisionNumber?: number;
  revisions?: StoryboardRevision[];
  status: StoryboardStatus;
  characterVersionSnapshots: Record<string, string>;
  styleVersionSnapshotId: string;
  scenes: StoryboardScene[];
  totalShots: number;
  totalDurationSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderAdapterSpec {
  id: string;
  name: string;
  category: 'Video Generation' | 'Camera Motion' | 'Character Consistency';
  status: 'Architecture Ready' | 'Adapter Staged' | 'Planned';
  description: string;
  supportedRatios: string[];
  maxDurationSeconds: number;
  promptSyntaxPattern: string;
  dnaIndependenceGuarantee: string;
}

export type LanguageMode = 'bilingual' | 'vi' | 'en';

// ==========================================
// PHASE 4: IMAGE GENERATION PIPELINE TYPES
// ==========================================

export type ImageGenerationProvider =
  | 'mock-studio'
  | 'gemini-imagen'
  | 'midjourney'
  | 'flux-pro'
  | 'stable-diffusion'
  | 'dall-e-3';

export type ImageGenerationJobStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type OutputApprovalStatus = 'pending' | 'approved' | 'rejected';

export type OutputAssetType = 'mock' | 'image';
export type OutputMimeType =
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/svg+xml';

export interface ImageGenerationOutputAsset {
  id: string; // e.g. "out_job_img_001_01"
  outputId?: string; // Explicit alias for id
  jobId: string;
  shotId: string;
  iterationNumber?: number; // 1, 2, 3...
  imageUrl: string; // High-res Data URL or canonical URI
  thumbnailUrl?: string;
  storagePath: string; // Canonical: "renders/episodes/{episodeId}/shots/{shotId}/output_{timestamp}.png"
  outputType: OutputAssetType; // "mock" | "image"
  mimeType: OutputMimeType | string; // "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml"
  isApproved?: boolean;
  approvalStatus?: OutputApprovalStatus;
  rejectionReason?: string;
  rejectionTimestamp?: string;
  approvedTimestamp?: string;
  deterministicHash?: string;
  aspectRatio: string;
  width: number;
  height: number;
  fileSize?: number;
  seed?: number;
  provider?: ImageGenerationProvider;
  model?: string;
  requestId?: string;
  createdAt: string;
  isProductionReady?: boolean;
  isMock?: boolean;
  executionMode?: ProviderExecutionMode;
  isRealGoogleExecution?: boolean;
}

export interface ImageGenerationPromptBreakdown {
  styleDna: string;
  charactersDna: string[];
  referenceAssets: string[];
  environment: string;
  cameraAndLighting: string;
  actionAndEmotion: string;
  continuity: string;
  dialogueCue: string;
}

export interface GenerationInputSnapshot {
  snapshotCreatedAt: string;
  deterministicPayloadHash: string;
  shotPayload: {
    id: string;
    shotNumber: number;
    sceneNumber: number;
    shotType: string;
    durationSeconds: number;
    action: string;
    cameraDirection: string;
    framing: string;
    cameraMovement: string;
    cameraAngle?: string;
    lighting: string;
    location: string;
    dialogue?: string;
    speakerCharacterName?: string;
    emotion: string;
    visualPurpose: string;
    characterIds: string[];
  };
  resolvedCharacterVersions: Array<{
    characterId: string;
    characterName: string;
    characterVersionId: string;
    versionNumber: string;
    visualPromptSnippet: string;
    canonicalAppearance: string;
  }>;
  resolvedReferenceAssets: Array<{
    id: string;
    characterId: string;
    characterVersionId: string;
    label: string;
    viewAngle: string;
    storagePath: string;
  }>;
  resolvedProjectReferences?: Array<{
    id: string;
    name: string;
    type: string;
    source: string;
    uri: string;
    storagePath: string;
    characterId?: string;
    characterVersionId?: string;
    tags?: string[];
  }>;
  resolvedStyleSnapshot: {
    id: string;
    versionNumber: string;
    name: string;
    positivePrompt: string;
    negativePrompt: string;
    colorPaletteRule: string;
    lightingRule: string;
  };
  compiledPrompt: string;
  negativePrompt: string;
}

export interface GenerationIntegrityAuditResult {
  jobId: string;
  shotId: string;
  auditTimestamp: string;
  isImmutable: boolean;
  score: number; // 100%
  checks: {
    zeroActiveCharacterStateLeak: {
      passed: boolean;
      details: string;
      lockedVersions: Record<string, string>;
      activeVersionsInDb: Record<string, string>;
    };
    zeroActiveStyleStateLeak: {
      passed: boolean;
      details: string;
      lockedStyleVersionId: string;
      activeStyleVersionIdInDb: string;
    };
    referenceAssetIsolation: {
      passed: boolean;
      details: string;
      resolvedAssetIds: string[];
      invalidAssetIds: string[];
    };
    deterministicInputChecksum: {
      passed: boolean;
      checksum: string;
      details: string;
    };
    regenerationImmutabilityGuarantee: {
      passed: boolean;
      details: string;
      previousOutputsCount: number;
      outputsArePreserved: boolean;
    };
  };
}

export interface ImageGenerationJob {
  id: string; // e.g. "img_job_shot_ep009_s01_01_1720000000"
  shotId: string;
  shotNumber: number;
  sceneId: string;
  sceneNumber: number;
  episodeId: string;
  storyboardId: string;

  // REGENERATION & ITERATION TRACKING
  parentJobId?: string; // If regenerated, points to previous job ID
  iterationNumber?: number; // 1 (initial run), 2, 3...

  // COMPLETE FROZEN GENERATION INPUT SNAPSHOT
  inputSnapshot?: GenerationInputSnapshot;

  // IMMUTABILITY CONTRACT:
  // Strictly extracted from Shot - NEVER active or current version
  characterDnaSnapshots: Record<string, string>; // characterId -> CharacterVersionId
  characterVersionNames?: Record<string, string>; // characterId -> "v1.0"
  referenceAssetIds: string[]; // Resolved reference asset IDs strictly from locked CharacterVersion
  referenceAssetPaths: Record<string, string>; // refId -> "characters/{charId}/{verId}/..."
  projectReferenceIds?: string[]; // Selected project reference IDs
  projectReferenceSnapshots?: Array<{
    id: string;
    name: string;
    type: string;
    source: string;
    uri: string;
    storagePath: string;
    characterId?: string;
    characterVersionId?: string;
    tags?: string[];
  }>;
  styleVersionSnapshotId: string; // Strictly from shot.styleVersionSnapshotId
  styleVersionName?: string; // "v1.0"

  // PROMPT SPECIFICATION
  prompt: string; // Fully compiled prompt string
  negativePrompt?: string;
  promptBreakdown?: ImageGenerationPromptBreakdown;

  // PROVIDER & EXECUTION
  provider: ImageGenerationProvider;
  executionMode?: ProviderExecutionMode;
  isRealGoogleExecution?: boolean;
  modelName?: string;
  status: ImageGenerationJobStatus;
  progress: number; // 0 to 100
  params: {
    aspectRatio: string;
    resolution: string;
    seed?: number;
    steps?: number;
    guidanceScale?: number;
    sampler?: string;
  };

  // OUTPUTS & AUDIT TIMESTAMPS
  requestId?: string; // Provider request/generation ID
  rateLimitInfo?: ProviderRateLimitInfo;
  outputAssets: ImageGenerationOutputAsset[];
  error: string | null;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  executionDurationMs?: number;
}

export interface ProviderRateLimitInfo {
  isRateLimited: boolean;
  retryAfterSeconds?: number;
  quotaExceeded?: boolean;
  failedModel?: string;
  suggestedAlternativeModel?: string;
  suggestedProvider?: ImageGenerationProvider;
  attemptCount?: number;
  rawErrorMessage?: string;
}

export interface ImmutableJobSnapshot {
  jobId: string;
  shotId: string;
  episodeId: string;
  storyboardId: string;
  sceneNumber: number;
  shotNumber: number;
  iterationNumber: number;
  deterministicPayloadHash: string;

  // STRICT IMMUTABILITY CONTRACT:
  // Provider receives ONLY frozen snapshot parameters - NEVER active Character/Style state
  prompt: string;
  negativePrompt?: string;
  characterVersionIds: Record<string, string>; // characterId -> frozen CharacterVersionId
  referenceAssetIds: string[];
  referenceAssetUrls: Record<string, string>; // refId -> storagePath or canonical URI
  projectReferenceIds?: string[];
  projectReferences?: Array<{
    id: string;
    name: string;
    type: string;
    source: string;
    uri: string;
    storagePath: string;
    characterId?: string;
    characterVersionId?: string;
    tags?: string[];
  }>;
  styleSnapshot: {
    id: string;
    versionNumber: string;
    name: string;
    positivePrompt: string;
    negativePrompt: string;
    colorPaletteRule: string;
    lightingRule: string;
  };
  camera: {
    shotType: string;
    framing: string;
    cameraAngle?: string;
    cameraMovement?: string;
    cameraDirection?: string;
  };
  lighting: string;
  composition: {
    location: string;
    action: string;
    emotion: string;
    visualPurpose: string;
    dialogue?: string;
    speakerCharacterName?: string;
    characterIds: string[];
  };
  params: {
    aspectRatio: string;
    resolution: string;
    seed?: number;
    steps?: number;
    guidanceScale?: number;
    sampler?: string;
  };
  provider: ImageGenerationProvider;
  modelName: string;
}

export interface ProviderGenerationResult {
  provider: ImageGenerationProvider;
  model: string;
  requestId: string;
  outputAsset?: ImageGenerationOutputAsset;
  timestamp: string;
  status: 'completed' | 'failed';
  error?: string | null;
  rateLimitInfo?: ProviderRateLimitInfo;
  executionDurationMs?: number;
}

export interface ImageProviderAdapter {
  readonly providerId: ImageGenerationProvider;
  readonly defaultModel: string;
  readonly supportedModels: string[];

  /**
   * Generates an image using ONLY the immutable job snapshot.
   * STRICT CONTRACT: Never read active Character or Style state during generation.
   */
  generateImage(
    jobSnapshot: ImmutableJobSnapshot,
    options?: any
  ): Promise<ProviderGenerationResult>;
}

export interface ImageProviderSpec {
  id: ImageGenerationProvider;
  name: string;
  badge: string;
  category: 'Mock Engine' | 'Cloud Diffusion' | 'Production API';
  description: string;
  supportedRatios: string[];
  maxResolution: string;
  defaultSteps: number;
  promptSyntax: string;
  isMockOnly: boolean;
}

export type StyleVersion = GlobalStyleVersion;
export type { StudioDatabase } from '../services/storageService';

export * from './flowTypes';

