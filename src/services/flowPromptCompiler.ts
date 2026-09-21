/**
 * Flow Prompt Compiler
 * Deterministically compiles a ProductionPack into the official
 * PI & KEM — GOOGLE FLOW MASTER PRODUCTION PROMPT (15-Part Canonical Standard).
 * Strictly enforces all 15 sections, Center-Safe Composition, Character Master DNA,
 * Family Member Lock, Style Lock, and Shot-Specific Dynamic Injection.
 */

import { ProductionPack } from '../types';

export class FlowPromptCompiler {
  /**
   * Deterministically compiles the complete Google Flow Master Production Prompt string from a ProductionPack
   */
  public static compile(pack: ProductionPack): string {
    const sceneCanon = pack.canon_snapshot.sceneCanon;
    const shotDuration = Math.min(pack.shot.durationSeconds || 5, 10);

    // Character mapping
    const visibleCharacters = pack.characters.map((c) => c.displayName);
    const visibleFamilyMembersText =
      visibleCharacters.length > 0
        ? visibleCharacters.join(', ')
        : 'Không có nhân vật trong shot (Cảnh tĩnh môi trường / Shot bối cảnh vật thể)';

    // Camera Timeline formatting
    const cameraBeats = pack.camera_timeline || pack.scene_brief?.cameraTimeline;
    let cameraTimelineFormatted = '';
    if (cameraBeats && cameraBeats.length > 0) {
      cameraTimelineFormatted = cameraBeats
        .map(
          (b) =>
            `[${b.timeRange}]: ${b.description}${b.movement ? ` [Chuyển động: ${b.movement}]` : ''}${b.framing ? ` [Khung hình: ${b.framing}]` : ''}${b.focus ? ` [Trọng tâm: ${b.focus}]` : ''}`
        )
        .join('\n');
    } else {
      cameraTimelineFormatted = `[0–${shotDuration}s]: ${pack.shot.cameraMovement || 'Static eye-level frame'} — giữ trọn vẹn chủ thể chính bên trong vùng an toàn 9:16 (central 40% safe zone).`;
    }

    // Spatial Lock formatting
    let spatialBlockingList = '';
    if (pack.continuity.characterPositions) {
      spatialBlockingList = `* Vị trí nhân vật theo tính liên tục: ${pack.continuity.characterPositions}\n`;
    }
    if (pack.characters.length === 1) {
      spatialBlockingList += `* ${pack.characters[0].displayName}: CENTER (khóa chặt bên trong vùng an toàn 40% trung tâm)`;
    } else if (pack.characters.length === 2) {
      spatialBlockingList += `* ${pack.characters[0].displayName}: CENTER LEFT (bên trong 40% safe zone)\n* ${pack.characters[1].displayName}: CENTER RIGHT (bên trong 40% safe zone)`;
    } else if (pack.characters.length > 2) {
      const positions = ['CENTER LEFT', 'CENTER', 'CENTER RIGHT', 'SUB-CENTER'];
      spatialBlockingList += pack.characters
        .map((c, i) => `* ${c.displayName}: ${positions[i % positions.length]} (bên trong 40% safe zone)`)
        .join('\n');
    } else {
      spatialBlockingList += '* Cảnh bối cảnh tĩnh / Không có nhân vật hiện diện.';
    }

    // Dialogue formatting
    const dialogueFormatted = pack.shot.dialogue
      ? `• ${pack.shot.speakerCharacterName ? `${pack.shot.speakerCharacterName}: ` : ''}"${pack.shot.dialogue}"`
      : '• Không có thoại trong shot này (Hành động trực quan / Silent action).';

    // References formatting
    const attachedRefsFormatted =
      pack.references.length > 0
        ? pack.references
            .map(
              (r, i) =>
                `${i + 1}. [${r.reference_type}] ${r.purpose} (Mã: ${r.reference_id}, Version: ${r.version}${r.url ? `, URL: ${r.url}` : ''})`
            )
            .join('\n')
        : 'Chưa đính kèm tài liệu tham chiếu bổ sung.';

    const storyboardRef = pack.references.find((r) => r.reference_type === 'STORYBOARD_REFERENCE');
    const charRefs = pack.references.filter((r) => r.reference_type === 'CHARACTER');
    const styleRef = pack.references.find((r) => r.reference_type === 'STYLE');

    // Props formatting
    const propsList = [
      ...(pack.continuity.props || []),
      ...(pack.shot.continuityNotes?.propContinuity ? [pack.shot.continuityNotes.propContinuity] : []),
    ];
    const propsText = propsList.length > 0 ? propsList.join(', ') : 'Không có đạo cụ đặc biệt';

    // Section 15 Summary fields
    const charBlockingSummary =
      pack.continuity.characterPositions ||
      (pack.characters.length > 0
        ? pack.characters.map((c) => `${c.displayName} ở vị trí trung tâm an toàn (Center Safe Zone)`).join('; ')
        : 'Không có nhân vật');

    const cameraSummary = `${pack.shot.shotType}, Góc máy: ${pack.shot.cameraAngle || 'Eye-level 0°'}, Bố cục: ${pack.shot.framing || 'Rule of Thirds / Center-Safe'}`;

    const continuitySummary = [
      pack.continuity.propContinuity ? `Đạo cụ: ${pack.continuity.propContinuity}` : '',
      pack.continuity.environmentContinuity ? `Môi trường: ${pack.continuity.environmentContinuity}` : '',
      pack.continuity.characterPositions ? `Nhân vật: ${pack.continuity.characterPositions}` : '',
    ]
      .filter(Boolean)
      .join(' | ') || 'Duy trì tính liên tục của ánh sáng ban mai và không gian phòng khách.';

    const storyboardSummaryText = storyboardRef
      ? `Đã đính kèm Storyboard Keyframe [${storyboardRef.reference_id}] (Version: ${storyboardRef.version}): Sử dụng làm hướng dẫn bố cục không gian, tỷ lệ và chặn vị trí nhân vật (spatial blocking guide).`
      : 'Không có Storyboard Reference cụ thể (Áp dụng Center-Safe Composition chuẩn).';

    const charRefsSummaryText =
      charRefs.length > 0
        ? charRefs.map((cr) => `[${cr.reference_id}] (${cr.version}): ${cr.purpose}`).join('; ')
        : 'Áp dụng Character Master DNA chuẩn v1.0.';

    // Assemble the 15-Part Master Production Prompt
    return `# PI & KEM — GOOGLE FLOW MASTER PRODUCTION PROMPT

## 1. CORE PRODUCTION LOCK

Create a cinematic 3D animated family scene for the Pi & Kem series.

**Production rules:**

* Exactly the specified Pi & Kem family members.
* Never duplicate, merge, replace, or redesign characters.
* Character DNA is the source of truth for identity and appearance.
* Character reference images are authoritative for visual identity.
* Preserve the same face, body proportions, hairstyle, clothing and overall visual identity across shots.
* Do not introduce characters that are not explicitly listed.
* Do not remove a listed character unless the shot explicitly specifies that the character is not visible.
* Maximum shot duration: 10 seconds.
* No subtitles, captions, logos, UI elements, or watermarks unless explicitly requested.
* Vietnamese dialogue with a natural Northern Vietnamese accent.

---

# 2. CENTER-SAFE COMPOSITION — MANDATORY FOR ALL SHOTS

All production footage MUST be generated in **16:9 landscape**.

However, every shot must be composed specifically for later **9:16 vertical center cropping**.

### 9:16 SAFE ZONE

Treat the **central 40% of the horizontal 16:9 frame as the primary vertical safe zone**.

\`\`\`text
16:9 MASTER FRAME

┌──────────────────────────────────────────────┐
│                                              │
│   NON-CRITICAL   │  9:16 SAFE ZONE │  NON-CRITICAL
│                  │                │
│                  │                │
│                  │                │
│                  │                │
└──────────────────────────────────────────────┘
\`\`\`

### Mandatory rules

* Keep the main character strictly within the central safe zone.
* Keep the main food/object strictly within the central safe zone.
* Keep the primary action within the central safe zone.
* Keep important faces and facial expressions within the central safe zone.
* Keep important hands and character interactions within the central safe zone.
* Keep all critical visual information within the central safe zone.
* Keep characters fully visible from head to feet whenever reasonably possible.
* Leave sufficient space around important characters and objects.
* Do NOT place important characters, faces, hands, objects, or actions near the left or right edges.
* Do NOT use wide compositions that require important subjects to span the full 16:9 width.
* Secondary/background elements may extend toward the left and right edges only when they are non-essential.
* Do NOT introduce important characters or objects from the extreme left or right edges.
* Prefer centered compositions, medium shots, and medium-wide shots over extreme wide shots.
* Camera movement must keep the main subject inside the safe zone throughout the entire shot.
* If the character moves, subtly follow and re-center the subject.
* Do not allow the primary subject to leave the safe zone during camera movement.
* The scene must remain natural and cinematic in 16:9.

### SAFE AREA PRIORITY

**Center-safe composition has absolute priority over wide cinematic composition.**

Do not sacrifice vertical-crop safety for a wider cinematic composition.

### 9:16 SIMULATION REQUIREMENT

Before rendering, mentally simulate a **9:16 center crop** of the final 16:9 frame.

The resulting vertical crop MUST still contain:

* the complete main character whenever possible
* the main object
* the primary action
* important facial expressions
* essential character interactions
* all critical visual information

The shot must remain visually understandable and aesthetically acceptable after center cropping to 9:16.

---

# 3. CHARACTER MASTER DNA

## BA TRƯỜNG / ETHAN — FATHER

Ba Trường (Ethan), fit mid-30s father, rectangular glasses, friendly approachable face, short dark side-part hair, clean-shaven. Wearing a light blue polo shirt and grey shorts. Athletic adult male build, supportive expression.

**Character Lock:**

* Adult Vietnamese father.
* Rectangular glasses.
* Short dark side-part hair.
* Clean-shaven.
* Light blue polo shirt.
* Grey shorts.
* Athletic adult male proportions.
* Friendly, caring and supportive presence.
* Do not change his face, hairstyle, body proportions, glasses, or clothing.

---

## MẸ VÂN / EMMA — MOTHER

Mẹ Vân (Emma), stylish early 30s mother, friendly round face, short dark wavy hair. Wearing a **PURPLE FLORAL COLLARED SHIRT** and blue jeans. Fit and energetic adult female proportions, warm and confident presence.

**Character Lock:**

* Adult Vietnamese mother.
* Friendly round face.
* Short dark wavy hair.
* PURPLE FLORAL COLLARED SHIRT.
* Blue jeans.
* Fit adult female proportions.
* Warm, patient and confident presence.
* Do not change her face, hairstyle, body proportions, or clothing.

---

## CHỊ PI / NANCY — OLDER SISTER

Nancy (Pi), a vibrant 6-year-old girl, large expressive dark eyes, dark hair tied in two high bouncy pigtails with colorful ribbons. Wearing a yellow t-shirt and denim overalls. Childlike proportions, small body, slightly oversized head. Joyful and energetic.

**Character Lock:**

* 6-year-old girl.
* Large expressive dark eyes.
* Two high bouncy pigtails.
* Colorful ribbons.
* Yellow t-shirt.
* Denim overalls.
* Small childlike body.
* Slightly oversized head.
* Joyful and energetic.
* Do not change her face, hairstyle, proportions, or clothing.

---

## EM KEM / LEO — YOUNGER BROTHER

Leo (Kem), an adorable 3-year-old toddler, chubby rosy cheeks, large curious eyes. Wearing a blue and white striped summer romper. Toddler proportions: round baby face, short arms and legs, noticeably smaller than his sister.

**CRITICAL HAIR LOCK:**

* VERY SHORT BUZZ CUT dark hair.
* Almost bald.
* Hair tightly cropped to the scalp.
* NO bangs.
* NO fringe.
* NO fluffy hair.
* NO spikes.
* NO tufts.
* NO long hair.

Do not redesign, age up, or change his hairstyle.

---

# 4. FAMILY MEMBER LOCK

The core Pi & Kem family consists of exactly four members:

1. Ba Trường / Ethan — Father
2. Mẹ Vân / Emma — Mother
3. Chị Pi / Nancy — Older sister
4. Em Kem / Leo — Younger brother

For every shot, explicitly identify which family members are visible.

Visible family members in this shot: ${visibleFamilyMembersText}

Never create duplicate versions of the same character.

Never introduce additional people, children, animals, or background characters unless explicitly requested.

---

# 5. STYLE LOCK

Use a consistent cinematic 3D animated family-film visual style.

* Cinematic 3D animation.
* High-quality polished 3D rendering.
* Natural skin and material detail.
* Soft cinematic lighting.
* Natural depth of field.
* Smooth cinematic camera movement.
* Warm, appealing family-friendly visual tone.
* Consistent character rendering.
* Consistent visual identity across all shots.

Do not switch animation style, character design language, rendering style, or visual identity between shots.

---

# 6. EPISODE CONTEXT

**Episode Title:** ${pack.canon_snapshot.episodeTitle}

**Episode Theme:** ${pack.shot.visualPurpose || 'Gia đình gắn kết, khám phá cuộc sống hàng ngày đầy ắp tiếng cười'}

**Story Context:**
${pack.scene_brief?.sceneIntent || 'Gia đình Pi Kem cùng nhau trải nghiệm những khoảnh khắc ấm áp và hài hước trong đời sống hàng ngày.'}

**Characters Used in This Episode:**
${pack.continuity.allowedCharacters && pack.continuity.allowedCharacters.length > 0 ? pack.continuity.allowedCharacters.join(', ') : 'Ba Trường (Ethan), Mẹ Vân (Emma), Chị Pi (Nancy), Em Kem (Leo)'}

**Episode Continuity:**
${pack.continuity.location ? `Địa điểm: ${pack.continuity.location}. ` : ''}${pack.continuity.lighting ? `Ánh sáng: ${pack.continuity.lighting}. ` : ''}${pack.continuity.environment ? `Môi trường: ${pack.continuity.environment}. ` : 'Duy trì không gian sinh hoạt ấm cúng gia đình chuẩn Canon.'}

---

# 7. SCENE

**Scene:** Cảnh #${pack.canon_snapshot.sceneNumber}${pack.scene_brief?.sceneIntent ? ` — ${pack.scene_brief.sceneIntent}` : ''}

**Location:**
${sceneCanon.location || pack.shot.location || 'Phòng khách gia đình Pi Kem'}

**Environment:**
${sceneCanon.lighting || 'Ánh ban mai chiếu xiên ấm áp qua cửa sổ phòng khách, bầu không khí gia đình trong trẻo, sinh động.'}

**Characters Visible:**
${visibleFamilyMembersText}

**Props:**
${propsText}

**Scene Action:**
${pack.scene_brief?.sceneIntent || pack.shot.action}

**Emotion / Performance:**
${pack.scene_brief?.emotion || pack.shot.emotion || 'Ấm áp, tự nhiên, tràn đầy năng lượng tươi vui.'}

**Dialogue:**
${dialogueFormatted}

**Sound Intent:**
${pack.scene_brief?.soundIntent || pack.shot.soundIntent || 'Âm thanh sinh hoạt gia đình chân thật, tiếng bước chân, tiếng cười nói tự nhiên, không nhạc nền át tiếng.'}

---

# 8. SHOT

**Shot:** Shot #${pack.canon_snapshot.shotNumber} (${pack.shot_id})

**Duration:** MAXIMUM 10 SECONDS (${shotDuration}s)

**Shot Intent:**
${pack.shot.visualPurpose || 'Keyframe diễn hoạt chuẩn xác hành động và cảm xúc của nhân vật.'}

**Exact Action:**
${pack.shot.action}

**Character Blocking:**
${charBlockingSummary}

**Camera:**
${cameraSummary}

**Camera Movement:**
${pack.shot.cameraMovement || 'Static / Cố định'}

**Camera Timeline:**
${cameraTimelineFormatted}

**Composition:**
Apply the mandatory CENTER-SAFE COMPOSITION rules above.

**Lighting:**
${pack.shot.lighting || sceneCanon.lighting || 'Ánh sáng tự nhiên dịu nhẹ'}

---

# 9. CONTINUITY LOCK

Maintain continuity with previous and following shots.

Preserve:

* Character identity.
* Face.
* Body proportions.
* Hairstyle.
* Clothing.
* Character positions where continuity requires it.
* Props.
* Location layout.
* Environment.
* Lighting.
* Time of day.
* Visual style.
* Ongoing action.

Do not introduce unexplained changes between shots.

---

# 10. SPATIAL LOCK

Use explicit spatial positioning whenever multiple characters appear.

Example:

* Emma: FAR LEFT
* Ethan: FAR RIGHT
* Nancy: CENTER LEFT
* Leo: CENTER RIGHT

Shot Spatial Blocking:
${spatialBlockingList}

However, when applying spatial blocking, keep all **important faces, actions and interactions inside the central 40% safe zone whenever possible**.

Spatial blocking must never compromise 9:16 center-crop readability.

---

# 11. AUDIO / DIALOGUE

All dialogue must be spoken in:

**Vietnamese — natural Northern Vietnamese accent.**

Use the exact supplied dialogue.

${dialogueFormatted}

Do not translate dialogue into English.

Do not generate subtitles or on-screen text.

---

# 12. NEGATIVE CONSTRAINTS

Do NOT generate:

* Duplicate characters.
* Extra family members.
* Random people.
* Random children.
* Pets unless explicitly requested.
* Character redesigns.
* Different hairstyles.
* Different outfits.
* Age changes.
* Incorrect body proportions.
* Kem with long, fluffy, spiky, or tufted hair.
* Text.
* Subtitles.
* Logos.
* Watermarks.
* UI elements.
* Unrequested objects.
* Unrequested environmental changes.
* Important subjects outside the central safe zone.
* Camera movement that causes the main subject to leave the safe zone.

---

# 13. REFERENCES

Attach when available:

1. Character reference — Ba Trường / Ethan
2. Character reference — Mẹ Vân / Emma
3. Character reference — Pi / Nancy
4. Character reference — Kem / Leo
5. Style reference
6. Storyboard reference
7. Location reference
8. Prop reference
9. Continuity reference

Character references preserve identity.

Storyboard reference controls spatial composition, blocking and shot intent.

Do not reinterpret the storyboard in a way that conflicts with Character DNA or CENTER-SAFE COMPOSITION.

Attached References for this Shot:
${attachedRefsFormatted}

---

# 14. FINAL GENERATION INSTRUCTION

Generate ONLY the specified shot.

Preserve all Character, Style, Scene, Spatial, Continuity and Negative Locks.

**16:9 landscape production source.**

**Maximum 10 seconds.**

**CENTER-SAFE COMPOSITION IS MANDATORY.**

The shot must remain fully understandable after a **9:16 center crop**.

The final footage must work both as:

1. An individual 16:9 episode shot.
2. A 9:16 Shorts crop.

Maintain cinematic quality without sacrificing center-safe composition.

---

# 15. SHOT-SPECIFIC INPUT

Replace ONLY these fields:

**EPISODE:**
${pack.canon_snapshot.episodeTitle} (${pack.episode_id})

**SCENE:**
Cảnh #${pack.canon_snapshot.sceneNumber} (${pack.scene_id})

**SHOT:**
Shot #${pack.canon_snapshot.shotNumber} (${pack.shot_id})

**CHARACTERS VISIBLE:**
${visibleFamilyMembersText}

**LOCATION:**
${sceneCanon.location || pack.shot.location || 'Phòng khách gia đình Pi Kem'}

**PROPS:**
${propsText}

**ACTION:**
${pack.shot.action}

**CHARACTER BLOCKING:**
${charBlockingSummary}

**CAMERA:**
${cameraSummary}

**CAMERA TIMELINE:**
${cameraTimelineFormatted}

**EMOTION:**
${pack.shot.emotion || pack.scene_brief?.emotion || 'Ấm áp, tự nhiên, sinh động'}

**DIALOGUE:**
${dialogueFormatted}

**CONTINUITY:**
${continuitySummary}

**STORYBOARD:**
${storyboardSummaryText}

**CHARACTER REFERENCES:**
${charRefsSummaryText}`;
  }

  /**
   * Generates a condensed prompt suitable for tools with character limits
   */
  public static compileCondensed(pack: ProductionPack): string {
    const charDesc = pack.characters
      .map((c) => `${c.displayName} (${c.facialFeatures}, ${c.hairStyle}, ${c.outfit})`)
      .join('; ');
    return (
      `Pixar 3D animation keyframe. ${pack.shot.shotType}, ${pack.shot.framing}. ` +
      `Scene: ${pack.shot.action}. ` +
      `Characters: ${charDesc}. ` +
      `Lighting: ${pack.shot.lighting}, Location: ${pack.shot.location}. ` +
      `Safe centered composition for 16:9 and 9:16 crop. High detail, warm cinematic tones.`
    );
  }
}
