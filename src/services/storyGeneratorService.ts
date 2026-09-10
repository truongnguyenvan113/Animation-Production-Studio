import {
  Character,
  CharacterVersion,
  DialogueLine,
  Episode,
  GlobalStyleVersion,
  Scene,
  StoryDraft,
} from '../types';
import { CharacterService } from './characterService';
import { CharacterVersionService } from './characterVersionService';
import { EpisodeService } from './episodeService';
import { StyleService } from './styleService';

export interface StoryGeneratorInput {
  seasonId?: string;
  title: string;
  storyIdea: string;
  educationalLesson: string;
  additionalNotes?: string;
  targetAudience: string;
  targetDuration: string;
  characterIds: string[]; // Selected canonical character IDs
  supportingCharacterIds?: string[];
  location?: string;
}

export interface StoryPreset {
  id: string;
  title: string;
  storyIdea: string;
  educationalLesson: string;
  targetAudience: string;
  targetDuration: string;
  characterIds: string[];
  supportingCharacterIds: string[];
  location: string;
  additionalNotes: string;
}

export class StoryGeneratorService {
  /**
   * Pre-configured canonical story ideas aligned with the Canonical Character Bible.
   */
  public static getStoryPresets(): StoryPreset[] {
    return [
      {
        id: 'preset_football',
        title: 'Tập 10 – Trận bóng mini và tinh thần đồng đội',
        storyIdea:
          'Ba Trường (Ethan) tổ chức một giải bóng đá mini ở sân sau với khung thành xếp bằng hai chiếc gối mềm cho Pi, Kem và Mochi cùng tham gia.',
        educationalLesson:
          'Chiến thắng không quan trọng bằng niềm vui tham gia, tinh thần đồng đội, và sự kiên nhẫn khi hướng dẫn em nhỏ.',
        targetAudience: '3–7 tuổi (Family co-viewing)',
        targetDuration: '07:00 (Phút)',
        characterIds: ['char_ethan', 'char_pi', 'char_kem'],
        supportingCharacterIds: ['char_mochi'],
        location: 'Sân cỏ sau nhà ngập nắng ấm (Backyard Mini Pitch)',
        additionalNotes:
          'Ba Trường thể hiện niềm yêu thích bóng đá cuồng nhiệt nhưng luôn nhường nhịn và khuyến khích Kem sút bóng. Mochi chạy lon ton làm trọng tài bất đắc dĩ.',
      },
      {
        id: 'preset_cooking',
        title: 'Tập 11 – Tiệm bánh kỳ diệu của Mẹ Vân và hai đầu bếp nhí',
        storyIdea:
          'Mẹ Vân (Emma) hướng dẫn Pi và Kem nhào bột làm bánh quy hình các con thú cho buổi dã ngoại cuối tuần.',
        educationalLesson:
          'Bài học về sự cẩn thận, biết kiên nhẫn chờ đợi bột nở, và niềm vui chia sẻ bánh ngon cho cả gia đình.',
        targetAudience: '3–7 tuổi (Preschool & Primary)',
        targetDuration: '07:30 (Phút)',
        characterIds: ['char_emma', 'char_pi', 'char_kem'],
        supportingCharacterIds: ['char_mochi', 'char_ethan'],
        location: 'Gian bếp gia đình sáng sủa và ấm cúng (Family Kitchen Island)',
        additionalNotes:
          'Kem lỡ tay làm bột dính lên mũi Mochi khiến cả nhà bật cười. Mẹ Vân khéo léo biến sự cố thành trò chơi tạo hình bột vui nhộn.',
      },
      {
        id: 'preset_nature',
        title: 'Tập 12 – Cuộc phiêu lưu tìm đồ chơi và bạn bướm vàng',
        storyIdea:
          'Chiếc máy bay giấy màu đỏ của Pi bay lạc vào bụi hoa sau vườn; Pi và Kem cùng Mochi lần theo dấu vết để tìm lại.',
        educationalLesson:
          'Khuyến khích trẻ quan sát thế giới tự nhiên xung quanh, bảo vệ côn trùng có ích và biết hợp tác giải quyết vấn đề.',
        targetAudience: '3–6 tuổi (Toddler & Preschool)',
        targetDuration: '06:30 (Phút)',
        characterIds: ['char_pi', 'char_kem', 'char_emma'],
        supportingCharacterIds: ['char_mochi'],
        location: 'Khu vườn hoa trước hiên nhà (Sunny Flower Garden)',
        additionalNotes:
          'Pi dẫn dắt như một nhà thám hiểm dũng cảm. Kem lặp lại các câu khẩu hiệu của chị gái một cách ngộ nghĩnh.',
      },
      {
        id: 'preset_cleanup',
        title: 'Tập 13 – Vũ điệu dọn dẹp và bí mật ngăn nắp',
        storyIdea:
          'Sau một buổi chiều chơi trò đóng kịch, phòng khách bừa bộn đồ chơi. Ba Trường và Mẹ Vân biến giờ dọn dẹp thành một thử thách âm nhạc sôi động.',
        educationalLesson:
          'Tự giác giữ gìn đồ chơi, tôn trọng không gian chung và biến việc nhà thành niềm vui gắn kết các thành viên.',
        targetAudience: '2–7 tuổi (All Family)',
        targetDuration: '06:00 (Phút)',
        characterIds: ['char_ethan', 'char_emma', 'char_pi', 'char_kem'],
        supportingCharacterIds: ['char_mochi'],
        location: 'Phòng khách gia đình ấm cúng (Living Room)',
        additionalNotes:
          'Pi sáng tạo ra bài hát dọn dẹp với vũ điệu vui nhộn. Ba Trường dùng lập trình đồng hồ đếm ngược cổ vũ hai con.',
      },
    ];
  }

  /**
   * Generates a structured 3-act story draft and scene breakdown
   * using the canonical character registry as the immutable source of truth.
   */
  public static generateStoryDraft(input: StoryGeneratorInput): StoryDraft {
    const allCharIds = Array.from(
      new Set([...input.characterIds, ...(input.supportingCharacterIds || [])]),
    );

    // 1. Resolve canonical characters and their active DNA versions
    const characterParticipation: StoryDraft['characterParticipation'] = [];
    const characterDnaSnapshots: Record<string, string> = {};

    for (const charId of allCharIds) {
      const char = CharacterService.getCharacterById(charId);
      if (!char) continue;

      const activeVer = CharacterVersionService.getVersionById(char.activeVersionId);
      const versionId = activeVer ? activeVer.id : char.activeVersionId;
      characterDnaSnapshots[charId] = versionId;

      let participationRole = 'Diễn viên phụ / Hỗ trợ câu chuyện';
      if (char.id === 'char_pi') {
        participationRole = 'Nhân vật chính nhí – Khởi xướng hành động & năng động dẫn dắt';
      } else if (char.id === 'char_kem') {
        participationRole = 'Đồng hành tò mò – Tạo tiếng cười, học hỏi và bắt chước chị Pi';
      } else if (char.id === 'char_ethan') {
        participationRole = 'Người cha vui tính – Khích lệ, hài hước, tạo sân chơi và giải pháp';
      } else if (char.id === 'char_emma') {
        participationRole = 'Người mẹ dịu dàng – Định hướng tâm lý, kiên nhẫn dạy bảo và chăm sóc';
      } else if (char.id === 'char_mochi') {
        participationRole = 'Bạn cún cưng trung thành – Yếu tố gây cười dễ thương và kết nối tình cảm';
      }

      characterParticipation.push({
        characterId: char.id,
        characterName: `${char.displayName} (${char.vietnameseName})`,
        characterRole: char.role,
        versionSnapshotId: versionId,
        participationRole,
      });
    }

    // 2. Resolve Global Style Snapshot
    const activeStyle = StyleService.getActiveStyleVersion();
    const styleVersionSnapshotId = activeStyle ? activeStyle.id : 'style_ver_1_0';

    // 3. Synthesize Narrative Structure (Beginning, Middle, Ending)
    const title = input.title.trim() || 'Tập phim mới – Khám phá cùng Pi & Kem';
    const premise = input.storyIdea.trim();
    const lesson = input.educationalLesson.trim();
    const location = input.location?.trim() || 'Không gian gia đình ấm cúng (Home Environment)';

    const beginning = `Mở đầu trong không khí tươi vui, ấm áp tại ${location}. ${
      input.characterIds.includes('char_pi')
        ? 'Pi tràn đầy năng lượng khởi xướng một hoạt động hào hứng.'
        : 'Cả nhà bắt đầu một buổi sáng ngập tràn tiếng cười.'
    } Mục tiêu rõ ràng được đặt ra cùng sự tham gia nhiệt tình của ${characterParticipation
      .map((c) => c.characterName.split(' ')[0])
      .join(', ')}.`;

    const middle = `Khi hoạt động đang diễn ra sôi nổi, một tình huống bất ngờ xuất hiện đòi hỏi sự kiên nhẫn và phối hợp. ${
      input.characterIds.includes('char_kem')
        ? 'Kem với tính tò mò ngây thơ đã tạo nên một khoảnh khắc hài hước ngoài dự kiến.'
        : 'Các nhân vật gặp chút lúng túng khi mọi thứ chưa diễn ra như ý.'
    } ${
      allCharIds.includes('char_mochi')
        ? 'Chú cún Mochi vẫy đuôi lon ton tham gia, mang lại không khí giải tỏa căng thẳng.'
        : ''
    } Nhờ sự khích lệ và hướng dẫn dịu dàng, mọi người cùng tìm ra cách giải quyết sáng tạo.`;

    const ending = `Cả nhà cùng nhau hoàn thành trọn vẹn mục tiêu trong niềm vui hân hoan. Thông điệp giáo dục: "${lesson}" được khắc sâu một cách tự nhiên qua nụ cười, cái ôm ấm áp và việc cùng dọn dẹp, chuẩn bị cho những hành trình tiếp theo.`;

    const emotionalArc =
      'Háo hức đón nhận → Tò mò khám phá → Thử thách / Bất ngờ vui vẻ → Đồng lòng sẻ chia → Tự hào & Yêu thương';

    // 4. Generate Structured Scenes (Consumable by future Storyboard phase)
    const scenes: Scene[] = this.buildStructuredScenes({
      title,
      premise,
      lesson,
      location,
      characterParticipation,
      characterDnaSnapshots,
      allCharIds,
      additionalNotes: input.additionalNotes || '',
    });

    const draftId = `draft_${Date.now()}`;
    const nowIso = new Date().toISOString();

    return {
      id: draftId,
      episodeId: '',
      title,
      premise,
      educationalLesson: lesson,
      targetAudience: input.targetAudience,
      targetDuration: input.targetDuration,
      additionalNotes: input.additionalNotes,
      beginning,
      middle,
      ending,
      emotionalArc,
      location,
      characterParticipation,
      styleVersionSnapshotId,
      scenes,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  }

  /**
   * Constructs 6 granular, production-ready scene breakdowns matching the Canonical Character Bible.
   */
  private static buildStructuredScenes(params: {
    title: string;
    premise: string;
    lesson: string;
    location: string;
    characterParticipation: StoryDraft['characterParticipation'];
    characterDnaSnapshots: Record<string, string>;
    allCharIds: string[];
    additionalNotes: string;
  }): Scene[] {
    const {
      title,
      premise,
      lesson,
      location,
      characterDnaSnapshots,
      allCharIds,
    } = params;

    const hasPi = allCharIds.includes('char_pi');
    const hasKem = allCharIds.includes('char_kem');
    const hasEthan = allCharIds.includes('char_ethan');
    const hasEmma = allCharIds.includes('char_emma');
    const hasMochi = allCharIds.includes('char_mochi');

    const filterDna = (ids: string[]) => {
      const res: Record<string, string> = {};
      for (const id of ids) {
        if (characterDnaSnapshots[id]) {
          res[id] = characterDnaSnapshots[id];
        }
      }
      return res;
    };

    // Scene 1: Inciting Incident / Warm Morning Setup
    const s1Chars = allCharIds.slice(0, 3);
    const scene1: Scene = {
      id: `scene_${Date.now()}_01`,
      sceneNumber: 1,
      title: 'Căn phòng ấm áp & Khởi đầu ý tưởng',
      location: `${location} – Khu vực trung tâm`,
      timeOfDay: 'Buổi sáng nắng dịu (Morning Warm Sun)',
      lighting: 'Ánh sáng vàng ấm 5400K rọi từ cửa sổ, đổ bóng mềm mại phong cách hoạt hình 3D cao cấp',
      characterIds: s1Chars,
      characterDnaReferences: filterDna(s1Chars),
      action: `${
        hasPi ? 'Pi nhảy chân sáo vào phòng, hai tay giơ cao đầy phấn khởi.' : 'Mọi người quây quần vui vẻ.'
      } ${
        hasKem ? 'Kem lon ton chạy theo sau, tay ôm một món đồ chơi nhỏ, mắt chớp chớp tò mò.' : ''
      } ${
        hasMochi ? 'Mochi chạy trước dẫn đường, chiếc đuôi ngắn ngoe nguẩy nhịp nhàng.' : ''
      }`,
      dialogue: [
        ...(hasPi
          ? [
              {
                characterId: 'char_pi',
                characterName: 'Pi',
                line: `Hôm nay chúng mình sẽ có một thử thách thật tuyệt vời! ${hasKem ? 'Kem ơi, em đã sẵn sàng chưa?' : ''}`,
                emotion: 'Phấn khích, vui vẻ',
              },
            ]
          : []),
        ...(hasKem
          ? [
              {
                characterId: 'char_kem',
                characterName: 'Kem',
                line: 'Sẵn sàng! Kem sẵn sàng ùi nha!',
                emotion: 'Hớn hở, ngọng nghịu đáng yêu',
              },
            ]
          : []),
        ...(hasEmma
          ? [
              {
                characterId: 'char_emma',
                characterName: 'Mẹ Vân',
                line: 'Hai bảo bối của mẹ hôm nay nhiều năng lượng quá! Mẹ đã chuẩn bị sẵn mọi thứ rồi đây.',
                emotion: 'Ấm áp, trìu mến',
              },
            ]
          : []),
      ],
      emotion: 'Tươi vui, tràn đầy mong chờ và phấn khởi',
      storyPurpose: 'Giới thiệu tiền đề câu chuyện (Inciting Incident) và thiết lập mục tiêu ban đầu',
      educationalPurpose: 'Khơi gợi lòng hào hứng tìm tòi và sự gắn kết thân thiết giữa các thành viên',
      cameraDirection: 'Wide Shot thiết lập không gian, chuyển sang Medium Two-Shot bắt biểu cảm Pi & Kem',
      estimatedDurationSeconds: 65,
    };

    // Scene 2: Preparation & Initial Steps
    const s2Chars = allCharIds.filter((id) => id !== 'char_mochi' || allCharIds.length <= 2);
    const scene2: Scene = {
      id: `scene_${Date.now()}_02`,
      sceneNumber: 2,
      title: 'Những bước đầu tiên & Sự tò mò của trẻ thơ',
      location: `${location} – Bàn làm việc & Sàn trải thảm`,
      timeOfDay: 'Buổi sáng (Bright Daytime)',
      lighting: 'Ánh sáng cân bằng, làm nổi bật màu sắc trang phục rực rỡ của các nhân vật',
      characterIds: s2Chars,
      characterDnaReferences: filterDna(s2Chars),
      action: `${
        hasPi ? 'Pi cẩn thận sắp xếp các dụng cụ theo thứ tự, vừa làm vừa chỉ dẫn cho Kem.' : ''
      } ${
        hasKem ? 'Kem bắt chước động tác của chị nhưng hơi vụng về, làm rơi nhẹ một món đồ xuống thảm rồi tròn xoe mắt nhìn.' : ''
      } ${
        hasEthan ? 'Ba Trường xuất hiện với nụ cười dí dỏm, cúi xuống cùng tầm mắt với hai con.' : ''
      }`,
      dialogue: [
        ...(hasPi
          ? [
              {
                characterId: 'char_pi',
                characterName: 'Pi',
                line: 'Em phải giữ thật chắc như thế này này, từ từ thôi nhé Kem!',
                emotion: 'Tự tin, ra dáng chị cả',
              },
            ]
          : []),
        ...(hasKem
          ? [
              {
                characterId: 'char_kem',
                characterName: 'Kem',
                line: 'Dạ... Pi chỉ Kem nha!',
                emotion: 'Ngoan ngoãn, chăm chú',
              },
            ]
          : []),
        ...(hasEthan
          ? [
              {
                characterId: 'char_ethan',
                characterName: 'Ba Trường',
                line: 'Hai tuyển thủ nhí làm việc nghiêm túc quá! Cần Ba Trường hỗ trợ một tay không nào?',
                emotion: 'Hài hước, cổ vũ',
              },
            ]
          : []),
      ],
      emotion: 'Tập trung, ấm áp, tình cảm gia đình hòa thuận',
      storyPurpose: 'Phát triển hành động (Rising Action), thể hiện tính cách nhân vật theo đúng DNA chuẩn',
      educationalPurpose: 'Dạy trẻ cách kiên nhẫn hướng dẫn em nhỏ và tinh thần ham học hỏi',
      cameraDirection: 'Over-the-shoulder shot từ góc nhìn của Ba/Mẹ, cận cảnh bàn tay các con',
      estimatedDurationSeconds: 70,
    };

    // Scene 3: Unexpected Complication / Slapstick Twist
    const s3Chars = allCharIds;
    const scene3: Scene = {
      id: `scene_${Date.now()}_03`,
      sceneNumber: 3,
      title: 'Tình huống bất ngờ & Vết chân vui nhộn',
      location: `${location} – Trung tâm khu vực hoạt động`,
      timeOfDay: 'Buổi trưa nắng sáng (Mid-morning)',
      lighting: 'Ánh sáng tương phản sinh động, làm rõ vệt chuyển động nhanh',
      characterIds: s3Chars,
      characterDnaReferences: filterDna(s3Chars),
      action: `${
        hasMochi
          ? 'Mochi háo hức nhảy cẫng lên muốn tham gia, vô tình va vào chiếc hộp khiến đồ vật lăn nhẹ trên sàn.'
          : 'Một tình huống bất ngờ xảy ra khi mọi thứ bị xáo trộn nhẹ.'
      } ${
        hasKem ? 'Kem ồ lên một tiếng đầy ngạc nhiên, rồi khúc khích cười.' : ''
      } ${
        hasPi ? 'Pi thoáng bối rối, hai tay chống hông nhưng ánh mắt dần chuyển sang bật cười.' : ''
      }`,
      dialogue: [
        ...(hasKem
          ? [
              {
                characterId: 'char_kem',
                characterName: 'Kem',
                line: `${hasMochi ? 'A, Mochi ơi! Mochi làm xiếc kìa!' : 'Ôi ôi, lăn rồi kìa chị Pi!'}`,
                emotion: 'Cười khanh khách, vô tư',
              },
            ]
          : []),
        ...(hasPi
          ? [
              {
                characterId: 'char_pi',
                characterName: 'Pi',
                line: `${hasMochi ? 'Mochi ơi là Mochi! Em tinh nghịch quá à!' : 'Khoan đã nào, chúng mình phải xử lý sao đây?'}`,
                emotion: 'Vừa giận vừa buồn cười',
              },
            ]
          : []),
        ...(hasEmma
          ? [
              {
                characterId: 'char_emma',
                characterName: 'Mẹ Vân',
                line: 'Không sao đâu các con yêu! Bất ngờ nho nhỏ này có thể trở thành một phần đặc biệt đấy.',
                emotion: 'Điềm tĩnh, dịu dàng trấn an',
              },
            ]
          : []),
      ],
      emotion: 'Bất ngờ, vui nhộn, không khí cười đùa thoải mái',
      storyPurpose: 'Nút thắt kịch tính hài hước (Complication) thử thách khả năng thích ứng của các bé',
      educationalPurpose: 'Dạy trẻ không hoảng hốt trước lỗi lầm hay tai nạn vô ý, học cách đón nhận sự cố với nụ cười',
      cameraDirection: 'Low Angle theo tầm mắt của Mochi/Kem, bắt trọn phản ứng khuôn mặt các nhân vật',
      estimatedDurationSeconds: 75,
    };

    // Scene 4: Collaborative Creative Solution
    const s4Chars = allCharIds;
    const scene4: Scene = {
      id: `scene_${Date.now()}_04`,
      sceneNumber: 4,
      title: 'Giải pháp sáng tạo & Sự đồng lòng của gia đình',
      location: `${location}`,
      timeOfDay: 'Buổi trưa ấm áp (Warm Afternoon Light)',
      lighting: 'Ánh sáng tỏa rộng êm dịu, phản chiếu không khí hợp tác gia đình',
      characterIds: s4Chars,
      characterDnaReferences: filterDna(s4Chars),
      action: `${
        hasEthan ? 'Ba Trường đưa ra một ý tưởng biến sự cố thành chi tiết trang trí độc đáo.' : 'Cả nhà cùng xúm lại tìm cách biến sự cố thành điều kỳ diệu.'
      } ${
        hasPi ? 'Mắt Pi sáng rực lên với sáng kiến mới, nhanh nhẹn tiếp tục công việc.' : ''
      } ${
        hasKem ? 'Kem nhiệt tình vỗ tay cổ vũ rồi cùng tham gia vào vị trí của mình.' : ''
      }`,
      dialogue: [
        ...(hasEthan
          ? [
              {
                characterId: 'char_ethan',
                characterName: 'Ba Trường',
                line: 'Trong lập trình, người ta gọi đây là tính năng đặc biệt chứ không phải lỗi đâu! Chúng ta cùng biến nó thành tác phẩm nào!',
                emotion: 'Hóm hỉnh, truyền cảm hứng',
              },
            ]
          : []),
        ...(hasPi
          ? [
              {
                characterId: 'char_pi',
                characterName: 'Pi',
                line: 'Đúng rồi! Em hiểu ý ba rồi! Kem ơi, em đưa cho chị chiếc nơ màu xanh kia nhé!',
                emotion: 'Hào hứng, sáng tạo',
              },
            ]
          : []),
        ...(hasKem
          ? [
              {
                characterId: 'char_kem',
                characterName: 'Kem',
                line: 'Dạ, nơ xanh của chị Pi nè!',
                emotion: 'Nhiệt tình, đắc ý',
              },
            ]
          : []),
      ],
      emotion: 'Hăng say, tràn ngập năng lượng tích cực và sự hợp tác',
      storyPurpose: 'Đỉnh điểm hành động (Climax / Teamwork Solution), giải quyết nút thắt một cách thông minh',
      educationalPurpose: 'Khuyến khích tư duy linh hoạt (growth mindset) và sức mạnh của tinh thần đồng đội',
      cameraDirection: 'Dynamic Pan theo vòng tròn bao quát cả gia đình cùng chụm đầu làm việc',
      estimatedDurationSeconds: 80,
    };

    // Scene 5: Celebration of the Outcome
    const s5Chars = allCharIds;
    const scene5: Scene = {
      id: `scene_${Date.now()}_05`,
      sceneNumber: 5,
      title: 'Tác phẩm hoàn thành & Niềm tự hào rạng rỡ',
      location: `${location} – Trung tâm căn phòng`,
      timeOfDay: 'Chiều tà rực rỡ (Golden Hour Glow)',
      lighting: 'Ánh hoàng hôn dịu ngọt chiếu qua ô cửa sổ, tạo viền sáng rim-light trên tóc và trang phục các nhân vật',
      characterIds: s5Chars,
      characterDnaReferences: filterDna(s5Chars),
      action: `Mọi người lùi lại một bước ngắm nhìn thành quả chung. ${
        hasPi && hasKem ? 'Pi và Kem đập tay ăn mừng (high-five) vang ròn rã.' : ''
      } ${
        hasEmma && hasEthan ? 'Ba Trường và Mẹ Vân nhìn nhau mỉm cười đầy tự hào.' : ''
      } ${
        hasMochi ? 'Mochi ngồi ngoan ngoãn ngước mắt nhìn ngắm với vẻ mặt cực kỳ đáng yêu.' : ''
      }`,
      dialogue: [
        ...(hasPi
          ? [
              {
                characterId: 'char_pi',
                characterName: 'Pi',
                line: 'Đẹp tuyệt vời luôn ba mẹ ơi! Nhờ có sự giúp đỡ của Kem và Mochi nữa đấy ạ!',
                emotion: 'Tự hào, biết ơn',
              },
            ]
          : []),
        ...(hasKem
          ? [
              {
                characterId: 'char_kem',
                characterName: 'Kem',
                line: 'Đẹp quá! Kem yêu cả nhà nhiều!',
                emotion: 'Ngọt ngào, hạnh phúc',
              },
            ]
          : []),
        ...(hasEmma
          ? [
              {
                characterId: 'char_emma',
                characterName: 'Mẹ Vân',
                line: 'Mẹ tự hào về các con lắm! Khi chúng mình cùng chia sẻ và giúp đỡ nhau, mọi thứ đều trở nên kỳ diệu.',
                emotion: 'Tràn đầy tình mẫu tử',
              },
            ]
          : []),
      ],
      emotion: 'Thăng hoa cảm xúc, ấm áp, ngập tràn tình yêu thương',
      storyPurpose: 'Mở nút câu chuyện (Resolution), đạt được mục tiêu ban đầu vượt mong đợi',
      educationalPurpose: `Khẳng định giá trị cốt lõi: ${lesson}`,
      cameraDirection: 'Slow Dolly Back từ cận cảnh tác phẩm ra toàn cảnh gia đình ôm nhau ấm áp',
      estimatedDurationSeconds: 70,
    };

    // Scene 6: Moral Takeaway & Tidying Up Together
    const s6Chars = allCharIds;
    const scene6: Scene = {
      id: `scene_${Date.now()}_06`,
      sceneNumber: 6,
      title: 'Cùng nhau dọn dẹp & Lời tạm biệt ngọt ngào',
      location: `${location}`,
      timeOfDay: 'Hoàng hôn ấm êm (Evening Comfort)',
      lighting: 'Ánh đèn trong phòng bật sáng dịu nhẹ, tạo cảm giác an yên sau một ngày dài vui vẻ',
      characterIds: s6Chars,
      characterDnaReferences: filterDna(s6Chars),
      action: `${
        hasPi && hasKem
          ? 'Pi và Kem cùng nhau thu dọn đồ dùng vào từng chiếc giỏ gọn gàng.'
          : 'Cả nhà cùng nhau dọn dẹp không gian.'
      } ${
        hasEthan ? 'Ba Trường bế Kem lên vai lắc lư trêu đùa.' : ''
      } ${
        hasEmma ? 'Mẹ Vân xoa đầu khen ngợi Pi.' : ''
      } ${
        hasMochi ? 'Mochi ngậm một chiếc khăn nhỏ chạy lại như muốn góp sức.' : ''
      }`,
      dialogue: [
        ...(hasEthan
          ? [
              {
                characterId: 'char_ethan',
                characterName: 'Ba Trường',
                line: 'Chơi vui thì cũng phải dọn dẹp gọn gàng, đúng tiêu chuẩn của các siêu nhân nhí chứ nhỉ!',
                emotion: 'Vui vẻ, gương mẫu',
              },
            ]
          : []),
        ...(hasPi
          ? [
              {
                characterId: 'char_pi',
                characterName: 'Pi',
                line: 'Dạ! Để con cất hộp màu này vào đúng chỗ của nó nhé!',
                emotion: 'Tự giác, trách nhiệm',
              },
            ]
          : []),
        ...(hasKem
          ? [
              {
                characterId: 'char_kem',
                characterName: 'Kem',
                line: 'Kem dọn phụ chị Pi nè! Bye bye các bạn nhỏ nhé!',
                emotion: 'Dễ thương, vẫy tay về phía khán giả',
              },
            ]
          : []),
      ],
      emotion: 'Bình yên, trọn vẹn, để lại ấn tượng giáo dục sâu sắc',
      storyPurpose: 'Kết màn (Outro / Call-to-action), tạo thói quen tốt cho trẻ em xem phim',
      educationalPurpose: 'Rèn luyện tính tự giác, trách nhiệm giữ gìn vệ sinh và ngăn nắp sau khi vui chơi',
      cameraDirection: 'Eye-level Medium Shot, các nhân vật cùng nhìn về ống kính vẫy tay chào tạm biệt',
      estimatedDurationSeconds: 60,
    };

    return [scene1, scene2, scene3, scene4, scene5, scene6];
  }

  /**
   * Commits a generated StoryDraft into the production database as a persistent Episode
   * with immutable Character DNA snapshots and Style snapshot.
   */
  public static commitDraftToEpisode(params: {
    draft: StoryDraft;
    seasonId?: string;
    episodeNumber?: number;
  }): Episode {
    const { draft } = params;
    const seasonId = params.seasonId || 'season_001';

    const existingEpisodes = EpisodeService.getAllEpisodes();
    const episodeNumber =
      params.episodeNumber ||
      (existingEpisodes.length > 0
        ? Math.max(...existingEpisodes.map((e) => e.episodeNumber)) + 1
        : 1);

    const characterIds: string[] = [];
    const supportingCharacterIds: string[] = [];
    const characterVersionSnapshots: Record<string, string> = {};

    for (const part of draft.characterParticipation) {
      const char = CharacterService.getCharacterById(part.characterId);
      if (!char) continue;

      if (char.isSupporting) {
        supportingCharacterIds.push(char.id);
      } else {
        characterIds.push(char.id);
      }
      characterVersionSnapshots[char.id] = part.versionSnapshotId;
    }

    const newEpisode = EpisodeService.createEpisode({
      seasonId,
      episodeNumber,
      title: draft.title,
      storyIdea: draft.premise,
      theme: draft.educationalLesson,
      educationalMessage: draft.educationalLesson,
      characterIds,
      supportingCharacterIds,
      location: draft.location,
      duration: draft.targetDuration,
      targetPlatform: 'YouTube Kids & OTT Streaming',
      status: 'Story Generated',
      customCharacterVersionSnapshots: characterVersionSnapshots,
      styleVersionSnapshotId: draft.styleVersionSnapshotId,
    });

    // Attach full structured draft and scenes
    const updatedDraft: StoryDraft = {
      ...draft,
      episodeId: newEpisode.id,
    };

    const finalizedEpisode = EpisodeService.updateEpisode(newEpisode.id, {
      storyDraft: updatedDraft,
      scenes: draft.scenes,
      status: 'Story Generated',
    });

    return finalizedEpisode;
  }
}
