import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  ListCheck,
  CheckCircle2,
  AlertCircle,
  Youtube,
  Facebook,
  FileText,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { PublishingPack } from '../../types';

interface ExportPackageTabProps {
  pack: PublishingPack;
  onNavigateToTab: (tabId: string) => void;
}

export const ExportPackageTab: React.FC<ExportPackageTabProps> = ({
  pack,
  onNavigateToTab,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Compile YouTube Bundle
  const youtubeBundleText = `TIÊU ĐỀ YOUTUBE:
${pack.youtube.title}

MÔ TẢ VIDEO:
${pack.youtube.description}

HASHTAGS:
${pack.youtube.hashtags.join(' ')}`;

  // Compile Facebook Bundle
  const facebookBundleText = pack.facebook.includeYoutubeLink && pack.youtube.videoUrl
    ? `${pack.facebook.post}\n\n👉 Xem trọn vẹn tập phim tại: ${pack.youtube.videoUrl}`
    : pack.facebook.post;

  // Compile All-in-one text
  const completeBundleText = `=== GÓI XUẤT BẢN HOÀN CHỈNH KEM TIVI ===
Tập phim: ${pack.episodeBrief.title}
Chủ đề: ${pack.episodeBrief.theme || 'Gia đình & Tình bạn'}
Thông điệp: ${pack.episodeBrief.message || ''}

----------------------------------------
1. YOUTUBE STUDIO
----------------------------------------
TIÊU ĐỀ:
${pack.youtube.title}

MÔ TẢ:
${pack.youtube.description}

HASHTAGS:
${pack.youtube.hashtags.join(' ')}

LỊCH PHÁT SÓNG YOUTUBE:
- Trạng thái: ${pack.youtube.publishStatus}
- Ngày dự kiến: ${pack.youtube.scheduledDate || 'Chưa định ngày'} ${pack.youtube.scheduledTime || ''}
- Video Link: ${pack.youtube.videoUrl || 'Chưa đính kèm'}
- Thumbnail Link: ${pack.youtube.thumbnailUrl || 'Chưa đính kèm'}

----------------------------------------
2. FACEBOOK FANPAGE
----------------------------------------
BÀI VIẾT:
${facebookBundleText}

LỊCH ĐĂNG FACEBOOK:
- Trạng thái: ${pack.facebook.status}
- Ngày dự kiến: ${pack.facebook.scheduledDate || 'Chưa định ngày'} ${pack.facebook.scheduledTime || ''}
- Ảnh đính kèm: ${pack.facebook.imageUrl || pack.youtube.thumbnailUrl || 'Chưa đính kèm'}

========================================`;

  const handleDownloadFile = () => {
    const blob = new Blob([completeBundleText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Publishing_Pack_${pack.episodeId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Checklist items evaluation
  const checklistItems = [
    {
      id: 'video',
      label: 'Video thành phẩm (Final Video) đã sẵn sàng',
      ready: !!(pack.assets.finalVideoUrl || pack.youtube.videoUrl),
      tab: 'youtube',
    },
    {
      id: 'thumbnail',
      label: 'Ảnh đại diện (Thumbnail) chất lượng cao đã chọn',
      ready: !!(pack.assets.thumbnailUrl || pack.youtube.thumbnailUrl || pack.facebook.imageUrl),
      tab: 'youtube',
    },
    {
      id: 'yt_title',
      label: 'Tiêu đề YouTube đã đặt chuẩn SEO & Hook hấp dẫn',
      ready: !!(pack.youtube.title && pack.youtube.title.trim().length > 10),
      tab: 'youtube',
    },
    {
      id: 'yt_desc',
      label: 'Mô tả YouTube đã có tóm tắt, giới thiệu nhân vật và thông điệp',
      ready: !!(pack.youtube.description && pack.youtube.description.trim().length > 50),
      tab: 'youtube',
    },
    {
      id: 'hashtags',
      label: 'Bộ thẻ Hashtag (#Shorts, #PiKem, #KemTivi...) đầy đủ',
      ready: pack.youtube.hashtags.length >= 3,
      tab: 'youtube',
    },
    {
      id: 'fb_post',
      label: 'Bài viết Facebook tâm sự gia đình ấm áp đã duyệt',
      ready: !!(pack.facebook.post && pack.facebook.post.trim().length > 50),
      tab: 'facebook',
    },
    {
      id: 'yt_schedule',
      label: 'Đã lên lịch hoặc ấn định ngày giờ phát sóng YouTube',
      ready: !!pack.youtube.scheduledDate || pack.youtube.publishStatus === 'published',
      tab: 'youtube',
    },
    {
      id: 'fb_schedule',
      label: 'Đã lên lịch hoặc ấn định thời điểm đăng bài Fanpage',
      ready: !!pack.facebook.scheduledDate || pack.facebook.status === 'published',
      tab: 'facebook',
    },
  ];

  const readyCount = checklistItems.filter((i) => i.ready).length;
  const progressPercent = Math.round((readyCount / checklistItems.length) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Gói Xuất Bản & Sao Chép Nhanh</h3>
            <p className="text-xs text-slate-400">
              Sao chép nội dung xuất bản bằng một cú nhấp chuột để đăng tải lên YouTube Studio và Facebook Creator Studio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadFile}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Tải file gói (.txt)</span>
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(completeBundleText, 'all_bundle')}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
          >
            {copiedKey === 'all_bundle' ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>Đã sao chép tất cả</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>📋 Sao chép toàn bộ gói</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Checklist Progress Section */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListCheck className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Danh Mục Kiểm Tra Độ Sẵn Sàng Xuất Bản (Publishing Checklist)
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400">
              {readyCount}/{checklistItems.length} mục hoàn thành
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              progressPercent === 100
                ? 'bg-emerald-500'
                : progressPercent >= 50
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Checklist item list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onNavigateToTab(item.tab)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                item.ready
                  ? 'bg-slate-950/60 border-emerald-500/20 hover:border-emerald-500/40 text-slate-200'
                  : 'bg-slate-950/30 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs">
                {item.ready ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className={item.ready ? 'font-medium' : 'text-slate-400'}>{item.label}</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase font-mono ml-2 shrink-0">
                {item.tab} →
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Copy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* YouTube Copy Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-rose-500" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Gói Dữ Liệu YouTube
              </h4>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(youtubeBundleText, 'yt_bundle')}
              className="px-3 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold border border-rose-500/40 transition-colors flex items-center gap-1.5"
            >
              {copiedKey === 'yt_bundle' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-rose-300" />
                  <span>Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Chép toàn bộ YouTube</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Tiêu đề YouTube:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(pack.youtube.title, 'yt_title_only')}
                  className="text-rose-400 hover:underline"
                >
                  {copiedKey === 'yt_title_only' ? '✓ Đã chép' : 'Chép tiêu đề'}
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-semibold truncate">
                {pack.youtube.title || 'Chưa có tiêu đề'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Mô tả video:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(pack.youtube.description, 'yt_desc_only')}
                  className="text-rose-400 hover:underline"
                >
                  {copiedKey === 'yt_desc_only' ? '✓ Đã chép' : 'Chép mô tả'}
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 line-clamp-3 text-[11px] leading-relaxed">
                {pack.youtube.description || 'Chưa có mô tả'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Hashtags:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(pack.youtube.hashtags.join(' '), 'yt_tags_only')}
                  className="text-rose-400 hover:underline"
                >
                  {copiedKey === 'yt_tags_only' ? '✓ Đã chép' : 'Chép hashtags'}
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono text-[11px] truncate">
                {pack.youtube.hashtags.join(' ') || 'Chưa có hashtags'}
              </div>
            </div>
          </div>
        </div>

        {/* Facebook Copy Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Facebook className="w-4 h-4 text-sky-500" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Gói Bài Viết Facebook
              </h4>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(facebookBundleText, 'fb_bundle')}
              className="px-3 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 text-xs font-bold border border-sky-500/40 transition-colors flex items-center gap-1.5"
            >
              {copiedKey === 'fb_bundle' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-sky-300" />
                  <span>Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Chép bài viết Facebook</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="text-slate-400 text-[11px]">Bài viết tâm sự Fanpage:</div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 line-clamp-6 text-[11px] leading-relaxed whitespace-pre-wrap">
                {facebookBundleText || 'Chưa có nội dung bài viết Facebook'}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
              <span>Độ dài: {pack.facebook.post.length} ký tự</span>
              <span>
                Kèm link YouTube: {pack.facebook.includeYoutubeLink ? 'Có' : 'Không'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
