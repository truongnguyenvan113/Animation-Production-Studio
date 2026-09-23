import React, { useState, useEffect, useRef } from 'react';
import {
  Facebook,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Clock,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  ThumbsUp,
  MessageCircle,
  Share2,
  Globe,
  Link2,
  Upload,
} from 'lucide-react';
import { PublishingPack, FacebookPublishingData, FacebookPublishStatus } from '../../types';
import { publishingService } from '../../services/publishingService';
import { AssetSelectorModal } from './AssetSelectorModal';

interface FacebookTabProps {
  pack: PublishingPack;
  onPackUpdated: (updatedPack: PublishingPack) => void;
}

export const FacebookTab: React.FC<FacebookTabProps> = ({ pack, onPackUpdated }) => {
  const [data, setData] = useState<FacebookPublishingData>({ ...pack.facebook });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const directFileInputRef = useRef<HTMLInputElement>(null);
  const [isDirectUploading, setIsDirectUploading] = useState(false);

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsDirectUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64Data = ev.target?.result as string;
        try {
          const res = await fetch('/api/storage/upload-reference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              base64Data,
              characterId: 'facebook_image',
            }),
          });
          const resData = await res.json();
          const targetUrl = resData.fileUrl || base64Data;
          const targetId = resData.assetId || `asset_upload_${Date.now()}`;
          handleSelectImage(targetId, targetUrl);
        } catch {
          handleSelectImage(`asset_upload_${Date.now()}`, base64Data);
        } finally {
          setIsDirectUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsDirectUploading(false);
    }
  };

  // Synchronize local data whenever pack changes
  useEffect(() => {
    setData({ ...pack.facebook });
  }, [pack.episodeId, pack.facebook]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFieldChange = (field: keyof FacebookPublishingData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const updated = publishingService.updateFacebookData(pack.episodeId, data);
    onPackUpdated(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleRegeneratePost = () => {
    const newPost = publishingService.generateFacebookPost(pack.episodeBrief);
    setData((prev) => ({ ...prev, post: newPost }));
  };

  const handleSelectImage = (assetId: string, url: string) => {
    setData((prev) => ({
      ...prev,
      imageAssetId: assetId,
      imageUrl: url,
    }));
  };

  // Compile full post text including YouTube link if checked
  const fullPostTextWithLink =
    data.includeYoutubeLink && pack.youtube?.videoUrl
      ? `${data.post}\n\n👉 Xem trọn vẹn tập phim tại: ${pack.youtube.videoUrl}`
      : data.post;

  const displayImage = data.imageUrl || pack.youtube?.thumbnailUrl || pack.assets?.thumbnailUrl;

  return (
    <div className="space-y-6">
      {/* Top Header & Save */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-sky-950/20 border border-sky-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/30">
            <Facebook className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Facebook Fanpage & Storytelling Post</h3>
            <p className="text-xs text-slate-400">
              Văn phong tâm sự gia đình ấm áp, tương tác cao dành cho phụ huynh kênh Kem Tivi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Đã lưu thành công</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu bài viết Facebook</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span>Nội Dung Bài Viết (Storytelling Post)</span>
                <span className="text-[11px] font-normal text-slate-400">
                  ({data.post.length} ký tự)
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRegeneratePost}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1"
                  title="Tạo lại bài viết tâm sự"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Tạo lại</span>
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard(fullPostTextWithLink, 'post')}
                  className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 text-xs font-bold border border-sky-500/40 transition-colors flex items-center gap-1"
                >
                  {copiedKey === 'post' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-sky-300" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép bài viết</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <textarea
              rows={14}
              value={data.post}
              onChange={(e) => handleFieldChange('post', e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs leading-relaxed focus:outline-hidden focus:border-sky-500"
              placeholder="Nhập nội dung bài viết tâm sự dành cho Fanpage..."
            />

            {/* YouTube Link Integration */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={data.includeYoutubeLink ?? true}
                  onChange={(e) => handleFieldChange('includeYoutubeLink', e.target.checked)}
                  className="rounded border-slate-700 text-sky-500 focus:ring-sky-500/40"
                />
                <span className="font-semibold">Kèm liên kết YouTube khi sao chép bài viết</span>
              </label>

              {data.includeYoutubeLink && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                  <Link2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">
                    {pack.youtube?.videoUrl || 'Chưa có liên kết video YouTube (có thể bổ sung tại tab YouTube)'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Image Asset Box */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Hình Ảnh Kèm Bài Viết Facebook</span>
              </label>

              <div className="flex items-center gap-1.5 flex-wrap">
                <input
                  type="file"
                  ref={directFileInputRef}
                  onChange={handleDirectUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isDirectUploading}
                  onClick={() => directFileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 text-xs font-semibold border border-sky-800/60 transition-colors flex items-center gap-1.5"
                  title="Tải ảnh từ máy tính cá nhân"
                >
                  <Upload className="w-3 h-3 text-sky-400" />
                  <span>{isDirectUploading ? 'Đang tải...' : 'Tải từ máy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAssetModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 text-xs font-semibold border border-amber-800/60 transition-colors flex items-center gap-1.5"
                  title="Tạo ảnh Facebook bằng AI từ ảnh tham khảo"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Tạo bằng AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAssetModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                  title="Mở thư viện ảnh tham chiếu & Storyboard"
                >
                  <ImageIcon className="w-3 h-3 text-slate-400" />
                  <span>{displayImage ? 'Thay đổi ảnh' : 'Chọn ảnh'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-24 h-24 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt="Facebook Attached"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-700" />
                )}
              </div>

              <div className="flex-1 min-w-0 text-xs space-y-1">
                <div className="text-slate-300 font-semibold truncate flex items-center gap-2">
                  <span>{displayImage ? 'Đã liên kết ảnh Facebook' : 'Chưa có ảnh kèm'}</span>
                  {data.imageAssetId && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 truncate max-w-[150px]">
                      {data.imageAssetId}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {displayImage || 'Tải ảnh từ máy tính, tạo tự động bằng AI từ ảnh tham khảo hoặc chọn từ thư viện'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Facebook Live Simulator Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Facebook className="w-3.5 h-3.5 text-sky-400" />
            <span>Mô Phỏng Giao Diện Facebook (Live Preview)</span>
          </div>

          <div className="rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-xl overflow-hidden font-sans">
            {/* FB Header */}
            <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-amber-100">
                  KT
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">Kem Tivi</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[9px] font-bold">
                      ✓
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span>Vừa xong</span>
                    <span>•</span>
                    <Globe className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* FB Post Body */}
            <div className="p-3.5 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-h-[280px] overflow-y-auto custom-scrollbar">
              {data.post || 'Chưa có nội dung bài viết.'}
              {data.includeYoutubeLink && pack.youtube?.videoUrl && (
                <div className="mt-3 text-sky-700 font-medium">
                  👉 Xem trọn vẹn tập phim tại: {pack.youtube.videoUrl}
                </div>
              )}
            </div>

            {/* FB Image */}
            {displayImage && (
              <div className="w-full bg-slate-100 border-t border-b border-slate-200 aspect-video overflow-hidden">
                <img
                  src={displayImage}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* FB Stats */}
            <div className="px-3.5 py-2 flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center text-[9px]">
                  👍
                </div>
                <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px]">
                  ❤️
                </div>
                <span className="ml-1 font-medium">352</span>
              </div>
              <div className="flex items-center gap-3">
                <span>48 bình luận</span>
                <span>12 chia sẻ</span>
              </div>
            </div>

            {/* FB Action Buttons */}
            <div className="px-2 py-1 flex items-center justify-around text-slate-600 text-xs font-semibold">
              <button
                type="button"
                className="flex-1 py-1.5 flex items-center justify-center gap-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-slate-600" />
                <span>Thích</span>
              </button>
              <button
                type="button"
                className="flex-1 py-1.5 flex items-center justify-center gap-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-slate-600" />
                <span>Bình luận</span>
              </button>
              <button
                type="button"
                className="flex-1 py-1.5 flex items-center justify-center gap-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Chia sẻ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduling & Publish Status for Facebook */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Lịch Đăng Bài Fanpage (Facebook Schedule)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Múi giờ: Asia/Ho_Chi_Minh
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Trạng thái bài viết:
            </label>
            <select
              value={data.status}
              onChange={(e) => handleFieldChange('status', e.target.value as FacebookPublishStatus)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-hidden focus:border-sky-500"
            >
              <option value="draft">Bản nháp (Draft)</option>
              <option value="ready">Sẵn sàng (Ready)</option>
              <option value="published">Đã đăng (Published)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Ngày đăng bài:</span>
            </label>
            <input
              type="date"
              value={data.scheduledDate || ''}
              onChange={(e) => handleFieldChange('scheduledDate', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-sky-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Giờ đăng bài:</span>
            </label>
            <input
              type="time"
              value={data.scheduledTime || '20:00'}
              onChange={(e) => handleFieldChange('scheduledTime', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-sky-500"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu lịch đăng Facebook</span>
          </button>
        </div>
      </div>

      {/* Asset Selector Modal */}
      <AssetSelectorModal
        isOpen={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        onSelect={handleSelectImage}
        currentAssetId={data.imageAssetId}
        currentUrl={data.imageUrl}
        title="Chọn hoặc Tạo Hình Ảnh Bài Viết Facebook"
        assetType="image"
        episodeId={pack.episodeId}
        episodeTitle={pack.episodeTitle}
        episodeSynopsis={pack.episodeSynopsis}
        defaultRatio="1:1"
      />
    </div>
  );
};
