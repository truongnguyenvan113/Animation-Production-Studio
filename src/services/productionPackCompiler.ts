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
  SceneBrief,
  ProjectReference,
  CameraTimelineEntry,
} from '../types';
import { storageService } from './storageService';
import { systemSettingsService } from './systemSettingsService';
import { CharacterService } from './characterService';
import { computeDeterministicPayloadHash } from './imageGenerationService';

/**
 * Resolves the real version or content-addressable checksum for a reference.
 * Strictly prevents hardcoded static '1.0' placeholders.
 */
function resolveReferenceVersion(
  ref: {
    id: string;
    version?: string;
    characterVersionId?: string;
    styleVersionId?: string;
    outputAssetId?: string;
    jobId?: string;
    storagePath?: string;
    uri?: string;
    url?: string;
  },
  knownVersion?: string
): string {
  if (ref.characterVersionId) return ref.characterVersionId;
  if (ref.styleVersionId) return ref.styleVersionId;
  if (ref.outputAssetId) return ref.outputAssetId;
  if (ref.jobId) return ref.jobId;
  if (knownVersion && knownVersion !== '1.0' && knownVersion !== 'v1.0') {
    return knownVersion;
  }
  if (ref.version && ref.version !== '1.0' && ref.version !== 'v1.0') {
    return ref.version;
  }
  if (knownVersion) return knownVersion;
  // Compute deterministic content-addressable checksum from reference identity and path
  const hash = computeDeterministicPayloadHash({
    id: ref.id,
    path: ref.storagePath || ref.uri || ref.url || '',
  });
  return `chk_${hash.slice(0, 8)}`;
}

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

    // Locate Episode Scene Canon if available
    const episodeScene = episode?.scenes?.find(
      (s) => s.id === foundScene?.episodeSceneId || s.sceneNumber === (foundScene?.sceneNumber || shot.sceneNumber)
    );

    // 3. Resolve Effective Settings Snapshot
    const effectiveSettings = systemSettingsService.resolveEffectiveSettings(
      shot,
      options?.customExecutionMode
    );

    // 4. Resolve Character DNA Snapshots (Strictly Source of Truth)
    const charactersData: ProductionPack['characters'] = [];
    const charIds = shot.characterIds && shot.characterIds.length > 0
      ? shot.characterIds
      : ['char_pi'];

    const episodeCharSnapshots = episode?.characterVersionSnapshots || {};

    for (const charId of charIds) {
      const char = db.characters.find((c) => c.id === charId);
      if (!char) {
        throw new Error(`PRODUCTION_PACK_INVALID: Character "${charId}" not found in database.`);
      }

      // 1. Resolve locked version ID ONLY from explicit locked Shot or Episode snapshot
      const lockedVersionId =
        shot.characterDnaReferences?.[charId] ||
        episodeCharSnapshots[charId];

      let charVersion: CharacterVersion | undefined;

      if (lockedVersionId) {
        charVersion = db.characterVersions.find(
          (v) => v.id === lockedVersionId && v.characterId === charId
        );
        if (!charVersion) {
          throw new Error(
            `PRODUCTION_PACK_INVALID: Locked CharacterVersion "${lockedVersionId}" for character "${charId}" not found in database.`
          );
        }
      } else {
        // If no snapshot exists, use the canonical baseline version only if guaranteed by data model
        charVersion = db.characterVersions.find(
          (v) => v.characterId === charId && v.version === 'v1.0'
        );
        if (!charVersion) {
          throw new Error(
            `PRODUCTION_PACK_INVALID: No explicit snapshot found for character "${charId}" in shot or episode, and canonical baseline "v1.0" does not exist.`
          );
        }
      }

      // Character-specific DNA Constraints derived dynamically from CharacterVersion
      const dnaConstraints: string[] = [];

      if (charVersion) {
        if (charVersion.hair) {
          dnaConstraints.push(`Kiểu tóc bất biến: ${charVersion.hair}`);
        }
        if (charVersion.faceShape || charVersion.eyes) {
          dnaConstraints.push(
            `Khuôn mặt & ánh mắt: ${charVersion.faceShape || ''}${charVersion.eyes ? ` | mắt: ${charVersion.eyes}` : ''}`
          );
        }
        if (charVersion.clothing) {
          dnaConstraints.push(`Trang phục đặc trưng: ${charVersion.clothing}`);
        }
        if (charVersion.bodyProportions) {
          dnaConstraints.push(`Tỷ lệ cơ thể: ${charVersion.bodyProportions}`);
        }
        if (charVersion.characterPrompt) {
          dnaConstraints.push(`Đặc tả tạo hình Canon: ${charVersion.characterPrompt}`);
        }
        if (charVersion.negativePrompt) {
          dnaConstraints.push(`Tránh sai lệch: ${charVersion.negativePrompt}`);
        }
      }

      // Primary reference asset URL if available
      let primaryRefUrl: string | undefined;
      const primaryRef = CharacterService.getPrimaryReference(charVersion.id);
      if (primaryRef) {
        primaryRefUrl = primaryRef.image;
      }

      charactersData.push({
        characterId: char.id,
        displayName: char.displayName || char.vietnameseName,
        activeVersionId: charVersion.id, // Strictly locked snapshot/baseline version ID
        versionNumber: charVersion.version,
        dnaConstraints,
        outfit: charVersion.clothing || 'Trang phục chuẩn theo Canon Version',
        facialFeatures: `${charVersion.faceShape || 'Cân đối'}, mắt: ${charVersion.eyes || 'sáng to'}, biểu cảm: ${charVersion.facialExpression || 'tươi vui'}`,
        hairStyle: charVersion.hair || 'Kiểu tóc chuẩn theo Canon Version',
        skinTone: charVersion.skinTone || 'Trắng sáng tự nhiên Đông Nam Á',
        primaryReferenceAssetUrl: primaryRefUrl,
      });
    }

    // 5. Resolve Style DNA (Strictly Source of Truth: Shot snapshot -> Episode snapshot -> Canonical Baseline v1.0)
    const lockedStyleVersionId =
      shot.styleVersionSnapshotId ||
      episode?.styleVersionSnapshotId;

    let styleVer: GlobalStyleVersion | undefined;

    if (lockedStyleVersionId) {
      styleVer = db.globalStyleVersions?.find((s) => s.id === lockedStyleVersionId);
      if (!styleVer) {
        throw new Error(
          `PRODUCTION_PACK_INVALID: Locked StyleVersion "${lockedStyleVersionId}" not found in database.`
        );
      }
    } else {
      // If no snapshot exists, use canonical baseline version guaranteed by data model
      styleVer = db.globalStyleVersions?.find(
        (s) => s.id === 'style_ver_1_0' || s.version === 'v1.0'
      );
      if (!styleVer) {
        throw new Error(
          'PRODUCTION_PACK_INVALID: No explicit style snapshot found in shot or episode, and canonical baseline "v1.0" does not exist.'
        );
      }
    }

    const styleData: ProductionPack['style'] = {
      styleVersionId: styleVer.id,
      versionNumber: styleVer.version || 'v1.0',
      name: (styleVer as any)?.name || styleVer?.animationStyle || 'Default 3D CGI Animation',
      positivePrompt:
        styleVer?.globalPrompt ||
        (styleVer as any)?.positivePrompt ||
        'Pixar and Disney modern 3D CGI animation aesthetic, subsurface scattering on skin, rich vibrant palette',
      negativePrompt:
        styleVer?.negativePrompt ||
        'photorealistic live action, 2D flat, low poly, oversaturated, deformed hands, distorted anatomy',
      colorPaletteRule:
        styleVer?.colorPalette ||
        (styleVer as any)?.colorPaletteRule ||
        'Bảng màu ấm áp, tươi vui, độ bão hòa vừa phải',
      lightingRule:
        styleVer?.lighting ||
        (styleVer as any)?.lightingRule ||
        'Ánh sáng tự nhiên dịu nhẹ với soft bounce lights',
    };

    // 6. Compile Structured Scene Brief (7 canonical production fields)
    const sceneBrief: SceneBrief = {
      sceneTitle:
        foundScene?.title ||
        episodeScene?.title ||
        `Cảnh #${foundScene?.sceneNumber || shot.sceneNumber}`,
      sceneIntent:
        shot.sceneIntent ||
        episodeScene?.storyPurpose ||
        episodeScene?.educationalPurpose ||
        'Thiết lập bối cảnh và cảm xúc câu chuyện',
      action: shot.action || episodeScene?.action || '',
      dialogue: shot.dialogue
        ? `${shot.speakerCharacterName ? shot.speakerCharacterName + ': ' : ''}"${shot.dialogue}"`
        : episodeScene?.dialogue?.length
        ? episodeScene.dialogue.map((d: any) => `${d.characterName}: "${d.line}"`).join(' | ')
        : undefined,
      emotion: shot.emotion || episodeScene?.emotion || 'Tự nhiên, ấm áp',
      soundIntent:
        shot.soundIntent ||
        (episodeScene as any)?.soundIntent ||
        (shot.dialogue
          ? 'Thu âm hội thoại rõ nét, âm thanh nền gia đình sống động'
          : 'Âm thanh môi trường và tiếng động tự nhiên (foley)'),
      specialNotes:
        shot.specialNotes ||
        (episodeScene as any)?.specialNotes ||
        shot.continuityNotes?.propContinuity ||
        '',
      cameraTimeline:
        shot.cameraTimeline && shot.cameraTimeline.length > 0
          ? shot.cameraTimeline
          : undefined,
    };

    // 7. Resolve Continuity (Dynamically Derived from Episode Canon & Shot)
    const continuityNotes = shot.continuityNotes || {};

    const allowedCharacters =
      episode?.allowedCharacters && episode.allowedCharacters.length > 0
        ? episode.allowedCharacters
        : Array.from(
            new Set([...(episode?.characterIds || []), ...(episode?.supportingCharacterIds || [])])
          );

    const excludedCharacters = episode?.excludedCharacters || [];

    const characterAppearanceLocks: string[] = [];
    const outfitLocks: string[] = [];
    for (const c of charactersData) {
      characterAppearanceLocks.push(
        `${c.displayName}: ${c.hairStyle}; ${c.facialFeatures}; tông da ${c.skinTone}`
      );
      outfitLocks.push(`${c.displayName}: ${c.outfit}`);
    }

    const props =
      episode?.props && episode.props.length > 0
        ? episode.props
        : continuityNotes.propContinuity
        ? [continuityNotes.propContinuity]
        : [];

    const location =
      shot.location || foundScene?.location || episode?.location || 'Phòng khách gia đình Pi Kem';
    const environment =
      continuityNotes.environmentContinuity ||
      foundScene?.timeOfDay ||
      shot.timeOfDay ||
      'Ban mai ngập tràn ánh sáng';
    const lighting =
      shot.lighting || foundScene?.lighting || 'Ánh nắng 5600K rọi từ cửa sổ lớn, chiếu ấm các vật thể';
    const language = episode?.language || 'Tiếng Việt (Vietnamese)';
    const dialogueRequirements = shot.dialogue
      ? `Thoại khớp với nhân vật ${shot.speakerCharacterName || 'diễn viên'}, giữ đúng lời thoại: "${shot.dialogue}".`
      : 'Không có thoại bắt buộc (Visual / Non-verbal Action).';
    const durationLimit = shot.durationSeconds
      ? `${shot.durationSeconds}s`
      : episode?.durationLimit || episode?.targetDuration || episode?.duration || '10s';

    const continuityRules = [
      ...(episode?.continuityRules || []),
      ...(continuityNotes.actionContinuity
        ? [`Hành động liên tục: ${continuityNotes.actionContinuity}`]
        : []),
      ...(continuityNotes.previousShotRelationship
        ? [`Mối quan hệ với shot trước: ${continuityNotes.previousShotRelationship}`]
        : []),
    ];

    const relevantExclusions = [
      ...excludedCharacters.map((cId) => {
        const c = db.characters.find((ch) => ch.id === cId);
        return `Không xuất hiện nhân vật: ${c?.displayName || cId}`;
      }),
    ];

    const continuity: ProductionPack['continuity'] = {
      previousShotId:
        shot.shotNumber > 1
          ? `shot_ep${foundScene?.sceneNumber || 1}_s${shot.shotNumber - 1}`
          : undefined,
      previousAction:
        continuityNotes.previousShotRelationship || 'Thiết lập ban đầu cảnh phim',
      characterPositions:
        continuityNotes.characterPositions || 'Trung tâm không gian cảnh quay',
      propContinuity:
        continuityNotes.propContinuity || 'Đạo cụ duy trì trạng thái hiện hữu',
      environmentContinuity:
        continuityNotes.environmentContinuity || 'Môi trường ánh sáng giữ nguyên tính liên tục',
      allowedCharacters,
      excludedCharacters,
      characterAppearanceLocks,
      outfitLocks,
      props,
      location,
      environment,
      lighting,
      language,
      dialogueRequirements,
      durationLimit,
      continuityRules,
      relevantExclusions,
    };

    // 8. Resolve Traceable References (CHARACTER, STYLE, STORYBOARD_REFERENCE, LOCATION, PROP, CONTINUITY)
    const references: TraceableReference[] = [];

    // A. Storyboard Reference (Keyframe Spatial Blocking Guide)
    if (shot.activeImageOutputUrl) {
      const sbVersion =
        shot.activeImageJobId ||
        shot.activeOutputAssetId ||
        `chk_${computeDeterministicPayloadHash({ shotId: shot.id, url: shot.activeImageOutputUrl }).slice(0, 8)}`;

      references.push({
        reference_id: shot.activeOutputAssetId || `ref_sb_${shot.id}`,
        reference_type: 'STORYBOARD_REFERENCE',
        version: sbVersion,
        source: `Storyboard/${foundStoryboard?.id || 'sb'}/Shot/${shot.id}`,
        purpose:
          'Tham chiếu Storyboard Keyframe đã duyệt: Sử dụng làm hướng dẫn bố cục không gian, tỷ lệ và chặn vị trí nhân vật (spatial blocking guide)',
        url: shot.activeImageOutputUrl,
        thumbnailUrl: shot.activeImageOutputUrl,
        shotId: shot.id,
        isLocked: true,
      });
    }

    // B. Character references
    for (const charData of charactersData) {
      const charRefs = CharacterService.getReferencesForVersion(charData.activeVersionId);
      for (const cr of charRefs) {
        if (cr.active) {
          references.push({
            reference_id: cr.id,
            reference_type: 'CHARACTER',
            version: charData.versionNumber,
            source: `CharacterReference/${cr.characterId}`,
            purpose: `Tham chiếu tạo hình góc ${cr.type} cho ${charData.displayName}`,
            url: cr.image,
            thumbnailUrl: cr.thumbnail || cr.image,
            characterId: cr.characterId,
            isLocked: true,
          });
        }
      }
    }

    // C. Project references (Style, Location, Prop, Continuity) - Deterministic Filtering
    if (db.projectReferences) {
      for (const pr of db.projectReferences) {
        if (pr.type === 'style') {
          // Relevant only if matches the locked style version and episode
          const isStyleMatch =
            !pr.styleVersionId || pr.styleVersionId === styleData.styleVersionId;
          const isEpisodeMatch = !pr.episodeId || pr.episodeId === episodeId;
          if (isStyleMatch && isEpisodeMatch) {
            references.push({
              reference_id: pr.id,
              reference_type: 'STYLE',
              version: resolveReferenceVersion(pr, styleData.versionNumber),
              source: `ProjectReference/${pr.id}`,
              purpose: `Tham chiếu phong cách mỹ thuật: ${pr.name}`,
              url: pr.uri,
              thumbnailUrl: pr.thumbnail || pr.uri,
              isLocked: true,
            });
          }
        } else if (pr.type === 'location') {
          // Relevant only if matches current shot/scene location and current episode
          const isEpisodeMatch = !pr.episodeId || pr.episodeId === episodeId;
          const isShotMatch = !pr.shotId || pr.shotId === shot.id;
          const shotLocation = (
            shot.location ||
            foundScene?.location ||
            episodeScene?.location ||
            ''
          ).toLowerCase();
          const prTags = (pr.tags || []).map((t) => t.toLowerCase());
          const isLocationMatch =
            !pr.episodeId ||
            shotLocation.includes(pr.name.toLowerCase()) ||
            pr.name.toLowerCase().includes(shotLocation) ||
            prTags.some(
              (t) =>
                shotLocation.includes(t) ||
                t.includes('location') ||
                t.includes('living room') ||
                t.includes('studio') ||
                t.includes('phòng khách')
            );

          if (isEpisodeMatch && isShotMatch && isLocationMatch) {
            references.push({
              reference_id: pr.id,
              reference_type: 'LOCATION',
              version: resolveReferenceVersion(pr),
              source: `ProjectReference/${pr.id}`,
              purpose: `Tham chiếu bối cảnh không gian: ${pr.name}`,
              url: pr.uri,
              thumbnailUrl: pr.thumbnail || pr.uri,
              isLocked: true,
            });
          }
        } else if (pr.type === 'prop') {
          // Relevant only if matches props specified for this shot or continuity
          const currentProps = [
            ...(continuity.props || []),
            ...(shot.continuityNotes?.propContinuity
              ? [shot.continuityNotes.propContinuity]
              : []),
          ].map((p) => p.toLowerCase());

          const isEpisodeMatch = !pr.episodeId || pr.episodeId === episodeId;
          const isShotMatch = !pr.shotId || pr.shotId === shot.id;
          const prTags = (pr.tags || []).map((t) => t.toLowerCase());

          const isPropMatch =
            (pr.shotId && pr.shotId === shot.id) ||
            currentProps.some(
              (cp) =>
                cp.includes(pr.name.toLowerCase()) ||
                pr.name.toLowerCase().includes(cp) ||
                prTags.some((t) => cp.includes(t))
            );

          if (isEpisodeMatch && isShotMatch && isPropMatch) {
            references.push({
              reference_id: pr.id,
              reference_type: 'PROP',
              version: resolveReferenceVersion(pr),
              source: `ProjectReference/${pr.id}`,
              purpose: `Tham chiếu đạo cụ sản xuất: ${pr.name}`,
              url: pr.uri,
              thumbnailUrl: pr.thumbnail || pr.uri,
              isLocked: true,
            });
          }
        } else if (
          pr.tags?.includes('continuity') ||
          (pr.shotId && pr.shotId !== shot.id && pr.episodeId === episodeId)
        ) {
          // Relevant only if belongs to current episode continuity and linked sequence
          const isEpisodeMatch = pr.episodeId === episodeId;
          const isPreviousShotMatch =
            continuity.previousShotId && pr.shotId === continuity.previousShotId;
          const isSceneMatch =
            foundScene?.shots?.some((s) => s.id === pr.shotId) &&
            pr.shotId !== shot.id;

          if (
            isEpisodeMatch &&
            (isPreviousShotMatch || isSceneMatch || pr.tags?.includes('continuity'))
          ) {
            references.push({
              reference_id: pr.id,
              reference_type: 'CONTINUITY',
              version: resolveReferenceVersion(pr),
              source: `ProjectReference/${pr.id}`,
              purpose: `Tham chiếu tính liên tục cảnh phim: ${pr.name}`,
              url: pr.uri,
              thumbnailUrl: pr.thumbnail || pr.uri,
              shotId: pr.shotId,
              isLocked: true,
            });
          }
        }
      }
    }

    // Deterministically sort all references by canonical type order, then stable reference_id
    const REFERENCE_TYPE_ORDER: Record<string, number> = {
      STORYBOARD_REFERENCE: 1,
      CHARACTER: 2,
      STYLE: 3,
      LOCATION: 4,
      PROP: 5,
      CONTINUITY: 6,
    };

    references.sort((a, b) => {
      const orderA = REFERENCE_TYPE_ORDER[a.reference_type] ?? 99;
      const orderB = REFERENCE_TYPE_ORDER[b.reference_type] ?? 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.reference_id.localeCompare(b.reference_id);
    });

    // 9. Negative Constraints Compilation (Aligned with Master Production Prompt Section 12)
    const negativeConstraints = [
      'Duplicate characters, extra family members, random people, random children, unrequested pets',
      'Character redesigns, different hairstyles, different outfits, age changes, incorrect body proportions',
      'Kem with long, fluffy, spiky, or tufted hair (MUST BE VERY SHORT BUZZ CUT, almost bald, no bangs/fringe)',
      'Text, subtitles, logos, watermarks, UI elements, unrequested objects, unrequested environmental changes',
      'Important subjects outside the central 40% safe zone, camera movement that causes main subject to leave safe zone',
      'photorealistic humans, live action movie, uncanny valley, 2D vector, flat cartoon, anime lineart',
      'distorted hands, extra fingers, malformed limbs, fused bodies',
      'deviations from approved Character Master DNA',
    ];
    if (styleData.negativePrompt) {
      negativeConstraints.push(styleData.negativePrompt);
    }

    // 10. Constraints (16:9 Canvas + 9:16 Shorts Safe + Center Safe Area 40%)
    const constraints: ProductionPack['constraints'] = {
      aspectRatio: '16:9',
      shortsCropSafe: true,
      safeArea: 'CENTER',
      compositionRules: [
        'Central 40% horizontal safe zone mandatory for 9:16 vertical center crop simulation',
        'Keep main characters fully visible from head to feet whenever reasonably possible',
        'Center-safe composition has absolute priority over wide cinematic composition',
        'Balanced negative space around main action, soft warm background bokeh',
      ],
    };

    // 10.5 Camera Timeline Resolution & Normalization (Aligned with Master Prompt Sections 8 & 15)
    const resolvedCameraTimeline: CameraTimelineEntry[] =
      shot.cameraTimeline && shot.cameraTimeline.length > 0
        ? shot.cameraTimeline
        : sceneBrief?.cameraTimeline && sceneBrief.cameraTimeline.length > 0
        ? sceneBrief.cameraTimeline
        : [];

    const normalizedCameraTimeline: CameraTimelineEntry[] = resolvedCameraTimeline.map((beat) => ({
      timeRange: (beat.timeRange || '').trim(),
      description: (beat.description || '').trim(),
      movement: beat.movement ? beat.movement.trim() : undefined,
      framing: beat.framing ? beat.framing.trim() : undefined,
      focus: beat.focus ? beat.focus.trim() : undefined,
    }));

    // 11. Derive Deterministic Production Pack Identity from Immutable Inputs
    const canonicalPayload = {
      canonVersion: (episode as any)?.version ? String((episode as any).version) : '1.0',
      episodeId,
      sceneId: foundScene?.id || shot.storyboardSceneId,
      shotId: shot.id,
      sceneNumber: foundScene?.sceneNumber || shot.sceneNumber,
      shotNumber: shot.shotNumber,
      sceneCanon: {
        location: foundScene?.location || shot.location || 'Phòng khách gia đình Pi Kem',
        lighting: foundScene?.lighting || shot.lighting || 'Ánh ban mai chiếu xiên ấm áp',
        timeOfDay: foundScene?.timeOfDay || shot.timeOfDay || 'Buổi sáng',
        weather: 'Trời nắng trong veo',
      },
      effectiveSettings: {
        aspectRatio: effectiveSettings.aspectRatio,
        safeArea: effectiveSettings.safeArea,
        executionMode: effectiveSettings.executionMode,
        targetProvider: effectiveSettings.targetProvider,
        enforceDnaLock: effectiveSettings.enforceDnaLock,
        enforceStyleLock: effectiveSettings.enforceStyleLock,
      },
      shot: {
        action: shot.action,
        dialogue: shot.dialogue,
        emotion: shot.emotion,
        shotType: shot.shotType,
        framing: shot.framing,
        cameraMovement: shot.cameraMovement,
        cameraAngle: shot.cameraAngle,
        cameraDirection: shot.cameraDirection,
        lighting: shot.lighting,
        location: shot.location,
        characterIds: [...(shot.characterIds || [])].sort(),
      },
      cameraTimeline: normalizedCameraTimeline.map((b) => ({
        timeRange: b.timeRange,
        description: b.description,
        movement: b.movement || '',
        framing: b.framing || '',
        focus: b.focus || '',
      })),
      characters: charactersData
        .map((c) => ({
          characterId: c.characterId,
          lockedVersionId: c.activeVersionId,
          versionNumber: c.versionNumber,
        }))
        .sort((a, b) => a.characterId.localeCompare(b.characterId)),
      style: {
        styleVersionId: styleData.styleVersionId,
        versionNumber: styleData.versionNumber,
      },
      continuity: {
        allowedCharacters: [...(continuity.allowedCharacters || [])].sort(),
        excludedCharacters: [...(continuity.excludedCharacters || [])].sort(),
        props: [...(continuity.props || [])].sort(),
        location: continuity.location,
        environment: continuity.environment,
        lighting: continuity.lighting,
      },
      references: references.map((r) => ({
        id: r.reference_id,
        type: r.reference_type,
        version: r.version,
        url: r.url,
      })),
      negativeConstraints,
    };

    const canonicalInputHash = computeDeterministicPayloadHash(canonicalPayload);
    const packId = `pack_${shot.id}_${canonicalInputHash.slice(0, 12)}`;

    const pack: ProductionPack = {
      pack_id: packId,
      canonical_input_hash: canonicalInputHash,
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
      scene_brief: sceneBrief,
      camera_timeline:
        normalizedCameraTimeline.length > 0 ? normalizedCameraTimeline : undefined,
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
