import React, { useState, useMemo, useEffect } from 'react';
import {
  Shot,
  Episode,
  Storyboard,
  ImageGenerationProvider,
  LanguageMode,
  ProjectReference,
} from '../../types';
import { StorageService } from '../../services/storageService';
import { ImageGenerationService, IMAGE_PROVIDER_SPECS } from '../../services/imageGenerationService';
import { ImageAdapterRegistry } from '../../services/adapters';
import {
  X,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  Film,
  Camera,
  Play,
  FolderArchive,
  Image as ImageIcon,
  Video,
  Check,
  Info,
} from 'lucide-react';

interface CreateJobModalProps {
  initialEpisodeId?: string;
  initialShotId?: string;
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (jobId: string, runImmediately: boolean) => void;
  language?: LanguageMode;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({
  initialEpisodeId,
  initialShotId,
  isOpen,
  onClose,
  onJobCreated,
  language = 'bilingual',
}) => {
  const storage = StorageService.getInstance();
  const db = storage.getDatabase();
  const imageGenService = ImageGenerationService.getInstance();

  const registry = ImageAdapterRegistry.getInstance();
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>(
    initialEpisodeId || 'ep_009'
  );
  const [selectedSceneNumber, setSelectedSceneNumber] = useState<number>(1);
  const [selectedShotId, setSelectedShotId] = useState<string>(initialShotId || '');
  const [provider, setProvider] = useState<ImageGenerationProvider>('mock-studio');
  const [selectedModel, setSelectedModel] = useState<string>(() =>
    registry.getActiveModel('mock-studio')
  );
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [resolution, setResolution] = useState<string>('1920x1080');
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 900000 + 100000));
  const [steps, setSteps] = useState<number>(30);
  const [guidanceScale, setGuidanceScale] = useState<number>(7.5);
  const [runImmediately, setRunImmediately] = useState<boolean>(true);
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>([]);
  const [refCategoryFilter, setRefCategoryFilter] = useState<'all' | 'character' | 'style' | 'location' | 'video' | 'image'>('all');

  const handleProviderSelect = (newProvider: ImageGenerationProvider) => {
    setProvider(newProvider);
    setSelectedModel(registry.getActiveModel(newProvider));
  };

  const isVi = language === 'vi';

  // Find storyboard for episode
  const storyboard = useMemo(() => {
    return db.storyboards.find((sb) => sb.episodeId === selectedEpisodeId);
  }, [db.storyboards, selectedEpisodeId]);

  // Current scene
  const currentScene = useMemo(() => {
    if (!storyboard) return undefined;
    return storyboard.scenes.find((s) => s.sceneNumber === selectedSceneNumber) || storyboard.scenes[0];
  }, [storyboard, selectedSceneNumber]);

  // Current shot
  const currentShot = useMemo(() => {
    if (!currentScene) return undefined;
    if (selectedShotId) {
      const found = currentScene.shots.find((s) => s.id === selectedShotId);
      if (found) return found;
    }
    return currentScene.shots[0];
  }, [currentScene, selectedShotId]);

  // Available project references from library
  const availableReferences = useMemo(() => {
    return db.projectReferences || [];
  }, [db.projectReferences]);

  // Auto-suggest references when shot changes
  useEffect(() => {
    if (!currentShot) return;
    const allRefs = db.projectReferences || [];
    const autoRefs: string[] = [];

    // Match locked character versions in shot
    Object.entries(currentShot.characterDnaReferences || {}).forEach(([charId, versionId]) => {
      const match = allRefs.find(
        (r) => r.characterId === charId && r.characterVersionId === versionId
      );
      if (match && !autoRefs.includes(match.id)) {
        autoRefs.push(match.id);
      }
    });

    // Match style reference
    const styleRef = allRefs.find(
      (r) => r.type === 'style' && r.styleVersionId === currentShot.styleVersionSnapshotId
    );
    if (styleRef && !autoRefs.includes(styleRef.id)) {
      autoRefs.push(styleRef.id);
    }

    if (autoRefs.length > 0) {
      setSelectedReferenceIds((prev) => Array.from(new Set([...prev, ...autoRefs])));
    }
  }, [currentShot?.id, db.projectReferences]);

  const toggleReferenceSelection = (refId: string) => {
    setSelectedReferenceIds((prev) =>
      prev.includes(refId) ? prev.filter((id) => id !== refId) : [...prev, refId]
    );
  };

  const filteredReferences = useMemo(() => {
    if (refCategoryFilter === 'all') return availableReferences;
    return availableReferences.filter((r) => r.type === refCategoryFilter);
  }, [availableReferences, refCategoryFilter]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShot || !storyboard) return;

    try {
      const job = imageGenService.createJobFromShot(
        currentShot,
        selectedEpisodeId,
        storyboard.id,
        provider,
        {
          aspectRatio,
          resolution,
          seed,
          steps,
          guidanceScale,
          modelName: selectedModel,
          projectReferenceIds: selectedReferenceIds,
        }
      );

      onJobCreated(job.id, runImmediately);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo Image Generation Job');
    }
  };

  const selectedProviderSpec = imageGenService.getProviderSpec(provider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isVi ? 'Tạo Job Kết Xuất Khung Hình' : 'Create Image Generation Job'}
              </h3>
              <p className="text-xs text-slate-400">
                {isVi
                  ? 'Tự động khóa Character DNA + Style Snapshot từ Shot'
                  : 'Automatically locks Character DNA + Style Snapshot from Shot'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs custom-scrollbar">
          {/* Episode & Shot Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {isVi ? 'Tập phim:' : 'Episode:'}
              </label>
              <select
                value={selectedEpisodeId}
                onChange={(e) => {
                  setSelectedEpisodeId(e.target.value);
                  setSelectedSceneNumber(1);
                  setSelectedShotId('');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-medium focus:outline-none focus:border-amber-500"
              >
                {db.episodes.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.title} ({ep.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {isVi ? 'Phân cảnh (Scene):' : 'Scene Number:'}
              </label>
              <select
                value={selectedSceneNumber}
                onChange={(e) => {
                  setSelectedSceneNumber(Number(e.target.value));
                  setSelectedShotId('');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-medium focus:outline-none focus:border-amber-500"
              >
                {storyboard?.scenes.map((s) => (
                  <option key={s.id} value={s.sceneNumber}>
                    Scene {s.sceneNumber}: {s.title || `Cảnh ${s.sceneNumber}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {isVi ? 'Shot mục tiêu:' : 'Target Shot:'}
              </label>
              <select
                value={currentShot?.id || ''}
                onChange={(e) => setSelectedShotId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-medium focus:outline-none focus:border-amber-500"
              >
                {currentScene?.shots.map((s) => (
                  <option key={s.id} value={s.id}>
                    Shot #{s.shotNumber}: {s.shotType} ({s.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Locked Snapshot Guarantee Card */}
          {currentShot && (
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  {isVi ? 'Khóa Bất Biến Từ Shot Được Chọn:' : 'Locked Snapshots from Shot:'}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded font-bold">
                  {currentShot.id}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block font-semibold mb-1">
                    DNA Nhân vật (Character Versions):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(currentShot.characterDnaReferences || {}).map(([cId, vId]) => (
                      <span key={cId} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono text-[10px] border border-emerald-500/20">
                        {cId.replace('char_', '')}: {vId}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block font-semibold mb-1">
                    Style Snapshot & Refs:
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono text-[10px] border border-indigo-500/20">
                      {currentShot.styleVersionSnapshotId}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      &bull; Tự động khóa reference assets
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                {currentShot.action}
              </p>
            </div>
          )}

          {/* Project Reference Library Selection */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <FolderArchive className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-slate-200">
                  {isVi ? 'Thư Viện Tham Chiếu Dự Án (Reference Library):' : 'Project Reference Library:'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  {selectedReferenceIds.length} {isVi ? 'đã chọn' : 'selected'}
                </span>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'character', 'style', 'location', 'image', 'video'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setRefCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${
                      refCategoryFilter === cat
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Golden Rule Immuntability Notice */}
            <div className="flex items-start space-x-2 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-[11px]">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                {isVi
                  ? 'Character DNA & Version Snapshots luôn là Chân Lý Tối Thượng (Source of Truth). Tham chiếu sáng tạo bổ trợ góc máy, ánh sáng và bối cảnh, không bao giờ ghi đè lên DNA nhân vật.'
                  : 'Character DNA & Version Snapshots remain the Source of Truth. Creative references guide lighting, composition, and framing without overriding Character DNA.'}
              </span>
            </div>

            {/* Reference Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {filteredReferences.map((ref) => {
                const isSelected = selectedReferenceIds.includes(ref.id);
                return (
                  <div
                    key={ref.id}
                    onClick={() => toggleReferenceSelection(ref.id)}
                    className={`flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-amber-500 text-slate-950' : 'border border-slate-700 bg-slate-950'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    {/* Thumbnail / Icon */}
                    <div className="w-10 h-8 rounded bg-slate-950 overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                      {ref.uri ? (
                        <img
                          src={ref.uri}
                          alt={ref.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : ref.type === 'video' ? (
                        <Video className="w-4 h-4 text-purple-400" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 truncate text-[11px]">
                          {ref.name}
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-slate-800 text-slate-400 ml-1 shrink-0 uppercase">
                          {ref.type}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 truncate">
                        {ref.characterId && (
                          <span className="text-emerald-400 font-mono">
                            {ref.characterId.replace('char_', '')}: {ref.characterVersionId || 'v1.0'}
                          </span>
                        )}
                        <span>&bull;</span>
                        <span>{ref.source.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredReferences.length === 0 && (
                <div className="col-span-2 text-center py-4 text-slate-500 text-xs">
                  {isVi ? 'Không tìm thấy tham chiếu nào trong mục này.' : 'No references found in this category.'}
                </div>
              )}
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="block text-slate-400 font-semibold">
              {isVi ? 'Chọn Bộ Kết Xuất (Provider Adapter):' : 'Select Provider Adapter:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {IMAGE_PROVIDER_SPECS.map((spec) => {
                const isSelected = provider === spec.id;
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => handleProviderSelect(spec.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/60 ring-2 ring-amber-500/20 text-white'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{spec.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold font-mono bg-slate-800 text-slate-300">
                        {spec.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      {spec.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Exact Model Selection */}
            <div className="pt-2">
              <label className="block text-slate-400 font-semibold mb-1">
                {isVi ? 'Model Thực Thi (Exact Model ID):' : 'Execution Model (Exact Model ID):'}
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
              >
                {registry.getAdapter(provider).supportedModels.map((m) => (
                  <option key={m} value={m}>
                    {m} {m === registry.getAdapter(provider).defaultModel ? (isVi ? '(Mặc định)' : '(Default)') : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Technical Generation Parameters */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="font-bold text-slate-300 block text-xs">
              {isVi ? 'Tham Số Kết Xuất Kỹ Thuật (Parameters)' : 'Technical Render Parameters'}
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Tỉ lệ khung hình:</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                >
                  <option value="16:9">16:9 (Landscape Standard)</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="9:16">9:16 (Vertical Shorts)</option>
                  <option value="4:3">4:3 (Classic TV)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Độ phân giải:</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                >
                  <option value="1920x1080">1080p (1920x1080)</option>
                  <option value="3840x2160">4K UHD (3840x2160)</option>
                  <option value="1024x1024">1K (1024x1024)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Seed ngẫu nhiên:</label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Số bước (Steps):</label>
                <input
                  type="number"
                  value={steps}
                  min={10}
                  max={100}
                  onChange={(e) => setSteps(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>
            </div>

            {/* Run immediately checkbox */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center space-x-2">
              <input
                type="checkbox"
                id="run-immediately-toggle"
                checked={runImmediately}
                onChange={(e) => setRunImmediately(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
              />
              <label htmlFor="run-immediately-toggle" className="text-slate-300 font-semibold cursor-pointer">
                {isVi
                  ? 'Chạy kết xuất mô phỏng ngay sau khi tạo Job'
                  : 'Execute mock render immediately after queuing'}
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors text-xs"
          >
            {isVi ? 'Hủy bỏ' : 'Cancel'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={!currentShot}
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
          >
            {runImmediately ? (
              <>
                <Play className="w-4 h-4 mr-1.5 fill-current" />
                {isVi ? 'Khởi Tạo & Chạy Render' : 'Queue & Run Job'}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1.5" />
                {isVi ? 'Thêm Vào Hàng Đợi (Queue)' : 'Add to Queue'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
