import React, { useState, useEffect, useMemo } from 'react';
import {
  Shot,
  Episode,
  Storyboard,
  ProductionPack,
  FlowGenerationJob,
  ProductionAsset,
  ProviderExecutionMode,
  LanguageMode,
} from '../../types';
import { storageService } from '../../services/storageService';
import { googleFlowDirector } from '../../services/googleFlowDirector';
import { FlowPromptCompiler } from '../../services/flowPromptCompiler';
import { FlowWorkspaceTab } from './FlowWorkspaceTab';
import { MasterPromptTab } from './MasterPromptTab';
import { DnaStyleTab } from './DnaStyleTab';
import { TraceableReferencesTab } from './TraceableReferencesTab';
import { AuditProvenanceTab } from './AuditProvenanceTab';
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
  ExternalLink,
  Play,
  Clock,
  Eye,
  Sliders,
  CheckCircle2,
  Lock,
  Compass,
  Film,
  X,
  Camera,
  Music,
  Video,
} from 'lucide-react';

interface GoogleFlowDirectorViewProps {
  language?: LanguageMode;
  initialEpisodeId?: string;
  initialShotId?: string;
  onNavigateToStoryboard?: (episodeId?: string) => void;
}

export const GoogleFlowDirectorView: React.FC<GoogleFlowDirectorViewProps> = ({
  language = 'vi',
  initialEpisodeId = 'ep_009',
  initialShotId = 'shot_ep009_s01_01',
  onNavigateToStoryboard,
}) => {
  const [db, setDb] = useState(() => storageService.getDatabase());
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>(initialEpisodeId);
  const [selectedShotId, setSelectedShotId] = useState<string>(initialShotId);
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

  // Find active episode, storyboard, and shot
  const activeEpisode = useMemo(() => {
    return db.episodes.find((e) => e.id === selectedEpisodeId) || db.episodes[0];
  }, [db.episodes, selectedEpisodeId]);

  const activeStoryboard = useMemo(() => {
    return db.storyboards.find((s) => s.episodeId === activeEpisode?.id);
  }, [db.storyboards, activeEpisode]);

  const allShots = useMemo(() => {
    if (!activeStoryboard) return [];
    return activeStoryboard.scenes.flatMap((sc) => sc.shots);
  }, [activeStoryboard]);

  const activeShot = useMemo(() => {
    return allShots.find((s) => s.id === selectedShotId) || allShots[0];
  }, [allShots, selectedShotId]);

  // Keep selectedShotId valid
  useEffect(() => {
    if (activeShot && activeShot.id !== selectedShotId) {
      setSelectedShotId(activeShot.id);
    }
  }, [activeShot]);

  // Load or compile Production Pack whenever activeShot changes
  useEffect(() => {
    if (!activeShot) return;
    try {
      const compiled = googleFlowDirector.prepareProductionPack(activeShot, {
        episodeId: activeEpisode.id,
        storyboardId: activeStoryboard?.id,
        customExecutionMode: executionMode,
      });
      setPack(compiled);

      const existingJobs = googleFlowDirector.getJobsForShot(activeShot.id);
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
  }, [activeShot?.id, executionMode]);

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
    if (!activeShot) return undefined;
    const assets = googleFlowDirector.getAssetsForShot(activeShot.id);
    return assets[0];
  }, [activeShot?.id, db]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(fullPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
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

  const handleRunLocalAsset = async () => {
    if (!activeJob) return;
    setIsExecutingLocal(true);
    try {
      activeJob.execution_mode = 'LOCAL_ASSET';
      await googleFlowDirector.executeLocalAsset(activeJob.job_id);
    } catch (err: any) {
      alert(`Lỗi thực thi Local Asset: ${err.message}`);
    } finally {
      setIsExecutingLocal(false);
    }
  };

  const handleImportAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob || !activeShot) return;
    setImportError(null);
    setIsImporting(true);

    try {
      await googleFlowDirector.importGoogleFlowAsset({
        jobId: activeJob.job_id,
        fileUrl: importUrl || `/assets/aistudio/renders/episodes/${activeEpisode.id}/shots/${activeShot.id}/${activeShot.id}.jpg`,
        mimeType: importMime,
        width: Number(importWidth),
        height: Number(importHeight),
        fileSize: Number(importFileSize),
        durationSeconds: importMime === 'video/mp4' ? Number(importDuration) : undefined,
        sourceFileName: `google_flow_render_${activeShot.id}.${importMime === 'video/mp4' ? 'mp4' : 'jpg'}`,
      });

      setShowImportModal(false);
      setImportUrl('');
    } catch (err: any) {
      setImportError(err.message || 'Không thể nhập tệp');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div id="view-google-flow-director" className="space-y-6 pb-16">
      {/* Top Banner & Target Selectors */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Google Flow Director</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Phase 4.7 Production Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              Trung tâm điều phối quy trình sản xuất điện ảnh chuẩn Google Flow: Đóng gói bất biến Production Pack, biên dịch Prompt 14 phần đầy đủ, bảo toàn Source of Truth Character DNA & Style và đối soát kỹ thuật (provenance QA).
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedPrompt ? 'Đã chép Prompt' : 'Chép Master Prompt (15 Phần)'}
            </button>

            <button
              type="button"
              onClick={handleDownloadPack}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất Pack JSON
            </button>
          </div>
        </div>

        {/* Target Selectors: Episode, Scene, Shot */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">Tập phim:</span>
            <select
              value={selectedEpisodeId}
              onChange={(e) => setSelectedEpisodeId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold bg-slate-50"
            >
              {db.episodes.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.title} ({ep.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">Mục tiêu Shot:</span>
            <select
              value={selectedShotId}
              onChange={(e) => setSelectedShotId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold bg-slate-50 font-mono"
            >
              {allShots.map((s) => (
                <option key={s.id} value={s.id}>
                  Cảnh {s.sceneNumber} &bull; Shot #{s.shotNumber} ({s.id}) — {s.shotType}
                </option>
              ))}
            </select>
          </div>

          {onNavigateToStoryboard && (
            <button
              type="button"
              onClick={() => onNavigateToStoryboard(selectedEpisodeId)}
              className="ml-auto text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1"
            >
              <Film className="w-3.5 h-3.5" />
              Mở trong Storyboard
            </button>
          )}
        </div>
      </div>

      {/* Mode Classification Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
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
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              executionMode === 'LOCAL_ASSET'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Local Asset Preview
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between overflow-x-auto text-xs">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('flow')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'flow'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4" />
            Điều Phối Sản Xuất (Flow Director)
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'prompt'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Master Prompt (15 Phần)
          </button>
          <button
            onClick={() => setActiveTab('dna')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'dna'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Khóa DNA & Style (Source of Truth)
          </button>
          <button
            onClick={() => setActiveTab('refs')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'refs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            Tài Liệu Tham Chiếu ({pack?.references.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('provenance')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'provenance'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Audit & Provenance QA
          </button>
        </div>
      </div>

      {/* TAB 1: ĐIỀU PHỐI SẢN XUẤT (FLOW WORKSPACE) */}
      {activeTab === 'flow' && (
        <FlowWorkspaceTab
          shot={activeShot}
          episode={activeEpisode}
          pack={pack}
          activeJob={activeJob}
          latestAsset={latestAsset}
          executionMode={executionMode}
          isExecutingLocal={isExecutingLocal}
          copiedPrompt={copiedPrompt}
          onCopyPrompt={handleCopyPrompt}
          onDownloadPack={handleDownloadPack}
          onOpenImportModal={() => setShowImportModal(true)}
          onRunLocalAsset={handleRunLocalAsset}
          onSelectTab={setActiveTab}
        />
      )}



      {/* TAB 2: MASTER PROMPT (15 PHẦN) */}
      {activeTab === 'prompt' && (
        <MasterPromptTab
          pack={pack}
          copiedPrompt={copiedPrompt}
          onCopyPrompt={handleCopyPrompt}
          onDownloadPack={handleDownloadPack}
        />
      )}

      {/* TAB 3: DNA & STYLE (SOURCE OF TRUTH) */}
      {activeTab === 'dna' && (
        <DnaStyleTab
          shot={activeShot}
          pack={pack}
          db={db}
        />
      )}

      {/* TAB 4: TRACEABLE REFERENCES */}
      {activeTab === 'refs' && (
        <TraceableReferencesTab
          pack={pack}
          shot={activeShot}
          db={db}
        />
      )}

      {/* TAB 5: AUDIT & PROVENANCE QA */}
      {activeTab === 'provenance' && (
        <AuditProvenanceTab
          shot={activeShot}
          pack={pack}
          activeJob={activeJob}
          latestAsset={latestAsset}
          db={db}
          onRefresh={() => setDb(storageService.getDatabase())}
        />
      )}

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
                  (Để trống sẽ dùng tệp mặc định sản xuất: <code>/assets/aistudio/renders/episodes/{activeEpisode.id}/shots/{activeShot.id}/{activeShot.id}.jpg</code>)
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
                <span>• Tệp sẽ được gắn chặt với Shot <code>{activeShot.id}</code> và Production Pack <code>{pack?.pack_id}</code>.</span><br />
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
