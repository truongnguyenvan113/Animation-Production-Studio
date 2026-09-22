/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ProjectReference,
  ProjectReferenceType,
  ProjectReferenceSource,
  Shot,
  CharacterReference,
} from '../types';
import { storageService } from './storageService';
import { validateProductionImageOutput, isMockOutput } from './imageValidationService';

/**
 * Creates clean, valid, browser-loadable SVG data URIs for reference mock/sample cards
 * Strictly enforces Unicode characters and avoids XML entity bugs.
 */
export function createReferenceSvg(options: {
  title: string;
  type: string;
  source: string;
  badge?: string;
  accentColor: string;
  secondaryColor: string;
  iconType?: 'character' | 'location' | 'style' | 'video' | 'keyframe' | 'prop';
  meta?: string;
}): string {
  const {
    title,
    type,
    source,
    badge = 'REFERENCE',
    accentColor = '#f59e0b',
    secondaryColor = '#6366f1',
    iconType = 'style',
    meta = 'Canonical Reference Asset',
  } = options;

  let iconSvg = '';
  switch (iconType) {
    case 'character':
      iconSvg = `
        <circle cx="160" cy="110" r="45" fill="${accentColor}" fill-opacity="0.25" stroke="${accentColor}" stroke-width="3" />
        <circle cx="160" cy="100" r="24" fill="${accentColor}" fill-opacity="0.8" />
        <path d="M115 165 C115 130, 205 130, 205 165 Z" fill="${accentColor}" fill-opacity="0.6" />
        <circle cx="152" cy="98" r="3" fill="#ffffff" />
        <circle cx="168" cy="98" r="3" fill="#ffffff" />
        <path d="M154 108 Q160 114 166 108" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round" />
      `;
      break;
    case 'video':
      iconSvg = `
        <rect x="105" y="70" width="110" height="80" rx="14" fill="#0f172a" stroke="${accentColor}" stroke-width="3" />
        <polygon points="148,95 148,125 174,110" fill="${accentColor}" />
        <circle cx="160" cy="110" r="48" fill="none" stroke="${secondaryColor}" stroke-width="2" stroke-dasharray="6,4" />
      `;
      break;
    case 'keyframe':
      iconSvg = `
        <rect x="100" y="65" width="120" height="75" rx="10" fill="#0f172a" stroke="#10b981" stroke-width="3" />
        <circle cx="130" cy="95" r="14" fill="#10b981" fill-opacity="0.4" />
        <polygon points="115,130 145,100 170,120 195,95 210,130" fill="#10b981" fill-opacity="0.6" />
        <circle cx="200" cy="80" r="6" fill="#f59e0b" />
      `;
      break;
    case 'location':
      iconSvg = `
        <rect x="95" y="60" width="130" height="90" rx="12" fill="#0f172a" stroke="${accentColor}" stroke-width="2.5" />
        <path d="M100 135 L135 95 L165 125 L190 100 L220 135 Z" fill="${accentColor}" fill-opacity="0.5" />
        <path d="M140 135 L170 110 L200 135 Z" fill="${secondaryColor}" fill-opacity="0.6" />
        <circle cx="140" cy="85" r="10" fill="#fbbf24" />
      `;
      break;
    default:
      iconSvg = `
        <rect x="105" y="65" width="110" height="80" rx="12" fill="#0f172a" stroke="${secondaryColor}" stroke-width="3" />
        <circle cx="140" cy="100" r="16" fill="${accentColor}" fill-opacity="0.7" />
        <circle cx="175" cy="105" r="12" fill="${secondaryColor}" fill-opacity="0.7" />
        <path d="M115 135 Q160 115 205 135" stroke="#38bdf8" stroke-width="3" fill="none" />
      `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
        <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${accentColor}" />
          <stop offset="100%" stop-color="${secondaryColor}" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#bgGrad)" rx="16" />
      <rect x="1" y="1" width="318" height="198" rx="15" fill="none" stroke="#334155" stroke-width="1.5" />
      
      <!-- Top Bar decoration -->
      <rect x="16" y="14" width="288" height="3" rx="1.5" fill="url(#barGrad)" />

      <!-- Center Icon / Illustration -->
      <g>
        ${iconSvg}
      </g>

      <!-- Badge -->
      <rect x="18" y="24" width="${badge.length * 7 + 16}" height="18" rx="9" fill="${accentColor}" fill-opacity="0.2" stroke="${accentColor}" stroke-width="1" />
      <text x="${18 + (badge.length * 7 + 16) / 2}" y="36.5" fill="${accentColor}" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="middle">
        ${badge}
      </text>

      <!-- Source pill -->
      <text x="302" y="36" fill="#94a3b8" font-family="sans-serif" font-size="9" font-weight="600" text-anchor="end">
        ${String(source || '').toUpperCase().replace('_', ' ')}
      </text>

      <!-- Title & Type -->
      <text x="160" y="165" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">
        ${title}
      </text>
      <text x="160" y="182" fill="#94a3b8" font-family="sans-serif" font-size="9.5" text-anchor="middle">
        ${meta} • ${String(type || 'REF').toUpperCase()}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SEED_PROJECT_REFERENCES: ProjectReference[] = [
  // REAL RASTER PRODUCTION ASSETS
  {
    id: 'pref_char_pi_turnaround_real',
    name: 'Pi Character Turnaround & Model Reference (Real CGI)',
    description: 'Authentic 3D Pixar-style model sheet for Pi with front and three-quarter angles in sporty teal hoodie.',
    type: 'image',
    source: 'uploaded_image',
    uri: '/assets/aistudio/references/images/char_pi_turnaround.jpg',
    storagePath: 'references/images/char_pi_turnaround.jpg',
    thumbnail: '/assets/aistudio/references/images/char_pi_turnaround.jpg',
    mimeType: 'image/jpeg',
    tags: ['Pi', 'Model Sheet', 'Real Image', 'Turnaround', '3D CGI'],
    characterId: 'char_pi',
    characterVersionId: 'ver_pi_v1',
    createdAt: '2026-02-01T08:00:00.000Z',
    aspectRatio: '1:1',
    width: 1024,
    height: 1024,
    fileSize: 599410,
    isFavorite: true,
  },
  {
    id: 'pref_vid_pi_motion_real',
    name: 'Pi Studio Action & Turnaround Motion Clip',
    description: 'High-definition 1280x720 video turnaround reference clip for character motion conditioning.',
    type: 'video',
    source: 'uploaded_video',
    uri: '/assets/aistudio/references/videos/pi_turnaround_motion.mp4',
    storagePath: 'references/videos/pi_turnaround_motion.mp4',
    thumbnail: '/assets/aistudio/references/images/char_pi_turnaround.jpg',
    mimeType: 'video/mp4',
    tags: ['Video Reference', 'Motion Clip', 'MP4', 'Character Turnaround'],
    characterId: 'char_pi',
    createdAt: '2026-02-02T09:00:00.000Z',
    durationSeconds: 2.0,
    aspectRatio: '16:9',
    width: 1280,
    height: 720,
    fileSize: 9129,
    isFavorite: true,
  },
  {
    id: 'pref_style_warm_pixar_real',
    name: 'Warm Cinematic Studio 3D Lighting Reference',
    description: 'Photorealistic Pixar aesthetic lighting reference: soft morning sunlight streaming through studio windows.',
    type: 'style',
    source: 'style_guide',
    uri: '/assets/aistudio/references/styles/warm_pixar_style.jpg',
    storagePath: 'references/styles/warm_pixar_style.jpg',
    thumbnail: '/assets/aistudio/references/styles/warm_pixar_style.jpg',
    mimeType: 'image/jpeg',
    tags: ['Style Guide', 'Lighting', 'Warm Studio', '3D Pixar', 'Real Raster'],
    styleVersionId: 'style_ver_1_0',
    createdAt: '2026-02-03T10:00:00.000Z',
    aspectRatio: '16:9',
    width: 1376,
    height: 768,
    fileSize: 695251,
    isFavorite: true,
  },
  {
    id: 'pref_style_hanoi_01',
    name: 'Hanoi Autumn Cinematic Lighting Guide',
    description: 'Golden hour ambient light, warm peach tones, and cozy pastel gradients tailored for Season 1 episodes.',
    type: 'style',
    source: 'style_guide',
    uri: createReferenceSvg({
      title: 'Hanoi Autumn Lighting',
      type: 'style',
      source: 'style_guide',
      badge: 'GLOBAL STYLE',
      accentColor: '#f59e0b',
      secondaryColor: '#ec4899',
      iconType: 'style',
      meta: 'Style v1.0 Standard',
    }),
    storagePath: 'references/style/pref_style_hanoi_01.png',
    styleVersionId: 'style_ver_1_0',
    tags: ['Style', 'Lighting', 'Hanoi Autumn', '3D CGI', 'Golden Hour'],
    createdAt: '2026-02-01T10:00:00.000Z',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    isFavorite: true,
  },
  {
    id: 'pref_loc_drawing_room_01',
    name: 'Family Studio & Canvas Drawing Area',
    description: 'Bright family living room interior with child-safe wooden furniture, colorful paint jars, and large white floor canvas.',
    type: 'location',
    source: 'uploaded_image',
    uri: createReferenceSvg({
      title: 'Studio & Canvas Area',
      type: 'location',
      source: 'uploaded_image',
      badge: 'LOCATION',
      accentColor: '#3b82f6',
      secondaryColor: '#10b981',
      iconType: 'location',
      meta: 'Ep 9 Primary Set',
    }),
    storagePath: 'references/locations/pref_loc_drawing_room_01.png',
    episodeId: 'ep_009',
    tags: ['Location', 'Living Room', 'Canvas', 'Drawing Area', 'Episode 9'],
    createdAt: '2026-02-05T14:30:00.000Z',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    isFavorite: true,
  },
  {
    id: 'pref_char_pi_v1_sheet',
    name: 'Pi v1.0 Character Model Turnaround',
    description: 'Canonical 3D reference sheet for Pi: round energetic face, dark brown hair with cowlick, bright yellow polo with dinosaur crest.',
    type: 'character',
    source: 'character_sheet',
    uri: createReferenceSvg({
      title: 'Pi Turnaround Model',
      type: 'character',
      source: 'character_sheet',
      badge: 'PI v1.0',
      accentColor: '#eab308',
      secondaryColor: '#3b82f6',
      iconType: 'character',
      meta: 'char_pi / ver_pi_v1',
    }),
    storagePath: 'characters/char_pi/ver_pi_v1/pref_char_pi_v1_sheet.png',
    characterId: 'char_pi',
    characterVersionId: 'ver_pi_v1',
    tags: ['Pi', 'Main Character', 'Model Sheet', 'v1.0', 'Orthographic'],
    createdAt: '2026-02-10T09:00:00.000Z',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    isFavorite: true,
  },
  {
    id: 'pref_char_emma_v1_sheet',
    name: 'Emma (Kem) v1.0 Expression Sheet',
    description: 'Canonical facial expression sheet for Emma: big curious eyes, twin puffy buns with peach clips, joyful pastel pink dress.',
    type: 'character',
    source: 'character_sheet',
    uri: createReferenceSvg({
      title: 'Emma Expression Sheet',
      type: 'character',
      source: 'character_sheet',
      badge: 'EMMA v1.0',
      accentColor: '#ec4899',
      secondaryColor: '#a855f7',
      iconType: 'character',
      meta: 'char_emma / ver_emma_v1',
    }),
    storagePath: 'characters/char_emma/ver_emma_v1/pref_char_emma_v1_sheet.png',
    characterId: 'char_emma',
    characterVersionId: 'ver_emma_v1',
    tags: ['Emma', 'Kem', 'Toddler', 'Expressions', 'v1.0'],
    createdAt: '2026-02-10T09:15:00.000Z',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    isFavorite: true,
  },
  {
    id: 'pref_char_mochi_v1_sheet',
    name: 'Mochi Golden Puppy Turnaround',
    description: 'Fluffy golden fur, floppy ears, wagging tail, and playful mischievous poses for the family puppy Mochi.',
    type: 'character',
    source: 'character_sheet',
    uri: createReferenceSvg({
      title: 'Mochi Puppy Turnaround',
      type: 'character',
      source: 'character_sheet',
      badge: 'MOCHI v1.0',
      accentColor: '#f97316',
      secondaryColor: '#eab308',
      iconType: 'character',
      meta: 'char_mochi / ver_mochi_v1',
    }),
    storagePath: 'characters/char_mochi/ver_mochi_v1/pref_char_mochi_v1_sheet.png',
    characterId: 'char_mochi',
    characterVersionId: 'ver_mochi_v1',
    tags: ['Mochi', 'Puppy', 'Pet', 'Golden Fur', 'v1.0'],
    createdAt: '2026-02-12T11:00:00.000Z',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    isFavorite: false,
  },
  {
    id: 'pref_keyframe_ep9_s1_01',
    name: 'Shot 1-1 White Canvas Opening Keyframe (Real CGI Render)',
    description: 'Approved production keyframe: High fidelity 3D Pixar render of Pi and Kem in the sunlit studio with the pristine floor canvas.',
    type: 'image',
    source: 'generated_image',
    uri: '/assets/aistudio/renders/episodes/ep_009/shots/shot_ep009_s01_01/shot_ep009_s01_01.jpg',
    storagePath: 'renders/episodes/ep_009/shots/shot_ep009_s01_01/shot_ep009_s01_01.jpg',
    thumbnail: '/assets/aistudio/renders/episodes/ep_009/shots/shot_ep009_s01_01/shot_ep009_s01_01.jpg',
    mimeType: 'image/jpeg',
    episodeId: 'ep_009',
    shotId: 'shot_ep009_s01_01',
    jobId: 'job_ep009_s01_01_real',
    outputAssetId: 'out_gemini-imagen_job_ep009_s01_01_real',
    characterId: 'char_pi',
    characterVersionId: 'ver_pi_v1',
    tags: ['Episode 9', 'Scene 1', 'Shot 1', 'Keyframe', 'White Canvas', 'Approved', 'Real Production'],
    createdAt: '2026-02-18T16:20:00.000Z',
    aspectRatio: '16:9',
    width: 1376,
    height: 768,
    fileSize: 803212,
    isFavorite: true,
  },
  {
    id: 'pref_vid_splash_motion_01',
    name: 'Color Splash Fluid Dynamics Reference',
    description: 'High-speed fluid motion reference clip showing water splash arcs and droplet dispersion for painting scenes.',
    type: 'video',
    source: 'uploaded_video',
    uri: createReferenceSvg({
      title: 'Color Splash Fluid Motion',
      type: 'video',
      source: 'uploaded_video',
      badge: 'VIDEO REF',
      accentColor: '#8b5cf6',
      secondaryColor: '#06b6d4',
      iconType: 'video',
      meta: 'Fluid Dynamics • 4.5s',
    }),
    storagePath: 'references/videos/pref_vid_splash_motion_01.mp4',
    tags: ['Video Reference', 'Fluid Motion', 'Paint Splash', 'VFX', 'Animation'],
    createdAt: '2026-02-20T08:45:00.000Z',
    durationSeconds: 4.5,
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    isFavorite: false,
  },
  {
    id: 'pref_vid_mochi_run_01',
    name: 'Mochi Pawprints Run Cycle Preview',
    description: 'Generated video animation preview showing Mochi galloping across the canvas leaving cheerful cyan pawprints.',
    type: 'video',
    source: 'generated_video',
    uri: createReferenceSvg({
      title: 'Mochi Pawprints Run Cycle',
      type: 'video',
      source: 'generated_video',
      badge: 'GENERATED VIDEO',
      accentColor: '#10b981',
      secondaryColor: '#f97316',
      iconType: 'video',
      meta: 'Scene 3 Preview • 3.2s',
    }),
    storagePath: 'renders/episodes/ep_009/shots/shot_ep009_s03_01/video_preview.mp4',
    episodeId: 'ep_009',
    shotId: 'shot_ep009_s03_01',
    characterId: 'char_mochi',
    characterVersionId: 'ver_mochi_v1',
    tags: ['Generated Video', 'Mochi', 'Run Cycle', 'Pawprints', 'Episode 9', 'Scene 3'],
    createdAt: '2026-02-22T13:10:00.000Z',
    durationSeconds: 3.2,
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    isFavorite: true,
  },
];

export class ProjectReferenceService {
  /**
   * Returns all persistent project references from database.
   */
  public static getAllReferences(): ProjectReference[] {
    const db = storageService.getDatabase();
    return db.projectReferences || [];
  }

  /**
   * Retrieves a reference by its unique persistent ID.
   */
  public static getReferenceById(id: string): ProjectReference | undefined {
    return this.getAllReferences().find((r) => r.id === id);
  }

  /**
   * Filters references by type.
   */
  public static getReferencesByType(type: ProjectReferenceType): ProjectReference[] {
    return this.getAllReferences().filter((r) => r.type === type);
  }

  /**
   * Filters references by source.
   */
  public static getReferencesBySource(source: ProjectReferenceSource): ProjectReference[] {
    return this.getAllReferences().filter((r) => r.source === source);
  }

  /**
   * Strictly returns references linked to a specific Character and Version.
   * Enforces Character DNA version integrity.
   */
  public static getReferencesForCharacter(
    characterId: string,
    characterVersionId?: string,
  ): ProjectReference[] {
    return this.getAllReferences().filter((r) => {
      if (r.characterId !== characterId) return false;
      if (characterVersionId && r.characterVersionId && r.characterVersionId !== characterVersionId) {
        return false;
      }
      return true;
    });
  }

  /**
   * Searches and filters references across all dimensions.
   */
  public static searchReferences(options: {
    query?: string;
    type?: ProjectReferenceType | 'all';
    source?: ProjectReferenceSource | 'all';
    characterId?: string | 'all';
    tag?: string;
    favoritesOnly?: boolean;
  }): ProjectReference[] {
    let refs = this.getAllReferences();

    if (options.type && options.type !== 'all') {
      refs = refs.filter((r) => r.type === options.type);
    }

    if (options.source && options.source !== 'all') {
      refs = refs.filter((r) => r.source === options.source);
    }

    if (options.characterId && options.characterId !== 'all') {
      refs = refs.filter((r) => r.characterId === options.characterId);
    }

    if (options.tag) {
      const lowerTag = options.tag.toLowerCase();
      refs = refs.filter((r) => r.tags.some((t) => t.toLowerCase() === lowerTag));
    }

    if (options.favoritesOnly) {
      refs = refs.filter((r) => r.isFavorite);
    }

    if (options.query && options.query.trim() !== '') {
      const q = options.query.toLowerCase().trim();
      refs = refs.filter((r) => {
        return (
          r.name.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          r.id.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          (r.characterId && r.characterId.toLowerCase().includes(q)) ||
          (r.characterVersionId && r.characterVersionId.toLowerCase().includes(q))
        );
      });
    }

    return refs;
  }

  /**
   * Creates and persists a new Project Reference.
   * Validates duplicate prevention and sets canonical storage path.
   */
  public static createReference(
    data: Omit<ProjectReference, 'id' | 'createdAt'> & { id?: string },
  ): ProjectReference {
    const db = storageService.getDatabase();
    const existing = db.projectReferences || [];

    // Check for duplicate URI/storagePath to prevent duplicate records
    const isDuplicate = existing.some(
      (r) =>
        (data.storagePath && r.storagePath === data.storagePath) ||
        (data.outputAssetId && r.outputAssetId === data.outputAssetId) ||
        (data.uri && r.uri === data.uri && r.name === data.name),
    );

    if (isDuplicate) {
      const found = existing.find(
        (r) =>
          (data.storagePath && r.storagePath === data.storagePath) ||
          (data.outputAssetId && r.outputAssetId === data.outputAssetId) ||
          (data.uri && r.uri === data.uri && r.name === data.name),
      );
      if (found) return found;
    }

    const id =
      data.id ||
      `pref_${data.type.slice(0, 3)}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    // Determine canonical storage path if missing
    let storagePath = data.storagePath;
    if (!storagePath) {
      if (data.characterId && data.characterVersionId) {
        storagePath = `characters/${data.characterId}/${data.characterVersionId}/${id}.png`;
      } else if (data.type === 'video') {
        storagePath = `references/videos/${id}.mp4`;
      } else if (data.type === 'style') {
        storagePath = `references/style/${id}.png`;
      } else {
        storagePath = `references/images/${id}.png`;
      }
    }

    const newRef: ProjectReference = {
      ...data,
      id,
      storagePath,
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newRef, ...existing];
    storageService.saveDatabase({ projectReferences: updated });

    return newRef;
  }

  /**
   * Imports an approved keyframe from a Storyboard Shot into the Project Reference Library.
   * Reuses the generated asset directly without re-uploading.
   * 
   * STRICT PRODUCTION MANDATE:
   * Mock Studio SVG outputs MUST FAIL this production import path.
   * Only genuine raster production images (PNG, JPEG, WebP) can be imported.
   */
  public static importKeyframeAsReference(options: {
    shot: Shot;
    episodeId: string;
    imageUrl: string;
    name?: string;
    description?: string;
    tags?: string[];
  }): ProjectReference {
    const { shot, episodeId, imageUrl, name, description, tags } = options;

    const db = storageService.getDatabase();
    const existing = db.projectReferences || [];

    // 1. Audit Mock Status: Mock SVG must NEVER be imported as an approved production reference
    const isMock =
      shot.isMockOutput === true ||
      imageUrl.startsWith('data:image/svg+xml') ||
      imageUrl.includes('<svg') ||
      imageUrl.includes('%3Csvg') ||
      shot.outputMimeType === 'image/svg+xml';

    if (isMock) {
      throw new Error(
        'Mock Studio SVG output cannot be imported into Project Reference Library. Only verified real production raster images (PNG, JPEG, WebP) are eligible for reference library import.'
      );
    }

    // Check if this shot's keyframe is already registered
    const existingKeyframeRef = existing.find(
      (r) => r.shotId === shot.id && r.source === 'generated_image' && r.uri === imageUrl,
    );
    if (existingKeyframeRef) {
      return existingKeyframeRef;
    }

    // Find linked output asset if available
    let matchedAsset: any;
    const linkedJob = (db.imageGenerationJobs || []).find((j) => j.id === shot.activeImageJobId);
    if (linkedJob && Array.isArray(linkedJob.outputAssets)) {
      matchedAsset = linkedJob.outputAssets.find(
        (o) => o.id === shot.activeOutputAssetId || o.imageUrl === imageUrl
      );
    }

    if (matchedAsset && isMockOutput(matchedAsset)) {
      throw new Error(
        'Mock Studio SVG output cannot be imported into Project Reference Library. Only verified real production raster images (PNG, JPEG, WebP) are eligible for reference library import.'
      );
    }

    const primaryCharId = shot.characterIds && shot.characterIds.length > 0 ? shot.characterIds[0] : undefined;
    const primaryCharVersionId = primaryCharId ? shot.characterDnaReferences?.[primaryCharId] : undefined;

    const refName =
      name ||
      `Shot #${shot.shotNumber} Approved Keyframe (${shot.shotType})`;
    const refDesc =
      description ||
      `Approved keyframe from Episode ${episodeId}, Scene ${shot.sceneNumber}, Shot ${shot.shotNumber}. Action: ${shot.action}`;

    const defaultTags = [
      `Episode ${episodeId}`,
      `Scene ${shot.sceneNumber}`,
      `Shot ${shot.shotNumber}`,
      'Keyframe',
      'Approved',
      'Generated',
      shot.shotType,
      ...(tags || []),
    ];

    const detectedMime =
      matchedAsset?.mimeType ||
      shot.outputMimeType ||
      (imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg') ? 'image/jpeg' : 'image/png');

    const width = matchedAsset?.width || (detectedMime === 'image/jpeg' ? 1376 : 1920);
    const height = matchedAsset?.height || (detectedMime === 'image/jpeg' ? 768 : 1080);
    const fileSize = matchedAsset?.fileSize || (detectedMime === 'image/jpeg' ? 803212 : 1250000);

    return this.createReference({
      name: refName,
      description: refDesc,
      type: 'image',
      source: 'generated_image',
      uri: imageUrl,
      storagePath: matchedAsset?.storagePath || `renders/episodes/${episodeId}/shots/${shot.id}/keyframe_${Date.now()}.png`,
      thumbnail: imageUrl,
      tags: Array.from(new Set(defaultTags)),
      episodeId,
      shotId: shot.id,
      jobId: shot.activeImageJobId || matchedAsset?.jobId,
      outputAssetId: shot.activeOutputAssetId || matchedAsset?.id,
      characterId: primaryCharId,
      characterVersionId: primaryCharVersionId,
      styleVersionId: shot.styleVersionSnapshotId,
      aspectRatio: matchedAsset?.aspectRatio || '16:9',
      width,
      height,
      fileSize,
      mimeType: detectedMime,
      isFavorite: true,
    });
  }

  /**
   * Updates an existing Project Reference.
   * Note: This does NOT mutate existing job snapshots (Job Snapshot Immutability).
   */
  public static updateReference(
    id: string,
    updates: Partial<ProjectReference>,
  ): ProjectReference | undefined {
    const db = storageService.getDatabase();
    const existing = db.projectReferences || [];
    const index = existing.findIndex((r) => r.id === id);
    if (index === -1) return undefined;

    const updatedRef: ProjectReference = {
      ...existing[index],
      ...updates,
      id, // Protect primary key
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [...existing];
    updatedList[index] = updatedRef;

    storageService.saveDatabase({ projectReferences: updatedList });
    return updatedRef;
  }

  /**
   * Deletes a Project Reference from the library.
   * Note: Existing Jobs retain their frozen snapshots and remain 100% intact.
   */
  public static deleteReference(id: string): boolean {
    const db = storageService.getDatabase();
    const existing = db.projectReferences || [];
    const filtered = existing.filter((r) => r.id !== id);

    if (filtered.length === existing.length) return false;

    storageService.saveDatabase({ projectReferences: filtered });
    return true;
  }

  /**
   * Synchronizes character reference assets into the project reference library
   * so character turnarounds are always accessible in the central catalog.
   */
  public static syncCharacterReferencesToProjectLibrary(): number {
    const db = storageService.getDatabase();
    const charRefs = db.characterReferences || [];
    const projectRefs = db.projectReferences || [];

    let count = 0;
    const existingPaths = new Set(projectRefs.map((r) => r.storagePath));
    const existingIds = new Set(projectRefs.map((r) => r.id));

    charRefs.forEach((cr: CharacterReference) => {
      if (!existingPaths.has(cr.storagePath) && !existingIds.has(cr.id)) {
        const char = db.characters.find((c) => c.id === cr.characterId);
        const ver = db.characterVersions.find((v) => v.id === cr.characterVersionId);

        projectRefs.push({
          id: `pref_sync_${cr.id}`,
          name: `${char?.displayName || cr.characterId} ${cr.type} (${ver?.version || 'v1.0'})`,
          description: cr.description || `Character reference asset for ${char?.displayName || cr.characterId}`,
          type: 'character',
          source: 'character_sheet',
          uri: cr.image,
          storagePath: cr.storagePath,
          thumbnail: cr.thumbnail || cr.image,
          tags: [
            char?.displayName || cr.characterId,
            'Character Sheet',
            ver?.version || 'v1.0',
            cr.type,
            'Sync',
          ],
          characterId: cr.characterId,
          characterVersionId: cr.characterVersionId,
          createdAt: cr.createdAt || new Date().toISOString(),
          isFavorite: cr.isPrimary,
        });
        count++;
      }
    });

    if (count > 0) {
      storageService.saveDatabase({ projectReferences: projectRefs });
    }

    return count;
  }

  /**
   * Audits integrity: cleans any orphan character links and removes duplicate IDs.
   */
  public static auditIntegrity(): {
    total: number;
    orphansCleaned: number;
    duplicatesRemoved: number;
  } {
    const db = storageService.getDatabase();
    let refs = db.projectReferences || [];
    const initialCount = refs.length;

    // Deduplicate by ID
    const seenIds = new Set<string>();
    const uniqueRefs: ProjectReference[] = [];
    let duplicatesRemoved = 0;

    for (const r of refs) {
      if (seenIds.has(r.id)) {
        duplicatesRemoved++;
      } else {
        seenIds.add(r.id);
        uniqueRefs.push(r);
      }
    }

    // Verify character links if present
    const validCharIds = new Set(db.characters.map((c) => c.id));
    const validVersionIds = new Set(db.characterVersions.map((v) => v.id));
    let orphansCleaned = 0;

    const cleanedRefs = uniqueRefs.map((r) => {
      let isOrphan = false;
      if (r.characterId && !validCharIds.has(r.characterId)) {
        isOrphan = true;
      }
      if (r.characterVersionId && !validVersionIds.has(r.characterVersionId)) {
        isOrphan = true;
      }

      if (isOrphan) {
        orphansCleaned++;
        const { characterId, characterVersionId, ...rest } = r;
        return rest as ProjectReference;
      }
      return r;
    });

    if (duplicatesRemoved > 0 || orphansCleaned > 0) {
      storageService.saveDatabase({ projectReferences: cleanedRefs });
    }

    return {
      total: cleanedRefs.length,
      orphansCleaned,
      duplicatesRemoved,
    };
  }
}
