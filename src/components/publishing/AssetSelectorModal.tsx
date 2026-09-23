import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  Check,
  Link as LinkIcon,
  Film,
  Sparkles,
  Upload,
  RefreshCw,
  Layers,
  CheckSquare,
  Square,
  Wand2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { storageService } from '../../services/storageService';

interface AssetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assetId: string, url: string) => void;
  currentAssetId?: string;
  currentUrl?: string;
  title?: string;
  assetType?: 'image' | 'video';
  episodeId?: string;
  episodeTitle?: string;
  episodeSynopsis?: string;
  defaultRatio?: '16:9' | '1:1' | '4:3';
}

export const AssetSelectorModal: React.FC<AssetSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentAssetId,
  currentUrl,
  title,
  assetType = 'image',
  episodeId,
  episodeTitle,
  episodeSynopsis,
  defaultRatio = '16:9',
}) => {
  const [tab, setTab] = useState<'references' | 'shots' | 'upload' | 'generate' | 'videos' | 'custom'>(
    assetType === 'video' ? 'videos' : 'references'
  );

  // Custom URL state
  const [customInputUrl, setCustomInputUrl] = useState(currentUrl || '');
  const [customAssetId, setCustomAssetId] = useState(currentAssetId || '');

  // Upload local file state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadAssetName, setUploadAssetName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Auto-Generation from Reference Images state
  const [selectedRefUrls, setSelectedRefUrls] = useState<string[]>([]);
  const [genPrompt, setGenPrompt] = useState('');
  const [genTheme, setGenTheme] = useState('Tết Trung Thu gia đình lung linh');
  const [genRatio, setGenRatio] = useState<'16:9' | '1:1' | '4:3'>(defaultRatio);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatusText, setGenStatusText] = useState('');
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);
  const [generatedAssetId, setGeneratedAssetId] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const db = storageService.getDatabase();
  const projectRefs = db.projectReferences || [];
  const charRefs = db.characterReferences || [];
  const storyboards = db.storyboards || [];
  const productionAssets = db.productionAssets || [];

  // Initialize generation context when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomInputUrl(currentUrl || '');
      setCustomAssetId(currentAssetId || '');
      setUploadError(null);
      setGenError(null);

      // Pre-select reference images related to episode or canonical characters
      const initialRefs: string[] = [];
      charRefs.forEach((cr) => {
        const u = cr.image || cr.thumbnail;
        if (u && !initialRefs.includes(u)) {
          initialRefs.push(u);
        }
      });
      projectRefs.forEach((pr) => {
        const u = pr.uri || pr.thumbnail;
        if (u && !initialRefs.includes(u)) {
          initialRefs.push(u);
        }
      });
      // Limit to 4 initial picks
      setSelectedRefUrls(initialRefs.slice(0, 4));

      // Default prompt
      const resolvedTitle = episodeTitle || 'Pi & Kem Hoạt Hình';
      const resolvedSyn = episodeSynopsis || 'Pi và Kem rước đèn lồng ngôi sao cùng gia đình đón Tết Trung Thu';
      setGenPrompt(
        `Khung cảnh 3D rực rỡ, Pi và Kem háo hức cười tươi rạng rỡ, cầm đèn lồng lung linh dưới ánh trăng rằm, Ba Trường và Mẹ Vân mỉm cười hạnh phúc bên cạnh, phong cách hoạt hình 3D Pixar, màu sắc tươi sáng ấm cúng.`
      );
    }
  }, [isOpen, episodeTitle, episodeSynopsis, currentUrl, currentAssetId]);

  if (!isOpen) return null;

  const resolvedTitle =
    title ||
    (assetType === 'video'
      ? 'Chọn Video Thành Phẩm (Final Video Asset)'
      : 'Chọn Hình Ảnh / Thumbnail');

  // Available video assets from production or canonical exports
  const videoAssetCandidates: Array<{ id: string; name: string; url: string; note: string }> = [
    {
      id: 'asset_capcut_final_ep010',
      name: 'CapCut Final Assembly Master — EP10 (Chiếc Đèn Lồng Đặc Biệt)',
      url: '/assets/video/ep010_final_master_1080p.mp4',
      note: 'Bản dựng hoàn chỉnh CapCut 1080p 24fps (Âm thanh lồng tiếng + SFX)',
    },
    {
      id: 'asset_capcut_final_ep009',
      name: 'CapCut Final Assembly Master — EP09 (Cùng Nhau Vẽ Tranh)',
      url: '/assets/video/ep009_final_master_1080p.mp4',
      note: 'Bản dựng hoàn chỉnh CapCut 1080p 24fps (Bản xuất bản chuẩn)',
    },
    {
      id: 'asset_flow_ep010_composite',
      name: 'Google Flow Composite Sequence EP10',
      url: '/assets/video/flow_composite_ep010.mp4',
      note: 'Ghép nối chuỗi phân cảnh từ Google Flow Director',
    },
  ];

  productionAssets.forEach((pa) => {
    if (pa.mimeType?.includes('video') || pa.imageUrl?.endsWith('.mp4')) {
      if (!videoAssetCandidates.some((v) => v.id === pa.asset_id)) {
        videoAssetCandidates.push({
          id: pa.asset_id,
          name: `Production Asset: ${pa.asset_id}`,
          url: pa.imageUrl,
          note: `Khung thời lượng: ${pa.durationSeconds || 5}s • ${pa.provider}`,
        });
      }
    }
  });

  // Extract shots with images
  const shotImages: Array<{ id: string; title: string; url: string; shotCode: string }> = [];
  storyboards.forEach((sb) => {
    sb.scenes?.forEach((sc) => {
      sc.shots?.forEach((shot) => {
        if (shot.activeImageOutputUrl) {
          shotImages.push({
            id: shot.id,
            shotCode: `Shot ${shot.sceneNumber}.${shot.shotNumber}`,
            title: shot.visualPurpose || shot.action || 'Shot Keyframe',
            url: shot.activeImageOutputUrl,
          });
        }
      });
    });
  });

  // Handle local file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP).');
      return;
    }

    setUploadFile(file);
    setUploadAssetName(file.name.replace(/\.[^/.]+$/, ''));
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload local file to server storage & apply
  const handlePerformUpload = async () => {
    if (!uploadPreview || !uploadFile) {
      setUploadError('Chưa có file ảnh nào được chọn.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await fetch('/api/storage/upload-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: uploadFile.name,
          base64Data: uploadPreview,
          characterId: 'custom_upload',
        }),
      });

      if (!response.ok) {
        throw new Error(`Lỗi máy chủ: ${response.statusText}`);
      }

      const resData = await response.json();
      if (resData.status === 'ok') {
        const generatedId = resData.assetId || `asset_upload_${Date.now()}`;
        const finalUrl = resData.fileUrl || uploadPreview;

        // Register in project references for studio rehydration & library browsing
        const updatedDb = storageService.getDatabase();
        const currentProjectRefs = updatedDb.projectReferences || [];
        const newRef: any = {
          id: generatedId,
          name: uploadAssetName || uploadFile.name,
          type: 'image',
          source: 'uploaded_image',
          uri: finalUrl,
          storagePath: finalUrl,
          thumbnail: finalUrl,
          tags: ['Upload', 'Thumbnail'],
          createdAt: new Date().toISOString(),
        };
        currentProjectRefs.unshift(newRef);
        storageService.saveDatabase({ projectReferences: currentProjectRefs });

        onSelect(generatedId, finalUrl);
        onClose();
      } else {
        throw new Error(resData.message || 'Tải ảnh thất bại.');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      // Fallback: directly apply Data URL if server endpoint has issues
      const fallbackId = `asset_dataurl_${Date.now()}`;
      onSelect(fallbackId, uploadPreview);
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle reference image selection for generation
  const toggleRefSelection = (url: string) => {
    if (selectedRefUrls.includes(url)) {
      setSelectedRefUrls(selectedRefUrls.filter((u) => u !== url));
    } else {
      setSelectedRefUrls([...selectedRefUrls, url]);
    }
  };

  // Handle AI thumbnail generation
  const handleGenerateThumbnail = async () => {
    setIsGenerating(true);
    setGenError(null);
    setGenStatusText('Đang nạp ảnh tham chiếu nhân vật & bối cảnh...');

    try {
      const timer1 = setTimeout(() => {
        setGenStatusText('Đang xử lý mô hình hoạt hình 3D Pixar & bố cục tiêu đề...');
      }, 700);

      const timer2 = setTimeout(() => {
        setGenStatusText('Đang kết xuất ánh sáng volumetric & hoàn tất ảnh...');
      }, 1500);

      const res = await fetch('/api/publishing/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: episodeId || 'ep010',
          title: episodeTitle || 'Pi & Kem Hoạt Hình',
          prompt: genPrompt,
          theme: genTheme,
          aspectRatio: genRatio,
          referenceImageUrls: selectedRefUrls,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!res.ok) {
        throw new Error(`Máy chủ phản hồi lỗi: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.status === 'ok') {
        setGeneratedPreviewUrl(data.fileUrl);
        setGeneratedAssetId(data.assetId);
        setGenStatusText('Tạo ảnh đại diện thành công!');
      } else {
        throw new Error(data.message || 'Tạo ảnh không thành công.');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setGenError(`Không thể tạo ảnh: ${err.message || 'Đã xảy ra lỗi'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply generated thumbnail
  const handleApplyGenerated = () => {
    if (generatedPreviewUrl) {
      onSelect(generatedAssetId || `asset_gen_${Date.now()}`, generatedPreviewUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                assetType === 'video'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              {assetType === 'video' ? <Film className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{resolvedTitle}</h3>
              <p className="text-xs text-slate-400">
                {assetType === 'video'
                  ? 'Chọn từ kho bản dựng CapCut/Flow hoặc dán liên kết video thành phẩm'
                  : 'Tải ảnh từ máy, tạo tự động bằng AI từ ảnh tham khảo, hoặc chọn từ thư viện dự án'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
          {assetType === 'video' ? (
            <>
              <button
                onClick={() => setTab('videos')}
                className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  tab === 'videos'
                    ? 'border-rose-400 text-rose-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Video Kho Dự Án & CapCut ({videoAssetCandidates.length})</span>
              </button>
              <button
                onClick={() => setTab('custom')}
                className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  tab === 'custom'
                    ? 'border-rose-400 text-rose-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Dán liên kết Video (URL)</span>
              </button>
            </>
          ) : (
            <>
              {/* Tab 1: Upload from local */}
              <button
                onClick={() => setTab('upload')}
                className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  tab === 'upload'
                    ? 'border-sky-400 text-sky-300 bg-sky-950/20 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span>Tải lên từ máy (Upload)</span>
              </button>

              {/* Tab 2: AI Generate from reference images */}
              <button
                onClick={() => setTab('generate')}
                className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  tab === 'generate'
                    ? 'border-amber-400 text-amber-300 bg-amber-950/20 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Tạo bằng AI từ ảnh tham khảo</span>
              </button>

              {/* Tab 3: References library */}
              <button
                onClick={() => setTab('references')}
                className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  tab === 'references'
                    ? 'border-indigo-400 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Kho Tham chiếu ({projectRefs.length + charRefs.length})</span>
              </button>

              {/* Tab 4: Storyboard Shots */}
              <button
                onClick={() => setTab('shots')}
                className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  tab === 'shots'
                    ? 'border-indigo-400 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Khung Storyboard ({shotImages.length})</span>
              </button>

              {/* Tab 5: Custom URL */}
              <button
                onClick={() => setTab('custom')}
                className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  tab === 'custom'
                    ? 'border-indigo-400 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Dán liên kết (URL)</span>
              </button>
            </>
          )}
        </div>

        {/* Content area */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* ============================================================== */}
          {/* TAB 1: UPLOAD FROM LOCAL DEVICE */}
          {/* ============================================================== */}
          {tab === 'upload' && (
            <div className="max-w-xl mx-auto space-y-5 py-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) {
                    setUploadFile(file);
                    setUploadAssetName(file.name.replace(/\.[^/.]+$/, ''));
                    setUploadError(null);
                    const reader = new FileReader();
                    reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
                className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-950/60 hover:bg-slate-950/90 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Kéo thả file ảnh vào đây hoặc nhấp để duyệt file từ máy tính
                </h4>
                <p className="text-xs text-slate-400">
                  Hỗ trợ định dạng PNG, JPG, WEBP (khuyến nghị tỷ lệ 16:9 hoặc độ phân giải từ 1280x720)
                </p>
              </div>

              {uploadPreview && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-sky-400" />
                      <span>Xem trước ảnh đã chọn:</span>
                    </span>
                    {uploadFile && (
                      <span className="font-mono text-slate-400 text-[11px]">
                        {(uploadFile.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>

                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <img
                      src={uploadPreview}
                      alt="Uploaded Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tên / Nhãn gợi nhớ ảnh:
                    </label>
                    <input
                      type="text"
                      value={uploadAssetName}
                      onChange={(e) => setUploadAssetName(e.target.value)}
                      placeholder="VD: Thumbnail_Tap_10_Ban_Chuan"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-sky-500"
                    />
                  </div>

                  {uploadError && (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={handlePerformUpload}
                      className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang lưu trữ & áp dụng...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Lưu vào kho & Chọn làm ảnh đại diện</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => {
                        setUploadFile(null);
                        setUploadPreview(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: AI AUTO-GENERATE FROM REFERENCE IMAGES */}
          {/* ============================================================== */}
          {tab === 'generate' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left config column */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Step 1: Select Reference Images */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-400" />
                        <span>Ảnh Đính Kèm Tham Khảo Đã Chọn ({selectedRefUrls.length})</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Nhấp vào ảnh để bật/tắt làm mẫu tham khảo
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {charRefs.map((ref) => {
                        const imgUrl = ref.image || ref.thumbnail || '';
                        const isSelected = selectedRefUrls.includes(imgUrl);
                        return (
                          <div
                            key={ref.id}
                            onClick={() => toggleRefSelection(imgUrl)}
                            className={`group relative rounded-lg border overflow-hidden cursor-pointer transition-all aspect-square bg-slate-900 ${
                              isSelected
                                ? 'border-amber-400 ring-2 ring-amber-400/50'
                                : 'border-slate-800 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt={ref.characterId}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-1 right-1">
                              {isSelected ? (
                                <div className="p-0.5 rounded-full bg-amber-500 text-slate-950">
                                  <CheckSquare className="w-3 h-3 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="p-0.5 rounded-full bg-slate-900/80 text-slate-400">
                                  <Square className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 px-1 py-0.5 text-[9px] text-white truncate text-center font-semibold">
                              {ref.characterId}
                            </div>
                          </div>
                        );
                      })}
                      {projectRefs.map((ref) => {
                        const imgUrl = ref.uri || ref.thumbnail || '';
                        const isSelected = selectedRefUrls.includes(imgUrl);
                        return (
                          <div
                            key={ref.id}
                            onClick={() => toggleRefSelection(imgUrl)}
                            className={`group relative rounded-lg border overflow-hidden cursor-pointer transition-all aspect-square bg-slate-900 ${
                              isSelected
                                ? 'border-amber-400 ring-2 ring-amber-400/50'
                                : 'border-slate-800 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt={ref.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-1 right-1">
                              {isSelected ? (
                                <div className="p-0.5 rounded-full bg-amber-500 text-slate-950">
                                  <CheckSquare className="w-3 h-3 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="p-0.5 rounded-full bg-slate-900/80 text-slate-400">
                                  <Square className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 px-1 py-0.5 text-[9px] text-white truncate text-center font-semibold">
                              {ref.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Generation Options & Prompt */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Tỷ lệ khung hình:
                        </label>
                        <select
                          value={genRatio}
                          onChange={(e) => setGenRatio(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
                        >
                          <option value="16:9">16:9 (Chuẩn YouTube Thumbnail)</option>
                          <option value="1:1">1:1 (Chuẩn Vuông Facebook Post)</option>
                          <option value="4:3">4:3 (Chuẩn Màn hình Cổ điển)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Tông màu & Không khí:
                        </label>
                        <select
                          value={genTheme}
                          onChange={(e) => setGenTheme(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
                        >
                          <option value="Tết Trung Thu gia đình lung linh">Lễ hội Trung Thu ấm cúng</option>
                          <option value="3D Animation Pixar rực rỡ vui tươi">Hoạt hình 3D Pixar rực rỡ</option>
                          <option value="Khoảnh khắc hài hước dí dỏm">Hài hước vui nhộn (Funny)</option>
                          <option value="Ấm áp buổi tối gia đình đoàn viên">Gia đình sum vầy buổi tối</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Mô tả chi tiết khung cảnh (Prompt):
                      </label>
                      <textarea
                        rows={3}
                        value={genPrompt}
                        onChange={(e) => setGenPrompt(e.target.value)}
                        placeholder="Mô tả các nhân vật, nét mặt biểu cảm, đạo cụ cầm tay và ánh sáng..."
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={handleGenerateThumbnail}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 disabled:opacity-50 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Đang tạo ảnh tự động...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          <span>Tạo Tự Động Bằng AI Từ Các Ảnh Tham Khảo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right preview column */}
                <div className="lg:col-span-5 flex flex-col">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Kết Quả Ảnh Đại Diện AI</span>
                      </h4>

                      <div
                        className={`w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center relative ${
                          genRatio === '1:1' ? 'aspect-square' : genRatio === '4:3' ? 'aspect-4/3' : 'aspect-video'
                        }`}
                      >
                        {isGenerating && (
                          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-10">
                            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-2" />
                            <p className="text-xs font-semibold text-white">{genStatusText}</p>
                            <span className="text-[10px] text-slate-400 mt-1">
                              Đang tổng hợp thông tin từ {selectedRefUrls.length} ảnh mẫu
                            </span>
                          </div>
                        )}

                        {generatedPreviewUrl ? (
                          <img
                            src={generatedPreviewUrl}
                            alt="Generated Thumbnail"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-center p-6 text-slate-500">
                            <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                            <p className="text-xs font-semibold text-slate-400">Chưa có ảnh được tạo</p>
                            <p className="text-[11px] text-slate-600 mt-1">
                              Nhấp &quot;Tạo Tự Động Bằng AI&quot; để sinh ảnh đại diện sắc nét
                            </p>
                          </div>
                        )}
                      </div>

                      {genError && (
                        <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{genError}</span>
                        </div>
                      )}
                    </div>

                    {generatedPreviewUrl && (
                      <div className="space-y-2 pt-2">
                        <button
                          type="button"
                          onClick={handleApplyGenerated}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                        >
                          <Check className="w-4 h-4" />
                          <span>Áp dụng ảnh này làm ảnh đại diện</span>
                        </button>
                        <button
                          type="button"
                          disabled={isGenerating}
                          onClick={handleGenerateThumbnail}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Tạo lại biến thể khác</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: VIDEOS (FOR VIDEO ASSET TYPE) */}
          {/* ============================================================== */}
          {tab === 'videos' && (
            <div className="space-y-3">
              {videoAssetCandidates.map((v) => {
                const isSelected = currentAssetId === v.id || currentUrl === v.url;
                return (
                  <div
                    key={v.id}
                    onClick={() => {
                      onSelect(v.id, v.url);
                      onClose();
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-rose-400 bg-rose-950/20 ring-2 ring-rose-400/40'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 mt-0.5 shrink-0">
                        <Film className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{v.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {v.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{v.note}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{v.url}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="p-1 rounded-full bg-rose-500 text-white shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: REFERENCES LIBRARY */}
          {/* ============================================================== */}
          {tab === 'references' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {projectRefs.map((ref) => {
                const isSelected = currentAssetId === ref.id || currentUrl === ref.uri;
                return (
                  <div
                    key={ref.id}
                    onClick={() => {
                      onSelect(ref.id, ref.uri || ref.thumbnail || '');
                      onClose();
                    }}
                    className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all bg-slate-950 ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/40'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="aspect-video bg-slate-900 overflow-hidden relative">
                      <img
                        src={ref.thumbnail || ref.uri}
                        alt={ref.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-amber-500 text-slate-950 shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="p-2 text-[11px]">
                      <div className="font-semibold text-slate-200 truncate">{ref.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{ref.type}</div>
                    </div>
                  </div>
                );
              })}

              {charRefs.map((ref) => {
                const isSelected = currentAssetId === ref.id || currentUrl === ref.image;
                return (
                  <div
                    key={ref.id}
                    onClick={() => {
                      onSelect(ref.id, ref.image || ref.thumbnail || '');
                      onClose();
                    }}
                    className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all bg-slate-950 ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/40'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="aspect-square bg-slate-900 overflow-hidden relative">
                      <img
                        src={ref.thumbnail || ref.image}
                        alt={ref.description || ref.id}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-amber-500 text-slate-950 shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="p-2 text-[11px]">
                      <div className="font-semibold text-slate-200 truncate">
                        {ref.type} — {ref.characterId}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">Nhân vật tham chiếu</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: STORYBOARD SHOTS */}
          {/* ============================================================== */}
          {tab === 'shots' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {shotImages.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 text-sm">
                  Chưa có khung hình Storyboard nào được kết xuất hình ảnh.
                </div>
              ) : (
                shotImages.map((shot) => {
                  const isSelected = currentAssetId === shot.id || currentUrl === shot.url;
                  return (
                    <div
                      key={shot.id}
                      onClick={() => {
                        onSelect(shot.id, shot.url);
                        onClose();
                      }}
                      className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all bg-slate-950 ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-400/40'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="aspect-video bg-slate-900 overflow-hidden relative">
                        <img
                          src={shot.url}
                          alt={shot.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-amber-500 text-slate-950 shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-amber-300">
                          {shot.shotCode}
                        </span>
                      </div>
                      <div className="p-2 text-[11px]">
                        <div className="font-semibold text-slate-200 truncate">{shot.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">Keyframe Storyboard</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: CUSTOM URL INPUT */}
          {/* ============================================================== */}
          {tab === 'custom' && (
            <div className="max-w-md mx-auto py-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mã định danh Asset ID (tùy chọn):
                </label>
                <input
                  type="text"
                  value={customAssetId}
                  onChange={(e) => setCustomAssetId(e.target.value)}
                  placeholder={assetType === 'video' ? 'asset_video_custom_001' : 'asset_img_custom_001'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-amber-500 font-mono mb-3"
                />

                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {assetType === 'video'
                    ? 'Đường dẫn Video (URL, file MP4 cục bộ, YouTube hoặc CapCut export):'
                    : 'Đường dẫn ảnh (URL hoặc đường dẫn cục bộ):'}
                </label>
                <input
                  type="text"
                  value={customInputUrl}
                  onChange={(e) => setCustomInputUrl(e.target.value)}
                  placeholder={
                    assetType === 'video'
                      ? 'https://storage.../final_ep010.mp4 hoặc https://youtu.be/...'
                      : 'https://example.com/thumbnail.jpg hoặc /storage/...'
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {customInputUrl && assetType === 'image' && (
                <div className="rounded-xl border border-slate-800 p-2 bg-slate-950">
                  <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Xem trước ảnh:</div>
                  <div className="aspect-video rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img
                      src={customInputUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                disabled={!customInputUrl.trim()}
                onClick={() => {
                  const fallbackId =
                    customAssetId.trim() ||
                    (assetType === 'video'
                      ? `asset_video_${Date.now()}`
                      : `asset_img_${Date.now()}`);
                  onSelect(fallbackId, customInputUrl.trim());
                  onClose();
                }}
                className={`w-full py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs transition-colors flex items-center justify-center gap-2 ${
                  assetType === 'video'
                    ? 'bg-rose-500 hover:bg-rose-400 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{assetType === 'video' ? 'Xác nhận sử dụng video này' : 'Xác nhận sử dụng ảnh này'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
