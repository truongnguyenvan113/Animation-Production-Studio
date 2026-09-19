export type NavigationId =
  | 'dashboard'
  | 'characters'
  | 'character-dna'
  | 'character-references'
  | 'reference-library'
  | 'supporting-characters'
  | 'visual-style'
  | 'seasons'
  | 'episodes'
  | 'story-generator'
  | 'storyboard'
  | 'storyboard-images'
  | 'master-prompts'
  | 'video-production'
  | 'video-production-google-flow'
  | 'video-production-veo-api'
  | 'video-production-runway'
  | 'video-production-luma'
  | 'video-production-kling'
  | 'production-queue'
  | 'audio'
  | 'audio-voice'
  | 'audio-music'
  | 'audio-sfx'
  | 'video-editor'
  | 'render-history'
  | 'export-publish';

export interface NavItemConfig {
  id: NavigationId;
  labelEn: string;
  labelVi: string;
  iconName: string;
  children?: Array<{
    id: NavigationId;
    labelEn: string;
    labelVi: string;
    badge?: string;
  }>;
  badge?: string;
  phase?: 'foundation' | 'next';
}
