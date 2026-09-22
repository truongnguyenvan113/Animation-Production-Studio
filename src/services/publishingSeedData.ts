import { PublishingPack, PublishingTemplate } from '../types';

export const DEFAULT_PUBLISHING_TEMPLATES: PublishingTemplate[] = [
  {
    id: 'tpl_youtube_standard_v1',
    type: 'youtube',
    name: 'Pi & Kem — YouTube Standard v1',
    description: 'Mẫu chuẩn xuất bản YouTube cho kênh Kem Tivi, tối ưu SEO, đầy đủ giới thiệu nhân vật và thông điệp.',
    isDefault: true,
    tone: 'Tươi vui, ấm áp, giáo dục, thân thiện với trẻ em và cha mẹ',
    contentStructure: `1. Hook mở đầu gợi tò mò
2. Tóm tắt nội dung câu chuyện
3. Lời chào Kem Tivi & Thế giới Pi & Kem
4. Giới thiệu nhân vật (Pi, Kem, Ba Trường, Mẹ Vân, Mochi)
5. Thông điệp giáo dục ý nghĩa
6. Thông tin tập phim & Kêu gọi hành động (CTA Subscribe)
7. Bộ thẻ Hashtag chính thức`,
    fixedHashtags: ['#Shorts', '#PiKem', '#KemTivi', '#GiaDinhPiKem', '#HoatHinhThieuNhi'],
  },
  {
    id: 'tpl_facebook_storytelling_v1',
    type: 'facebook',
    name: 'Pi & Kem Storytelling v1 (Gia đình & Tâm sự cha mẹ)',
    description: 'Mẫu bài viết Facebook phong cách tâm sự gia đình ấm áp, giọng kể tự nhiên miền Bắc, kết nối cảm xúc cha mẹ.',
    isDefault: true,
    tone: 'Ấm áp, chân thành, tự nhiên, sâu lắng, chia sẻ góc nhìn nuôi dạy con',
    contentStructure: `1. Câu mở đầu gợi cảm xúc / câu hỏi đồng cảm của cha mẹ
2. Kể lại tình huống sinh hoạt đời thường ngộ nghĩnh của Pi và Kem
3. Chi tiết hài hước, đáng yêu nhưng đầy bài học
4. Sự đồng hành, kiên nhẫn của Ba Trường và Mẹ Vân
5. Lời nhắn nhủ nhẹ nhàng dành cho các gia đình
6. Liên kết xem trọn vẹn tập phim trên YouTube (tùy chọn)
7. Bộ thẻ Hashtag Facebook`,
    fixedHashtags: ['#PiKem', '#KemTivi', '#GiaDinhPiKem', '#NuoiDayCon', '#LamChaMe', '#HoatHinhViet'],
  },
  {
    id: 'tpl_hashtags_standard_v1',
    type: 'hashtags',
    name: 'Kem Tivi Standard Hashtag v1',
    description: 'Bộ thẻ phân loại nền tảng và nội dung cho kênh hoạt hình thiếu nhi Kem Tivi.',
    isDefault: true,
    fixedHashtags: [
      '#Shorts',
      '#PiKem',
      '#KemTivi',
      '#GiaDinhPiKem',
      '#HoatHinhThieuNhi',
      '#AnimationVietNam',
      '#HoatHinh3D',
      '#PhimHoatHinh',
    ],
  },
];

export const SEED_PUBLISHING_PACKS: PublishingPack[] = [
  {
    id: 'pub_ep_010',
    episodeId: 'ep_010',
    episodeBrief: {
      title: 'Chiếc Đèn Lồng Đặc Biệt',
      theme: 'Tết Trung Thu & Tình Yêu Thương Gia Đình',
      storySummary:
        'Pi làm đèn lồng giấy bóng kính hình ngôi sao rất cẩn thận, Kem nghịch ngợm dán lệch và làm rách giấy một chút, nhưng Ba Trường và Mẹ Vân đã giúp hai chị em biến chỗ rách thành một mặt trăng cười độc đáo. Tối đó hai chị em cùng Mochi rước đèn quanh sân nhà rộn rã tiếng cười.',
      message:
        'Một món đồ không cần hoàn hảo để trở nên đặc biệt. Tình yêu thương gia đình và tiếng cười biến mọi điều dang dở thành kỷ niệm ấm áp.',
      episodeType: 'Tập đặc biệt (Special)',
    },
    youtube: {
      title: '🏮 Pi & Kem – Chiếc Đèn Lồng Đặc Biệt! 🥰 | Hoạt Hình Thiếu Nhi | Kem Tivi #Shorts',
      description: `🏮 Chiếc đèn lồng Trung Thu bị rách giấy bóng kính thì có còn đón trăng được không nhỉ? Hãy cùng đón xem điều kỳ diệu bất ngờ trong tập phim đặc biệt hôm nay của gia đình Pi & Kem nhé!

📖 TÓM TẮT CÂU CHUYỆN:
Tết Trung Thu đến gần, chị Pi tỉ mỉ dán từng nan tre và giấy kính màu đỏ vàng để làm một chiếc đèn ông sao thật đẹp. Cậu em Kem tò mò muốn giúp chị, nhưng vì đôi bàn tay bé xíu vụng về nên đã lỡ dán lệch và làm rách một góc giấy bóng kính. Khi Pi rưng rưng muốn khóc, Ba Trường và Mẹ Vân đã nhẹ nhàng ngồi xuống bên hai chị em. Bằng sự sáng tạo và yêu thương, cả nhà đã cùng nhau biến góc rách ấy thành một ông Trăng cười lấp lánh độc nhất vô nhị. Tối rằm, dưới ánh trăng vàng vằng vặc, tiếng cười giòn giã của Pi, Kem và chú cún Mochi vang vọng khắp sân nhà.

🌈 CHÀO MỪNG BẠN ĐẾN VỚI THẾ GIỚI CỦA PI & KEM:
Kem Tivi là không gian hoạt hình 3D gia đình thuần Việt ấm áp, vui tươi và tràn đầy tính giáo dục dành cho các bạn nhỏ mầm non, tiểu học và cha mẹ.

🌟 GẶP GỠ CÁC NHÂN VẬT ĐÁNG YÊU:
👧 Pi (5 tuổi) – Cô bé nhanh nhẹn, giàu tình cảm, tỉ mỉ và luôn yêu thương, nhường nhịn em Kem.
👦 Kem (3 tuổi) – Cậu nhóc tinh nghịch, lí lắc, tò mò muốn tự tay làm mọi việc như người lớn.
👨 Ba Trường – Người ba kỹ sư công nghệ điềm đạm, kiên nhẫn, luôn biến mọi rắc rối thành trò chơi sáng tạo.
👩 Mẹ Vân – Người mẹ dịu dàng, chu đáo, người luôn lắng nghe và ôm ấp cảm xúc của các con.
🐶 Mochi – Chú cún lông xù trung thành, láu lỉnh, luôn có mặt trong mọi cuộc phiêu lưu của hai chị em.

✨ THÔNG ĐIỆP Ý NGHĨA:
"Một món đồ không cần hoàn hảo để trở nên đặc biệt. Tình yêu thương gia đình và tiếng cười biến mọi điều dang dở thành kỷ niệm ấm áp nhất."

🎬 THÔNG TIN TẬP PHIM:
• Tập: Chiếc Đèn Lồng Đặc Biệt
• Mùa: Season 1 – Gia Đình & Tuổi Thơ
• Thể loại: Hoạt hình 3D Thiếu nhi Việt Nam
• Bản quyền hình ảnh & âm thanh: Kem Tivi Studio

❤️ BẤM ĐĂNG KÝ KÊNH (SUBSCRIBE) VÀ BẬT CHUÔNG ĐỂ ĐÓN XEM NHỮNG TẬP MỚI NHẤT CÙNG PI VÀ KEM NHÉ!
👉 Kênh chính thức: Kem Tivi - Pi & Kem Animation

#Shorts #PiKem #KemTivi #GiaDinhPiKem #HoatHinhThieuNhi #TetTrungThu #TrungThu #DenLong #RuocDen #DenNgoiSao #GiaDinhYeuThuong #HoatHinh3D`,
      hashtags: [
        '#Shorts',
        '#PiKem',
        '#KemTivi',
        '#GiaDinhPiKem',
        '#HoatHinhThieuNhi',
        '#TetTrungThu',
        '#TrungThu',
        '#DenLong',
        '#RuocDen',
        '#DenNgoiSao',
        '#GiaDinhYeuThuong',
      ],
      thumbnailAssetId: 'ref_project_banner_hero',
      thumbnailUrl: '/assets/aistudio/references/images/char_pi_turnaround.jpg',
      videoUrl: 'https://youtube.com/shorts/sample_ep010_lantern',
      publishStatus: 'scheduled',
      scheduledDate: '2026-09-25',
      scheduledTime: '19:30',
      timezone: 'Asia/Ho_Chi_Minh',
    },
    facebook: {
      post: `🏮 Có những "vết rách" trong tuổi thơ lại biến thành kỷ niệm lấp lánh nhất...

Chiều nay hai chị em Pi và Kem ngồi bệt giữa hiên nhà làm đèn ông sao đón Trung Thu. Chị Pi nắn nót từng nan tre, vuốt từng nếp giấy kính đỏ au. Cậu nhóc Kem ba tuổi thì cứ lăng xăng: "Kem giúp chị Pi! Kem dán cho!". Kết quả là "xoẹt" một cái — góc cánh sao rách toạc, hồ dán dính lem nhem cả vào má.

Pi mếu máo, còn Kem thì sợ sệt nép sau lưng chú cún Mochi.

Nếu là ngày xưa bận rộn, chắc người lớn chúng mình dễ buột miệng: "Đã bảo em đừng nghịch rồi mà!". Nhưng hôm nay, Ba Trường chỉ cười xòa, ngồi bệt xuống cạnh hai đứa: "Ồ, góc rách này cong cong nhìn giống hệt nụ cười của ông Trăng ấy nhỉ?". Thế là Mẹ Vân lấy thêm chút giấy màu vàng, Pi cắt hình trăng khuyết, còn Kem hồ hởi chấm hồ dán đè lên. 

Từ một chiếc đèn lồng bị hỏng, cả nhà đã có một "Ông Trăng Cười" có một không hai trên đời! Đêm nay, hai chị em rước đèn quanh sân, nến lung linh qua lớp giấy đỏ, tiếng cười giòn tan át cả tiếng dế mùa thu.

Bố mẹ nhận ra, món đồ chơi của con không cần phải thẳng thớm hoàn hảo như mua ngoài tiệm. Chính sự kiên nhẫn và đồng hành của cả gia đình mới là điều thắp sáng ký ức tuổi thơ của con mãi mãi. ❤️

Mời cả nhà cùng bấm vào link xem lại khoảnh khắc rước đèn đáng yêu của Pi và Kem tối nay nhé! 👇`,
      imageAssetId: 'ref_project_banner_hero',
      imageUrl: '/assets/aistudio/references/images/char_pi_turnaround.jpg',
      youtubeUrl: 'https://youtube.com/shorts/sample_ep010_lantern',
      includeYoutubeLink: true,
      status: 'ready',
      scheduledDate: '2026-09-25',
      scheduledTime: '20:00',
    },
    assets: {
      finalVideoAssetId: 'asset_vid_ep010_capcut_final',
      finalVideoUrl: 'https://storage.googleapis.com/pikem-videos/ep010_final_render_capcut.mp4',
      thumbnailAssetId: 'ref_project_banner_hero',
      thumbnailUrl: '/assets/aistudio/references/images/char_pi_turnaround.jpg',
    },
    status: {
      videoReady: true,
      thumbnailReady: true,
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
        id: 'rev_ep010_01',
        version: 1,
        label: 'Khởi tạo từ Episode Brief & Bản nháp đầu tiên',
        createdAt: '2026-09-20T14:00:00.000Z',
        snapshot: {
          brief: {
            title: 'Chiếc Đèn Lồng Đặc Biệt',
            theme: 'Tết Trung Thu',
            storySummary: 'Làm đèn lồng ông sao đón Trung Thu.',
            message: 'Tình cảm gia đình ấm áp.',
            episodeType: 'Tập đặc biệt',
          },
          youtube: {
            title: '🏮 Pi & Kem – Chiếc Đèn Lồng Đặc Biệt! | Kem Tivi #Shorts',
            description: 'Đón xem tập phim Trung Thu đặc biệt của Pi và Kem!',
            hashtags: ['#Shorts', '#PiKem', '#KemTivi'],
            publishStatus: 'draft',
            timezone: 'Asia/Ho_Chi_Minh',
          },
          facebook: {
            post: 'Cùng Pi và Kem làm đèn lồng Trung Thu ấm áp tối nay nhé!',
            includeYoutubeLink: true,
            status: 'draft',
          },
          assets: {},
        },
      },
      {
        id: 'rev_ep010_02',
        version: 2,
        label: 'Hoàn thiện nội dung YouTube & Facebook theo chuẩn Kem Tivi',
        createdAt: '2026-09-22T09:30:00.000Z',
        snapshot: {
          brief: {
            title: 'Chiếc Đèn Lồng Đặc Biệt',
            theme: 'Tết Trung Thu & Tình Yêu Thương Gia Đình',
            storySummary:
              'Pi làm đèn lồng giấy bóng kính hình ngôi sao rất cẩn thận, Kem nghịch ngợm dán lệch và làm rách giấy một chút, nhưng Ba Trường và Mẹ Vân đã giúp hai chị em biến chỗ rách thành một mặt trăng cười độc đáo.',
            message:
              'Một món đồ không cần hoàn hảo để trở nên đặc biệt. Tình yêu thương gia đình và tiếng cười biến mọi điều dang dở thành kỷ niệm ấm áp.',
            episodeType: 'Tập đặc biệt (Special)',
          },
          youtube: {
            title: '🏮 Pi & Kem – Chiếc Đèn Lồng Đặc Biệt! 🥰 | Hoạt Hình Thiếu Nhi | Kem Tivi #Shorts',
            description: 'Tập phim Trung Thu hoàn thiện với giới thiệu nhân vật và lời kêu gọi đăng ký kênh.',
            hashtags: ['#Shorts', '#PiKem', '#KemTivi', '#TetTrungThu'],
            publishStatus: 'scheduled',
            scheduledDate: '2026-09-25',
            scheduledTime: '19:30',
            timezone: 'Asia/Ho_Chi_Minh',
          },
          facebook: {
            post: 'Bài viết tâm sự gia đình ấm áp đầy đủ.',
            includeYoutubeLink: true,
            status: 'ready',
          },
          assets: {
            thumbnailUrl: '/assets/aistudio/references/images/char_pi_turnaround.jpg',
          },
        },
      },
    ],
    createdAt: '2026-09-20T14:00:00.000Z',
    updatedAt: '2026-09-22T10:00:00.000Z',
  },
  {
    id: 'pub_ep_009',
    episodeId: 'ep_009',
    episodeBrief: {
      title: 'Cùng nhau vẽ tranh',
      theme: 'Sáng tạo & Chia sẻ nghệ thuật (Creativity & Sibling Bond)',
      storySummary:
        'Mẹ Vân trải tấm bạt lớn giữa sàn gỗ phòng khách để Pi và Kem thỏa sức vẽ tranh màu nước. Khi chú cún Mochi vô tình giẫm phải màu xanh in dấu chân lên tranh, Ba Trường và cả nhà đã biến vết chân cún thành những cầu thủ bóng đá ngộ nghĩnh.',
      message:
        'Khuyến khích trẻ em tự do biểu đạt cảm xúc qua hội họa, trân trọng nét vẽ của nhau, và cùng dọn dẹp sau khi chơi.',
      episodeType: 'Tập chuẩn (Standard)',
    },
    youtube: {
      title: '🎨 Pi & Kem – Cùng Nhau Vẽ Tranh! ✨ | Hoạt Hình Thiếu Nhi | Kem Tivi #Shorts',
      description: `🎨 Sẽ thế nào nếu chú cún cưng Mochi giẫm chân vào khay màu nước rồi in thẳng lên bức tranh khổng lồ của hai chị em? Đừng bỏ lỡ câu chuyện siêu ngộ nghĩnh của gia đình Pi & Kem nhé!

📖 TÓM TẮT CÂU CHUYỆN:
Buổi sáng nắng đẹp, Mẹ Vân trải một tấm bạt trắng lớn giữa phòng khách để mở xưởng tranh gia đình. Pi hăng say vẽ cầu vồng bảy sắc rực rỡ, còn Kem tinh nghịch chấm những đốm màu tròn xoe. Bỗng nhiên, chú cún Mochi ham vui chạy vụt qua khay màu xanh, để lại những dấu chân cún in khắp mặt bạt! Pi và Kem ngỡ ngàng, nhưng Ba Trường đã nhanh trí biến những dấu chân ngộ nghĩnh ấy thành một trận cầu bóng đá siêu đáng yêu. Cả nhà cùng lưu lại kỷ niệm bằng những dấu vân tay yêu thương.

🌈 CHÀO MỪNG BẠN ĐẾN VỚI THẾ GIỚI CỦA PI & KEM:
Kem Tivi là thế giới hoạt hình 3D tràn ngập yêu thương và tiếng cười dành cho các bạn nhỏ và gia đình Việt.

🌟 GẶP GỠ GIA ĐÌNH PI & KEM:
👧 Pi (5 tuổi) – Nhanh nhẹn, thông minh, đam mê hội họa và sắc màu.
👦 Kem (3 tuổi) – Hồn nhiên, tinh nghịch, thích bắt chước chị Pi.
👨 Ba Trường – Vui tính, sáng tạo và luôn đồng hành cùng các con.
👩 Mẹ Vân – Dịu dàng, tâm lý, người hướng dẫn các trò chơi gia đình.
🐶 Mochi – Chú cún lông xù đáng yêu, siêu quậy của cả nhà.

✨ THÔNG ĐIỆP Ý NGHĨA:
"Khuyến khích trẻ em tự do sáng tạo, biến những sai sót bất ngờ thành niềm vui và biết sẻ chia công việc dọn dẹp cùng gia đình."

🎬 THÔNG TIN TẬP PHIM:
• Tập 9: Cùng nhau vẽ tranh
• Mùa: Season 1 – Tuổi Thơ Kỳ Diệu
• Thể loại: Hoạt hình 3D Thiếu nhi Việt Nam
• Kênh phát sóng: Kem Tivi

❤️ BẤM ĐĂNG KÝ KÊNH ĐỂ ĐỒNG HÀNH CÙNG PI VÀ KEM MỖI NGÀY NHÉ!

#Shorts #PiKem #KemTivi #GiaDinhPiKem #HoatHinhThieuNhi #VeTranh #MauNuoc #SangTao #HoiHoaThieuNhi`,
      hashtags: [
        '#Shorts',
        '#PiKem',
        '#KemTivi',
        '#GiaDinhPiKem',
        '#HoatHinhThieuNhi',
        '#VeTranh',
        '#MauNuoc',
        '#SangTao',
        '#HoiHoaThieuNhi',
      ],
      thumbnailAssetId: 'ref_project_banner_hero',
      thumbnailUrl: '/assets/aistudio/references/images/char_pi_turnaround.jpg',
      publishStatus: 'draft',
      timezone: 'Asia/Ho_Chi_Minh',
    },
    facebook: {
      post: `🎨 Bức tranh gia đình đẹp nhất không phải là bức tranh không có vết lem...

Sáng chủ nhật, mẹ trải tấm bạt lớn giữa phòng khách cho hai chị em Pi và Kem vẽ màu nước. Đang lúc chị Pi say sưa tô cầu vồng, Kem nắn nót vẽ ô tô thì "bịch!" — chú cún Mochi phi thẳng qua khay màu xanh lam, để lại bốn dấu chân cún to đùng ngay giữa bức tranh!

Chị Pi ôm mặt "Trời ơi!", còn Kem thì vỗ tay cười nắc nẻ tưởng Mochi đang làm xiếc. 

May có Ba Trường đỡ lời: "Khoan đã nào, đây chính là các cầu thủ nhí đang đá bóng trên sân cỏ cầu vồng của Pi đấy chứ!". Thế là cả nhà lại xúm vào vẽ thêm mắt mũi, bóng đá cho từng dấu chân cún. Đến trưa, không chỉ bức tranh đầy màu sắc mà cả Pi, Kem, Ba, Mẹ và Mochi đều lấm lem xanh đỏ, tiếng cười vang cả xóm.

Đôi khi những "tai nạn" bất ngờ lại là cơ hội tuyệt vời nhất để con học cách linh hoạt và nhìn cuộc sống bằng lăng kính lạc quan. Bố mẹ đừng quá căng thẳng nếu con làm đổ màu hay lem bẩn nhé, vì ký ức lấm lem ấy sau này sẽ quý giá vô cùng! ❤️

Cùng đón xem tập phim "Cùng nhau vẽ tranh" của Pi & Kem trên kênh Kem Tivi nhé! 👇`,
      imageAssetId: 'ref_project_banner_hero',
      imageUrl: '/assets/aistudio/references/images/char_pi_turnaround.jpg',
      includeYoutubeLink: false,
      status: 'draft',
    },
    assets: {
      thumbnailAssetId: 'ref_project_banner_hero',
      thumbnailUrl: '/assets/aistudio/references/images/char_pi_turnaround.jpg',
    },
    status: {
      videoReady: false,
      thumbnailReady: true,
      youtubeReady: true,
      facebookReady: true,
    },
    templateVersions: {
      youtube: 'tpl_youtube_standard_v1',
      facebook: 'tpl_facebook_storytelling_v1',
      hashtag: 'tpl_hashtags_standard_v1',
    },
    history: [],
    createdAt: '2026-02-15T15:30:00.000Z',
    updatedAt: '2026-02-15T15:30:00.000Z',
  },
];
