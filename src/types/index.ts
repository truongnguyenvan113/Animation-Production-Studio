export type ReferenceType =
  | 'Front'
  | 'Side'
  | '3/4'
  | 'Full Body'
  | 'Face'
  | 'Expression'
  | 'Clothing'
  | 'Pose'
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
  createdAt: string;
}

export interface CharacterReference {
  id: string;
  characterVersionId: string;
  characterId: string;
  type: ReferenceType;
  image: string;
  thumbnail?: string;
  description: string;
  active: boolean;
  createdAt: string;
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
  location: string;
  timeOfDay: string;
  lighting: string;
  dialogue?: string;
  speakerCharacterId?: string;
  speakerCharacterName?: string;
  emotion: string;
  visualPurpose: string;
  continuityNotes: ShotContinuityNotes;
  generationStatus: ShotGenerationStatus;
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

export interface Storyboard {
  id: string; // e.g. "sb_ep009"
  episodeId: string;
  episodeVersion?: string | number;
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
