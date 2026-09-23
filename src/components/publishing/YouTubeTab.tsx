import React, { useState, useEffect, useRef } from 'react';
import {
  Youtube,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Clock,
  Image as ImageIcon,
  Video,
  Save,
  CheckCircle2,
  Tag,
  Plus,
  X,
  Eye,
  Edit3,
  ExternalLink,
  Upload,
} from 'lucide-react';
import { PublishingPack, YouTubePublishingData, YouTubePublishStatus } from '../../types';
import { publishingService } from '../../services/publishingService';
import { AssetSelectorModal } from './AssetSelectorModal';

interface YouTubeTabProps {
  pack: PublishingPack;
  onPackUpdated: (updatedPack: PublishingPack) => void;
}

export const YouTubeTab: React.FC<YouTubeTabProps> = ({ pack, onPackUpdated }) => {
  const [data, setData] = useState<YouTubePublishingData>({ ...pack.youtube });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [previewDescription, setPreviewDescription] = useState(false);
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
              characterId: 'youtube_thumbnail',
            }),
          });
          const resData = await res.json();
          const targetUrl = resData.fileUrl || base64Data;
          const targetId = resData.assetId || `asset_upload_${Date.now()}`;
          handleSelectThumbnail(targetId, targetUrl);
        } catch {
          handleSelectThumbnail(`asset_upload_${Date.now()}`, base64Data);
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
    setData({ ...pack.youtube });
  }, [pack.episodeId, pack.youtube]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFieldChange = (field: keyof YouTubePublishingData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const updated = publishingService.updateYouTubeData(pack.episodeId, data);
    // Sync into canonical assets table
    publishingService.updateAssetsData(pack.episodeId, {
      thumbnailAssetId: data.thumbnailAssetId,
      thumbnailUrl: data.thumbnailUrl,
      finalVideoAssetId: data.videoAssetId,
      finalVideoUrl: data.videoUrl,
    });
    onPackUpdated(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleRegenerateTitle = () => {
    const newTitle = publishingService.generateYouTubeTitle(pack.episodeBrief);
    setData((prev) => ({ ...prev, title: newTitle }));
  };

  const handleRegenerateDescription = () => {
    const newDesc = publishingService.generateYouTubeDescription(pack.episodeBrief);
    setData((prev) => ({ ...prev, description: newDesc }));
  };

  const handleRegenerateHashtags = () => {
    const newTags = publishingService.generateHashtags(pack.episodeBrief);
    setData((prev) => ({ ...prev, hashtags: newTags }));
  };

  const handleAddHashtag = () => {
    let tag = newTagInput.trim();
    if (!tag) return;
    if (!tag.startsWith('#')) tag = `#${tag}`;
    if (!data.hashtags.includes(tag)) {
      setData((prev) => ({ ...prev, hashtags: [...prev.hashtags, tag] }));
    }
    setNewTagInput('');
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setData((prev) => ({
      ...prev,
      hashtags: prev.hashtags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleSelectThumbnail = (assetId: string, url: string) => {
    setData((prev) => ({
      ...prev,
      thumbnailAssetId: assetId,
      thumbnailUrl: url,
    }));
    // Sync into assets
    publishingService.updateAssetsData(pack.episodeId, {
      thumbnailAssetId: assetId,
      thumbnailUrl: url,
    });
  };

  const handleSelectVideo = (assetId: string, url: string) => {
    setData((prev) => ({
      ...prev,
      videoAssetId: assetId,
      videoUrl: url,
    }));
    // Sync into assets
    publishingService.updateAssetsData(pack.episodeId, {
      finalVideoAssetId: assetId,
      finalVideoUrl: url,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Save */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/30">
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">YouTube Studio & Video Packaging</h3>
            <p className="text-xs text-slate-400">
              Định dạng chuẩn YouTube Kids & Shorts cho kênh Kem Tivi
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
                <span>Lưu thông tin YouTube</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Media Assets: Video & Thumbnail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Video Asset Box */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-rose-400" />
              <span>Video Thành Phẩm (Final Video)</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowVideoModal(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Video className="w-3 h-3 text-rose-400" />
                <span>{data.videoUrl || data.videoAssetId ? 'Thay đổi video' : 'Chọn video'}</span>
              </button>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  data.videoUrl || data.videoAssetId
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {data.videoUrl || data.videoAssetId ? 'Sẵn sàng' : 'Chưa gắn video'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={data.videoUrl || ''}
              onChange={(e) => handleFieldChange('videoUrl', e.target.value)}
              placeholder="Dán liên kết video (YouTube URL / Cloud Storage MP4 / CapCut Export)"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-rose-500"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              {data.videoAssetId ? (
                <span className="font-mono text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/50">
                  Asset ID: {data.videoAssetId}
                </span>
              ) : (
                <span className="text-slate-400">Chưa gắn mã Asset ID</span>
              )}
              {data.videoUrl && (
                <span className="text-emerald-400 flex items-center gap-1 truncate max-w-[200px]">
                  <Check className="w-3 h-3 shrink-0" />
                  <span className="truncate">{data.videoUrl}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail Asset Box */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>Ảnh Đại Diện Video (YouTube Thumbnail)</span>
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
                title="Tải ảnh đại diện từ máy tính cá nhân"
              >
                <Upload className="w-3 h-3 text-sky-400" />
                <span>{isDirectUploading ? 'Đang tải...' : 'Tải từ máy'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAssetModal(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 text-xs font-semibold border border-amber-800/60 transition-colors flex items-center gap-1.5"
                title="Tạo ảnh thumbnail bằng AI từ ảnh tham khảo"
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
                <span>{data.thumbnailUrl ? 'Thay đổi ảnh' : 'Chọn ảnh'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-28 h-18 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
              {data.thumbnailUrl ? (
                <img
                  src={data.thumbnailUrl}
                  alt="Thumbnail Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-700" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-xs space-y-1">
              <div className="text-slate-300 font-semibold truncate flex items-center gap-2">
                <span>{data.thumbnailUrl ? 'Đã liên kết ảnh đại diện' : 'Chưa chọn ảnh đại diện'}</span>
                {data.thumbnailAssetId && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 truncate max-w-[150px]">
                    {data.thumbnailAssetId}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {data.thumbnailUrl || 'Tải ảnh từ máy tính, tạo tự động bằng AI từ ảnh tham khảo hoặc chọn từ thư viện'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* YouTube Title */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <span>Tiêu Đề Video (Title)</span>
            <span className="text-[11px] font-normal text-slate-400">
              ({data.title.length}/100 ký tự)
            </span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerateTitle}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1"
              title="Tạo lại tiêu đề theo mẫu chuẩn"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Tạo lại</span>
            </button>

            <button
              type="button"
              onClick={() => copyToClipboard(data.title, 'title')}
              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold border border-rose-500/40 transition-colors flex items-center gap-1"
            >
              {copiedKey === 'title' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-rose-300" />
                  <span>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
        </div>

        <input
          type="text"
          value={data.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          maxLength={100}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-hidden focus:border-rose-500"
          placeholder="🏮 Pi & Kem – Tên tập phim! 🥰 | Hoạt Hình Thiếu Nhi | Kem Tivi #Shorts"
        />
      </div>

      {/* YouTube Description */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <span>Mô Tả Video (Description)</span>
            <span className="text-[11px] font-normal text-slate-400">
              ({data.description.split('\n').length} dòng, {data.description.length} ký tự)
            </span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewDescription(!previewDescription)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1"
            >
              {previewDescription ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{previewDescription ? 'Chỉnh sửa' : 'Xem trước'}</span>
            </button>

            <button
              type="button"
              onClick={handleRegenerateDescription}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Tạo lại</span>
            </button>

            <button
              type="button"
              onClick={() => copyToClipboard(data.description, 'description')}
              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold border border-rose-500/40 transition-colors flex items-center gap-1"
            >
              {copiedKey === 'description' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-rose-300" />
                  <span>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép mô tả</span>
                </>
              )}
            </button>
          </div>
        </div>

        {previewDescription ? (
          <div className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto custom-scrollbar font-mono">
            {data.description}
          </div>
        ) : (
          <textarea
            rows={12}
            value={data.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs leading-relaxed focus:outline-hidden focus:border-rose-500 font-sans"
            placeholder="Nội dung mô tả video đầy đủ..."
          />
        )}
      </div>

      {/* Hashtags Section */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400" />
            <span>Bộ Thẻ Hashtags ({data.hashtags.length} thẻ)</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerateHashtags}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Tạo lại</span>
            </button>

            <button
              type="button"
              onClick={() => copyToClipboard(data.hashtags.join(' '), 'hashtags')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-colors flex items-center gap-1"
            >
              {copiedKey === 'hashtags' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-amber-300" />
                  <span>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép thẻ</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tag chips */}
        <div className="flex flex-wrap gap-2">
          {data.hashtags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-amber-300 font-mono"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveHashtag(tag)}
                className="text-slate-500 hover:text-rose-400 transition-colors ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {/* Add tag input */}
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddHashtag();
              }
            }}
            placeholder="Thêm hashtag mới (nhấn Enter)..."
            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
          />
          <button
            type="button"
            onClick={handleAddHashtag}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </div>
      </div>

      {/* Scheduling & Publish Status (Metadata Only) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Lịch Phát Sóng YouTube (Schedule Metadata)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Múi giờ: {data.timezone || 'Asia/Ho_Chi_Minh'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Trạng thái xuất bản:
            </label>
            <select
              value={data.publishStatus}
              onChange={(e) => handleFieldChange('publishStatus', e.target.value as YouTubePublishStatus)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-hidden focus:border-emerald-500"
            >
              <option value="draft">Bản nháp (Draft)</option>
              <option value="scheduled">Đã lên lịch (Scheduled)</option>
              <option value="published">Đã phát hành (Published)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Ngày phát sóng dự kiến:</span>
            </label>
            <input
              type="date"
              value={data.scheduledDate || ''}
              onChange={(e) => handleFieldChange('scheduledDate', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Khung giờ phát sóng:</span>
            </label>
            <input
              type="time"
              value={data.scheduledTime || '19:30'}
              onChange={(e) => handleFieldChange('scheduledTime', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu lịch phát sóng YouTube</span>
          </button>
        </div>
      </div>

      {/* Thumbnail Asset Selector Modal */}
      <AssetSelectorModal
        isOpen={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        onSelect={handleSelectThumbnail}
        currentAssetId={data.thumbnailAssetId}
        currentUrl={data.thumbnailUrl}
        title="Chọn hoặc Tạo Thumbnail YouTube"
        assetType="image"
        episodeId={pack.episodeId}
        episodeTitle={pack.episodeTitle}
        episodeSynopsis={pack.episodeSynopsis}
        defaultRatio="16:9"
      />

      {/* Final Video Asset Selector Modal */}
      <AssetSelectorModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onSelect={handleSelectVideo}
        currentAssetId={data.videoAssetId}
        currentUrl={data.videoUrl}
        title="Chọn Video Thành Phẩm (Final Video)"
        assetType="video"
      />
    </div>
  );
};
