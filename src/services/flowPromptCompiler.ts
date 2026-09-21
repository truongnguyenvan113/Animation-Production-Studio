/**
 * Flow Prompt Compiler
 * Deterministically compiles a ProductionPack into structured Google Flow instructions.
 * Strictly separates sections to ensure zero ambiguity and immutable DNA enforcement.
 */

import { ProductionPack } from '../types';

export class FlowPromptCompiler {
  /**
   * Deterministically compiles the complete Google Flow prompt string from a ProductionPack
   */
  public static compile(pack: ProductionPack): string {
    const sections: string[] = [];

    // 1. SHOT INTENT
    const intentLines = [
      `Tập phim: ${pack.canon_snapshot.episodeTitle} | Cảnh #${pack.canon_snapshot.sceneNumber} | Shot #${pack.canon_snapshot.shotNumber}`,
      `Mục đích thị giác (Visual Purpose): ${pack.shot.visualPurpose || 'Keyframe thiết lập bối cảnh'}`,
      `Ý đồ phân cảnh (Scene Intent): ${pack.scene_brief?.sceneIntent || 'Thiết lập bối cảnh và cảm xúc câu chuyện'}`,
      `Thời lượng: ${pack.shot.durationSeconds}s | Trạng thái cảm xúc: ${pack.scene_brief?.emotion || pack.shot.emotion || 'Tự nhiên, ấm áp'}`,
      `Ý đồ âm thanh (Sound Intent): ${pack.scene_brief?.soundIntent || pack.shot.soundIntent || 'N/A'}`,
      `Ghi chú sản xuất đặc biệt (Special Notes): ${pack.scene_brief?.specialNotes || pack.shot.specialNotes || 'N/A'}`,
    ];
    sections.push(`=== SHOT INTENT ===\n` + intentLines.join('\n'));

    // 2. CHARACTER LOCK (Source of Truth - Immutable)
    const charLocks = pack.characters.map((char) => {
      const constraintsText = char.dnaConstraints.length > 0
        ? `\n  - RÀNG BUỘC DNA BẮT BUỘC:\n    * ${char.dnaConstraints.join('\n    * ')}`
        : '';
      return (
        `• NHÂN VẬT: ${char.displayName} (Version: ${char.versionNumber} [${char.activeVersionId}])\n` +
        `  - Khuôn mặt & Đặc điểm: ${char.facialFeatures}\n` +
        `  - Kiểu tóc & Tông màu: ${char.hairStyle}\n` +
        `  - Tông da: ${char.skinTone}${constraintsText}`
      );
    });
    sections.push(
      `=== CHARACTER LOCK ===\n` +
      (charLocks.length > 0 ? charLocks.join('\n\n') : 'Không có nhân vật trong shot (Cảnh tĩnh môi trường).')
    );

    // 3. OUTFIT LOCK
    const outfitLocks = pack.characters.map((char) => {
      return `• Trang phục của ${char.displayName}: ${char.outfit || 'Trang phục chuẩn theo Canon Version'}`;
    });
    sections.push(
      `=== OUTFIT LOCK ===\n` +
      (outfitLocks.length > 0 ? outfitLocks.join('\n') : 'N/A')
    );

    // 4. STYLE LOCK (From Style DNA)
    sections.push(
      `=== STYLE LOCK ===\n` +
      `Phong cách chuẩn: ${pack.style.name} (Version: ${pack.style.versionNumber})\n` +
      `Mô tả phong cách dương bản: ${pack.style.positivePrompt}\n` +
      `Quy tắc bảng màu: ${pack.style.colorPaletteRule}\n` +
      `Quy tắc ánh sáng: ${pack.style.lightingRule}`
    );

    // 5. LOCATION LOCK
    const sceneCanon = pack.canon_snapshot.sceneCanon;
    sections.push(
      `=== LOCATION LOCK ===\n` +
      `Địa điểm: ${sceneCanon.location || pack.shot.location || 'Không gian gia đình'}\n` +
      `Thời điểm trong ngày: ${sceneCanon.timeOfDay || pack.shot.timeOfDay || 'Ban ngày'}\n` +
      `Ánh sáng môi trường: ${sceneCanon.lighting || pack.shot.lighting || 'Ánh sáng tự nhiên dịu nhẹ'}`
    );

    // 6. CAMERA
    const cameraBeats = pack.camera_timeline || pack.scene_brief?.cameraTimeline;
    let cameraSection =
      `=== CAMERA ===\n` +
      `Góc quay (Camera Angle): ${pack.shot.cameraAngle || 'Eye-level 0°'}\n` +
      `Cỡ cảnh (Shot Type): ${pack.shot.shotType}\n` +
      `Bố cục khung hình (Framing): ${pack.shot.framing || 'Rule of Thirds'}\n` +
      `Chuyển động máy quay: ${pack.shot.cameraMovement || 'Static / Cố định'}\n` +
      `Hướng camera: ${pack.shot.cameraDirection || 'Chính diện'}`;

    if (cameraBeats && cameraBeats.length > 0) {
      const beatsText = cameraBeats
        .map(
          (b) =>
            `• ${b.timeRange}: ${b.description}${b.movement ? ` [Chuyển động: ${b.movement}]` : ''}${b.framing ? ` [Khung hình: ${b.framing}]` : ''}${b.focus ? ` [Trọng tâm: ${b.focus}]` : ''}`
        )
        .join('\n');
      cameraSection += `\n\nDiễn tiến chuyển động máy quay theo dòng thời gian (Camera Timeline Beats):\n${beatsText}`;
    }
    sections.push(cameraSection);

    // 7. COMPOSITION
    sections.push(
      `=== COMPOSITION ===\n` +
      `Tỷ lệ gốc: ${pack.constraints.aspectRatio}\n` +
      `Vùng an toàn (Safe Area): ${pack.constraints.safeArea}\n` +
      `Trọng tâm thị giác: ${pack.shot.visualFocus || pack.shot.subject || 'Nhân vật chính đang thực hiện hành động'}\n` +
      `Quy tắc bố cục: ${pack.constraints.compositionRules.join(', ')}`
    );

    // 8. ACTION
    sections.push(
      `=== ACTION ===\n` +
      `${pack.shot.action}`
    );

    // 9. PERFORMANCE
    sections.push(
      `=== PERFORMANCE ===\n` +
      `Biểu cảm nhân vật: ${pack.shot.emotion || 'Chân thật, sinh động, phù hợp độ tuổi'}\n` +
      `Nhịp điệu hành động: Tự nhiên, mềm mại, chuẩn chuyển động hoạt hình 3D cao cấp`
    );

    // 10. DIALOGUE
    sections.push(
      `=== DIALOGUE ===\n` +
      (pack.shot.dialogue
        ? `${pack.shot.speakerCharacterName ? pack.shot.speakerCharacterName + ': ' : ''}"${pack.shot.dialogue}"`
        : 'Không có thoại trong shot này (Hành động trực quan).')
    );

    // 11. CONTINUITY
    const continuityLines: string[] = [
      `Vị trí nhân vật: ${pack.continuity.characterPositions || 'Giữ nguyên trục hành động của cảnh trước'}`,
      `Đạo cụ liên tục: ${pack.continuity.propContinuity || 'Bạt sàn và màu vẽ duy trì trạng thái hiện hữu'}`,
      `Môi trường liên tục: ${pack.continuity.environmentContinuity || 'Nắng sớm chiếu xiên qua cửa sổ không đổi'}`,
    ];

    if (pack.continuity.allowedCharacters && pack.continuity.allowedCharacters.length > 0) {
      continuityLines.push(
        `Nhân vật cho phép (Allowed Characters): ${pack.continuity.allowedCharacters.join(', ')}`
      );
    }

    if (pack.continuity.excludedCharacters && pack.continuity.excludedCharacters.length > 0) {
      continuityLines.push(
        `Nhân vật loại trừ (Excluded Characters): ${pack.continuity.excludedCharacters.join(', ')}`
      );
    }

    if (
      pack.continuity.characterAppearanceLocks &&
      pack.continuity.characterAppearanceLocks.length > 0
    ) {
      continuityLines.push(
        `Khóa tạo hình nhân vật (Character Appearance Locks):\n  * ${pack.continuity.characterAppearanceLocks.join('\n  * ')}`
      );
    }

    if (pack.continuity.outfitLocks && pack.continuity.outfitLocks.length > 0) {
      continuityLines.push(
        `Khóa trang phục (Outfit Locks):\n  * ${pack.continuity.outfitLocks.join('\n  * ')}`
      );
    }

    if (pack.continuity.props && pack.continuity.props.length > 0) {
      continuityLines.push(`Đạo cụ quy định (Props): ${pack.continuity.props.join(', ')}`);
    }

    if (pack.continuity.location) {
      continuityLines.push(`Bối cảnh chuẩn: ${pack.continuity.location}`);
    }

    if (pack.continuity.language) {
      continuityLines.push(`Ngôn ngữ (Language): ${pack.continuity.language}`);
    }

    if (pack.continuity.dialogueRequirements) {
      continuityLines.push(`Yêu cầu thoại: ${pack.continuity.dialogueRequirements}`);
    }

    if (pack.continuity.durationLimit) {
      continuityLines.push(`Giới hạn thời lượng: ${pack.continuity.durationLimit}`);
    }

    if (pack.continuity.continuityRules && pack.continuity.continuityRules.length > 0) {
      continuityLines.push(
        `Quy tắc duy trì tính nhất quán (Continuity Rules):\n  * ${pack.continuity.continuityRules.join('\n  * ')}`
      );
    }

    if (pack.continuity.relevantExclusions && pack.continuity.relevantExclusions.length > 0) {
      continuityLines.push(
        `Quy định loại trừ (Exclusion Constraints):\n  * ${pack.continuity.relevantExclusions.join('\n  * ')}`
      );
    }

    sections.push(`=== CONTINUITY ===\n` + continuityLines.join('\n'));

    // 12. REFERENCE INSTRUCTIONS
    const refLines = pack.references.map((r, i) => {
      return `[Ref #${i + 1}] [${r.reference_type}] ${r.purpose} (Mã: ${r.reference_id}${r.shotId ? `, Shot: ${r.shotId}` : ''}, URL: ${r.url})`;
    });

    const hasStoryboardRef = pack.references.some(
      (r) => r.reference_type === 'STORYBOARD_REFERENCE'
    );
    const storyboardInstruction = hasStoryboardRef
      ? `\n\n• HƯỚNG DẪN THAM CHIẾU STORYBOARD (STORYBOARD SPATIAL BLOCKING INSTRUCTION):\n  Treat the storyboard reference as the primary spatial blocking and character composition guide. Preserve the relative position, framing, and spatial relationships shown in the storyboard while following Character DNA and Style DNA as the authoritative source for identity and appearance.`
      : '';

    sections.push(
      `=== REFERENCE INSTRUCTIONS ===\n` +
        (refLines.length > 0
          ? refLines.join('\n')
          : 'Không sử dụng thêm tài liệu tham chiếu ngoại vi.') +
        storyboardInstruction
    );

    // 13. NEGATIVE CONSTRAINTS
    sections.push(
      `=== NEGATIVE CONSTRAINTS ===\n` +
      pack.negative_constraints.map((neg) => `• ${neg}`).join('\n')
    );

    // 14. SHORTS SAFE COMPOSITION
    sections.push(
      `=== SHORTS SAFE COMPOSITION ===\n` +
      `• Tỷ lệ xuất bản phụ: 9:16 dọc (YouTube Shorts / TikTok)\n` +
      `• QUY TẮC CẮT DỌC AN TOÀN: Toàn bộ nhân vật chính, đạo cụ quan trọng và biểu cảm gương mặt PHẢI nằm gọn trong phạm vi 33% - 66% trục ngang trung tâm.\n` +
      `• Nghiêm cấm đặt hành động chính sát biên trái hoặc biên phải khung hình 16:9.`
    );

    return sections.join('\n\n');
  }

  /**
   * Generates a condensed prompt suitable for tools with character limits
   */
  public static compileCondensed(pack: ProductionPack): string {
    const charDesc = pack.characters.map((c) => `${c.displayName} (${c.facialFeatures}, ${c.hairStyle}, ${c.outfit})`).join('; ');
    return (
      `Pixar 3D animation keyframe. ${pack.shot.shotType}, ${pack.shot.framing}. ` +
      `Scene: ${pack.shot.action}. ` +
      `Characters: ${charDesc}. ` +
      `Lighting: ${pack.shot.lighting}, Location: ${pack.shot.location}. ` +
      `Safe centered composition for 16:9 and 9:16 crop. High detail, warm cinematic tones.`
    );
  }
}
