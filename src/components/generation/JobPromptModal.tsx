import React, { useState } from 'react';
import { ImageGenerationJob, LanguageMode } from '../../types';
import {
  X,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Layers,
  Camera,
  MessageSquare,
  Eye,
  FileCode,
} from 'lucide-react';

interface JobPromptModalProps {
  job: ImageGenerationJob | null;
  onClose: () => void;
  language?: LanguageMode;
}

export const JobPromptModal: React.FC<JobPromptModalProps> = ({
  job,
  onClose,
  language = 'bilingual',
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'compiled' | 'breakdown' | 'dna'>('compiled');

  if (!job) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(job.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isVi = language === 'vi';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  {isVi ? 'Prompt Tạo Ảnh Khung Hình' : 'Shot Generation Prompt'}
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Scene {job.sceneNumber} &bull; Shot #{job.shotNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {job.shotId} &bull; Provider: <span className="text-amber-300 font-semibold">{job.provider}</span>
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

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('compiled')}
            className={`pb-2.5 text-xs font-bold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'compiled'
                ? 'text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{isVi ? 'Prompt Tổng Hợp (Compiled)' : 'Full Compiled Prompt'}</span>
          </button>

          <button
            onClick={() => setActiveTab('breakdown')}
            className={`pb-2.5 text-xs font-bold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'breakdown'
                ? 'text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isVi ? 'Phân Rã 8 Lớp (Breakdown)' : '8-Layer Breakdown'}</span>
          </button>

          <button
            onClick={() => setActiveTab('dna')}
            className={`pb-2.5 text-xs font-bold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'dna'
                ? 'text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isVi ? 'Snapshot Bất Biến (Audit)' : 'Locked Snapshots'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs custom-scrollbar">
          {activeTab === 'compiled' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">
                  {isVi ? 'Toàn bộ Prompt chuyển giao cho Adapter:' : 'Master Prompt Dispatched to Provider Adapter:'}
                </span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-semibold transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      {isVi ? 'Đã sao chép!' : 'Copied!'}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      {isVi ? 'Sao chép Prompt' : 'Copy Prompt'}
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-slate-200 leading-relaxed whitespace-pre-wrap select-all">
                {job.prompt}
              </div>

              {job.negativePrompt && (
                <div>
                  <span className="font-semibold text-rose-400 block mb-1">
                    Negative Prompt (Bảo toàn thẩm mỹ & không biến dạng):
                  </span>
                  <div className="bg-slate-950 p-3 rounded-xl border border-rose-900/30 text-rose-200/90 font-mono text-[11px] leading-relaxed">
                    {job.negativePrompt}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'breakdown' && (
            <div className="space-y-3">
              {job.promptBreakdown ? (
                <>
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> 1. Style DNA Snapshot (v{job.styleVersionName})
                    </span>
                    <p className="text-slate-300">{job.promptBreakdown.styleDna}</p>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> 2. Character DNA Snapshots
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {job.promptBreakdown.charactersDna?.map((char, idx) => (
                        <li key={idx}>{char}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-pink-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> 3. Reference Assets Locked
                    </span>
                    {job.promptBreakdown.referenceAssets?.length ? (
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {job.promptBreakdown.referenceAssets.map((ref, idx) => (
                          <li key={idx} className="font-mono text-[11px]">{ref}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 italic">Không có reference bổ sung</p>
                    )}
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> 4. Environment & Setting
                    </span>
                    <p className="text-slate-300">{job.promptBreakdown.environment}</p>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-sky-400 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" /> 5. Camera Framing & Lighting
                    </span>
                    <p className="text-slate-300">{job.promptBreakdown.cameraAndLighting}</p>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-orange-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> 6. Action & Emotion
                    </span>
                    <p className="text-slate-300">{job.promptBreakdown.actionAndEmotion}</p>
                  </div>

                  {job.promptBreakdown.dialogueCue && (
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                      <span className="font-bold text-violet-400 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> 7. Dialogue & Lip-sync Cue
                      </span>
                      <p className="text-slate-300 italic">{job.promptBreakdown.dialogueCue}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-400">Không có dữ liệu phân rã chi tiết.</p>
              )}
            </div>
          )}

          {activeTab === 'dna' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Chứng chỉ Bất Biến (Immutability Contract Verified)</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Job này được khởi tạo trực tiếp từ Storyboard Shot đã khóa. Job đã tự động đóng gói
                  phiên bản DNA nhân vật, tệp tham chiếu 3D và Style Snapshot tại thời điểm tạo, hoàn
                  toàn độc lập và không bao giờ bị ảnh hưởng nếu nhân vật hoặc style sau này thay đổi.
                </p>
              </div>

              {/* Character DNA snapshots table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950 px-4 py-2 font-bold text-slate-300 border-b border-slate-800">
                  Phiên Bản Nhân Vật Khóa (Locked Character Versions)
                </div>
                <div className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {Object.entries(job.characterDnaSnapshots).map(([charId, verId]) => (
                    <div key={charId} className="px-4 py-2.5 flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{charId}</span>
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        {job.characterVersionNames?.[charId] || verId} ({verId})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolved reference assets */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950 px-4 py-2 font-bold text-slate-300 border-b border-slate-800 flex items-center justify-between">
                  <span>Ảnh Tham Chiếu Khóa Thuộc Version Này ({job.referenceAssetIds.length})</span>
                  <span className="text-[10px] text-amber-400 font-mono">characters/{'{charId}'}/{'{verId}'}/</span>
                </div>
                <div className="divide-y divide-slate-800/60 bg-slate-900/60 max-h-40 overflow-y-auto custom-scrollbar">
                  {job.referenceAssetIds.length > 0 ? (
                    job.referenceAssetIds.map((refId) => (
                      <div key={refId} className="px-4 py-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-mono">{refId}</span>
                        <span className="text-slate-500 font-mono truncate max-w-[280px]">
                          {job.referenceAssetPaths[refId] || 'canonical-path'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-slate-500 italic text-center">
                      Không có tệp tham chiếu nào được gán cho version này.
                    </div>
                  )}
                </div>
              </div>

              {/* Style snapshot */}
              <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Global Style Snapshot ID:</span>
                  <span className="font-mono text-indigo-300 font-bold text-sm">
                    {job.styleVersionSnapshotId} (v{job.styleVersionName || '1.0'})
                  </span>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded font-bold">
                  Khóa Bất Biến
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <span>Độ phân giải: <strong className="text-slate-200">{job.params.resolution}</strong></span>
            <span>&bull;</span>
            <span>Tỉ lệ: <strong className="text-slate-200">{job.params.aspectRatio}</strong></span>
            <span>&bull;</span>
            <span>Seed: <strong className="text-slate-200">#{job.params.seed}</strong></span>
          </div>
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
