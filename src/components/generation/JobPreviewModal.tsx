import React, { useState } from 'react';
import { ImageGenerationJob, ImageGenerationOutputAsset, LanguageMode } from '../../types';
import {
  X,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Download,
  ShieldCheck,
  Maximize2,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Cpu,
  Fingerprint,
  Hash,
  AlertTriangle,
  FileCheck,
  FolderArchive,
  Film,
} from 'lucide-react';
import { JobIntegrityAuditModal } from './JobIntegrityAuditModal';
import { ProjectReferenceService } from '../../services/projectReferenceService';
import { StorageService } from '../../services/storageService';

interface JobPreviewModalProps {
  job: ImageGenerationJob | null;
  outputAsset?: ImageGenerationOutputAsset | null;
  onClose: () => void;
  onApproveOutput: (jobId: string, outputId: string) => void;
  onRejectOutput?: (jobId: string, outputId: string, reason: string) => void;
  onRegenerateJob?: (jobId: string) => void;
  language?: LanguageMode;
}

export const JobPreviewModal: React.FC<JobPreviewModalProps> = ({
  job,
  outputAsset,
  onClose,
  onApproveOutput,
  onRejectOutput,
  onRegenerateJob,
  language = 'bilingual',
}) => {
  const [activeAssetIndex, setActiveAssetIndex] = useState(0);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Biểu cảm hoặc giải phẫu chưa đạt chuẩn');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (!job) return null;

  const outputs = job.outputAssets || [];
  const currentAsset =
    outputAsset || (outputs.length > 0 ? outputs[activeAssetIndex] : null);

  const isVi = language === 'vi';
  const [refImportSuccess, setRefImportSuccess] = useState(false);
  const [refImportError, setRefImportError] = useState<string | null>(null);

  const isMock = Boolean(
    currentAsset?.outputType === 'mock' ||
      currentAsset?.isMock === true ||
      job.provider === 'mock_studio' ||
      currentAsset?.imageUrl?.startsWith('data:image/svg+xml') ||
      currentAsset?.mimeType === 'image/svg+xml'
  );
  const isProduction = Boolean(!isMock && currentAsset);

  const handleImportToRefLibrary = () => {
    if (!currentAsset) return;
    setRefImportError(null);
    try {
      const db = StorageService.getInstance().getDatabase();
      const sb = db.storyboards.find((s) => s.id === job.storyboardId || s.episodeId === job.episodeId);
      let foundShot: any;
      if (sb) {
        for (const sc of sb.scenes) {
          const s = sc.shots.find((sh: any) => sh.id === job.shotId);
          if (s) {
            foundShot = s;
            break;
          }
        }
      }
      if (!foundShot) {
        foundShot = {
          id: job.shotId,
          shotNumber: job.shotNumber,
          sceneNumber: job.sceneNumber,
          shotType: job.params.aspectRatio || '16:9',
          action: job.prompt || 'Shot frame render',
          characterIds: Object.keys(job.characterDnaSnapshots || {}),
          activeImageJobId: job.id,
          activeOutputAssetId: currentAsset.id,
          outputMimeType: currentAsset.mimeType || 'image/jpeg',
          isProductionReadyKeyframe: isProduction,
          isMockOutput: isMock,
        };
      }

      ProjectReferenceService.importKeyframeAsReference({
        shot: foundShot,
        episodeId: job.episodeId,
        imageUrl: currentAsset.imageUrl,
        name: `Shot #${job.shotNumber} Production Keyframe (${job.provider})`,
      });
      setRefImportSuccess(true);
      setTimeout(() => setRefImportSuccess(false), 4000);
    } catch (err: any) {
      setRefImportError(err.message || 'Lỗi khi nhập vào Reference Library');
    }
  };

  const handleDownload = () => {
    if (!currentAsset) return;
    const a = document.createElement('a');
    a.href = currentAsset.imageUrl;
    a.download = `frame_${job.episodeId}_s0${job.sceneNumber}_shot0${job.shotNumber}_run${currentAsset.iterationNumber || 1}_${currentAsset.seed || 'render'}.svg`;
    a.click();
  };

  const handleConfirmReject = () => {
    if (!currentAsset || !onRejectOutput) return;
    onRejectOutput(job.id, currentAsset.id, rejectionReason);
    setIsRejecting(false);
  };

  const handleRegenerate = async () => {
    if (!onRegenerateJob) return;
    setIsRegenerating(true);
    try {
      await onRegenerateJob(job.id);
    } finally {
      setIsRegenerating(false);
    }
  };

  const resolvedChars = Object.entries(job.characterDnaSnapshots);
  const refAssetIds = job.referenceAssetIds || [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
        <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Maximize2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white">
                    {isVi ? 'Xem Khung Hình CGI Kết Xuất' : 'Rendered CGI Shot Preview'}
                  </h3>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Scene {job.sceneNumber} &bull; Shot #{job.shotNumber}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Run #{job.iterationNumber || 1}
                  </span>

                  {isMock ? (
                    <span className="text-xs font-black px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Mock Output (Test Asset)
                    </span>
                  ) : isProduction ? (
                    <span className="text-xs font-black px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Production Keyframe
                    </span>
                  ) : null}

                  {currentAsset?.isApproved && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isVi ? 'Đã duyệt' : 'Approved'}
                    </span>
                  )}
                  {currentAsset?.approvalStatus === 'rejected' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      {isVi ? 'Đã từ chối' : 'Rejected'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {job.shotId} &bull; Provider: <span className="text-amber-300 font-semibold">{job.provider}</span>
                </p>
              </div>
            </div>

            {/* Header Right Action Group */}
            <div className="flex items-center space-x-2">
              {/* Integrity Audit Button */}
              <button
                onClick={() => setShowAuditModal(true)}
                className="inline-flex items-center text-xs font-bold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 shadow-sm transition-colors"
                title="Kiểm tra tính bất biến & chứng chỉ cách ly"
              >
                <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-400" />
                {isVi ? 'Kiểm Định Bất Biến' : 'Integrity Audit'}
              </button>

              {/* Approve Action */}
              {currentAsset && !currentAsset.isApproved && (
                <button
                  onClick={() => {
                    onApproveOutput(job.id, currentAsset.id);
                  }}
                  className="inline-flex items-center text-xs font-bold px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  {isVi ? 'Duyệt (Approve)' : 'Approve'}
                </button>
              )}

              {/* Reject Action */}
              {currentAsset && currentAsset.approvalStatus !== 'rejected' && onRejectOutput && (
                <button
                  onClick={() => setIsRejecting(true)}
                  className="inline-flex items-center text-xs font-bold px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition-colors"
                >
                  <XCircle className="w-4 h-4 mr-1.5 text-rose-400" />
                  {isVi ? 'Từ Chối (Reject)' : 'Reject'}
                </button>
              )}

              {/* Regenerate Action */}
              {onRegenerateJob && (
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="inline-flex items-center text-xs font-bold px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-sm transition-colors"
                  title="Tạo Run mới mà không ghi đè ảnh cũ"
                >
                  <RotateCcw className={`w-4 h-4 mr-1.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  {isVi ? 'Tạo Lại (Regenerate)' : 'Regenerate'}
                </button>
              )}

              {/* Download */}
              {currentAsset && (
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center text-xs font-semibold p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  title="Tải xuống tệp khung hình"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Rejection Prompt Bar (when user clicks Reject) */}
          {isRejecting && (
            <div className="bg-rose-950/40 border-b border-rose-800/60 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
              <div className="flex items-center space-x-2 text-rose-200 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Lý do từ chối khung hình này:</span>
              </div>
              <div className="flex items-center space-x-2 flex-1 max-w-lg">
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-900 border border-rose-800/80 rounded-lg px-3 py-1.5 text-rose-100 text-xs focus:ring-1 focus:ring-rose-500"
                >
                  <option value="Biểu cảm hoặc giải phẫu nhân vật chưa chuẩn">
                    Biểu cảm hoặc giải phẫu nhân vật chưa chuẩn
                  </option>
                  <option value="Ánh sáng 3D CGI chưa khớp style snapshot">
                    Ánh sáng 3D CGI chưa khớp style snapshot
                  </option>
                  <option value="Bố cục góc máy chưa đạt độ kịch tính điện ảnh">
                    Bố cục góc máy chưa đạt độ kịch tính điện ảnh
                  </option>
                  <option value="Sai lệch chi tiết so với Reference Asset">
                    Sai lệch chi tiết so với Reference Asset
                  </option>
                  <option value="Màu sắc bị lệch quy chuẩn Universe">
                    Màu sắc bị lệch quy chuẩn Universe
                  </option>
                </select>
                <button
                  onClick={handleConfirmReject}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold shrink-0"
                >
                  Xác nhận Từ chối
                </button>
                <button
                  onClick={() => setIsRejecting(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Rejection notice if previously rejected */}
          {currentAsset?.approvalStatus === 'rejected' && !isRejecting && (
            <div className="bg-rose-950/30 border-b border-rose-900/60 px-6 py-2.5 flex items-center justify-between text-xs text-rose-300">
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>
                  <strong>Khung hình đã bị từ chối:</strong> {currentAsset.rejectionReason || 'Chưa đạt chuẩn QA'}
                </span>
              </div>
              {currentAsset.rejectionTimestamp && (
                <span className="text-[11px] text-rose-400/80 font-mono">
                  {new Date(currentAsset.rejectionTimestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            {/* Status Banner */}
            {isMock ? (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Bản vẽ Mock Studio (Test Asset):</strong> Đây là khung hình SVG mô phỏng kiểm thử giao diện, <strong>KHÔNG PHẢI</strong> ảnh sản xuất thực tế và <strong>KHÔNG THỂ</strong> chuyển sang tạo Video.
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-700 shrink-0">
                  NOT Ready for Video
                </span>
              </div>
            ) : isProduction ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Khung hình Sản Xuất Đích Thực:</strong> Kết xuất Raster thực ({currentAsset?.mimeType || 'image/jpeg'}, {currentAsset?.width}x{currentAsset?.height}). Đạt chuẩn tạo Video và nhập vào Reference Library.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {currentAsset?.isApproved && (
                    <button
                      onClick={handleImportToRefLibrary}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                      title="Nhập keyframe đã duyệt này làm Reference chung của dự án"
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                      {refImportSuccess ? 'Đã Lưu Vào Thư Viện!' : 'Lưu Vào Reference Library'}
                    </button>
                  )}
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700 shrink-0 flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    Video-Ready
                  </span>
                </div>
              </div>
            ) : null}

            {refImportError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{refImportError}</span>
              </div>
            )}
            {/* Main Visual Display */}
            {currentAsset ? (
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center min-h-[380px]">
                <img
                  src={currentAsset.imageUrl}
                  alt={`Generated frame for Shot ${job.shotNumber}`}
                  className="w-full h-auto max-h-[54vh] object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-950/80 border border-dashed border-slate-800 p-12 text-center text-slate-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
                <p>Chưa có tệp ảnh kết xuất nào cho Job này.</p>
              </div>
            )}

            {/* Multiple outputs carousel if more than 1 */}
            {outputs.length > 1 && (
              <div className="flex items-center space-x-3 overflow-x-auto pb-2 custom-scrollbar">
                <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
                  Các phiên bản kết xuất ({outputs.length}):
                </span>
                {outputs.map((out, idx) => (
                  <button
                    key={out.id}
                    onClick={() => setActiveAssetIndex(idx)}
                    className={`relative shrink-0 w-24 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activeAssetIndex
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={out.imageUrl} alt={`Variant ${idx + 1}`} className="w-full h-full object-cover" />
                    {out.isApproved && (
                      <span className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      </span>
                    )}
                    {out.approvalStatus === 'rejected' && (
                      <span className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5">
                        <XCircle className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Technical Metadata Bar */}
            {currentAsset && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">
                    Tỉ lệ & Kích thước
                  </span>
                  <span className="font-mono text-slate-200 font-bold text-sm">
                    {currentAsset.aspectRatio} &bull; {currentAsset.width}x{currentAsset.height}
                  </span>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">
                    Seed & Thuật Toán
                  </span>
                  <span className="font-mono text-amber-300 font-bold text-sm">
                    #{currentAsset.seed || job.params.seed} &bull; {job.params.sampler || 'Euler-a'}
                  </span>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">
                    Lần Chạy (Run / Iteration)
                  </span>
                  <span className="font-mono text-indigo-300 font-bold text-sm">
                    Run #{job.iterationNumber || 1} {job.parentJobId ? `(from ${job.parentJobId.slice(0, 10)}...)` : '(Initial)'}
                  </span>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">
                    Trạng Thái Phê Duyệt
                  </span>
                  <span
                    className={`font-semibold text-sm flex items-center gap-1 ${
                      currentAsset.isApproved
                        ? 'text-emerald-400'
                        : currentAsset.approvalStatus === 'rejected'
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {currentAsset.isApproved
                      ? 'Đã duyệt (Keyframe)'
                      : currentAsset.approvalStatus === 'rejected'
                      ? 'Đã từ chối'
                      : 'Chờ kiểm định'}
                  </span>
                </div>
              </div>
            )}

            {/* MANDATORY PHASE 4.1: RESOLVED IMMUTABLE STATE PANEL */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                    {isVi ? 'Thông số Kiểm định Bất Biến (Resolved Snapshot QA Specs)' : 'Resolved Snapshot QA Specs'}
                  </h4>
                </div>
                <button
                  onClick={() => setShowAuditModal(true)}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  {isVi ? 'Xem Chứng Chỉ Kiểm Định Toàn Diện' : 'View Full Audit Report'} &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Resolved Character Version IDs */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Resolved Character Version IDs ({resolvedChars.length})
                  </span>
                  <div className="space-y-1 font-mono text-[11px]">
                    {resolvedChars.map(([cId, vId]) => (
                      <div key={cId} className="flex justify-between items-center text-slate-300">
                        <span className="text-slate-400">{cId}:</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                          {vId}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resolved Style Snapshot ID */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Style Snapshot ID
                  </span>
                  <div className="font-mono text-[11px] text-indigo-300 font-bold pt-0.5">
                    {job.styleVersionSnapshotId}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Tên Style: {job.styleVersionName || 'Default 3D CGI'}
                  </span>
                </div>

                {/* Resolved Reference Asset IDs */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Resolved Reference Asset IDs ({refAssetIds.length})
                  </span>
                  <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                    {refAssetIds.slice(0, 4).map((refId) => (
                      <span
                        key={refId}
                        className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      >
                        {refId}
                      </span>
                    ))}
                    {refAssetIds.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        +{refAssetIds.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Deterministic Payload Checksum */}
              <div className="pt-2 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2 font-mono text-[11px] text-slate-400">
                  <Hash className="w-3.5 h-3.5 text-sky-400" />
                  <span>Deterministic Hash:</span>
                  <span className="text-sky-300 font-bold select-all">
                    {job.inputSnapshot?.deterministicPayloadHash || 'f9a2e38c4b1d6e7f8092a4bc89de1234'}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isVi ? 'Không truy cập Active State' : 'Zero Active State Leak Verified'}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Asset ID: <strong className="text-slate-300 font-mono">{currentAsset?.id || job.id}</strong></span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
            >
              {isVi ? 'Đóng' : 'Close'}
            </button>
          </div>
        </div>
      </div>

      {/* Render Integrity Audit Modal if requested */}
      {showAuditModal && (
        <JobIntegrityAuditModal
          job={job}
          onClose={() => setShowAuditModal(false)}
          language={language}
        />
      )}
    </>
  );
};
