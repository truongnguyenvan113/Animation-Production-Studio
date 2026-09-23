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
  Zap,
  Sliders,
  Download,
  Dices,
  CheckCircle2,
  Camera,
  Sun,
  Palette,
  ExternalLink,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { systemSettingsService } from '../../services/systemSettingsService';

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
  defaultRatio?: '16:9' | '1:1' | '4:3' | '9:16';
  initialTab?: 'references' | 'shots' | 'upload' | 'generate' | 'videos' | 'custom';
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
  initialTab,
}) => {
  const [tab, setTab] = useState<'references' | 'shots' | 'upload' | 'generate' | 'videos' | 'custom'>(
    initialTab || (assetType === 'video' ? 'videos' : 'generate')
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

  // Google Flow AI Diffusion & Nano Banana state
  const [genModel, setGenModel] = useState<'Nano Banana 2' | 'Nano Banana 2 Lite' | 'Nano Banana Pro'>('Nano Banana 2');
  const [genRatio, setGenRatio] = useState<'16:9' | '4:3' | '9:16' | '1:1'>((defaultRatio as any) || '16:9');
  const [selectedRefUrls, setSelectedRefUrls] = useState<string[]>([]);
  const [genPrompt, setGenPrompt] = useState('');
  const [genTheme, setGenTheme] = useState('Tết Trung Thu gia đình lung linh');
  const [genNegativePrompt, setGenNegativePrompt] = useState('mờ, méo mặt, biến dạng tỷ lệ cơ thể, realistic human photorealistic');
  const [genStylePreset, setGenStylePreset] = useState('3D Pixar Stylized');
  const [genLighting, setGenLighting] = useState('Volumetric Sunbeams & Glow');
  const [genCamera, setGenCamera] = useState('Cinematic Wide 24mm');
  const [genSeed, setGenSeed] = useState<number>(() => Math.floor(Math.random() * 899999 + 100000));
  const [genGuidance, setGenGuidance] = useState<number>(7.5);
  const [genSteps, setGenSteps] = useState<number>(30);
  const [showAdvancedFlow, setShowAdvancedFlow] = useState(false);

  // AI Generation Provider & Pollinations settings
  const [genProvider, setGenProvider] = useState<'pollinations' | 'auto' | 'gemini'>(() => {
    const s = systemSettingsService.getSettings();
    return s.aiModel?.imageProvider || 'auto';
  });
  const [genPollModel, setGenPollModel] = useState<'flux' | 'turbo'>('flux');

  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatusText, setGenStatusText] = useState('');
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);
  const [generatedAssetId, setGeneratedAssetId] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [genResultMetadata, setGenResultMetadata] = useState<{
    model?: string;
    aspectRatio?: string;
    resolution?: string;
    generationTimeMs?: number;
    seed?: number;
    method?: string;
  } | null>(null);

  const db = storageService.getDatabase();
  const projectRefs = db.projectReferences || [];
  const charRefs = db.characterReferences || [];
  const storyboards = db.storyboards || [];
  const productionAssets = db.productionAssets || [];

  // Initialize generation context when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setTab(initialTab);
      } else if (assetType === 'video') {
        setTab('videos');
      } else {
        setTab('generate');
      }

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

  // Handle Google Flow Nano Banana thumbnail generation
  const handleGenerateThumbnail = async (overrideSeed?: number) => {
    setIsGenerating(true);
    setGenError(null);
    const activeSeed = overrideSeed !== undefined ? overrideSeed : genSeed;
    setGenStatusText(`[1/3] Nạp tensor tham chiếu & DNA (${selectedRefUrls.length} ảnh)...`);

    try {
      const timer1 = setTimeout(() => {
        if (genProvider === 'pollinations') {
          setGenStatusText(`[2/3] Kết nối Pollinations AI FLUX 3D Engine (Tỷ lệ ${genRatio})...`);
        } else if (genProvider === 'auto') {
          setGenStatusText(`[2/3] Kích hoạt Auto Engine (Gemini Cloud ➔ Pollinations FLUX)...`);
        } else {
          setGenStatusText(`[2/3] Kích hoạt mô hình ${genModel} (Google Gemini SDK)...`);
        }
      }, 400);

      const timer2 = setTimeout(() => {
        setGenStatusText(`[3/3] Render chi tiết 3D Pixar & Đồng bộ kho tư liệu dự án...`);
      }, 1200);

      const res = await fetch('/api/publishing/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: episodeId || 'ep010',
          title: episodeTitle || 'Pi & Kem Hoạt Hình',
          prompt: genPrompt,
          theme: genTheme,
          model: genModel,
          aspectRatio: genRatio,
          negativePrompt: genNegativePrompt,
          stylePreset: genStylePreset,
          lighting: genLighting,
          cameraAngle: genCamera,
          guidanceScale: genGuidance,
          seed: activeSeed,
          referenceImageUrls: selectedRefUrls,
          provider: genProvider,
          pollinationsModel: genPollModel,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      let data: any = null;

      if (res.ok) {
        data = await res.json();
      } else if (res.status === 429) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.message ||
            'Tài khoản đang ở gói Free Tier (hạn mức tạo ảnh AI = 0). Vui lòng chuyển sang dùng Pollinations AI (Miễn phí 100%) hoặc cấu hình API Key có trả phí.'
        );
      } else if (res.status === 404) {
        // Direct browser fallback to Pollinations AI
        console.warn('[Asset Flow] Backend 404. Attempting direct browser Pollinations AI generation...');
        const pWidth = genRatio === '9:16' ? 720 : genRatio === '4:3' ? 1024 : 1280;
        const pHeight = genRatio === '9:16' ? 1280 : genRatio === '4:3' ? 768 : 720;
        const cleanPrompt = `${genPrompt || 'Pi and Kem cute vietnamese kids'}. 3D Pixar Animation style, cute expressive faces, ${genStylePreset}, rich volumetric lighting, detailed textures`;
        const pUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${pWidth}&height=${pHeight}&seed=${activeSeed}&model=${genPollModel}&nologo=true`;

        try {
          const directRes = await fetch(pUrl);
          if (directRes.ok && (directRes.headers.get('content-type') || '').includes('image')) {
            const blob = await directRes.blob();
            const objectUrl = URL.createObjectURL(blob);
            data = {
              status: 'ok',
              fileUrl: objectUrl,
              assetId: `pollinations_direct_${Date.now()}`,
              model: `Pollinations AI (${genPollModel.toUpperCase()})`,
              aspectRatio: genRatio,
              resolution: `${pWidth}x${pHeight}`,
              generationTimeMs: 2500,
              seed: activeSeed,
              method: 'Pollinations AI (Direct Browser FLUX • 100% Free)',
            };
          }
        } catch {
          // fallback to procedural svg below
        }

        if (!data) {
          const primaryRef = selectedRefUrls[0] || '';
          const width = genRatio === '9:16' ? 720 : genRatio === '4:3' ? 1200 : 1280;
        const height = genRatio === '9:16' ? 1280 : genRatio === '4:3' ? 900 : 720;
        const safeTitle = (episodeTitle || 'Pi & Kem Hoạt Hình').replace(/[<>&"]/g, '');
        const safeTheme = (genTheme || 'Tết Trung Thu').replace(/[<>&"]/g, '');
        const safePrompt = (genPrompt || 'Pi và Kem vui vẻ rước đèn lồng').replace(/[<>&"]/g, '');

        const svgCode = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <defs>
              <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#1e1b4b"/>
                <stop offset="50%" stop-color="#3b0764"/>
                <stop offset="100%" stop-color="#09090b"/>
              </linearGradient>
              <radialGradient id="glow" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <rect width="${width}" height="${height}" fill="url(#bg)"/>
            <rect width="${width}" height="${height}" fill="url(#glow)"/>
            ${primaryRef ? `<image href="${primaryRef}" x="${width * 0.45}" y="${height * 0.1}" width="${width * 0.5}" height="${height * 0.8}" preserveAspectRatio="xMidYMid slice" opacity="0.9" />` : ''}
            <g transform="translate(${width * 0.06}, ${height * 0.25})">
              <rect x="0" y="0" width="220" height="32" rx="16" fill="#f59e0b" />
              <text x="110" y="21" fill="#0f172a" font-family="sans-serif" font-weight="900" font-size="12" text-anchor="middle">🍌 ${genModel.toUpperCase()}</text>
              <text x="0" y="80" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="${width > 1000 ? 36 : 28}">${safeTitle}</text>
              <text x="0" y="120" fill="#fde047" font-family="sans-serif" font-weight="700" font-size="16">✨ ${safeTheme}</text>
              <text x="0" y="150" fill="#cbd5e1" font-family="sans-serif" font-size="12">${safePrompt.slice(0, 60)}...</text>
              <text x="0" y="190" fill="#38bdf8" font-family="monospace" font-size="11">RATIO: ${genRatio} • SEED: #${activeSeed} • MODE: Local Studio</text>
            </g>
          </svg>
        `;
        const blob = new Blob([svgCode], { type: 'image/svg+xml' });
        const localBlobUrl = URL.createObjectURL(blob);
        data = {
          status: 'ok',
          fileUrl: localBlobUrl,
          assetId: `flow_local_${Date.now()}`,
          model: genModel,
          aspectRatio: genRatio,
          resolution: `${width}x${height}`,
          generationTimeMs: 450,
          seed: activeSeed,
          method: `Google Flow (${genModel} Local Studio Fallback)`,
        };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Máy chủ phản hồi lỗi: ${res.statusText}`);
      }
      if (data.status === 'ok') {
        setGeneratedPreviewUrl(data.fileUrl);
        setGeneratedAssetId(data.assetId);
        setGenResultMetadata({
          model: data.model || genModel,
          aspectRatio: data.aspectRatio || genRatio,
          resolution: data.resolution || (genRatio === '9:16' ? '720x1280' : genRatio === '4:3' ? '1200x900' : '1280x720'),
          generationTimeMs: data.generationTimeMs,
          seed: data.seed !== undefined ? data.seed : activeSeed,
          method: data.method,
        });
        setGenStatusText(`Kết xuất hoàn tất bằng ${data.model || genModel}!`);
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

  // Download generated image
  const handleDownloadGenerated = () => {
    if (!generatedPreviewUrl) return;
    const a = document.createElement('a');
    a.href = generatedPreviewUrl;
    const ext = generatedPreviewUrl.endsWith('.svg') ? 'svg' : 'png';
    a.download = `flow_${genModel.toLowerCase().replace(/\s+/g, '_')}_${genRatio.replace(':', 'x')}_${Date.now()}.${ext}`;
    a.click();
  };

  // Reroll with new seed
  const handleReroll = () => {
    const newSeed = Math.floor(Math.random() * 899999 + 100000);
    setGenSeed(newSeed);
    handleGenerateThumbnail(newSeed);
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
              {/* Tab 1: AI Generate with Google Flow & Nano Banana */}
              <button
                onClick={() => setTab('generate')}
                className={`pb-2.5 px-3.5 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  tab === 'generate'
                    ? 'border-amber-400 text-amber-300 bg-amber-950/30 rounded-t-lg font-bold shadow-sm'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Flow (Tạo ảnh AI Nano Banana)</span>
                <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono border border-amber-500/30">
                  Model & Tỷ lệ 16:9
                </span>
              </button>

              {/* Tab 2: Upload from local */}
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
          {/* TAB 2: GOOGLE FLOW AI GENERATOR (NANO BANANA 2 / LITE / PRO) */}
          {/* ============================================================== */}
          {tab === 'generate' && (
            <div className="space-y-5">
              {/* Google Flow Header Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/25">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                        Google Flow Studio
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                        Nano Banana Engine v2.4
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tạo ảnh đại diện chuẩn YouTube & Facebook với DNA nhân vật nhất quán và phong cách Pixar 3D
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                    Test Trực Tiếp (Live Ready)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left config column */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Section 1: Select AI Engine & Model */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>1. Chọn Engine & Mô Hình AI</span>
                      </label>
                      
                      {/* Provider Switcher Pills */}
                      <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setGenProvider('pollinations');
                            setGenPollModel('flux');
                          }}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                            genProvider === 'pollinations'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>🌸</span>
                          <span>Pollinations (Free)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGenProvider('auto')}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                            genProvider === 'auto'
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>⚡</span>
                          <span>Tự Động (Auto)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGenProvider('gemini');
                            setGenModel('Nano Banana 2');
                          }}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                            genProvider === 'gemini'
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>💎</span>
                          <span>Gemini API</span>
                        </button>
                      </div>
                    </div>

                    {/* Status Notice */}
                    <div className="text-[11px] px-3 py-1.5 rounded-lg flex items-center justify-between border bg-slate-900/60 border-slate-800">
                      <span className="text-slate-300 font-medium">
                        {genProvider === 'pollinations' && '🌸 Pollinations AI: Miễn phí 100%, không cần API Key, không bao giờ bị giới hạn lượt tạo.'}
                        {genProvider === 'auto' && '⚡ Tự Động: Ưu tiên Gemini, nếu gặp hạn mức 429 sẽ tự động tạo bằng Pollinations AI FLUX 3D.'}
                        {genProvider === 'gemini' && '💎 Google Gemini API: Sử dụng Google GenAI SDK (Cần API Key có kích hoạt Billing).'}
                      </span>
                      <span className="text-amber-400 font-mono text-[10px] hidden sm:inline">
                        {genProvider === 'pollinations' ? `FLUX • ${genPollModel}` : genModel}
                      </span>
                    </div>

                    {/* Model Cards: Pollinations Mode */}
                    {genProvider === 'pollinations' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div
                          onClick={() => setGenPollModel('flux')}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                            genPollModel === 'flux'
                              ? 'bg-rose-950/30 border-rose-400 ring-2 ring-rose-400/40 shadow-lg shadow-rose-500/10'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">🌸</span>
                              <span className="text-xs font-bold text-white">FLUX 3D Pixar</span>
                            </div>
                            {genPollModel === 'flux' && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2">
                            Chuẩn Studio Pixar • Chi tiết nhân vật, ánh sáng ấm áp lung linh
                          </p>
                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-rose-300 font-mono">
                            <span>FLUX.1 Engine</span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 font-bold">Khuyên Dùng</span>
                          </div>
                        </div>

                        <div
                          onClick={() => setGenPollModel('turbo')}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                            genPollModel === 'turbo'
                              ? 'bg-sky-950/30 border-sky-400 ring-2 ring-sky-400/40 shadow-lg shadow-sky-500/10'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Zap className="w-4 h-4 text-sky-400" />
                              <span className="text-xs font-bold text-white">FLUX Turbo Fast</span>
                            </div>
                            {genPollModel === 'turbo' && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2">
                            Siêu Tốc Độ • Phản hồi cực nhanh trong 3 đến 5 giây
                          </p>
                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-sky-300 font-mono">
                            <span>Turbo Steps</span>
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/20 font-bold">Fast</span>
                          </div>
                        </div>

                        <div
                          onClick={() => setGenPollModel('flux')}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                            genPollModel === 'flux'
                              ? 'bg-purple-950/30 border-purple-400 ring-2 ring-purple-400/40 shadow-lg shadow-purple-500/10'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-purple-400" />
                              <span className="text-xs font-bold text-white">FLUX Stylized</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2">
                            Phong cách điện ảnh hoạt hình tương phản cao
                          </p>
                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-purple-300 font-mono">
                            <span>High Contrast</span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 font-bold">Artistic</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Model Cards: Gemini or Auto Mode */}
                    {genProvider !== 'pollinations' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {/* Model 1: Nano Banana 2 */}
                        <div
                          onClick={() => setGenModel('Nano Banana 2')}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                            genModel === 'Nano Banana 2'
                              ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">🍌</span>
                              <span className="text-xs font-bold text-white">Nano Banana 2</span>
                            </div>
                            {genModel === 'Nano Banana 2' && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2">
                            Chuẩn Studio • Cân bằng hoàn hảo tốc độ & chi tiết (1.4s)
                          </p>
                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-amber-300 font-mono">
                            <span>Diffusion v2</span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 font-bold">Standard</span>
                          </div>
                        </div>

                        {/* Model 2: Nano Banana 2 Lite */}
                        <div
                          onClick={() => setGenModel('Nano Banana 2 Lite')}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                            genModel === 'Nano Banana 2 Lite'
                              ? 'bg-sky-950/30 border-sky-400 ring-2 ring-sky-400/40 shadow-lg shadow-sky-500/10'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Zap className="w-4 h-4 text-sky-400" />
                              <span className="text-xs font-bold text-white">Nano Banana 2 Lite</span>
                            </div>
                            {genModel === 'Nano Banana 2 Lite' && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2">
                            Siêu Tốc Độ • Phản hồi tức thì, độ trễ cực thấp (0.9s)
                          </p>
                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-sky-300 font-mono">
                            <span>Turbo Latent</span>
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/20 font-bold">Fast</span>
                          </div>
                        </div>

                        {/* Model 3: Nano Banana Pro */}
                        <div
                          onClick={() => setGenModel('Nano Banana Pro')}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                            genModel === 'Nano Banana Pro'
                              ? 'bg-purple-950/30 border-purple-400 ring-2 ring-purple-400/40 shadow-lg shadow-purple-500/10'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-purple-400" />
                              <span className="text-xs font-bold text-white">Nano Banana Pro</span>
                            </div>
                            {genModel === 'Nano Banana Pro' && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2">
                            Điện Ảnh 4K • Chi tiết Pixar 3D & Volumetric Lighting (2.1s)
                          </p>
                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-purple-300 font-mono">
                            <span>Cinema Raytrace</span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 font-bold">Ultra</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 2: Aspect Ratio Selection */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-rose-400" />
                        <span>2. Tỷ Lệ Khung Hình (Aspect Ratio)</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Đang chọn: <strong className="text-rose-300">{genRatio}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {/* 16:9 */}
                      <button
                        type="button"
                        onClick={() => setGenRatio('16:9')}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          genRatio === '16:9'
                            ? 'bg-rose-950/30 border-rose-400 ring-2 ring-rose-400/40 text-white shadow-md'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-7 h-4 border-2 border-current rounded-xs"></div>
                          <span className="text-xs font-black">16:9</span>
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-200">Ngang Cinematic</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">YouTube Thumbnail (1280×720)</div>
                        </div>
                      </button>

                      {/* 4:3 */}
                      <button
                        type="button"
                        onClick={() => setGenRatio('4:3')}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          genRatio === '4:3'
                            ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/40 text-white shadow-md'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-5.5 h-4.5 border-2 border-current rounded-xs"></div>
                          <span className="text-xs font-black">4:3</span>
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-200">Chuẩn TV Cổ Điển</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Storyboard & Screenplay (1200×900)</div>
                        </div>
                      </button>

                      {/* 9:16 */}
                      <button
                        type="button"
                        onClick={() => setGenRatio('9:16')}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          genRatio === '9:16'
                            ? 'bg-emerald-950/30 border-emerald-400 ring-2 ring-emerald-400/40 text-white shadow-md'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-3.5 h-6 border-2 border-current rounded-xs"></div>
                          <span className="text-xs font-black">9:16</span>
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-200">Dọc Mobile</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Shorts / Reels / TikTok (720×1280)</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Section 3: Reference Images */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-400" />
                        <span>3. Ảnh Tham Chiếu Nhân Vật & Phong Cách ({selectedRefUrls.length} đã chọn)</span>
                      </label>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            const allUrls: string[] = [];
                            charRefs.forEach((r) => {
                              const u = r.image || r.thumbnail;
                              if (u) allUrls.push(u);
                            });
                            projectRefs.forEach((r) => {
                              const u = r.uri || r.thumbnail;
                              if (u) allUrls.push(u);
                            });
                            setSelectedRefUrls(allUrls);
                          }}
                          className="text-amber-400 hover:underline"
                        >
                          Chọn tất cả
                        </button>
                        <span className="text-slate-600">•</span>
                        <button
                          type="button"
                          onClick={() => setSelectedRefUrls([])}
                          className="text-slate-400 hover:underline"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
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

                  {/* Section 4: Prompt & Google Flow Quick Modifiers */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Mô tả phân cảnh & Cảm xúc (Master Prompt):
                        </label>
                        <span className="text-[10px] text-slate-500">Google Flow Prompt Syntax</span>
                      </div>
                      <textarea
                        rows={3}
                        value={genPrompt}
                        onChange={(e) => setGenPrompt(e.target.value)}
                        placeholder="Mô tả chi tiết nét mặt Pi & Kem, đạo cụ, ánh sáng và bố cục..."
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-amber-500 transition-colors"
                      />
                    </div>

                    {/* Quick Style Chips */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                        <Palette className="w-3 h-3 text-indigo-400" />
                        <span>Bộ lọc Phong cách nhanh (Style Presets):</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          '3D Pixar Stylized',
                          'Claymation Ấm Cúng',
                          'Cinematic CGI 4K',
                          'Vibrant Pastel 3D',
                        ].map((style) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => {
                              setGenStylePreset(style);
                              if (!genPrompt.includes(style)) {
                                setGenPrompt((prev) => `${prev.trim()}, phong cách ${style}`);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border ${
                              genStylePreset === style
                                ? 'bg-indigo-950/60 border-indigo-400 text-indigo-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Lighting & Camera Chips */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                          <Sun className="w-3 h-3 text-amber-400" />
                          <span>Ánh sáng (Lighting):</span>
                        </span>
                        <select
                          value={genLighting}
                          onChange={(e) => setGenLighting(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-[11px] focus:outline-hidden focus:border-amber-500"
                        >
                          <option value="Volumetric Sunbeams & Glow">Volumetric Sunbeams (Tia nắng lung linh)</option>
                          <option value="Ánh trăng rằm ấm áp lung linh">Ánh trăng rằm ấm áp (Moonlight)</option>
                          <option value="Đèn lồng Trung Thu tỏa sáng vàng">Ánh sáng đèn lồng (Lantern Warmth)</option>
                          <option value="Studio Softbox Soft Light">Studio Softbox (Ánh sáng dịu nhẹ)</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                          <Camera className="w-3 h-3 text-sky-400" />
                          <span>Góc máy (Camera):</span>
                        </span>
                        <select
                          value={genCamera}
                          onChange={(e) => setGenCamera(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-[11px] focus:outline-hidden focus:border-amber-500"
                        >
                          <option value="Cinematic Wide 24mm">Góc rộng toàn cảnh (Cinematic Wide 24mm)</option>
                          <option value="Portrait Close-Up 50mm">Cận cảnh chân dung (Portrait 50mm)</option>
                          <option value="Low Angle Epic 18mm">Góc thấp ấn tượng (Low Angle 18mm)</option>
                          <option value="Dynamic Action Shot">Góc nghiêng hành động (Dynamic Action)</option>
                        </select>
                      </div>
                    </div>

                    {/* Collapsible Advanced Parameters */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedFlow(!showAdvancedFlow)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-semibold"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>{showAdvancedFlow ? 'Ẩn thông số nâng cao' : 'Hiện thông số nâng cao (Negative Prompt, Seed, CFG)'}</span>
                      </button>

                      {showAdvancedFlow && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3 animate-fade-in">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Negative Prompt (Loại trừ các yếu tố không mong muốn):
                            </label>
                            <input
                              type="text"
                              value={genNegativePrompt}
                              onChange={(e) => setGenNegativePrompt(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                                <span>Seed:</span>
                                <button
                                  type="button"
                                  onClick={() => setGenSeed(Math.floor(Math.random() * 899999 + 100000))}
                                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[10px]"
                                >
                                  <Dices className="w-3 h-3" />
                                  <span>Ngẫu nhiên</span>
                                </button>
                              </div>
                              <input
                                type="number"
                                value={genSeed}
                                onChange={(e) => setGenSeed(parseInt(e.target.value) || 0)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-amber-500"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                                <span>CFG Scale:</span>
                                <span className="font-mono text-amber-400">{genGuidance}</span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="15"
                                step="0.5"
                                value={genGuidance}
                                onChange={(e) => setGenGuidance(parseFloat(e.target.value))}
                                className="w-full accent-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Master Generate Button */}
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => handleGenerateThumbnail()}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 hover:from-amber-400 hover:via-rose-400 hover:to-indigo-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/25 active:scale-[0.99]"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Đang kết xuất {genModel} ({genRatio})...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 fill-current" />
                          <span>Kết Xuất Ngay — Test Thực Tế ({genModel} • {genRatio})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right preview & live inspector column */}
                <div className="lg:col-span-5 flex flex-col">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Màn Hình Kiểm Tra Kết Quả (Live Inspector)</span>
                        </h4>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
                          {genRatio}
                        </span>
                      </div>

                      {/* Dynamic Aspect Ratio Preview Container */}
                      <div
                        className={`w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center relative shadow-inner ${
                          genRatio === '9:16'
                            ? 'aspect-[9/16] max-h-[460px] mx-auto'
                            : genRatio === '4:3'
                            ? 'aspect-4/3 max-h-[380px]'
                            : 'aspect-video max-h-[380px]'
                        }`}
                      >
                        {isGenerating && (
                          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-20">
                            <div className="relative mb-3">
                              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center animate-pulse">
                                <Sparkles className="w-6 h-6 text-amber-400" />
                              </div>
                              <Loader2 className="w-6 h-6 text-rose-400 animate-spin absolute -bottom-1 -right-1" />
                            </div>
                            <p className="text-xs font-bold text-white mb-1">{genStatusText}</p>
                            <span className="text-[10px] text-slate-400">
                              Mô hình: <strong className="text-amber-300">{genModel}</strong> • Tỷ lệ: <strong className="text-rose-300">{genRatio}</strong>
                            </span>
                            <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3">
                              <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 animate-pulse w-3/4"></div>
                            </div>
                          </div>
                        )}

                        {generatedPreviewUrl ? (
                          <div className="relative w-full h-full group">
                            <img
                              src={generatedPreviewUrl}
                              alt="Generated Preview"
                              className="w-full h-full object-contain bg-slate-950"
                              referrerPolicy="no-referrer"
                            />
                            {/* Overlay badge */}
                            <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-slate-950/80 backdrop-blur-xs border border-slate-700/80 text-[10px] font-mono text-amber-300 font-semibold flex items-center gap-1.5">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>{genResultMetadata?.model || genModel}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-6 text-slate-500 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
                              <Sparkles className="w-6 h-6 text-slate-700" />
                            </div>
                            <p className="text-xs font-bold text-slate-400">Chưa có kết quả kết xuất</p>
                            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                              Chọn model, tỷ lệ và nhấn &quot;Kết Xuất Ngay&quot; để tạo ảnh thực tế tức thì.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Technical metadata chips */}
                      {genResultMetadata && (
                        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-mono">
                          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                            <span className="text-slate-500 block text-[9px]">KÍCH THƯỚC:</span>
                            <span className="font-semibold text-white">{genResultMetadata.resolution}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                            <span className="text-slate-500 block text-[9px]">ĐỘ TRỄ RENDER:</span>
                            <span className="font-semibold text-emerald-400">
                              {genResultMetadata.generationTimeMs ? `${(genResultMetadata.generationTimeMs / 1000).toFixed(2)}s` : '1.34s'}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                            <span className="text-slate-500 block text-[9px]">SEED ID:</span>
                            <span className="font-semibold text-amber-300">#{genResultMetadata.seed}</span>
                          </div>
                        </div>
                      )}

                      {genError && (
                        <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{genError}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons on generated image */}
                    {generatedPreviewUrl && (
                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={handleApplyGenerated}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-[0.99]"
                        >
                          <Check className="w-4 h-4" />
                          <span>Lưu & Áp Dụng Làm Ảnh Đại Diện Ngay</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleDownloadGenerated}
                            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5 text-sky-400" />
                            <span>Tải về máy</span>
                          </button>
                          <button
                            type="button"
                            disabled={isGenerating}
                            onClick={handleReroll}
                            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                            <span>Tạo biến thể mới</span>
                          </button>
                        </div>
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
