export type PublishingStatus = 'draft' | 'ready' | 'scheduled' | 'published';
export type FacebookPostStatus = 'draft' | 'ready' | 'posted' | 'published';
export type FacebookPublishStatus = FacebookPostStatus;
export type YouTubePublishStatus = 'draft' | 'scheduled' | 'published';

export interface EpisodePublishingBrief {
  title: string;
  theme?: string;
  storySummary?: string;
  message?: string;
  episodeType?: string;
}

export interface YouTubePublishingData {
  title: string;
  description: string;
  hashtags: string[];
  videoAssetId?: string;
  thumbnailAssetId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  youtubeVideoId?: string;
  publishStatus: YouTubePublishStatus;
  scheduledAt?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  timezone: string;
  publishedAt?: string;
}

export interface FacebookPublishingData {
  post: string;
  imageAssetId?: string;
  imageUrl?: string;
  youtubeUrl?: string;
  includeYoutubeLink: boolean;
  status: FacebookPostStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  postedAt?: string;
}

export interface PublishingAssetsData {
  finalVideoAssetId?: string;
  finalVideoUrl?: string;
  thumbnailAssetId?: string;
  thumbnailUrl?: string;
}

export interface PublishingReadinessStatus {
  videoReady: boolean;
  thumbnailReady: boolean;
  youtubeReady: boolean;
  facebookReady: boolean;
}

export interface PublishingRevision {
  id: string;
  version: number;
  label: string;
  createdAt: string;
  snapshot: {
    brief: EpisodePublishingBrief;
    youtube: YouTubePublishingData;
    facebook: FacebookPublishingData;
    assets: PublishingAssetsData;
  };
}

export interface PublishingPack {
  id: string; // pub_{episodeId}
  episodeId: string;
  episodeBrief: EpisodePublishingBrief;
  youtube: YouTubePublishingData;
  facebook: FacebookPublishingData;
  assets: PublishingAssetsData;
  status: PublishingReadinessStatus;
  templateVersions?: {
    youtube?: string;
    facebook?: string;
    hashtag?: string;
  };
  history: PublishingRevision[];
  createdAt: string;
  updatedAt: string;
}

export interface PublishingTemplate {
  id: string;
  type: 'youtube' | 'facebook' | 'hashtags';
  name: string;
  description?: string;
  isDefault?: boolean;
  contentStructure?: string;
  fixedHashtags?: string[];
  tone?: string;
  customRules?: string;
}
