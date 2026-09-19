import React, { useState, useEffect, useMemo } from 'react';
import {
  ImageGenerationJob,
  ImageGenerationJobStatus,
  ImageGenerationProvider,
  LanguageMode,
  Episode,
  Storyboard,
} from '../../types';
import { StorageService } from '../../services/storageService';
import { ImageGenerationService, IMAGE_PROVIDER_SPECS } from '../../services/imageGenerationService';
import { JobPromptModal } from './JobPromptModal';
import { JobPreviewModal } from './JobPreviewModal';
import { CreateJobModal } from './CreateJobModal';
import { JobIntegrityAuditModal } from './JobIntegrityAuditModal';
import {
  Sparkles,
  Layers,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  Plus,
  Trash2,
  Maximize2,
  FileCode,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Search,
  ExternalLink,
  Film,
} from 'lucide-react';

interface ImageGenerationQueueViewProps {
  language?: LanguageMode;
  onNavigateToStoryboard?: (episodeId?: string) => void;
}

export const ImageGenerationQueueView: React.FC<ImageGenerationQueueViewProps> = ({
  language = 'bilingual',
  onNavigateToStoryboard,
}) => {
  const storage = StorageService.getInstance();
  const imageGenService = ImageGenerationService.getInstance();

  const [db, setDb] = useState(() => storage.getDatabase());
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);

  // Modals state
  const [promptModalJob, setPromptModalJob] = useState<ImageGenerationJob | null>(null);
  const [previewModalJob, setPreviewModalJob] = useState<ImageGenerationJob | null>(null);
  const [auditModalJob, setAuditModalJob] = useState<ImageGenerationJob | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Auto ensure initial sample jobs if empty so user sees instant working pipeline
  useEffect(() => {
    imageGenService.ensureInitialJobs();
    setDb(storage.getDatabase());
  }, []);

  // Poll database updates
  useEffect(() => {
    const interval = setInterval(() => {
      setDb(storage.getDatabase());
    }, 1000);
    return () => clearInterval(interval);
  }, [storage]);

  const isVi = language === 'vi';
  const jobs = db.imageGenerationJobs || [];

  // Metrics
  const metrics = useMemo(() => {
    const total = jobs.length;
    const queued = jobs.filter((j) => j.status === 'queued' || j.status === 'pending').length;
    const processing = jobs.filter((j) => j.status === 'processing').length;
    const completed = jobs.filter((j) => j.status === 'completed').length;
    const failed = jobs.filter((j) => j.status === 'failed').length;
    const approved = jobs.filter((j) => j.outputAssets?.some((o) => o.isApproved)).length;
    const rejected = jobs.filter((j) => j.outputAssets?.some((o) => o.approvalStatus === 'rejected')).length;

    return { total, queued, processing, completed, failed, approved, rejected };
  }, [jobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (selectedEpisodeId !== 'all' && job.episodeId !== selectedEpisodeId) return false;
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'approved') {
          if (!job.outputAssets?.some((o) => o.isApproved)) return false;
        } else if (selectedStatus === 'rejected') {
          if (!job.outputAssets?.some((o) => o.approvalStatus === 'rejected')) return false;
        } else if (job.status !== selectedStatus) {
          return false;
        }
      }
      if (selectedProvider !== 'all' && job.provider !== selectedProvider) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchShot = job.shotId.toLowerCase().includes(q);
        const matchPrompt = job.prompt.toLowerCase().includes(q);
        const matchScene = `scene ${job.sceneNumber}`.includes(q);
        if (!matchShot && !matchPrompt && !matchScene) return false;
      }
      return true;
    });
  }, [jobs, selectedEpisodeId, selectedStatus, selectedProvider, searchQuery]);

  // Actions
  const handleRunJob = async (
    jobId: string,
    simulateError: boolean = false,
    simulateRateLimit: boolean = false
  ) => {
    try {
      await imageGenService.runJob(jobId, simulateError, simulateRateLimit);
      setDb(storage.getDatabase());
    } catch (err: any) {
      alert(err.message || 'Lỗi khi chạy Job');
    }
  };

  const handleSwitchModelAndRetry = async (jobId: string, newModel: string) => {
    const currentDb = storage.getDatabase();
    const targetJob = (currentDb.imageGenerationJobs || []).find((j) => j.id === jobId);
    if (targetJob) {
      targetJob.modelName = newModel;
      targetJob.status = 'queued';
      targetJob.error = null;
      targetJob.rateLimitInfo = undefined;
      storage.saveDatabase({ imageGenerationJobs: [...currentDb.imageGenerationJobs] });
      await imageGenService.runJob(jobId);
      setDb(storage.getDatabase());
    }
  };

  const handleRunAllQueued = async () => {
    setIsRunningAll(true);
    try {
      await imageGenService.runAllQueued(selectedEpisodeId === 'all' ? undefined : selectedEpisodeId);
      setDb(storage.getDatabase());
    } finally {
      setIsRunningAll(false);
    }
  };

  const handleCancelJob = (jobId: string) => {
    imageGenService.cancelJob(jobId);
    setDb(storage.getDatabase());
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await imageGenService.retryJob(jobId);
      setDb(storage.getDatabase());
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteJob = (jobId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa Job kết xuất này khỏi hàng đợi?')) {
      imageGenService.deleteJob(jobId);
      setDb(storage.getDatabase());
    }
  };

  const handleApproveOutput = (jobId: string, outputId: string) => {
    imageGenService.approveOutput(jobId, outputId);
    const updatedDb = storage.getDatabase();
    setDb(updatedDb);
    const updatedJob = updatedDb.imageGenerationJobs.find((j) => j.id === jobId);
    if (updatedJob && previewModalJob?.id === jobId) {
      setPreviewModalJob(updatedJob);
    }
  };

  const handleRejectOutput = (jobId: string, outputId: string, reason: string) => {
    imageGenService.rejectOutput(jobId, outputId, reason);
    const updatedDb = storage.getDatabase();
    setDb(updatedDb);
    const updatedJob = updatedDb.imageGenerationJobs.find((j) => j.id === jobId);
    if (updatedJob && previewModalJob?.id === jobId) {
      setPreviewModalJob(updatedJob);
    }
  };

  const handleRegenerateJob = async (jobId: string) => {
    try {
      const newJob = await imageGenService.regenerateJob(jobId);
      const updatedDb1 = storage.getDatabase();
      setDb(updatedDb1);
      // Run new job immediately to generate live frame
      await imageGenService.runJob(newJob.id);
      const updatedDb2 = storage.getDatabase();
      setDb(updatedDb2);
      const updatedJob = updatedDb2.imageGenerationJobs.find((j) => j.id === newJob.id);
      if (updatedJob) {
        setPreviewModalJob(updatedJob);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tái tạo Job');
    }
  };

  const handleQueueAllEpisodeShots = () => {
    const sb = db.storyboards.find((s) => s.episodeId === 'ep_009');
    if (!sb) {
      alert('Không tìm thấy Storyboard Episode 9');
      return;
    }
    imageGenService.createJobsForStoryboard(sb, 'mock-studio');
    setDb(storage.getDatabase());
  };

  return (
    <div id="image-generation-queue-view" className="space-y-6">
      {/* Top Banner: Architecture & Immutability Guarantee */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {isVi ? 'Giai Đoạn 4: Hàng Đợi Kết Xuất Ảnh (Image Generation Pipeline)' : 'Phase 4: Image Generation Pipeline'}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Provider-Independent
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isVi
                ? 'Tự động phân giải Character DNA Snapshots + Reference Assets + Style Snapshot bất biến từ Storyboard Shot.'
                : 'Decoupled Job Queue with locked Character DNA Version, Reference Assets, and Style Snapshots.'}
            </p>
          </div>
        </div>

        {/* Global Toolbar Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToStoryboard && (
            <button
              type="button"
              onClick={() => onNavigateToStoryboard('ep_009')}
              className="inline-flex items-center text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Film className="w-4 h-4 mr-1.5 text-indigo-600" />
              {isVi ? 'Xem Storyboard (Phase 3)' : 'Back to Storyboard'}
            </button>
          )}

          <button
            type="button"
            onClick={handleQueueAllEpisodeShots}
            className="inline-flex items-center text-xs font-semibold px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
            title="Đưa toàn bộ shot của Episode 9 vào hàng đợi"
          >
            <Layers className="w-4 h-4 mr-1.5 text-indigo-600" />
            {isVi ? 'Hàng Đợi Toàn Bộ Ep 9' : 'Queue All Ep 9 Shots'}
          </button>

          <button
            type="button"
            onClick={handleRunAllQueued}
            disabled={metrics.queued === 0 || isRunningAll}
            className={`inline-flex items-center text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all ${
              metrics.queued > 0 && !isRunningAll
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            {isRunningAll ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                {isVi ? 'Đang Chạy Queue...' : 'Running Queue...'}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1.5 fill-current" />
                {isVi ? `Chạy Hết Hàng Đợi (${metrics.queued})` : `Run All Queued (${metrics.queued})`}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center text-xs font-bold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {isVi ? 'Tạo Job Mới' : '+ New Job'}
          </button>
        </div>
      </div>

      {/* Real-time Metrics Dashboard Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {isVi ? 'Tổng Số Jobs' : 'Total Jobs'}
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{metrics.total}</span>
            <span className="text-xs text-slate-400">jobs</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            {isVi ? 'Đang Chờ (Queued)' : 'Queued'}
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-extrabold text-amber-600 font-mono">{metrics.queued}</span>
            <span className="text-xs text-amber-500">ready</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
            {isVi ? 'Đang Xử Lý' : 'Processing'}
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-extrabold text-blue-600 font-mono">{metrics.processing}</span>
            {metrics.processing > 0 && <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            {isVi ? 'Hoàn Thành' : 'Completed'}
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-extrabold text-emerald-600 font-mono">{metrics.completed}</span>
            <span className="text-xs text-emerald-500">rendered</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">
            {isVi ? 'Đã Duyệt (Keyframes)' : 'Approved'}
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-extrabold text-purple-600 font-mono">{metrics.approved}</span>
            <span className="text-xs text-purple-500">locked</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
            {isVi ? 'Lỗi (Failed)' : 'Failed'}
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-extrabold text-rose-600 font-mono">{metrics.failed}</span>
            <span className="text-xs text-rose-500">error state</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-300 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
            {isVi ? 'Từ Chối (QA Rejected)' : 'QA Rejected'}
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-extrabold text-rose-700 font-mono">{metrics.rejected}</span>
            <span className="text-xs text-rose-500">rework</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: isVi ? 'Tất cả' : 'All' },
              { id: 'queued', label: isVi ? 'Hàng đợi' : 'Queued' },
              { id: 'completed', label: isVi ? 'Đã render' : 'Completed' },
              { id: 'approved', label: isVi ? 'Đã duyệt' : 'Approved' },
              { id: 'rejected', label: isVi ? 'Từ chối (QA)' : 'Rejected' },
              { id: 'failed', label: isVi ? 'Lỗi' : 'Failed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                  selectedStatus === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Episode, Provider & Search */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Episode selector */}
            <select
              value={selectedEpisodeId}
              onChange={(e) => setSelectedEpisodeId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">{isVi ? 'Tất cả tập phim' : 'All Episodes'}</option>
              {db.episodes.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.title} ({ep.id})
                </option>
              ))}
            </select>

            {/* Provider selector */}
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">{isVi ? 'Tất cả Providers' : 'All Providers'}</option>
              {IMAGE_PROVIDER_SPECS.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={isVi ? 'Tìm theo Shot ID, hành động...' : 'Search Shot ID, prompt...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 w-48 sm:w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Queue Jobs List / Cards */}
      {filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const output = job.outputAssets?.[0];
            const isApproved = output?.isApproved;
            const providerSpec = imageGenService.getProviderSpec(job.provider);

            return (
              <div
                key={job.id}
                id={`job-card-${job.id}`}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-sm hover:shadow-md ${
                  job.status === 'failed'
                    ? 'border-rose-300 bg-rose-50/10'
                    : isApproved
                    ? 'border-purple-300 bg-purple-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-5">
                  {/* Left: Thumbnail & Visual Status */}
                  <div className="w-full lg:w-64 shrink-0">
                    <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center group">
                      {output ? (
                        <>
                          <img
                            src={output.imageUrl}
                            alt={`Render for Shot ${job.shotNumber}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                            <button
                              onClick={() => setPreviewModalJob(job)}
                              className="p-2 rounded-lg bg-white/90 text-slate-900 font-bold hover:bg-white shadow-lg transition-transform transform hover:scale-105"
                              title="Xem toàn màn hình"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setPromptModalJob(job)}
                              className="p-2 rounded-lg bg-white/90 text-slate-900 font-bold hover:bg-white shadow-lg transition-transform transform hover:scale-105"
                              title="Xem Prompt chi tiết"
                            >
                              <FileCode className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : job.status === 'processing' ? (
                        <div className="p-4 text-center space-y-2">
                          <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
                          <span className="text-xs font-bold text-blue-300 block">
                            {isVi ? `Đang render (${job.progress}%)...` : `Rendering (${job.progress}%)...`}
                          </span>
                          <div className="w-32 bg-slate-800 rounded-full h-1.5 overflow-hidden mx-auto">
                            <div
                              className="bg-blue-500 h-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : job.status === 'failed' ? (
                        <div className="p-4 text-center text-rose-400 space-y-1">
                          <AlertTriangle className="w-6 h-6 mx-auto" />
                          <span className="text-xs font-bold block">Render Thất Bại</span>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-slate-500 space-y-1">
                          <Clock className="w-6 h-6 mx-auto text-amber-500" />
                          <span className="text-xs font-semibold block text-slate-400">
                            Trong Hàng Đợi (Queued)
                          </span>
                        </div>
                      )}

                      {/* Approval or Rejection badge on thumbnail */}
                      {isApproved ? (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-purple-600 text-white font-bold text-[10px] shadow-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Keyframe
                        </span>
                      ) : output?.approvalStatus === 'rejected' ? (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px] shadow-sm flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          QA Rejected
                        </span>
                      ) : null}
                    </div>

                    {/* Thumbnail sub-info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
                      <span>{job.params.aspectRatio} &bull; {job.params.resolution}</span>
                      <span className="font-mono">Seed: #{job.params.seed}</span>
                    </div>
                  </div>

                  {/* Right: Job Details & Controls */}
                  <div className="flex-1 space-y-3">
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                            Scene {job.sceneNumber} &bull; Shot #{job.shotNumber}
                          </span>
                          <span className="text-xs text-slate-400">&bull;</span>
                          <span className="text-xs font-mono text-slate-500 font-bold">
                            {job.shotId}
                          </span>
                          <span className="text-xs text-slate-400">&bull;</span>
                          <span className="text-xs font-semibold text-indigo-600">
                            {job.episodeId}
                          </span>
                        </div>
                      </div>

                      {/* Status and Provider Badges */}
                      <div className="flex items-center space-x-2">
                        {/* Provider & Model Badge */}
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                            {providerSpec.name}
                          </span>
                          {job.modelName && (
                            <span
                              className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                              title="Selected Model"
                            >
                              {job.modelName}
                            </span>
                          )}
                          {job.requestId && (
                            <span
                              className="text-[10px] font-mono text-slate-400 hidden sm:inline"
                              title="Provider Request ID"
                            >
                              {job.requestId}
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 ${
                            job.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : job.status === 'processing'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                              : job.status === 'failed'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {job.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {job.status === 'processing' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          {job.status === 'failed' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {job.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* IMMUTABILITY CONTRACT BADGES: Character DNA Snapshot + Reference Assets + Style Snapshot */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>DNA Khóa (Locked):</span>
                      </div>

                      {/* Character versions */}
                      {Object.entries(job.characterDnaSnapshots).map(([cId, vId]) => (
                        <span
                          key={cId}
                          className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-800 font-mono text-[11px] font-bold"
                          title={`Nhân vật ${cId} cố định phiên bản ${vId}`}
                        >
                          {job.characterVersionNames?.[cId] ? `${cId.replace('char_', '')}: ${job.characterVersionNames[cId]}` : vId}
                        </span>
                      ))}

                      {/* Style version */}
                      <span className="px-2 py-0.5 rounded-md bg-white border border-indigo-300 text-indigo-800 font-mono text-[11px] font-bold">
                        Style: v{job.styleVersionName}
                      </span>

                      {/* Reference assets count */}
                      <span className="px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-800 font-mono text-[11px] font-bold">
                        Refs: {job.referenceAssetIds.length} tệp
                      </span>
                    </div>

                    {/* Prompt Preview Snippet */}
                    <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start justify-between gap-3">
                      <p className="line-clamp-2 italic text-slate-600 font-serif">
                        &ldquo;{job.prompt}&rdquo;
                      </p>
                      <button
                        onClick={() => setPromptModalJob(job)}
                        className="shrink-0 text-indigo-600 hover:text-indigo-800 font-bold hover:underline inline-flex items-center"
                      >
                        <FileCode className="w-3.5 h-3.5 mr-1" />
                        {isVi ? 'Xem Prompt 8 Lớp' : 'Prompt Breakdown'}
                      </button>
                    </div>

                    {/* Error message display if failed */}
                    {job.error && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block font-bold">Trạng thái Lỗi Kết Xuất (Error State):</strong>
                              <span className="font-mono text-[11px]">{job.error}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRetryJob(job.id)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shrink-0"
                          >
                            <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                            Thử Lại
                          </button>
                        </div>

                        {/* Rate Limit Diagnostic & Quick Fallback */}
                        {job.rateLimitInfo && (
                          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <div className="space-y-0.5">
                              <span className="font-bold flex items-center gap-1 text-amber-800">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Quota / Rate Limit Exceeded (Reset: {job.rateLimitInfo.resetWindowMinutes}m)
                              </span>
                              <span className="text-amber-700 text-[10px]">
                                Gợi ý chuyển sang: <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">{job.rateLimitInfo.suggestedAlternativeModel}</code>
                              </span>
                            </div>
                            <button
                              onClick={() => handleSwitchModelAndRetry(job.id, job.rateLimitInfo!.suggestedAlternativeModel)}
                              className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] shadow-xs transition-colors"
                            >
                              Đổi sang {job.rateLimitInfo.suggestedAlternativeModel} & Thử Lại
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                        <span>Tạo lúc: {new Date(job.createdAt).toLocaleTimeString()}</span>
                        {job.completedAt && (
                          <>
                            <span>&bull;</span>
                            <span>Hoàn thành: {new Date(job.completedAt).toLocaleTimeString()}</span>
                          </>
                        )}
                        {job.executionDurationMs && (
                          <>
                            <span>&bull;</span>
                            <span className="font-mono font-semibold text-slate-600">
                              {(job.executionDurationMs / 1000).toFixed(2)}s
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Run button if queued */}
                        {(job.status === 'queued' || job.status === 'pending') && (
                          <>
                            <button
                              onClick={() => handleRunJob(job.id)}
                              className="inline-flex items-center text-xs font-bold px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
                            >
                              <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                              {isVi ? 'Chạy Render' : 'Run Job'}
                            </button>

                            {/* Test simulate rate limit (429) */}
                            <button
                              onClick={() => handleRunJob(job.id, false, true)}
                              className="inline-flex items-center text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                              title="Mô phỏng 429 Quota Exceeded để kiểm tra cơ chế đổi model & backoff"
                            >
                              <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                              {isVi ? 'Test Quota' : 'Simulate 429'}
                            </button>

                            {/* Test simulate error button */}
                            <button
                              onClick={() => handleRunJob(job.id, true, false)}
                              className="inline-flex items-center text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 transition-colors"
                              title="Mô phỏng lỗi adapter để kiểm tra error state"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-500" />
                              {isVi ? 'Test Lỗi' : 'Simulate Error'}
                            </button>
                          </>
                        )}

                        {/* Cancel button if processing */}
                        {job.status === 'processing' && (
                          <button
                            onClick={() => handleCancelJob(job.id)}
                            className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors"
                          >
                            Hủy bỏ
                          </button>
                        )}

                        {/* Preview, Audit, Approve, and Regenerate buttons if completed */}
                        {job.status === 'completed' && output && (
                          <>
                            {/* Direct QA Audit Button */}
                            <button
                              onClick={() => setAuditModalJob(job)}
                              className="inline-flex items-center text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                              title={isVi ? "Kiểm tra chứng chỉ bất biến & Zero Active State Leak" : "Audit Immutability & Snapshots"}
                            >
                              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              {isVi ? 'Kiểm Định QA' : 'Audit'}
                            </button>

                            <button
                              onClick={() => setPreviewModalJob(job)}
                              className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                            >
                              <Maximize2 className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                              {isVi ? 'Xem & Phê Duyệt' : 'Preview & QA'}
                            </button>

                            {!isApproved && (
                              <button
                                onClick={() => handleApproveOutput(job.id, output.id)}
                                className="inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                {isVi ? 'Duyệt Keyframe' : 'Approve'}
                              </button>
                            )}

                            <button
                              onClick={() => handleRegenerateJob(job.id)}
                              className="inline-flex items-center text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title={isVi ? "Tạo Run mới kế thừa snapshot mà không ghi đè ảnh cũ" : "Regenerate new run"}
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              {isVi ? 'Tạo Run Mới' : 'Regenerate'}
                            </button>
                          </>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Xóa Job khỏi hàng đợi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {isVi ? 'Không có Job kết xuất nào phù hợp bộ lọc' : 'No Image Generation Jobs Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isVi
              ? 'Tất cả các job kết xuất được tạo trực tiếp từ Storyboard Shot với Character DNA Snapshots và Style Snapshots bất biến.'
              : 'Create a new generation job from a locked Storyboard Shot or click "Queue All Ep 9 Shots" to populate the pipeline.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={handleQueueAllEpisodeShots}
              className="inline-flex items-center text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <Layers className="w-4 h-4 mr-1.5" />
              {isVi ? 'Đưa toàn bộ Ep 9 vào hàng đợi' : 'Queue All Ep 9 Shots'}
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center text-xs font-bold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {isVi ? 'Tạo Job thủ công' : 'Create Custom Job'}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {promptModalJob && (
        <JobPromptModal
          job={promptModalJob}
          onClose={() => setPromptModalJob(null)}
          language={language}
        />
      )}

      {previewModalJob && (
        <JobPreviewModal
          job={previewModalJob}
          onClose={() => setPreviewModalJob(null)}
          onApproveOutput={handleApproveOutput}
          onRejectOutput={handleRejectOutput}
          onRegenerateJob={handleRegenerateJob}
          language={language}
        />
      )}

      {auditModalJob && (
        <JobIntegrityAuditModal
          job={auditModalJob}
          onClose={() => setAuditModalJob(null)}
          language={language}
        />
      )}

      {isCreateModalOpen && (
        <CreateJobModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onJobCreated={(jobId, runImmediately) => {
            setDb(storage.getDatabase());
            if (runImmediately) {
              handleRunJob(jobId);
            }
          }}
          language={language}
        />
      )}
    </div>
  );
};
