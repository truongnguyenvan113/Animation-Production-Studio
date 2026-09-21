import React, { useState, useEffect, useMemo } from 'react';
import {
  Shot,
  Episode,
  ProductionPack,
  FlowGenerationJob,
  ProductionAsset,
  ProviderExecutionMode,
} from '../../types';
import { storageService } from '../../services/storageService';
import { googleFlowDirector } from '../../services/googleFlowDirector';
import { FlowPromptCompiler } from '../../services/flowPromptCompiler';
import {
  Sparkles,
  ShieldCheck,
  Layers,
  Copy,
  Check,
  Download,
  Upload,
  AlertTriangle,
  FileCode,
  X,
  ExternalLink,
  Play,
  Clock,
  Eye,
  Sliders,
  CheckCircle2,
  Lock,
  Compass,
} from 'lucide-react';

interface GoogleFlowDirectorModalProps {
  shot: Shot;
  episodeId?: string;
  storyboardId?: string;
  onClose: () => void;
  onAssetUpdated?: () => void;
}

export const GoogleFlowDirectorModal: React.FC<GoogleFlowDirectorModalProps> = ({
  shot,
  episodeId = 'ep_009',
  storyboardId,
  onClose,
  onAssetUpdated,
}) => {
  const [db, setDb] = useState(() => storageService.getDatabase());
  const [pack, setPack] = useState<ProductionPack | null>(null);
  const [activeJob, setActiveJob] = useState<FlowGenerationJob | null>(null);
  const [executionMode, setExecutionMode] = useState<ProviderExecutionMode>('ASSISTED_FLOW');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedPack, setCopiedPack] = useState(false);
  const [isExecutingLocal, setIsExecutingLocal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importMime, setImportMime] = useState('image/jpeg');
  const [importWidth, setImportWidth] = useState(1376);
  const [importHeight, setImportHeight] = useState(768);
  const [importFileSize, setImportFileSize] = useState(803212);
  const [importDuration, setImportDuration] = useState<number | undefined>(undefined);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'flow' | 'prompt' | 'dna' | 'refs' | 'provenance'>('flow');

  // Load or compile Production Pack
  useEffect(() => {
    try {
      const compiled = googleFlowDirector.prepareProductionPack(shot, {
        episodeId,
        storyboardId,
        customExecutionMode: executionMode,
      });
      setPack(compiled);

      // Check if job exists for this pack
      const existingJobs = googleFlowDirector.getJobsForShot(shot.id);
      if (existingJobs.length > 0) {
        setActiveJob(existingJobs[0]);
        setExecutionMode(existingJobs[0].execution_mode);
      } else {
        const newJob = googleFlowDirector.createFlowJob(compiled, executionMode);
        setActiveJob(newJob);
      }
    } catch (e: any) {
      console.error('Error preparing production pack:', e);
    }
  }, [shot.id, executionMode]);

  // Subscribe to DB changes
  useEffect(() => {
    return storageService.subscribe(() => {
      setDb(storageService.getDatabase());
    });
  }, []);

  const fullPrompt = useMemo(() => {
    if (!pack) return '';
    return FlowPromptCompiler.compile(pack);
  }, [pack]);

  const latestAsset: ProductionAsset | undefined = useMemo(() => {
    const assets = googleFlowDirector.getAssetsForShot(shot.id);
    return assets[0];
  }, [shot.id, db]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(fullPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyPackJson = () => {
    if (!pack) return;
    navigator.clipboard.writeText(JSON.stringify(pack, null, 2));
    setCopiedPack(true);
    setTimeout(() => setCopiedPack(false), 2000);
  };

  const handleDownloadPack = () => {
    if (!pack) return;
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ProductionPack_${pack.shot_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Run Local Asset Preview
  const handleRunLocalAsset = async () => {
    if (!activeJob) return;
    setIsExecutingLocal(true);
    try {
      // Ensure job has LOCAL_ASSET mode
      activeJob.execution_mode = 'LOCAL_ASSET';
      await googleFlowDirector.executeLocalAsset(activeJob.job_id);
      if (onAssetUpdated) onAssetUpdated();
    } catch (err: any) {
      alert(`Lỗi thực thi Local Asset: ${err.message}`);
    } finally {
      setIsExecutingLocal(false);
    }
  };

  // Handle Asset Import
  const handleImportAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob) return;
    setImportError(null);
    setIsImporting(true);

    try {
      await googleFlowDirector.importGoogleFlowAsset({
        jobId: activeJob.job_id,
        fileUrl: importUrl || `/assets/aistudio/renders/episodes/${episodeId}/shots/${shot.id}/${shot.id}.jpg`,
        mimeType: importMime,
        width: Number(importWidth),
        height: Number(importHeight),
        fileSize: Number(importFileSize),
        durationSeconds: importMime === 'video/mp4' ? Number(importDuration) : undefined,
        sourceFileName: `google_flow_render_${shot.id}.${importMime === 'video/mp4' ? 'mp4' : 'jpg'}`,
      });

      setShowImportModal(false);
      setImportUrl('');
      if (onAssetUpdated) onAssetUpdated();
    } catch (err: any) {
      setImportError(err.message || 'Không thể nhập tệp');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        id="modal-google-flow-director"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold tracking-tight">Google Flow Director</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Phase 4.7 Production Engine
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {shot.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cảnh #{shot.sceneNumber} &bull; Shot #{shot.shotNumber} &bull; {shot.shotType} ({shot.durationSeconds}s) &bull; Bố cục: {shot.framing}
              </p>
            </div>
          </div>

          <button
            id="btn-close-flow-director"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs overflow-x-auto">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('flow')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'flow'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Điều Phối Sản Xuất (Flow Director)
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'prompt'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Prompt 14 Phần Chuẩn
            </button>
            <button
              onClick={() => setActiveTab('dna')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'dna'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Khóa DNA & Style (Source of Truth)
            </button>
            <button
              onClick={() => setActiveTab('refs')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'refs'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Tài Liệu Tham Chiếu ({pack?.references.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('provenance')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'provenance'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Audit & Provenance QA
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1 shadow-2xs"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedPrompt ? 'Đã chép Prompt' : 'Chép Prompt'}
            </button>
            <button
              type="button"
              onClick={handleDownloadPack}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất Pack JSON
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'flow' && (
            <div className="space-y-6">
              {/* Execution Mode Classification Notice */}
              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      Phương thức thực thi (Execution Mode):
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                        executionMode === 'ASSISTED_FLOW'
                          ? 'bg-indigo-900/60 text-indigo-200 border-indigo-500/40'
                          : 'bg-blue-900/60 text-blue-200 border-blue-500/40'
                      }`}
                    >
                      {executionMode === 'ASSISTED_FLOW'
                        ? 'ASSISTED GOOGLE FLOW EXECUTION'
                        : 'LOCAL DEVELOPMENT ASSET (PREVIEW)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    {executionMode === 'ASSISTED_FLOW'
                      ? 'Quy trình chuẩn bị gói sản xuất (Production Pack) để thực hiện trên Google Flow Studio, sau đó nhập kết quả vào hệ thống với kiểm chứng nguồn gốc (provenance).'
                      : 'Chế độ sử dụng khung hình kết xuất cục bộ (Local Asset) phục vụ kiểm thử giao diện và phát triển offline.'}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExecutionMode('ASSISTED_FLOW')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      executionMode === 'ASSISTED_FLOW'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Google Flow Assisted
                  </button>
                  <button
                    type="button"
                    onClick={() => setExecutionMode('LOCAL_ASSET')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      executionMode === 'LOCAL_ASSET'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Local Asset Preview
                  </button>
                </div>
              </div>

              {/* Action Staging Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Card: Flow Instructions & Export */}
                <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Quy Trình Google Flow
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">
                      ID: {pack?.pack_id}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2.5">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <strong className="text-slate-800 block">Sao chép Prompt 14 phần đã khóa</strong>
                        Prompt bao gồm đầy đủ DNA nhân vật bất biến (Kem tóc húi cua cực ngắn, Mẹ Vân v1), quy tắc 16:9 và vùng an toàn 9:16 Shorts.
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        <strong className="text-slate-800 block">Mở Google Flow Studio</strong>
                        Chuyển sang workspace sáng tạo của Google Flow và dán prompt cùng tài liệu tham chiếu đính kèm.
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        <strong className="text-slate-800 block">Nhập Kết Quả & Kiểm Định QA</strong>
                        Nhập tệp hình ảnh (JPEG/PNG) hoặc video (MP4) kết xuất từ Flow để lưu trữ xuất xứ và bàn giao sang QA.
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <a
                      href="https://labs.google/flow"
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Mở Google Flow Studio
                    </a>

                    <button
                      type="button"
                      onClick={() => setShowImportModal(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Nhập Kết Quả Flow (Import Asset)
                    </button>
                  </div>
                </div>

                {/* Right Card: Current Active Frame & Local Asset Fallback */}
                <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-emerald-600" />
                        Khung Hình Hiện Tại Của Shot
                      </h4>
                      {latestAsset ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                          {latestAsset.execution_mode}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">Chưa có kết xuất</span>
                      )}
                    </div>

                    {/* Frame Preview Display */}
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
                      {shot.activeImageOutputUrl ? (
                        <img
                          src={shot.activeImageOutputUrl}
                          alt={shot.id}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4 text-slate-500 text-xs">
                          Chưa có khung hình cho shot này
                        </div>
                      )}

                      {shot.activeImageOutputUrl && (
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950/80 text-white border border-white/20">
                            {latestAsset?.execution_mode === 'LOCAL_ASSET'
                              ? 'LOCAL DEVELOPMENT ASSET'
                              : latestAsset?.execution_mode === 'ASSISTED_FLOW'
                              ? 'GOOGLE FLOW IMPORTED'
                              : 'PREVIEW'}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                            {shot.outputMimeType?.toUpperCase() || 'JPEG'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Hoặc thực thi bản xem trước cục bộ:
                    </span>
                    <button
                      type="button"
                      onClick={handleRunLocalAsset}
                      disabled={isExecutingLocal}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3 h-3 text-blue-600" />
                      {isExecutingLocal ? 'Đang nạp...' : 'Nạp Local Preview'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Effective Settings Precedence Resolution Panel */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Chuỗi Thứ Bậc Kế Thừa Cài Đặt (Effective Settings Precedence)
                </h4>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {pack?.effective_settings.appliedHierarchy.map((lvl, i) => (
                    <React.Fragment key={lvl}>
                      <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 shadow-2xs">
                        {lvl}
                      </span>
                      {i < pack.effective_settings.appliedHierarchy.length - 1 && (
                        <span className="text-slate-400 font-bold">&rarr;</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tỷ lệ khung hình</span>
                    <span className="font-bold text-slate-800">16:9 (Chuẩn điện ảnh)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Shorts-Safe Crop</span>
                    <span className="font-bold text-emerald-700">9:16 Cắt Dọc An Toàn</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Vùng an toàn</span>
                    <span className="font-bold text-slate-800">CENTER (33% - 66%)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Độ phân giải đích</span>
                    <span className="font-bold text-slate-800">{pack?.effective_settings.defaultResolution || '1376x768'}</span>
                  </div>
                </div>

                <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    <strong>Bảo Toàn Bất Biến:</strong> Cài đặt hệ thống chỉ chi phối tham số môi trường và bố cục. Bản sắc nhân vật (Character DNA) và phong cách nghệ thuật (Style DNA) là Source of Truth tối cao và không bao giờ bị ghi đè.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROMPT */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Google Flow Prompt Đầy Đủ (14 Phần)</h4>
                  <p className="text-xs text-slate-500">Được biên dịch tất định từ Production Pack, kiểm soát chặt chẽ từng chiều kích thị giác.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPrompt ? 'Đã sao chép' : 'Sao chép toàn bộ Prompt'}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 max-h-[55vh] leading-relaxed whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                {fullPrompt}
              </div>
            </div>
          )}

          {/* TAB 3: DNA */}
          {activeTab === 'dna' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="block text-emerald-950 font-bold">Khóa Nhận Diện Nhân Vật (Immutable Character DNA Lock)</strong>
                  Hệ thống bảo đảm mọi chỉ dẫn tạo hình cho Google Flow đều khóa cứng nhận dạng theo phiên bản duyệt (Version Snapshot).
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pack?.characters.map((char) => (
                  <div key={char.characterId} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h5 className="font-bold text-sm text-slate-900">{char.displayName}</h5>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {char.versionNumber} [{char.activeVersionId}]
                      </span>
                    </div>

                    <div className="text-xs space-y-2 text-slate-600">
                      <div>
                        <strong className="text-slate-800">Kiểu tóc & Tông màu:</strong> {char.hairStyle}
                      </div>
                      <div>
                        <strong className="text-slate-800">Gương mặt & Ánh mắt:</strong> {char.facialFeatures}
                      </div>
                      <div>
                        <strong className="text-slate-800">Trang phục:</strong> {char.outfit}
                      </div>
                      <div>
                        <strong className="text-slate-800">Tông da:</strong> {char.skinTone}
                      </div>

                      {char.dnaConstraints.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                            Ràng buộc DNA bất biến:
                          </span>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-700">
                            {char.dnaConstraints.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Style Lock Card */}
              {pack?.style && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h5 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      Khóa Phong Cách Toàn Cục (Style DNA Lock)
                    </h5>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300">
                      {pack.style.versionNumber} [{pack.style.styleVersionId}]
                    </span>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-600">
                    <div><strong className="text-slate-800">Tên phong cách:</strong> {pack.style.name}</div>
                    <div><strong className="text-slate-800">Quy tắc màu sắc:</strong> {pack.style.colorPaletteRule}</div>
                    <div><strong className="text-slate-800">Quy tắc ánh sáng:</strong> {pack.style.lightingRule}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REFS */}
          {activeTab === 'refs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Danh Mục Tài Liệu Tham Chiếu Có Nguồn Gốc (Traceable References)</h4>
                  <p className="text-xs text-slate-500">Mỗi tham chiếu đính kèm đều có ID định danh, kiểu tham chiếu và mục đích rõ ràng.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {pack?.references.map((ref) => (
                  <div key={ref.reference_id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                    <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={ref.thumbnailUrl || ref.url} alt={ref.reference_id} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-slate-500">{ref.reference_id}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {ref.reference_type}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium text-[11px] line-clamp-2">{ref.purpose}</p>
                      <span className="text-[10px] text-slate-400 block font-mono truncate">{ref.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PROVENANCE */}
          {activeTab === 'provenance' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 border border-slate-800">
                <h4 className="text-sm font-bold flex items-center gap-2 text-indigo-300">
                  <ShieldCheck className="w-4 h-4" />
                  Bảng Đối Soát Kỹ Thuật (Technical Audit Checklist)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-400">Target Provider:</span> <strong className="text-white">Google Flow</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Execution Mode:</span> <strong className="text-indigo-400">{activeJob?.execution_mode || executionMode}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">External Google API Request:</span> <strong className="text-amber-400">NO (Assisted Workflow / Local Asset)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Input Hash:</span> <code className="font-mono text-emerald-400">{activeJob?.input_hash || 'N/A'}</code>
                  </div>
                  <div>
                    <span className="text-slate-400">Production Pack ID:</span> <code className="font-mono text-slate-300">{pack?.pack_id}</code>
                  </div>
                  <div>
                    <span className="text-slate-400">Canon Version:</span> <strong className="text-white">Episode Canon v{pack?.canon_snapshot.canonVersion}</strong>
                  </div>
                </div>
              </div>

              {/* Latest Asset Provenance Record */}
              {latestAsset ? (
                <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h5 className="font-bold text-sm text-slate-900">Hồ Sơ Nguồn Gốc Asset (Asset Provenance)</h5>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      latestAsset.qa_status === 'PASSED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : latestAsset.qa_status === 'FLAGGED'
                        ? 'bg-amber-100 text-amber-800'
                        : latestAsset.qa_status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      QA: {latestAsset.qa_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Asset ID</span>
                      <span className="font-mono font-bold text-slate-800">{latestAsset.asset_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Định dạng MIME</span>
                      <span className="font-mono font-bold text-slate-800">{latestAsset.mimeType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Kích thước raster</span>
                      <span className="font-mono font-bold text-slate-800">{latestAsset.width} x {latestAsset.height} px</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Dung lượng tệp</span>
                      <span className="font-mono font-bold text-slate-800">{(latestAsset.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Thời gian nạp</span>
                      <span className="text-slate-700">{new Date(latestAsset.created_at).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Xác thực Real Google API</span>
                      <span className="font-bold text-slate-700">
                        {latestAsset.isRealGoogleExecution ? 'Có (Authenticated)' : 'Không (Assisted / Local)'}
                      </span>
                    </div>
                  </div>

                  {/* QA Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        googleFlowDirector.updateQAStatus(latestAsset.asset_id, 'PASSED', 'Đạt chuẩn hình ảnh sản xuất.');
                        if (onAssetUpdated) onAssetUpdated();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Phê Duyệt QA (Pass)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        googleFlowDirector.updateQAStatus(latestAsset.asset_id, 'FLAGGED', 'Cần kiểm tra lại biểu cảm.');
                        if (onAssetUpdated) onAssetUpdated();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Gắn Cờ (Flag)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  Chưa có Asset nào được nhập hoặc kết xuất cho shot này.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Google Flow Director &bull; Source of Truth Architecture</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-900 font-bold transition-colors"
          >
            Đóng Director
          </button>
        </div>
      </div>

      {/* ASSET IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                Nhập Kết Quả Từ Google Flow
              </h4>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportAsset} className="p-5 space-y-4 text-xs">
              {importError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {importError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Đường dẫn tệp / URL hình ảnh hoặc video:</label>
                <input
                  type="text"
                  placeholder="/assets/aistudio/renders/... hoặc https://..."
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">
                  (Để trống sẽ dùng tệp mặc định sản xuất: <code>/assets/aistudio/renders/episodes/{episodeId}/shots/{shot.id}/{shot.id}.jpg</code>)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Định dạng MIME:</label>
                  <select
                    value={importMime}
                    onChange={(e) => setImportMime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="image/jpeg">image/jpeg (Ảnh chụp chuẩn)</option>
                    <option value="image/png">image/png (Raster PNG)</option>
                    <option value="image/webp">image/webp (WebP)</option>
                    <option value="video/mp4">video/mp4 (Video Veo/Flow)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Dung lượng tệp (bytes):</label>
                  <input
                    type="number"
                    value={importFileSize}
                    onChange={(e) => setImportFileSize(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Chiều rộng (Width px):</label>
                  <input
                    type="number"
                    value={importWidth}
                    onChange={(e) => setImportWidth(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Chiều cao (Height px):</label>
                  <input
                    type="number"
                    value={importHeight}
                    onChange={(e) => setImportHeight(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {importMime === 'video/mp4' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Thời lượng video (giây):</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="4.0"
                    value={importDuration || ''}
                    onChange={(e) => setImportDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              )}

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-[11px] space-y-1">
                <strong className="block font-bold">Quy Trình Kiểm Tra Tính Hợp Lệ (Auto-Validation):</strong>
                <span>• Tệp sẽ được gắn chặt với Shot <code>{shot.id}</code> và Production Pack <code>{pack?.pack_id}</code>.</span><br />
                <span>• Trạng thái được chuyển ngay sang <code>PENDING_QA</code> để phê duyệt.</span>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1.5 shadow-sm"
                >
                  {isImporting ? 'Đang xác thực...' : 'Xác Nhận Nhập Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
