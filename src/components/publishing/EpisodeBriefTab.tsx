import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Info,
} from 'lucide-react';
import { PublishingPack, EpisodePublishingBrief, Episode } from '../../types';
import { publishingService } from '../../services/publishingService';

interface EpisodeBriefTabProps {
  pack: PublishingPack;
  episode?: Episode;
  onPackUpdated: (updatedPack: PublishingPack) => void;
  onNavigateToTab: (tabId: string) => void;
}

export const EpisodeBriefTab: React.FC<EpisodeBriefTabProps> = ({
  pack,
  episode,
  onPackUpdated,
  onNavigateToTab,
}) => {
  const [brief, setBrief] = useState<EpisodePublishingBrief>({ ...pack.episodeBrief });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [generateMode, setGenerateMode] = useState<'all' | 'youtube' | 'facebook'>('all');

  const hasExistingContent =
    !!(pack.youtube?.title && pack.youtube?.title.trim()) ||
    !!(pack.youtube?.description && pack.youtube?.description.trim()) ||
    !!(pack.facebook?.post && pack.facebook?.post.trim());

  const handleFieldChange = (field: keyof EpisodePublishingBrief, value: string) => {
    setBrief((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBrief = () => {
    const updated = publishingService.updateEpisodeBrief(pack.episodeId, brief);
    onPackUpdated(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleResetFromEpisode = () => {
    if (!episode) return;
    const title = episode.title || `Tập ${episode.episodeNumber}`;
    const theme = episode.theme || 'Gia đình & Tình bạn';
    const storySummary =
      episode.storyDraft?.premise || episode.storyIdea || 'Câu chuyện gia đình ấm áp của Pi & Kem.';
    const message =
      episode.educationalMessage ||
      episode.storyDraft?.educationalLesson ||
      'Một món đồ không cần hoàn hảo để trở nên đặc biệt.';

    const resetBrief: EpisodePublishingBrief = {
      title,
      theme,
      storySummary,
      message,
      episodeType: brief.episodeType || 'Tập chuẩn (Standard)',
    };

    setBrief(resetBrief);
    const updated = publishingService.updateEpisodeBrief(pack.episodeId, resetBrief);
    onPackUpdated(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const triggerGenerate = (mode: 'all' | 'youtube' | 'facebook') => {
    setGenerateMode(mode);
    if (hasExistingContent) {
      setShowOverwriteModal(true);
    } else {
      executeGenerate(mode, false);
    }
  };

  const executeGenerate = (mode: 'all' | 'youtube' | 'facebook', asNewRevision: boolean) => {
    // Save brief first
    publishingService.updateEpisodeBrief(pack.episodeId, brief);

    const updated = publishingService.generatePublishingContent(pack.episodeId, {
      mode,
      asNewRevision,
    });
    onPackUpdated(updated);
    setShowOverwriteModal(false);

    if (mode === 'youtube') {
      onNavigateToTab('youtube');
    } else if (mode === 'facebook') {
      onNavigateToTab('facebook');
    } else {
      onNavigateToTab('youtube');
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro info box */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-300">
            Episode Brief – Dữ liệu nguồn cho nội dung xuất bản
          </p>
          <p className="text-slate-300 text-xs leading-relaxed">
            Thông tin tại đây được dùng làm chất liệu sinh tự động Tiêu đề YouTube, Mô tả chuẩn SEO, Bài viết tâm sự Facebook và bộ Thẻ Hashtags. 
            Bạn có thể chỉnh sửa tự do mà không làm ảnh hưởng đến kịch bản sản xuất gốc.
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Thông Tin Tóm Lược Tập Phim</span>
          </h3>

          <div className="flex items-center gap-2">
            {episode && (
              <button
                type="button"
                onClick={handleResetFromEpisode}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                title="Lấy lại nội dung từ Episode Storyboard"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Nạp lại từ tập phim gốc</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveBrief}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                  <span>Đã lưu</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Brief</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Tên tập phim (Title):
            </label>
            <input
              type="text"
              value={brief.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm font-medium focus:outline-hidden focus:border-amber-500"
              placeholder="Ví dụ: Chiếc Đèn Lồng Đặc Biệt"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Loại tập phim (Episode Type):
            </label>
            <select
              value={brief.episodeType || 'Tập chuẩn (Standard)'}
              onChange={(e) => handleFieldChange('episodeType', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-hidden focus:border-amber-500"
            >
              <option value="Tập chuẩn (Standard)">Tập chuẩn (Standard)</option>
              <option value="Tập đặc biệt (Special)">Tập đặc biệt (Special)</option>
              <option value="Shorts / Điểm tin ngắn">Shorts / Điểm tin ngắn</option>
              <option value="Tập lễ hội / Mùa vụ">Tập lễ hội / Mùa vụ</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Chủ đề & Thông điệp chính (Theme):
          </label>
          <input
            type="text"
            value={brief.theme || ''}
            onChange={(e) => handleFieldChange('theme', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-hidden focus:border-amber-500"
            placeholder="Ví dụ: Tết Trung Thu & Tình Yêu Thương Gia Đình"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Nội dung tóm tắt câu chuyện (Story Summary):
          </label>
          <textarea
            rows={4}
            value={brief.storySummary || ''}
            onChange={(e) => handleFieldChange('storySummary', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm leading-relaxed focus:outline-hidden focus:border-amber-500"
            placeholder="Mô tả tóm tắt diễn biến câu chuyện của Pi, Kem và gia đình..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Thông điệp giáo dục / Giá trị gia đình (Educational Lesson & Moral):
          </label>
          <textarea
            rows={2}
            value={brief.message || ''}
            onChange={(e) => handleFieldChange('message', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm leading-relaxed focus:outline-hidden focus:border-amber-500"
            placeholder="Ví dụ: Một món đồ không cần hoàn hảo để trở nên đặc biệt. Tình yêu thương gia đình biến mọi điều dang dở thành kỷ niệm ấm áp."
          />
        </div>
      </div>

      {/* Generation Trigger Panel */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Khởi Tạo Nội Dung Xuất Bản Tự Động</h4>
          </div>
          <p className="text-xs text-slate-300">
            Hệ thống áp dụng chuẩn Mẫu Kem Tivi v1, tối ưu SEO YouTube và văn phong tâm sự gia đình Facebook.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => triggerGenerate('youtube')}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Tạo riêng YouTube</span>
          </button>

          <button
            type="button"
            onClick={() => triggerGenerate('facebook')}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Tạo riêng Facebook</span>
          </button>

          <button
            type="button"
            onClick={() => triggerGenerate('all')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>✨ Tạo Toàn Bộ Nội Dung</span>
          </button>
        </div>
      </div>

      {/* Overwrite Confirmation Modal */}
      {showOverwriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4 text-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Phát hiện nội dung đã tồn tại</h4>
                <p className="text-xs text-slate-400">Bạn đã có bản thảo xuất bản cho tập phim này</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn muốn ghi đè trực tiếp lên các trường hiện tại, hay lưu phiên bản hiện tại vào Lịch sử và tạo dưới dạng một phiên bản mới?
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => executeGenerate(generateMode, true)}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>Tạo dưới dạng Phiên bản mới (Khuyên dùng)</span>
              </button>

              <button
                type="button"
                onClick={() => executeGenerate(generateMode, false)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs border border-slate-700 transition-colors"
              >
                Ghi đè trực tiếp (Không tạo bản ghi mới)
              </button>

              <button
                type="button"
                onClick={() => setShowOverwriteModal(false)}
                className="w-full py-2 px-3 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
