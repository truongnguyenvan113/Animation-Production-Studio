/**
 * Production Pack Compiler
 * Compiles System Settings, Character DNA, Style DNA, Production Canon, Scene Canon,
 * Continuity, Shot, and References into an immutable ProductionPack.
 */

import {
  ProductionPack,
  Shot,
  Episode,
  Storyboard,
  StoryboardScene,
  Character,
  CharacterVersion,
  GlobalStyleVersion,
  TraceableReference,
  ProviderExecutionMode,
} from '../types';
import { storageService } from './storageService';
import { systemSettingsService } from './systemSettingsService';
import { CharacterService } from './characterService';
import { StyleService } from './styleService';

export class ProductionPackCompiler {
  /**
   * Compiles an immutable ProductionPack for a specific shot
   */
  public static compile(
    shot: Shot,
    options?: {
      episodeId?: string;
      storyboardId?: string;
      customExecutionMode?: ProviderExecutionMode;
    }
  ): ProductionPack {
    const db = storageService.getDatabase();

    // 1. Locate Storyboard and Scene
    let foundStoryboard: Storyboard | undefined;
    let foundScene: StoryboardScene | undefined;

    if (options?.storyboardId) {
      foundStoryboard = db.storyboards.find((sb) => sb.id === options.storyboardId);
    }

    if (!foundStoryboard && options?.episodeId) {
      foundStoryboard = db.storyboards.find((sb) => sb.episodeId === options.episodeId);
    }

    if (!foundStoryboard) {
      foundStoryboard = db.storyboards.find((sb) =>
        sb.scenes?.some((sc) => sc.shots?.some((s) => s.id === shot.id))
      );
    }

    if (foundStoryboard) {
      foundScene = foundStoryboard.scenes?.find((sc) =>
        sc.shots?.some((s) => s.id === shot.id) || sc.id === shot.storyboardSceneId
      );
    }

    // 2. Locate Episode
    const episodeId = options?.episodeId || foundStoryboard?.episodeId || 'ep_009';
    const episode: Episode | undefined = db.episodes.find((ep) => ep.id === episodeId);

    // 3. Resolve Effective Settings Snapshot
    const effectiveSettings = systemSettingsService.resolveEffectiveSettings(
      shot,
      options?.customExecutionMode
    );

    // 4. Resolve Character DNA Snapshots (Strictly Source of Truth)
    const charactersData: ProductionPack['characters'] = [];
    const charIds = shot.characterIds && shot.characterIds.length > 0
      ? shot.characterIds
      : ['char_van']; // Default to Mẹ Vân if none listed

    for (const charId of charIds) {
      const char = db.characters.find((c) => c.id === charId);
      if (!char) continue;

      // Resolve locked version ID from Shot (NEVER rely solely on activeVersionId if shot has snapshot)
      const lockedVersionId = shot.characterDnaReferences?.[charId] || char.activeVersionId;
      const charVersion: CharacterVersion | undefined = db.characterVersions.find(
        (v) => v.id === lockedVersionId || (v.characterId === charId && v.version === 'v1.0')
      );

      // Character-specific DNA Constraints
      const dnaConstraints: string[] = [];

      if (charId === 'char_kem') {
        // Canon rule for Kem
        dnaConstraints.push(
          'Extremely short hair.',
          'Hair tightly cropped close to the scalp.',
          'No bangs.',
          'No fringe.',
          'No fluffy hair.',
          'No spikes.',
          'No hair tuft.',
          'No long hair.'
        );
      } else if (charId === 'char_van') {
        // Canon rule for Mẹ Vân
        dnaConstraints.push(
          'Gương mặt hiền hậu, nét đẹp người mẹ Việt Nam hiện đại.',
          'Tóc đen dài vừa phải, buộc gọn thấp sau gáy nhã nhặn.',
          'Trang phục áo thun màu kem ấm, quần ống suông thoải mái gia đình.',
          'Tông da sáng tự nhiên, ánh mắt ấm áp yêu thương con cái.'
        );
      } else if (charId === 'char_pi') {
        // Canon rule for Pi
        dnaConstraints.push(
          'Bé trai 5 tuổi năng động, đôi mắt to sáng thông minh.',
          'Tóc đen ngắn cắt gọn gàng ôm sát đầu cậu bé.',
          'Áo phông vàng tươi in họa tiết chú cún, quần soóc xanh biển.'
        );
      } else if (charId === 'char_quang') {
        // Canon rule for Bố Quang
        dnaConstraints.push(
          'Gương mặt trí thức, kính mắt gọng vuông đen mỏng.',
          'Nụ cười ấm áp, phong thái điềm đạm.',
          'Áo polo xanh navy chỉn chu, tóc rẽ ngôi 7/3 gọn gàng.'
        );
      } else if (charVersion?.characterPrompt) {
        dnaConstraints.push(charVersion.characterPrompt);
      }

      // Primary reference asset URL if available
      let primaryRefUrl: string | undefined;
      const primaryRef = CharacterService.getPrimaryReference(charVersion?.id || lockedVersionId);
      if (primaryRef) {
        primaryRefUrl = primaryRef.image;
      }

      charactersData.push({
        characterId: char.id,
        displayName: char.displayName || char.vietnameseName,
        activeVersionId: lockedVersionId,
        versionNumber: charVersion?.version || 'v1.0',
        dnaConstraints,
        outfit: charVersion?.clothing || (charId === 'char_van' ? 'Áo thun cotton màu kem, quần vải mềm thoải mái' : 'Trang phục chuẩn Canon'),
        facialFeatures: `${charVersion?.faceShape || 'Thon gọn'}, mắt: ${charVersion?.eyes || 'đen ấm áp'}, nụ cười: ${charVersion?.mouth || 'hiền từ'}`,
        hairStyle: charVersion?.hair || (charId === 'char_van' ? 'Tóc buộc thấp sau gáy' : 'Tóc ngắn gọn gàng'),
        skinTone: charVersion?.skinTone || 'Trắng sáng tự nhiên Đông Nam Á',
        primaryReferenceAssetUrl: primaryRefUrl,
      });
    }

    // 5. Resolve Style DNA (Strictly Source of Truth)
    const styleVersionId = shot.styleVersionSnapshotId || 'style_ver_1_0';
    const styleVer: GlobalStyleVersion | undefined = db.globalStyleVersions?.find(
      (s) => s.id === styleVersionId
    ) || StyleService.getActiveStyleVersion();

    const styleData: ProductionPack['style'] = {
      styleVersionId: styleVer?.id || 'style_ver_1_0',
      versionNumber: styleVer?.version || 'v1.0',
      name: (styleVer as any)?.name || styleVer?.animationStyle || 'Default 3D CGI Animation',
      positivePrompt: styleVer?.globalPrompt || (styleVer as any)?.positivePrompt || 'Pixar and Disney modern 3D CGI animation aesthetic, subsurface scattering on skin, rich vibrant palette',
      negativePrompt: styleVer?.negativePrompt || 'photorealistic live action, 2D flat, low poly, oversaturated, deformed hands, distorted anatomy',
      colorPaletteRule: styleVer?.colorPalette || (styleVer as any)?.colorPaletteRule || 'Bảng màu ấm áp, tươi vui, độ bão hòa vừa phải',
      lightingRule: styleVer?.lighting || (styleVer as any)?.lightingRule || 'Ánh sáng tự nhiên dịu nhẹ với soft bounce lights',
    };

    // 6. Resolve Continuity
    const continuityNotes = shot.continuityNotes || {};
    const continuity: ProductionPack['continuity'] = {
      previousShotId: shot.shotNumber > 1 ? `shot_ep${foundScene?.sceneNumber || 1}_s${shot.shotNumber - 1}` : undefined,
      previousAction: continuityNotes.previousShotRelationship || 'Thiết lập ban đầu cảnh phim',
      characterPositions: continuityNotes.characterPositions || 'Mẹ Vân ở trung tâm tấm bạt sàn phòng khách',
      propContinuity: continuityNotes.propContinuity || 'Tấm bạt trắng phẳng phiu, các khay màu và cọ vẽ xung quanh',
      environmentContinuity: continuityNotes.environmentContinuity || 'Phòng khách chung cư tràn ngập ánh ban mai từ cửa sổ lớn',
    };

    // 7. Resolve Traceable References
    const references: TraceableReference[] = [];

    // Character references
    for (const charData of charactersData) {
      const charRefs = CharacterService.getReferencesForVersion(charData.activeVersionId);
      for (const cr of charRefs) {
        if (cr.active) {
          references.push({
            reference_id: cr.id,
            reference_type: 'CHARACTER',
            version: charData.versionNumber,
            source: `CharacterReference/${cr.characterId}`,
            purpose: `Tham chiếu góc ${cr.type} cho ${charData.displayName}`,
            url: cr.image,
            thumbnailUrl: cr.thumbnail || cr.image,
            characterId: cr.characterId,
          });
        }
      }
    }

    // Style references from ProjectReferenceLibrary if available
    if (db.projectReferences) {
      const styleRefs = db.projectReferences.filter((pr) => pr.type === 'style');
      for (const sr of styleRefs) {
        references.push({
          reference_id: sr.id,
          reference_type: 'STYLE',
          version: '1.0',
          source: `ProjectReference/${sr.id}`,
          purpose: `Tham chiếu phong cách: ${sr.name}`,
          url: sr.uri,
          thumbnailUrl: sr.thumbnail || sr.uri,
        });
      }
    }

    // 8. Negative Constraints Compilation
    const negativeConstraints = [
      'photorealistic humans, live action movie, uncanny valley',
      '2D vector, flat cartoon, anime lineart, sketch, watercolor',
      'distorted hands, extra fingers, malformed limbs, fused bodies',
      'dark gritty atmosphere, horror, excessive grain, compression artifacts',
      'spikes, fringe, fluffy hair or bangs for character Kem',
      'deviations from approved Character DNA facial features',
      'elements outside safe action area in 9:16 vertical crop',
    ];
    if (styleData.negativePrompt) {
      negativeConstraints.push(styleData.negativePrompt);
    }

    // 9. Constraints (16:9 Canvas + 9:16 Shorts Safe + Center Safe Area)
    const constraints: ProductionPack['constraints'] = {
      aspectRatio: '16:9',
      shortsCropSafe: true,
      safeArea: 'CENTER',
      compositionRules: [
        'Central action safe zone (33% to 66% width) to guarantee 9:16 Shorts vertical crop compatibility',
        'Eye-level camera alignment with subject focus in lower two-thirds',
        'Balanced negative space around main action, soft warm background bokeh',
      ],
    };

    // 10. Assemble ProductionPack
    const packId = `pack_${shot.id}_${Date.now()}`;
    const pack: ProductionPack = {
      pack_id: packId,
      project_id: (episode as any)?.projectId || 'proj_pikem_s01',
      episode_id: episodeId,
      scene_id: foundScene?.id || shot.storyboardSceneId,
      shot_id: shot.id,
      created_at: new Date().toISOString(),
      canon_snapshot: {
        canonVersion: (episode as any)?.version ? String((episode as any).version) : '1.0',
        episodeTitle: episode?.title || 'Tập 9: Bữa Tiệc Sắc Màu',
        sceneNumber: foundScene?.sceneNumber || shot.sceneNumber,
        shotNumber: shot.shotNumber,
        sceneCanon: {
          location: foundScene?.location || shot.location || 'Phòng khách gia đình Pi Kem',
          lighting: foundScene?.lighting || shot.lighting || 'Ánh ban mai chiếu xiên ấm áp',
          timeOfDay: foundScene?.timeOfDay || shot.timeOfDay || 'Buổi sáng',
          weather: 'Trời nắng trong veo',
        },
      },
      effective_settings: effectiveSettings,
      shot,
      characters: charactersData,
      style: styleData,
      continuity,
      references,
      constraints,
      negative_constraints: negativeConstraints,
    };

    return pack;
  }
}
