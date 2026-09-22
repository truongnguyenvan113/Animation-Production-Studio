import {
  PublishingPack,
  PublishingTemplate,
  EpisodePublishingBrief,
  YouTubePublishingData,
  FacebookPublishingData,
  PublishingAssetsData,
  PublishingReadinessStatus,
  PublishingRevision,
  Episode,
} from '../types';
import { storageService } from './storageService';
import { DEFAULT_PUBLISHING_TEMPLATES, SEED_PUBLISHING_PACKS } from './publishingSeedData';

export class PublishingService {
  private static instance: PublishingService;

  private constructor() {}

  public static getInstance(): PublishingService {
    if (!PublishingService.instance) {
      PublishingService.instance = new PublishingService();
    }
    return PublishingService.instance;
  }

  /**
   * Returns all publishing packs stored in the studio database
   */
  public getPublishingPacks(): PublishingPack[] {
    const db = storageService.getDatabase();
    if (!Array.isArray(db.publishingPacks)) {
      return [...SEED_PUBLISHING_PACKS];
    }
    return db.publishingPacks;
  }

  /**
   * Finds a publishing pack by episode ID
   */
  public getPublishingPackByEpisodeId(episodeId: string): PublishingPack | null {
    const packs = this.getPublishingPacks();
    return packs.find((p) => p.episodeId === episodeId) || null;
  }

  /**
   * Returns the publishing pack for an episode, or creates an initial one
   * if none exists, auto-prefilling from the episode's canonical data.
   */
  public getOrCreatePublishingPack(episodeId: string): PublishingPack {
    const existing = this.getPublishingPackByEpisodeId(episodeId);
    if (existing) {
      return existing;
    }

    const db = storageService.getDatabase();
    const episode = db.episodes.find((e) => e.id === episodeId);

    const title = episode?.title || `Tập ${episodeId}`;
    const theme = episode?.theme || 'Gia đình & Tình bạn';
    const storySummary =
      episode?.storyDraft?.premise || episode?.storyIdea || 'Câu chuyện dễ thương của gia đình Pi & Kem.';
    const message =
      episode?.educationalMessage ||
      episode?.storyDraft?.educationalLesson ||
      'Tình yêu thương gia đình và sự sẻ chia là bài học quý giá nhất.';
    const episodeType = 'Tập chuẩn (Standard)';

    const brief: EpisodePublishingBrief = {
      title,
      theme,
      storySummary,
      message,
      episodeType,
    };

    const newPack: PublishingPack = {
      id: `pub_${episodeId}`,
      episodeId,
      episodeBrief: brief,
      youtube: {
        title: this.generateYouTubeTitle(brief),
        description: this.generateYouTubeDescription(brief),
        hashtags: this.generateHashtags(brief),
        publishStatus: 'draft',
        timezone: 'Asia/Ho_Chi_Minh',
      },
      facebook: {
        post: this.generateFacebookPost(brief),
        includeYoutubeLink: true,
        status: 'draft',
      },
      assets: {},
      status: {
        videoReady: false,
        thumbnailReady: false,
        youtubeReady: true,
        facebookReady: true,
      },
      templateVersions: {
        youtube: 'tpl_youtube_standard_v1',
        facebook: 'tpl_facebook_storytelling_v1',
        hashtag: 'tpl_hashtags_standard_v1',
      },
      history: [
        {
          id: `rev_${Date.now()}`,
          version: 1,
          label: 'Khởi tạo ban đầu từ thông tin tập phim',
          createdAt: new Date().toISOString(),
          snapshot: {
            brief: { ...brief },
            youtube: {
              title: this.generateYouTubeTitle(brief),
              description: this.generateYouTubeDescription(brief),
              hashtags: this.generateHashtags(brief),
              publishStatus: 'draft',
              timezone: 'Asia/Ho_Chi_Minh',
            },
            facebook: {
              post: this.generateFacebookPost(brief),
              includeYoutubeLink: true,
              status: 'draft',
            },
            assets: {},
          },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.savePublishingPack(newPack);
    return newPack;
  }

  /**
   * Saves a publishing pack and optionally records a revision snapshot.
   */
  public savePublishingPack(
    pack: PublishingPack,
    createRevision = false,
    revisionLabel?: string
  ): PublishingPack {
    const db = storageService.getDatabase();
    const currentPacks = Array.isArray(db.publishingPacks) ? [...db.publishingPacks] : [...SEED_PUBLISHING_PACKS];

    const updatedStatus = this.recomputeStatus(pack);
    const updatedPack: PublishingPack = {
      ...pack,
      status: updatedStatus,
      updatedAt: new Date().toISOString(),
    };

    if (createRevision) {
      const nextVersion = (updatedPack.history?.length || 0) + 1;
      const newRev: PublishingRevision = {
        id: `rev_${Date.now()}_v${nextVersion}`,
        version: nextVersion,
        label: revisionLabel || `Phiên bản v${nextVersion} (${new Date().toLocaleTimeString('vi-VN')})`,
        createdAt: new Date().toISOString(),
        snapshot: {
          brief: { ...updatedPack.episodeBrief },
          youtube: { ...updatedPack.youtube },
          facebook: { ...updatedPack.facebook },
          assets: { ...updatedPack.assets },
        },
      };
      updatedPack.history = [newRev, ...(updatedPack.history || [])];
    }

    const idx = currentPacks.findIndex((p) => p.episodeId === pack.episodeId);
    if (idx >= 0) {
      currentPacks[idx] = updatedPack;
    } else {
      currentPacks.push(updatedPack);
    }

    storageService.saveDatabase({ publishingPacks: currentPacks });
    return updatedPack;
  }

  /**
   * Recomputes checklist readiness based on actual field content
   */
  public recomputeStatus(pack: PublishingPack): PublishingReadinessStatus {
    const videoReady = !!(
      pack.assets?.finalVideoAssetId ||
      pack.assets?.finalVideoUrl ||
      pack.youtube?.videoAssetId ||
      pack.youtube?.videoUrl
    );
    const thumbnailReady = !!(
      pack.assets?.thumbnailAssetId ||
      pack.assets?.thumbnailUrl ||
      pack.youtube?.thumbnailAssetId ||
      pack.youtube?.thumbnailUrl ||
      pack.facebook?.imageAssetId ||
      pack.facebook?.imageUrl
    );
    const youtubeReady = !!(pack.youtube?.title?.trim() && pack.youtube?.description?.trim());
    const facebookReady = !!(pack.facebook?.post?.trim());

    return {
      videoReady,
      thumbnailReady,
      youtubeReady,
      facebookReady,
    };
  }

  /**
   * Updates only the Episode Brief without clobbering YouTube or Facebook content
   */
  public updateEpisodeBrief(
    episodeId: string,
    briefChanges: Partial<EpisodePublishingBrief>
  ): PublishingPack {
    const pack = this.getOrCreatePublishingPack(episodeId);
    const updated: PublishingPack = {
      ...pack,
      episodeBrief: {
        ...pack.episodeBrief,
        ...briefChanges,
      },
    };
    return this.savePublishingPack(updated);
  }

  /**
   * Updates YouTube data independently
   */
  public updateYouTubeData(
    episodeId: string,
    youtubeChanges: Partial<YouTubePublishingData>
  ): PublishingPack {
    const pack = this.getOrCreatePublishingPack(episodeId);
    const updated: PublishingPack = {
      ...pack,
      youtube: {
        ...pack.youtube,
        ...youtubeChanges,
      },
    };
    return this.savePublishingPack(updated);
  }

  /**
   * Updates Facebook data independently
   */
  public updateFacebookData(
    episodeId: string,
    facebookChanges: Partial<FacebookPublishingData>
  ): PublishingPack {
    const pack = this.getOrCreatePublishingPack(episodeId);
    const updated: PublishingPack = {
      ...pack,
      facebook: {
        ...pack.facebook,
        ...facebookChanges,
      },
    };
    return this.savePublishingPack(updated);
  }

  /**
   * Updates Assets linking independently
   */
  public updateAssetsData(
    episodeId: string,
    assetsChanges: Partial<PublishingAssetsData>
  ): PublishingPack {
    const pack = this.getOrCreatePublishingPack(episodeId);
    const updatedAssets = {
      ...pack.assets,
      ...assetsChanges,
    };
    const updated: PublishingPack = {
      ...pack,
      assets: updatedAssets,
      youtube: {
        ...pack.youtube,
        thumbnailAssetId: updatedAssets.thumbnailAssetId || pack.youtube.thumbnailAssetId,
        thumbnailUrl: updatedAssets.thumbnailUrl || pack.youtube.thumbnailUrl,
        videoAssetId: updatedAssets.finalVideoAssetId || pack.youtube.videoAssetId,
        videoUrl: updatedAssets.finalVideoUrl || pack.youtube.videoUrl,
      },
      facebook: {
        ...pack.facebook,
        imageAssetId: updatedAssets.thumbnailAssetId || pack.facebook.imageAssetId,
        imageUrl: updatedAssets.thumbnailUrl || pack.facebook.imageUrl,
      },
    };
    return this.savePublishingPack(updated);
  }

  /**
   * Generates or regenerates content based on current Episode Brief
   * Supports scoping to 'all', 'youtube', or 'facebook'.
   */
  public generatePublishingContent(
    episodeId: string,
    options?: {
      mode?: 'all' | 'youtube' | 'facebook';
      asNewRevision?: boolean;
    }
  ): PublishingPack {
    const pack = this.getOrCreatePublishingPack(episodeId);
    const brief = pack.episodeBrief;
    const mode = options?.mode || 'all';

    let updatedYouTube = { ...pack.youtube };
    let updatedFacebook = { ...pack.facebook };

    if (mode === 'all' || mode === 'youtube') {
      updatedYouTube = {
        ...updatedYouTube,
        title: this.generateYouTubeTitle(brief),
        description: this.generateYouTubeDescription(brief),
        hashtags: this.generateHashtags(brief),
      };
    }

    if (mode === 'all' || mode === 'facebook') {
      updatedFacebook = {
        ...updatedFacebook,
        post: this.generateFacebookPost(brief),
      };
    }

    const updatedPack: PublishingPack = {
      ...pack,
      youtube: updatedYouTube,
      facebook: updatedFacebook,
    };

    const label =
      mode === 'all'
        ? 'Tạo toàn bộ nội dung xuất bản mới'
        : mode === 'youtube'
        ? 'Tạo lại nội dung YouTube'
        : 'Tạo lại nội dung bài viết Facebook';

    return this.savePublishingPack(updatedPack, !!options?.asNewRevision, label);
  }

  /**
   * Restores a historic snapshot into active working fields
   */
  public restoreRevision(episodeId: string, revisionId: string): PublishingPack | null {
    const pack = this.getPublishingPackByEpisodeId(episodeId);
    if (!pack || !Array.isArray(pack.history)) return null;

    const rev = pack.history.find((h) => h.id === revisionId);
    if (!rev) return null;

    const restoredPack: PublishingPack = {
      ...pack,
      episodeBrief: { ...rev.snapshot.brief },
      youtube: { ...rev.snapshot.youtube },
      facebook: { ...rev.snapshot.facebook },
      assets: { ...rev.snapshot.assets },
    };

    return this.savePublishingPack(
      restoredPack,
      true,
      `Khôi phục từ Phiên bản v${rev.version} (${new Date().toLocaleTimeString('vi-VN')})`
    );
  }

  /**
   * Deletes a publishing pack
   */
  public deletePublishingPack(episodeId: string): boolean {
    const db = storageService.getDatabase();
    if (!Array.isArray(db.publishingPacks)) return false;
    const filtered = db.publishingPacks.filter((p) => p.episodeId !== episodeId);
    storageService.saveDatabase({ publishingPacks: filtered });
    return true;
  }

  /**
   * Returns available publishing templates
   */
  public getTemplates(): PublishingTemplate[] {
    const db = storageService.getDatabase();
    if (!Array.isArray(db.publishingTemplates) || db.publishingTemplates.length === 0) {
      return [...DEFAULT_PUBLISHING_TEMPLATES];
    }
    return db.publishingTemplates;
  }

  /**
   * Saves a custom or updated template and immediately syncs to disk
   */
  public async saveTemplate(template: PublishingTemplate): Promise<PublishingTemplate> {
    const db = storageService.getDatabase();
    const templates = Array.isArray(db.publishingTemplates)
      ? [...db.publishingTemplates]
      : [...DEFAULT_PUBLISHING_TEMPLATES];

    const contentVal = template.content ?? template.contentStructure ?? '';
    const normalized: PublishingTemplate = {
      ...template,
      platform: template.platform || template.type || 'youtube',
      type: template.type || template.platform || 'youtube',
      content: contentVal,
      contentStructure: contentVal,
      updatedAt: new Date().toISOString(),
    };

    const idx = templates.findIndex((t) => t.id === normalized.id);
    if (idx >= 0) {
      templates[idx] = normalized;
    } else {
      templates.push(normalized);
    }
    storageService.saveDatabase({ publishingTemplates: templates });
    await storageService.saveToDisk();
    return normalized;
  }

  /**
   * Resets all publishing templates back to the default studio standards
   */
  public async resetTemplatesToDefault(): Promise<PublishingTemplate[]> {
    const fresh = DEFAULT_PUBLISHING_TEMPLATES.map((t) => ({ ...t, updatedAt: new Date().toISOString() }));
    storageService.saveDatabase({ publishingTemplates: fresh });
    await storageService.saveToDisk();
    return fresh;
  }

  /**
   * Creates a new custom template
   */
  public async createTemplate(newTpl: Omit<PublishingTemplate, 'id'>): Promise<PublishingTemplate> {
    const id = `tpl_${newTpl.platform || 'custom'}_${Date.now()}`;
    const contentVal = newTpl.content ?? newTpl.contentStructure ?? '';
    const template: PublishingTemplate = {
      ...newTpl,
      id,
      platform: newTpl.platform || newTpl.type || 'youtube',
      type: newTpl.type || newTpl.platform || 'youtube',
      content: contentVal,
      contentStructure: contentVal,
      isDefault: false,
      updatedAt: new Date().toISOString(),
    };
    return this.saveTemplate(template);
  }

  /**
   * Deletes a template by ID
   */
  public async deleteTemplate(templateId: string): Promise<boolean> {
    const db = storageService.getDatabase();
    if (!Array.isArray(db.publishingTemplates)) return false;
    const remaining = db.publishingTemplates.filter((t) => t.id !== templateId);
    storageService.saveDatabase({ publishingTemplates: remaining });
    await storageService.saveToDisk();
    return true;
  }

  // =========================================================================
  // CONTENT GENERATION ALGORITHMS
  // =========================================================================

  /**
   * Interpolates template variables with actual episode brief data
   */
  public interpolateTemplate(templateString: string, brief: EpisodePublishingBrief): string {
    const cleanTitle = brief.title.replace(/^Tập\s*\d+\s*[-–:]\s*/i, '').trim();
    const summary = brief.storySummary?.trim() || cleanTitle;
    const message =
      brief.message?.trim() ||
      'Một món đồ không cần hoàn hảo để trở nên đặc biệt. Tình yêu thương gia đình và tiếng cười biến mọi điều dang dở thành kỷ niệm ấm áp.';
    const theme = brief.theme || 'Gia đình & Tuổi thơ';
    const hashtags = this.generateHashtags(brief).join(' ');

    return templateString
      .replace(/\{episode_title\}/g, cleanTitle)
      .replace(/\{story_summary\}/g, summary)
      .replace(/\{educational_lesson\}/g, message)
      .replace(/\{theme\}/g, theme)
      .replace(/\{hashtags\}/g, hashtags);
  }

  /**
   * YouTube Title Generator
   * Template: {emoji} Pi & Kem – {episode_title}! {emotion_emoji} | Hoạt Hình Thiếu Nhi | Kem Tivi #Shorts
   */
  public generateYouTubeTitle(brief: EpisodePublishingBrief): string {
    const title = brief.title.replace(/^Tập\s*\d+\s*[-–:]\s*/i, '').trim();
    const themeLower = (brief.theme || '').toLowerCase();

    let prefixEmoji = '✨';
    let emotionEmoji = '🥰';

    if (themeLower.includes('trung thu') || themeLower.includes('đèn lồng')) {
      prefixEmoji = '🏮';
      emotionEmoji = '🥰';
    } else if (themeLower.includes('vẽ') || themeLower.includes('nghệ thuật') || themeLower.includes('màu')) {
      prefixEmoji = '🎨';
      emotionEmoji = '✨';
    } else if (themeLower.includes('thể thao') || themeLower.includes('bóng')) {
      prefixEmoji = '⚽';
      emotionEmoji = '🎉';
    } else if (themeLower.includes('nấu ăn') || themeLower.includes('bánh') || themeLower.includes('bếp')) {
      prefixEmoji = '🍰';
      emotionEmoji = '😋';
    } else if (themeLower.includes('thiên nhiên') || themeLower.includes('cây') || themeLower.includes('vườn')) {
      prefixEmoji = '🌱';
      emotionEmoji = '🌈';
    }

    return `${prefixEmoji} Pi & Kem – ${title}! ${emotionEmoji} | Hoạt Hình Thiếu Nhi | Kem Tivi #Shorts`;
  }

  /**
   * YouTube Description Generator (Uses active template from library if available)
   */
  public generateYouTubeDescription(brief: EpisodePublishingBrief, customTemplateContent?: string): string {
    if (customTemplateContent) {
      return this.interpolateTemplate(customTemplateContent, brief);
    }

    const templates = this.getTemplates();
    const ytTemplate = templates.find((t) => t.platform === 'youtube' || t.type === 'youtube');
    const tplText = ytTemplate?.content || ytTemplate?.contentStructure;
    if (tplText && tplText.includes('{')) {
      return this.interpolateTemplate(tplText, brief);
    }

    const cleanTitle = brief.title.replace(/^Tập\s*\d+\s*[-–:]\s*/i, '').trim();
    const summary = brief.storySummary?.trim() || cleanTitle;
    const message =
      brief.message?.trim() ||
      'Mỗi ngày lớn lên cùng gia đình là một chuyến phiêu lưu ấm áp và tràn ngập tiếng cười.';
    const theme = brief.theme || 'Gia đình & Tuổi thơ';

    const hook = brief.theme?.toLowerCase().includes('trung thu')
      ? '🏮 Chiếc đèn lồng Trung Thu bị rách giấy bóng kính thì có còn rước trăng được không nhỉ? Cùng khám phá bí mật ngọt ngào của hai chị em Pi & Kem nhé!'
      : `✨ Chuyện gì sẽ xảy ra trong cuộc phiêu lưu "${cleanTitle}" hôm nay của hai chị em Pi và Kem? Cả nhà cùng theo dõi nhé!`;

    const hashtags = this.generateHashtags(brief).join(' ');

    return `${hook}

📖 TÓM TẮT CÂU CHUYỆN:
${summary}

🌈 CHÀO MỪNG BẠN ĐẾN VỚI THẾ GIỚI CỦA PI & KEM:
Kem Tivi là kênh hoạt hình 3D gia đình thuần Việt ấm áp, vui tươi và tràn đầy tính giáo dục dành cho các bạn nhỏ mầm non, tiểu học và cha mẹ.

🌟 GẶP GỠ CÁC NHÂN VẬT ĐÁNG YÊU:
👧 Pi (5 tuổi) – Cô bé nhanh nhẹn, giàu tình cảm, tỉ mỉ và luôn yêu thương, nhường nhịn em Kem.
👦 Kem (3 tuổi) – Cậu em trai tinh nghịch, đáng yêu, lí lắc và thích bắt chước chị Pi.
👨 Ba Trường – Người ba kỹ sư công nghệ điềm đạm, kiên nhẫn, luôn đồng hành và biến mọi rắc rối thành trò chơi sáng tạo.
👩 Mẹ Vân – Người mẹ dịu dàng, chu đáo, người giữ lửa ấm áp và định hướng thói quen tốt cho tổ ấm nhỏ.
🐶 Mochi – Chú cún lông xù trung thành, láu lỉnh, luôn có mặt trong mọi khoảnh khắc vui nhộn của hai chị em.

✨ THÔNG ĐIỆP CỦA CÂU CHUYỆN:
"${message}"

🎬 THÔNG TIN TẬP PHIM:
• Tập: ${cleanTitle}
• Chủ đề: ${theme}
• Thể loại: Hoạt hình 3D Thiếu nhi Việt Nam
• Kênh chính thức: Kem Tivi - Pi & Kem Animation Studio

❤️ BẤM ĐĂNG KÝ KÊNH (SUBSCRIBE) VÀ BẬT CHUÔNG ĐỂ ĐÓN XEM NHỮNG TẬP MỚI NHẤT CÙNG PI VÀ KEM NHÉ!
👉 Kênh YouTube: Kem Tivi

${hashtags}`;
  }

  /**
   * Facebook Post Generator (Uses active template from library if available)
   */
  public generateFacebookPost(brief: EpisodePublishingBrief, customTemplateContent?: string): string {
    if (customTemplateContent) {
      return this.interpolateTemplate(customTemplateContent, brief);
    }

    const templates = this.getTemplates();
    const fbTemplate = templates.find((t) => t.platform === 'facebook' || t.type === 'facebook');
    const tplText = fbTemplate?.content || fbTemplate?.contentStructure;
    if (tplText && tplText.includes('{')) {
      return this.interpolateTemplate(tplText, brief);
    }

    const cleanTitle = brief.title.replace(/^Tập\s*\d+\s*[-–:]\s*/i, '').trim();
    const themeLower = (brief.theme || '').toLowerCase();
    const message =
      brief.message?.trim() ||
      'Một món đồ không cần hoàn hảo để trở nên đặc biệt. Tình yêu thương gia đình và tiếng cười biến mọi điều dang dở thành kỷ niệm ấm áp.';

    if (themeLower.includes('trung thu') || cleanTitle.toLowerCase().includes('đèn lồng')) {
      return `🏮 Có những "vết rách" trong tuổi thơ lại biến thành kỷ niệm lấp lánh nhất...

Chiều nay hai chị em Pi và Kem ngồi bệt giữa hiên nhà làm đèn ông sao đón Trung Thu. Chị Pi nắn nót từng nan tre, vuốt từng nếp giấy kính đỏ au. Cậu nhóc Kem ba tuổi thì cứ lăng xăng: "Kem giúp chị Pi! Kem dán cho!". Kết quả là "xoẹt" một cái — góc cánh sao rách toạc, hồ dán dính lem nhem cả vào má.

Pi mếu máo, còn Kem thì sợ sệt nép sau lưng chú cún Mochi.

Nếu là ngày xưa bận rộn, chắc người lớn chúng mình dễ buột miệng: "Đã bảo em đừng nghịch rồi mà!". Nhưng hôm nay, Ba Trường chỉ cười xòa, ngồi bệt xuống cạnh hai đứa: "Ồ, góc rách này cong cong nhìn giống hệt nụ cười của ông Trăng ấy nhỉ?". Thế là Mẹ Vân lấy thêm chút giấy màu vàng, Pi cắt hình trăng khuyết, còn Kem hồ hởi chấm hồ dán đè lên. 

Từ một chiếc đèn lồng bị hỏng, cả nhà đã có một "Ông Trăng Cười" có một không hai trên đời! Đêm nay, hai chị em rước đèn quanh sân, nến lung linh qua lớp giấy đỏ, tiếng cười giòn tan át cả tiếng dế mùa thu.

Bố mẹ nhận ra, món đồ chơi của con không cần phải thẳng thớm hoàn hảo như mua ngoài tiệm. Chính sự kiên nhẫn và đồng hành của cả gia đình mới là điều thắp sáng ký ức tuổi thơ của con mãi mãi. ❤️

Mời cả nhà cùng bấm vào link xem lại khoảnh khắc rước đèn đáng yêu của Pi và Kem tối nay nhé! 👇`;
    }

    if (themeLower.includes('vẽ') || cleanTitle.toLowerCase().includes('vẽ tranh')) {
      return `🎨 Bức tranh gia đình đẹp nhất không phải là bức tranh không có vết lem...

Sáng chủ nhật, mẹ trải tấm bạt lớn giữa phòng khách cho hai chị em Pi và Kem vẽ màu nước. Đang lúc chị Pi say sưa tô cầu vồng, Kem nắn nót vẽ ô tô thì "bịch!" — chú cún Mochi phi thẳng qua khay màu xanh lam, để lại bốn dấu chân cún to đùng ngay giữa bức tranh!

Chị Pi ôm mặt "Trời ơi!", còn Kem thì vỗ tay cười nắc nẻ tưởng Mochi đang làm xiếc. 

May có Ba Trường đỡ lời: "Khoan đã nào, đây chính là các cầu thủ nhí đang đá bóng trên sân cỏ cầu vồng của Pi đấy chứ!". Thế là cả nhà lại xúm vào vẽ thêm mắt mũi, bóng đá cho từng dấu chân cún. Đến trưa, không chỉ bức tranh đầy màu sắc mà cả Pi, Kem, Ba, Mẹ và Mochi đều lấm lem xanh đỏ, tiếng cười vang cả xóm.

Đôi khi những "tai nạn" bất ngờ lại là cơ hội tuyệt vời nhất để con học cách linh hoạt và nhìn cuộc sống bằng lăng kính lạc quan. Bố mẹ đừng quá căng thẳng nếu con làm đổ màu hay lem bẩn nhé, vì ký ức lấm lem ấy sau này sẽ quý giá vô cùng! ❤️

Cùng đón xem tập phim "${cleanTitle}" của Pi & Kem trên kênh Kem Tivi nhé! 👇`;
    }

    return `✨ Khi gia đình là nơi biến những điều bình dị thành điều kỳ diệu...

Hôm nay ở nhà Pi và Kem rộn ràng hơn mọi ngày với câu chuyện "${cleanTitle}". Hai chị em lúc nào cũng vậy — chị Pi thì tỉ mỉ, cẩn thận, còn cậu em Kem thì lém lỉnh, luôn có những ý tưởng bất ngờ khiến cả nhà bật cười.

Có những khoảnh khắc tưởng như rắc rối, nhưng nhờ sự kiên nhẫn của Ba Trường và sự dịu dàng của Mẹ Vân, mọi chuyện lại biến thành một bài học nhẹ nhàng, ấm áp.

${message}

Bố mẹ có câu chuyện đáng yêu nào của các bé nhà mình tuần này không? Hãy cùng chia sẻ dưới bình luận và cùng xem tập phim mới nhất của Pi & Kem nhé! ❤️👇`;
  }

  /**
   * Hashtags Generator (Extracts from hashtag template if available)
   */
  public generateHashtags(brief: EpisodePublishingBrief): string[] {
    const templates = this.getTemplates();
    const hashTemplate = templates.find((t) => t.platform === 'hashtags' || t.type === 'hashtags');
    let fixed = ['#Shorts', '#PiKem', '#KemTivi', '#GiaDinhPiKem', '#HoatHinhThieuNhi'];
    if (Array.isArray(hashTemplate?.fixedHashtags) && hashTemplate.fixedHashtags.length > 0) {
      fixed = hashTemplate.fixedHashtags;
    } else if (hashTemplate?.content) {
      const extracted = hashTemplate.content.match(/#[^\s#]+/g);
      if (extracted && extracted.length > 0) {
        fixed = extracted;
      }
    }
    const titleAndTheme = `${brief.title} ${brief.theme || ''}`.toLowerCase();
    const dynamicTags: string[] = [];

    if (titleAndTheme.includes('trung thu') || titleAndTheme.includes('đèn lồng')) {
      dynamicTags.push('#TetTrungThu', '#TrungThu', '#DenLong', '#RuocDen', '#DenNgoiSao', '#GiaDinhYeuThuong');
    }
    if (titleAndTheme.includes('vẽ') || titleAndTheme.includes('tranh') || titleAndTheme.includes('màu')) {
      dynamicTags.push('#VeTranh', '#MauNuoc', '#SangTao', '#HoiHoaThieuNhi');
    }
    if (titleAndTheme.includes('thể thao') || titleAndTheme.includes('bóng')) {
      dynamicTags.push('#TheThao', '#BongDa', '#KhoeManh');
    }
    if (titleAndTheme.includes('bếp') || titleAndTheme.includes('bánh') || titleAndTheme.includes('nấu')) {
      dynamicTags.push('#VaoBepCungMe', '#NauAn', '#LamBanh');
    }

    // Deduplicate tags
    const combined = Array.from(new Set([...fixed, ...dynamicTags]));
    return combined;
  }
}

export const publishingService = PublishingService.getInstance();
