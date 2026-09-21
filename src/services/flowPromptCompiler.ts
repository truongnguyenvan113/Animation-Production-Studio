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
    sections.push(
      `=== SHOT INTENT ===\n` +
      `Tập phim: ${pack.canon_snapshot.episodeTitle} | Cảnh #${pack.canon_snapshot.sceneNumber} | Shot #${pack.canon_snapshot.shotNumber}\n` +
      `Mục đích thị giác: ${pack.shot.visualPurpose || 'Keyframe thiết lập bối cảnh'}\n` +
      `Thời lượng: ${pack.shot.durationSeconds}s | Trạng thái cảm xúc: ${pack.shot.emotion || 'Tự nhiên, ấm áp'}`
    );

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
    sections.push(
      `=== CAMERA ===\n` +
      `Góc quay (Camera Angle): ${pack.shot.cameraAngle || 'Eye-level 0°'}\n` +
      `Cỡ cảnh (Shot Type): ${pack.shot.shotType}\n` +
      `Bố cục khung hình (Framing): ${pack.shot.framing || 'Rule of Thirds'}\n` +
      `Chuyển động máy quay: ${pack.shot.cameraMovement || 'Static / Cố định'}\n` +
      `Hướng camera: ${pack.shot.cameraDirection || 'Chính diện'}`
    );

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
    sections.push(
      `=== CONTINUITY ===\n` +
      `Vị trí nhân vật: ${pack.continuity.characterPositions || 'Giữ nguyên trục hành động của cảnh trước'}\n` +
      `Đạo cụ liên tục: ${pack.continuity.propContinuity || 'Bạt sàn và màu vẽ duy trì trạng thái hiện hữu'}\n` +
      `Môi trường liên tục: ${pack.continuity.environmentContinuity || 'Nắng sớm chiếu xiên qua cửa sổ không đổi'}`
    );

    // 12. REFERENCE INSTRUCTIONS
    const refLines = pack.references.map((r, i) => {
      return `[Ref #${i + 1}] [${r.reference_type}] ${r.purpose} (Mã: ${r.reference_id}, URL: ${r.url})`;
    });
    sections.push(
      `=== REFERENCE INSTRUCTIONS ===\n` +
      (refLines.length > 0 ? refLines.join('\n') : 'Không sử dụng thêm tài liệu tham chiếu ngoại vi.')
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
