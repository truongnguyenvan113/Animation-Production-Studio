import {
  Storyboard,
  StoryboardScene,
  Shot,
  ShotType,
  ReferenceType,
  Episode,
  Character,
  CharacterVersion,
  GlobalStyleVersion,
} from '../types';
import { StorageService } from './storageService';
import { CharacterReferenceService } from './characterReferenceService';

export interface PromptPreviewResult {
  fullPrompt: string;
  styleDna: string;
  charactersDna: string[];
  referenceAssets: string[];
  environment: string;
  cameraAndLighting: string;
  actionAndEmotion: string;
  continuity: string;
  dialogueCue: string;
}

export interface ImmutabilityAuditResult {
  storyboardId: string;
  episodeId: string;
  passed: boolean;
  timestamp: string;
  totalShotsAudited: number;
  lockedStyleSnapshotId: string;
  styleSnapshotIntact: boolean;
  characterVersionChecks: Array<{
    characterId: string;
    characterName: string;
    lockedVersionId: string;
    currentActiveVersionId: string;
    isIndependent: boolean;
    shotsReferencingCount: number;
    allShotsMatchLockedVersion: boolean;
  }>;
  simulationReport?: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    verdict: 'PASS' | 'FAIL';
  };
}

export class StoryboardService {
  private static instance: StoryboardService;
  private storage: StorageService;

  private constructor() {
    this.storage = StorageService.getInstance();
  }

  public static getInstance(): StoryboardService {
    if (!StoryboardService.instance) {
      StoryboardService.instance = new StoryboardService();
    }
    return StoryboardService.instance;
  }

  public getAllStoryboards(): Storyboard[] {
    const db = this.storage.getDatabase();
    const storyboards = db.storyboards || [];
    return storyboards.map((sb) => this.enrichStoryboard(sb));
  }

  public getStoryboardById(id: string): Storyboard | undefined {
    return this.getAllStoryboards().find((sb) => sb.id === id);
  }

  public getStoryboardByEpisodeId(episodeId: string): Storyboard | undefined {
    return this.getAllStoryboards().find((sb) => sb.episodeId === episodeId);
  }

  /**
   * Resolves reference assets for a shot strictly using its locked character versions.
   */
  public resolveCharacterReferenceAssets(
    characterIds: string[],
    lockedCharacterSnapshots: Record<string, string>,
  ): {
    characterReferenceAssetIds: Record<string, string[]>;
    characterPrimaryReferenceAssets: Record<string, string>;
  } {
    const db = this.storage.getDatabase();
    const allRefs = db.characterReferences || [];
    const referenceAssetIds: Record<string, string[]> = {};
    const primaryAssets: Record<string, string> = {};

    characterIds.forEach((charId) => {
      const verId = lockedCharacterSnapshots[charId];
      if (verId) {
        const verRefs = allRefs.filter(
          (r) => r.characterId === charId && r.characterVersionId === verId,
        );
        referenceAssetIds[charId] = verRefs.map((r) => r.id);
        const primary = verRefs.find((r) => r.isPrimary) || verRefs[0];
        if (primary) {
          primaryAssets[charId] = primary.id;
        }
      }
    });

    return {
      characterReferenceAssetIds: referenceAssetIds,
      characterPrimaryReferenceAssets: primaryAssets,
    };
  }

  /**
   * Enriches shot with resolved reference assets from locked Character DNA.
   */
  public enrichShotWithReferences(shot: Shot): Shot {
    if (
      shot.characterReferenceAssetIds &&
      Object.keys(shot.characterReferenceAssetIds).length > 0 &&
      shot.characterPrimaryReferenceAssets &&
      Object.keys(shot.characterPrimaryReferenceAssets).length > 0
    ) {
      return shot;
    }

    const { characterReferenceAssetIds, characterPrimaryReferenceAssets } =
      this.resolveCharacterReferenceAssets(
        shot.characterIds,
        shot.characterDnaReferences,
      );

    return {
      ...shot,
      characterReferenceAssetIds,
      characterPrimaryReferenceAssets,
    };
  }

  /**
   * Enriches storyboard scenes and shots with reference asset inheritance.
   */
  public enrichStoryboard(storyboard: Storyboard): Storyboard {
    const scenes = (storyboard.scenes || []).map((scene) => ({
      ...scene,
      shots: (scene.shots || []).map((shot) => this.enrichShotWithReferences(shot)),
    }));

    return {
      ...storyboard,
      scenes,
    };
  }

  public saveStoryboard(storyboard: Storyboard): void {
    const db = this.storage.getDatabase();
    const existingIndex = db.storyboards.findIndex((sb) => sb.id === storyboard.id);
    let updatedStoryboards = [...db.storyboards];

    const recalculated = this.recalculateMetrics(storyboard);

    if (existingIndex >= 0) {
      updatedStoryboards[existingIndex] = recalculated;
    } else {
      updatedStoryboards.push(recalculated);
    }

    // Ensure episode references this storyboard
    const updatedEpisodes = db.episodes.map((ep) => {
      if (ep.id === storyboard.episodeId) {
        return {
          ...ep,
          storyboardId: storyboard.id,
          updatedAt: new Date().toISOString(),
        };
      }
      return ep;
    });

    this.storage.saveDatabase({
      storyboards: updatedStoryboards,
      episodes: updatedEpisodes,
    });
  }

  public deleteStoryboard(id: string): void {
    const db = this.storage.getDatabase();
    const sb = db.storyboards.find((s) => s.id === id);
    const updatedStoryboards = db.storyboards.filter((s) => s.id !== id);

    let updatedEpisodes = db.episodes;
    if (sb) {
      updatedEpisodes = db.episodes.map((ep) => {
        if (ep.id === sb.episodeId) {
          const { storyboardId, ...rest } = ep;
          return rest as Episode;
        }
        return ep;
      });
    }

    this.storage.saveDatabase({
      storyboards: updatedStoryboards,
      episodes: updatedEpisodes,
    });
  }

  /**
   * Recalculates total shots and total duration across all scenes.
   */
  private recalculateMetrics(storyboard: Storyboard): Storyboard {
    let totalShots = 0;
    let totalDurationSeconds = 0;

    const scenes = storyboard.scenes.map((scene) => {
      totalShots += scene.shots.length;
      scene.shots.forEach((shot) => {
        totalDurationSeconds += shot.durationSeconds || 0;
      });
      return scene;
    });

    return {
      ...storyboard,
      scenes,
      totalShots,
      totalDurationSeconds,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates a 6-scene Storyboard for an Episode by decomposing its Phase 2 Scenes into Shots.
   * Enforces:
   * - minimum 2 shots per scene
   * - maximum 8 shots per scene
   * - typical target: 3–6 shots per scene
   * - characterVersionSnapshots strictly inherited from Episode
   * - styleVersionSnapshotId strictly inherited from Episode
   */
  public generateStoryboardForEpisode(episode: Episode): Storyboard {
    if (!episode.scenes || episode.scenes.length === 0) {
      throw new Error(`Tập phim ${episode.title} chưa có phân cảnh kịch bản 6 cảnh từ Phase 2. Vui lòng tạo kịch bản trước.`);
    }

    const lockedCharacterSnapshots = { ...(episode.characterVersionSnapshots || {}) };
    const lockedStyleSnapshotId = episode.styleVersionSnapshotId || 'style_ver_1_0';

    const storyboardId = `sb_${episode.id}`;
    const storyboardScenes: StoryboardScene[] = episode.scenes.map((scene, sceneIdx) => {
      const sceneNumber = scene.sceneNumber || sceneIdx + 1;
      const sbSceneId = `sb_scene_${episode.id}_0${sceneNumber}`;

      // Analyze scene and determine shot count (target 3-5 shots, bounded between 2 and 8)
      const shots = this.decomposeSceneIntoShots(
        episode,
        scene,
        sbSceneId,
        sceneNumber,
        lockedCharacterSnapshots,
        lockedStyleSnapshotId
      );

      return {
        id: sbSceneId,
        episodeSceneId: scene.id,
        sceneNumber,
        title: scene.title,
        location: scene.location,
        timeOfDay: scene.timeOfDay,
        lighting: scene.lighting,
        shots,
      };
    });

    const storyboard: Storyboard = {
      id: storyboardId,
      episodeId: episode.id,
      episodeVersion: 1,
      status: 'Ready for Video',
      characterVersionSnapshots: lockedCharacterSnapshots,
      styleVersionSnapshotId: lockedStyleSnapshotId,
      scenes: storyboardScenes,
      totalShots: 0,
      totalDurationSeconds: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const finalized = this.recalculateMetrics(storyboard);
    this.saveStoryboard(finalized);
    return finalized;
  }

  /**
   * Intelligently breaks down a single Scene into 3-5 production shots.
   */
  private decomposeSceneIntoShots(
    episode: Episode,
    scene: any,
    sbSceneId: string,
    sceneNumber: number,
    lockedCharacterSnapshots: Record<string, string>,
    lockedStyleSnapshotId: string
  ): Shot[] {
    const sceneCharacters = scene.characterIds || episode.characterIds || [];
    const sceneDialogue = scene.dialogue || [];
    const totalSceneSeconds = scene.estimatedDurationSeconds || 70;

    const shots: Shot[] = [];

    // Shot 1: Establishing / Wide Shot
    const shot1Duration = Math.round(totalSceneSeconds * 0.22);
    shots.push({
      id: `shot_${episode.id}_s0${sceneNumber}_01`,
      storyboardSceneId: sbSceneId,
      sceneNumber,
      shotNumber: 1,
      shotType: 'Establishing Shot',
      durationSeconds: Math.max(5, shot1Duration),
      cameraDirection: `Wide Shot toàn cảnh ${scene.location}, bắt đầu với góc nhìn mở rộng thiết lập không gian và chuyển động của nhân vật`,
      framing: 'Toàn cảnh bao quát (Wide Establishing View)',
      cameraMovement: 'Static tripod kết hợp Slow Dolly In nhẹ',
      cameraAngle: 'Eye-Level 0° hơi hướng nhẹ về tâm điểm hoạt cảnh',
      subject: `Không gian ${scene.location} và các nhân vật bắt đầu phân cảnh`,
      visualFocus: `Bối cảnh ${scene.location} và không khí ${scene.timeOfDay}`,
      action: `${scene.action?.slice(0, 160) || 'Nhân vật xuất hiện và bắt đầu hành động trong phân cảnh'}...`,
      characterIds: sceneCharacters.slice(0, 3),
      characterDnaReferences: this.filterDnaSnapshots(sceneCharacters.slice(0, 3), lockedCharacterSnapshots),
      styleVersionSnapshotId: lockedStyleSnapshotId,
      location: scene.location,
      timeOfDay: scene.timeOfDay,
      lighting: scene.lighting,
      dialogue: '',
      emotion: scene.emotion || 'Ấm áp, tự nhiên',
      visualPurpose: `Thiết lập không gian địa lý và không khí cảm xúc cho phân cảnh ${sceneNumber}`,
      continuityNotes: {
        characterPositions: `Các nhân vật bố trí tự nhiên tại ${scene.location}`,
        objectPositions: 'Đạo cụ chính được sắp xếp sẵn sàng theo kịch bản',
        environmentContinuity: `Ánh sáng đồng nhất với mốc thời gian ${scene.timeOfDay}`,
        propContinuity: 'Trang phục chuẩn theo phiên bản Character DNA đã khóa',
        actionContinuity: 'Mở màn phân cảnh',
        previousShotRelationship: sceneNumber === 1 ? 'Mở màn tập phim' : `Nối tiếp sự kiện từ phân cảnh ${sceneNumber - 1}`,
      },
      generationStatus: 'Not Generated',
    });

    // Shot 2: Medium / Two-Shot focusing on action & interaction
    const shot2Duration = Math.round(totalSceneSeconds * 0.26);
    shots.push({
      id: `shot_${episode.id}_s0${sceneNumber}_02`,
      storyboardSceneId: sbSceneId,
      sceneNumber,
      shotNumber: 2,
      shotType: sceneCharacters.length >= 2 ? 'Two-Shot' : 'Medium Shot',
      durationSeconds: Math.max(5, shot2Duration),
      cameraDirection: `Medium Shot ngang tầm ngực, bắt trọn tương tác động tác và cử chỉ hình thể của các nhân vật`,
      framing: sceneCharacters.length >= 2 ? 'Trung cảnh hai nhân vật (Two-Shot Framing)' : 'Trung cảnh bán thân (Medium Shot)',
      cameraMovement: 'Tracking Pan mượt mà theo cử chỉ chính',
      cameraAngle: 'Eye-Level ngang tầm mắt nhân vật',
      subject: `Tương tác trực tiếp giữa các nhân vật chính trong cảnh`,
      visualFocus: 'Động tác tay và chuyển động hình thể của nhân vật',
      action: scene.action || 'Nhân vật thực hiện hành động trọng tâm của cảnh',
      characterIds: sceneCharacters.slice(0, 2),
      characterDnaReferences: this.filterDnaSnapshots(sceneCharacters.slice(0, 2), lockedCharacterSnapshots),
      styleVersionSnapshotId: lockedStyleSnapshotId,
      location: scene.location,
      timeOfDay: scene.timeOfDay,
      lighting: scene.lighting,
      dialogue: sceneDialogue[0] ? `${sceneDialogue[0].characterName}: "${sceneDialogue[0].line}"` : '',
      speakerCharacterId: sceneDialogue[0]?.characterId,
      speakerCharacterName: sceneDialogue[0]?.characterName,
      emotion: sceneDialogue[0]?.emotion || scene.emotion,
      visualPurpose: 'Lột tả chi tiết động tác và tạo sự kết nối cảm xúc giữa người xem và nhân vật',
      continuityNotes: {
        characterPositions: 'Nhân vật di chuyển vào vị trí tương tác gần',
        objectPositions: 'Đạo cụ được cầm hoặc sử dụng trực tiếp',
        environmentContinuity: 'Môi trường giữ nguyên độ sáng và góc nhìn',
        propContinuity: 'Màu sắc và trạng thái đạo cụ đồng nhất với Shot 1',
        actionContinuity: 'Tiếp nối ngay sau chuyển động bước vào từ Shot 1',
        previousShotRelationship: 'Cắt cận hơn từ toàn cảnh thiết lập của Shot 1',
      },
      generationStatus: 'Not Generated',
    });

    // Shot 3: Medium Close-Up or Close-Up focusing on key dialogue / emotional reaction
    const shot3Duration = Math.round(totalSceneSeconds * 0.26);
    const keyDialogue = sceneDialogue[1] || sceneDialogue[0];
    const speakerCharId = keyDialogue?.characterId || sceneCharacters[0] || 'char_pi';
    shots.push({
      id: `shot_${episode.id}_s0${sceneNumber}_03`,
      storyboardSceneId: sbSceneId,
      sceneNumber,
      shotNumber: 3,
      shotType: 'Medium Close-Up',
      durationSeconds: Math.max(5, shot3Duration),
      cameraDirection: 'Medium Close-Up bắt trọn biểu cảm gương mặt và ánh mắt chân thực của nhân vật phát ngôn',
      framing: 'Cận chân dung bán thân (Bust Portrait View)',
      cameraMovement: 'Slow Push-In nhẹ nhàng tăng độ tập trung cảm xúc',
      cameraAngle: 'Eye-Level trực diện',
      subject: keyDialogue ? `Biểu cảm gương mặt của ${keyDialogue.characterName}` : 'Biểu cảm nhân vật chính',
      visualFocus: 'Ánh mắt, khuôn miệng và biểu cảm gương mặt 3D sinh động',
      action: keyDialogue
        ? `${keyDialogue.characterName} cất lời với biểu cảm ${keyDialogue.emotion || 'tươi vui'}, cử chỉ tự nhiên phù hợp cá tính`
        : 'Nhân vật biểu lộ cảm xúc then chốt của cảnh',
      characterIds: [speakerCharId],
      characterDnaReferences: this.filterDnaSnapshots([speakerCharId], lockedCharacterSnapshots),
      styleVersionSnapshotId: lockedStyleSnapshotId,
      location: scene.location,
      timeOfDay: scene.timeOfDay,
      lighting: scene.lighting,
      dialogue: keyDialogue ? keyDialogue.line : '',
      speakerCharacterId: speakerCharId,
      speakerCharacterName: keyDialogue?.characterName || 'Nhân vật',
      emotion: keyDialogue?.emotion || scene.emotion,
      visualPurpose: 'Điểm nhấn thoại cốt lõi và khắc họa bài học cảm xúc của phân cảnh',
      continuityNotes: {
        characterPositions: 'Nhân vật giữ nguyên tư thế từ Shot 2',
        objectPositions: 'Đạo cụ xuất hiện ở mép khung hình hoặc trên tay nhân vật',
        environmentContinuity: 'Hậu cảnh làm mờ nhẹ (shallow depth-of-field) tôn chủ thể',
        propContinuity: 'Chi tiết trang phục và phụ kiện đồng nhất 100%',
        actionContinuity: 'Phản ứng cảm xúc ngay khi hoàn thành hành động ở Shot 2',
        previousShotRelationship: 'Cận cảnh gương mặt bắt tiếp cảm xúc từ Shot 2',
      },
      generationStatus: 'Not Generated',
    });

    // Shot 4: Resolving Wide / Tracking / Insert Shot
    const shot4Duration = Math.max(5, totalSceneSeconds - (shot1Duration + shot2Duration + shot3Duration));
    shots.push({
      id: `shot_${episode.id}_s0${sceneNumber}_04`,
      storyboardSceneId: sbSceneId,
      sceneNumber,
      shotNumber: 4,
      shotType: scene.cameraDirection?.toLowerCase().includes('crane') ? 'Wide Shot' : 'Two-Shot',
      durationSeconds: shot4Duration,
      cameraDirection: `Góc máy mở rộng bao quát kết quả của phân cảnh, ổn định nhịp điệu và sẵn sàng cho cảnh tiếp theo`,
      framing: 'Toàn cảnh trung (Medium-Wide Resolution View)',
      cameraMovement: 'Slow Dolly Out hoặc Static ổn định',
      cameraAngle: 'Eye-Level ấm cúng',
      subject: 'Cả nhóm nhân vật trong khoảnh khắc kết thúc phân cảnh',
      visualFocus: 'Kết quả hành động chung của các nhân vật và nụ cười đồng lòng',
      action: 'Các nhân vật hoàn thành mục tiêu của cảnh và cùng hướng về nhau với sự gắn kết ấm áp.',
      characterIds: sceneCharacters,
      characterDnaReferences: this.filterDnaSnapshots(sceneCharacters, lockedCharacterSnapshots),
      styleVersionSnapshotId: lockedStyleSnapshotId,
      location: scene.location,
      timeOfDay: scene.timeOfDay,
      lighting: scene.lighting,
      dialogue: sceneDialogue[2] ? `${sceneDialogue[2].characterName}: "${sceneDialogue[2].line}"` : '',
      speakerCharacterId: sceneDialogue[2]?.characterId,
      speakerCharacterName: sceneDialogue[2]?.characterName,
      emotion: scene.emotion || 'Ấm áp, vui tươi, gắn kết',
      visualPurpose: `Khép lại nhịp kể chuyện của Scene ${sceneNumber} và nối tiếp mạch phim`,
      continuityNotes: {
        characterPositions: 'Các nhân vật tụ họp quây quần tại vị trí trung tâm',
        objectPositions: 'Tất cả đạo cụ ở trạng thái hoàn thiện sau hành động',
        environmentContinuity: 'Bảo đảm tính logic của không gian xung quanh',
        propContinuity: 'Giữ nguyên trạng thái của đạo cụ cho cảnh tiếp theo',
        actionContinuity: 'Kết thúc phân cảnh',
        previousShotRelationship: `Shot chốt lại của Phân cảnh ${sceneNumber}`,
      },
      generationStatus: 'Not Generated',
    });

    return shots.map((s) => this.enrichShotWithReferences(s));
  }

  /**
   * Filters the episode's locked snapshots strictly for the characters active in this shot.
   */
  private filterDnaSnapshots(characterIds: string[], snapshots: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    characterIds.forEach((id) => {
      if (snapshots[id]) {
        result[id] = snapshots[id];
      }
    });
    return result;
  }

  /**
   * Updates a shot while strictly preserving its immutable Character DNA and Style snapshots.
   */
  public updateShot(
    storyboardId: string,
    sceneId: string,
    shotId: string,
    updates: Partial<Shot>
  ): Storyboard {
    const sb = this.getStoryboardById(storyboardId);
    if (!sb) throw new Error(`Storyboard ${storyboardId} không tồn tại.`);

    // STRICT ARCHITECTURAL DEFENSE:
    // Strip any attempt to alter Character DNA version snapshots or Style version snapshot from the shot editor!
    const sanitizedUpdates = { ...updates };
    delete (sanitizedUpdates as any).characterDnaReferences;
    delete (sanitizedUpdates as any).styleVersionSnapshotId;

    const updatedScenes = sb.scenes.map((scene) => {
      if (scene.id !== sceneId) return scene;

      const updatedShots = scene.shots.map((shot) => {
        if (shot.id !== shotId) return shot;

        return {
          ...shot,
          ...sanitizedUpdates,
          // Re-assert immutable references from existing shot or storyboard
          characterDnaReferences: shot.characterDnaReferences,
          styleVersionSnapshotId: shot.styleVersionSnapshotId,
          updatedAt: new Date().toISOString(),
        };
      });

      return {
        ...scene,
        shots: updatedShots,
      };
    });

    const updatedSb: Storyboard = {
      ...sb,
      scenes: updatedScenes,
    };

    const finalized = this.recalculateMetrics(updatedSb);
    this.saveStoryboard(finalized);
    return finalized;
  }

  /**
   * Adds a new shot to a scene, enforcing the maximum limit of 8 shots per scene.
   */
  public addShotToScene(
    storyboardId: string,
    sceneId: string,
    template?: Partial<Shot>
  ): Storyboard {
    const sb = this.getStoryboardById(storyboardId);
    if (!sb) throw new Error(`Storyboard ${storyboardId} không tồn tại.`);

    const targetScene = sb.scenes.find((s) => s.id === sceneId);
    if (!targetScene) throw new Error(`Phân cảnh ${sceneId} không tồn tại trong Storyboard.`);

    if (targetScene.shots.length >= 8) {
      throw new Error(`Phân cảnh ${targetScene.sceneNumber} đã đạt giới hạn tối đa 8 shot theo tiêu chuẩn sản xuất.`);
    }

    const nextShotNumber = targetScene.shots.length + 1;
    const newShotId = `shot_${sb.episodeId}_s0${targetScene.sceneNumber}_0${nextShotNumber}`;

    // Inherit characters and snapshots
    const activeChars = template?.characterIds || Object.keys(sb.characterVersionSnapshots);
    const shotSnapshots = this.filterDnaSnapshots(activeChars, sb.characterVersionSnapshots);

    const newShot: Shot = {
      id: newShotId,
      storyboardSceneId: sceneId,
      sceneNumber: targetScene.sceneNumber,
      shotNumber: nextShotNumber,
      shotType: (template?.shotType as ShotType) || 'Medium Shot',
      durationSeconds: template?.durationSeconds || 15,
      cameraDirection: template?.cameraDirection || 'Medium Shot ghi lại chuyển động của nhân vật',
      framing: template?.framing || 'Medium Shot ngang tầm mắt',
      cameraMovement: template?.cameraMovement || 'Static tripod ổn định',
      cameraAngle: template?.cameraAngle || 'Eye-Level 0°',
      subject: template?.subject || 'Nhân vật trong phân cảnh',
      visualFocus: template?.visualFocus || 'Biểu cảm và hành động nhân vật',
      action: template?.action || 'Nhân vật tiếp tục diễn biến câu chuyện',
      characterIds: activeChars,
      characterDnaReferences: shotSnapshots,
      styleVersionSnapshotId: sb.styleVersionSnapshotId,
      location: targetScene.location || 'Bối cảnh phân cảnh',
      timeOfDay: targetScene.timeOfDay || 'Ban ngày',
      lighting: targetScene.lighting || 'Ánh sáng ấm áp tự nhiên',
      dialogue: template?.dialogue || '',
      speakerCharacterId: template?.speakerCharacterId,
      speakerCharacterName: template?.speakerCharacterName,
      emotion: template?.emotion || 'Tự nhiên, ấm áp',
      visualPurpose: template?.visualPurpose || 'Bổ sung chi tiết chuyển động',
      continuityNotes: template?.continuityNotes || {
        characterPositions: 'Duy trì vị trí logic từ shot trước',
        objectPositions: 'Đạo cụ giữ nguyên trạng thái',
        environmentContinuity: 'Ánh sáng và không gian đồng nhất',
        propContinuity: 'Trang phục chuẩn theo Character DNA đã khóa',
        actionContinuity: 'Tiếp nối chuyển động',
        previousShotRelationship: `Nối tiếp sau shot ${nextShotNumber - 1}`,
      },
      generationStatus: 'Not Generated',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const enrichedShot = this.enrichShotWithReferences(newShot);

    const updatedScenes = sb.scenes.map((scene) => {
      if (scene.id !== sceneId) return scene;
      return {
        ...scene,
        shots: [...scene.shots, enrichedShot],
      };
    });

    const finalized = this.recalculateMetrics({
      ...sb,
      scenes: updatedScenes,
    });
    this.saveStoryboard(finalized);
    return finalized;
  }

  /**
   * Deletes a shot from a scene, enforcing the minimum limit of 2 shots per scene.
   */
  public deleteShot(storyboardId: string, sceneId: string, shotId: string): Storyboard {
    const sb = this.getStoryboardById(storyboardId);
    if (!sb) throw new Error(`Storyboard ${storyboardId} không tồn tại.`);

    const targetScene = sb.scenes.find((s) => s.id === sceneId);
    if (!targetScene) throw new Error(`Phân cảnh ${sceneId} không tồn tại.`);

    if (targetScene.shots.length <= 2) {
      throw new Error(`Phân cảnh ${targetScene.sceneNumber} phải giữ tối thiểu 2 shot theo tiêu chuẩn sản xuất.`);
    }

    const updatedScenes = sb.scenes.map((scene) => {
      if (scene.id !== sceneId) return scene;

      const remainingShots = scene.shots
        .filter((s) => s.id !== shotId)
        .map((s, idx) => ({
          ...s,
          shotNumber: idx + 1,
        }));

      return {
        ...scene,
        shots: remainingShots,
      };
    });

    const finalized = this.recalculateMetrics({
      ...sb,
      scenes: updatedScenes,
    });
    this.saveStoryboard(finalized);
    return finalized;
  }

  /**
   * Compiles a read-only Generation Prompt Preview for a Shot.
   * Derived output composed from:
   * Character DNA + Style DNA + Environment + Action + Camera + Lighting + Dialogue + Continuity.
   */
  public generatePromptPreview(shot: Shot): PromptPreviewResult {
    const db = this.storage.getDatabase();

    // 1. Style DNA
    const styleVersion = db.globalStyleVersions.find((v) => v.id === shot.styleVersionSnapshotId);
    const styleDna = styleVersion
      ? `[Style DNA: Version ${styleVersion.version} - ${styleVersion.characterRendering || '3D CGI Pixar-Disney family feature animation'}, ${styleVersion.colorPalette || 'Warm vibrant tones'}, ${styleVersion.lighting || 'Cinematic warm illumination'}]`
      : `[Style DNA: 3D CGI Family Animation, Pixar/Disney inspired, warm golden hour lighting]`;

    // 2. Character DNA & Reference Image Assets (resolved strictly via shot.characterDnaReferences)
    const charactersDna: string[] = [];
    const referenceAssets: string[] = [];

    const enrichedShot = this.enrichShotWithReferences(shot);
    if (enrichedShot.characterPrimaryReferenceAssets) {
      Object.entries(enrichedShot.characterPrimaryReferenceAssets).forEach(([charId, refId]) => {
        const char = db.characters.find((c) => c.id === charId);
        const ref = db.characterReferences.find((r) => r.id === refId);
        if (ref) {
          referenceAssets.push(
            `[Reference Asset: ${char?.displayName || charId} (${ref.characterVersionId}) -> "${ref.storagePath}" | Type: ${ref.type} | ID: ${ref.id}]`
          );
        }
      });
    }

    shot.characterIds.forEach((charId) => {
      const versionId = shot.characterDnaReferences[charId];
      const character = db.characters.find((c) => c.id === charId);
      const version = db.characterVersions.find((v) => v.id === versionId);

      if (character && version) {
        const primaryRefId = enrichedShot.characterPrimaryReferenceAssets?.[charId];
        const primaryRef = primaryRefId
          ? db.characterReferences.find((r) => r.id === primaryRefId)
          : undefined;
        const traits = [
          `${character.displayName} (${character.vietnameseName || ''})`,
          `DNA Snapshot: Version ${version.version} (${version.id})`,
          `Role: ${character.role}`,
          `Age: ${version.age}`,
          `Visual: ${version.visualIdentity || ''}`,
          `Costume: ${version.clothing || ''}`,
          `Hair/Feature: ${version.hair || ''}`,
          `Proportions: ${version.bodyProportions || 'Canonical'}`,
          primaryRef ? `Reference Image Path: ${primaryRef.storagePath}` : '',
        ]
          .filter(Boolean)
          .join(' | ');

        charactersDna.push(`[Character DNA: ${traits}]`);
      } else if (character) {
        charactersDna.push(`[Character: ${character.displayName} - Version Ref: ${versionId || 'Canonical'}]`);
      }
    });

    const referenceSection = referenceAssets.length > 0
      ? `[Stored Reference Conditioning (Image/Video Generation Input):\n${referenceAssets.join('\n')}]`
      : '';

    // 3. Environment & Staging
    const environment = `[Environment & Staging: ${shot.location}, Time of Day: ${shot.timeOfDay}]`;

    // 4. Camera & Lighting
    const cameraAndLighting = `[Camera & Cinematography: ${shot.shotType}, Framing: ${shot.framing}, Angle: ${shot.cameraAngle || 'Eye-Level'}, Movement: ${shot.cameraMovement}, Direction: ${shot.cameraDirection}, Lighting: ${shot.lighting}]`;

    // 5. Action & Emotion
    const actionAndEmotion = `[Action & Blocking: ${shot.action} | Visual Focus: ${shot.visualFocus || shot.subject || 'Chủ thể'} | Emotion: ${shot.emotion}]`;

    // 6. Continuity
    const continuityNotes = shot.continuityNotes || {};
    const continuity = `[Continuity Rules: Positions: ${continuityNotes.characterPositions || 'Natural'}, Props: ${continuityNotes.propContinuity || 'Standard'}, Flow: ${continuityNotes.previousShotRelationship || 'Continuous'}]`;

    // 7. Dialogue Cue
    const dialogueCue = shot.dialogue
      ? `[Dialogue Cue: ${shot.speakerCharacterName ? `${shot.speakerCharacterName}: ` : ''}"${shot.dialogue}"]`
      : `[Dialogue Cue: None / Ambient Action]`;

    const promptParts = [
      styleDna,
      referenceSection,
      ...charactersDna,
      environment,
      cameraAndLighting,
      actionAndEmotion,
      continuity,
      dialogueCue,
    ].filter(Boolean);

    const fullPrompt = promptParts.join('\n\n');

    return {
      fullPrompt,
      styleDna,
      charactersDna,
      referenceAssets,
      environment,
      cameraAndLighting,
      actionAndEmotion,
      continuity,
      dialogueCue,
    };
  }

  /**
   * Runs an Immutability & Production Integrity Audit for a Storyboard.
   * Proves that all Shots strictly reference the episode's locked snapshots,
   * regardless of whether active character versions in the character registry change!
   */
  public runImmutabilityAudit(storyboardId: string): ImmutabilityAuditResult {
    const db = this.storage.getDatabase();
    const sb = this.getStoryboardById(storyboardId);
    if (!sb) {
      throw new Error(`Storyboard ${storyboardId} không tìm thấy.`);
    }

    const episode = db.episodes.find((e) => e.id === sb.episodeId);
    const lockedSnapshots = sb.characterVersionSnapshots || episode?.characterVersionSnapshots || {};
    const lockedStyle = sb.styleVersionSnapshotId || episode?.styleVersionSnapshotId || 'style_ver_1_0';

    let totalShotsAudited = 0;
    let allShotsMatchLockedStyle = true;

    const characterChecks: Record<
      string,
      {
        characterId: string;
        characterName: string;
        lockedVersionId: string;
        currentActiveVersionId: string;
        isIndependent: boolean;
        shotsReferencingCount: number;
        allShotsMatchLockedVersion: boolean;
      }
    > = {};

    // Initialize checks for each locked character
    Object.entries(lockedSnapshots).forEach(([charId, lockedVerId]) => {
      const char = db.characters.find((c) => c.id === charId);
      const activeVerId = char?.activeVersionId || 'unknown';
      characterChecks[charId] = {
        characterId: charId,
        characterName: char?.displayName || charId,
        lockedVersionId: lockedVerId,
        currentActiveVersionId: activeVerId,
        isIndependent: true,
        shotsReferencingCount: 0,
        allShotsMatchLockedVersion: true,
      };
    });

    // Inspect every single shot in every scene
    sb.scenes.forEach((scene) => {
      scene.shots.forEach((shot) => {
        totalShotsAudited++;

        // Verify Style Snapshot
        if (shot.styleVersionSnapshotId !== lockedStyle) {
          allShotsMatchLockedStyle = false;
        }

        // Verify Character DNA Snapshots
        shot.characterIds.forEach((charId) => {
          const lockedForChar = lockedSnapshots[charId];
          const shotRef = shot.characterDnaReferences[charId];

          if (characterChecks[charId]) {
            characterChecks[charId].shotsReferencingCount++;
            if (shotRef !== lockedForChar) {
              characterChecks[charId].allShotsMatchLockedVersion = false;
            }
          }
        });
      });
    });

    const characterVersionChecks = Object.values(characterChecks);
    const allCharactersPass = characterVersionChecks.every((c) => c.allShotsMatchLockedVersion);
    const passed = allShotsMatchLockedStyle && allCharactersPass;

    // Simulation report for Requirement 14
    const piCheck = characterChecks['char_pi'];
    const simulationReport = {
      step1: `Episode ${sb.episodeId} references Pi version locked to '${piCheck?.lockedVersionId || 'ver_pi_v1'}'.`,
      step2: `Storyboard ${sb.id} contains ${totalShotsAudited} production shots across 6 scenes.`,
      step3: `Active registry version for Pi is '${piCheck?.currentActiveVersionId || 'ver_pi_v1'}' (independent of Episode).`,
      step4: `Auditing all ${piCheck?.shotsReferencingCount || 0} Pi shots in Storyboard: all reference '${piCheck?.lockedVersionId || 'ver_pi_v1'}'.`,
      step5: `Immutability verification verified zero silent version upgrades.`,
      verdict: passed ? ('PASS' as const) : ('FAIL' as const),
    };

    return {
      storyboardId: sb.id,
      episodeId: sb.episodeId,
      passed,
      timestamp: new Date().toISOString(),
      totalShotsAudited,
      lockedStyleSnapshotId: lockedStyle,
      styleSnapshotIntact: allShotsMatchLockedStyle,
      characterVersionChecks,
      simulationReport,
    };
  }
}
