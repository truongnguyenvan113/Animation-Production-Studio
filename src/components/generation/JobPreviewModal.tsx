import React, { useState } from 'react';
import { ImageGenerationJob, ImageGenerationOutputAsset, LanguageMode } from '../../types';
import {
  X,
  CheckCircle2,
  Download,
  ShieldCheck,
  Maximize2,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Cpu,
} from 'lucide-react';

interface JobPreviewModalProps {
  job: ImageGenerationJob | null;
  outputAsset?: ImageGenerationOutputAsset | null;
  onClose: () => void;
  onApproveOutput: (jobId: string, outputId: string) => void;
  language?: LanguageMode;
}

export const JobPreviewModal: React.FC<JobPreviewModalProps> = ({
  job,
  outputAsset,
  onClose,
  onApproveOutput,
  language = 'bilingual',
}) => {
  const [activeAssetIndex, setActiveAssetIndex] = useState(0);

  if (!job) return null;

  const outputs = job.outputAssets || [];
  const currentAsset =
    outputAsset || (outputs.length > 0 ? outputs[activeAssetIndex] : null);

  const isVi = language === 'vi';

  const handleDownload = () => {
    if (!currentAsset) return;
    const a = document.createElement('a');
    a.href = currentAsset.imageUrl;
    a.download = `frame_${job.episodeId}_s0${job.sceneNumber}_shot0${job.shotNumber}_${currentAsset.seed || 'render'}.svg`;
    a.click();
  };

  return (
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
                {currentAsset?.isApproved && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isVi ? 'Đã duyệt' : 'Approved Keyframe'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {job.shotId} &bull; Provider: <span className="text-amber-300 font-semibold">{job.provider}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {currentAsset && !currentAsset.isApproved && (
              <button
                onClick={() => {
                  onApproveOutput(job.id, currentAsset.id);
                }}
                className="inline-flex items-center text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {isVi ? 'Duyệt làm Keyframe của Shot' : 'Approve as Shot Keyframe'}
              </button>
            )}

            {currentAsset && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="Tải xuống tệp khung hình"
              >
                <Download className="w-4 h-4 mr-1" />
                {isVi ? 'Tải ảnh' : 'Download'}
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Main Visual Display */}
          {currentAsset ? (
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center min-h-[380px]">
              <img
                src={currentAsset.imageUrl}
                alt={`Generated frame for Shot ${job.shotNumber}`}
                className="w-full h-auto max-h-[58vh] object-contain rounded-xl"
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
                  Thời Gian Tạo
                </span>
                <span className="font-mono text-indigo-300 font-bold text-sm">
                  {job.executionDurationMs ? `${(job.executionDurationMs / 1000).toFixed(2)}s` : '1.85s'}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">
                  Trạng Thái Duyệt
                </span>
                <span
                  className={`font-semibold text-sm flex items-center gap-1 ${
                    currentAsset.isApproved ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {currentAsset.isApproved ? 'Đã duyệt (Keyframe)' : 'Chờ phê duyệt'}
                </span>
              </div>
            </div>
          )}

          {/* Canonical Storage Path & Immutability Badge */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px] truncate">
              <span className="text-slate-500">Đường dẫn tệp:</span>
              <span className="text-amber-400 truncate">{currentAsset?.storagePath}</span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                DNA: {Object.values(job.characterVersionNames || job.characterDnaSnapshots).join(', ') || 'Locked'}
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                Style: v{job.styleVersionName}
              </span>
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
  );
};
