import React from 'react';
import { LanguageMode, ProviderAdapterSpec } from '../../types';
import { ProviderAdapterService } from '../../services/providerAdapterService';
import {
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Code,
  Check,
} from 'lucide-react';

interface ProviderAdaptersViewProps {
  language: LanguageMode;
}

export const ProviderAdaptersView: React.FC<ProviderAdaptersViewProps> = ({
  language,
}) => {
  const adapters = ProviderAdapterService.getAllAdapters();

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {formatLabel('Provider Adapter Specifications', 'Quy cách Kết nối Nhà cung cấp Video AI')}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Decoupled Architecture
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {formatLabel(
                'Creative truth (Character DNA & Style) is permanently decoupled from specific video AI engines.',
                'Dữ liệu sáng tạo (DNA & Style) hoàn toàn độc lập với các công cụ video AI như Runway, Kling, Luma, Sora.',
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Decoupling Principle Box */}
      <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-indigo-300">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>{formatLabel('Why Provider Decoupling Matters', 'Tại sao kiến trúc cần độc lập khỏi Provider?')}</span>
        </div>
        <p className="leading-relaxed">
          {formatLabel(
            'AI video generation models evolve rapidly. By storing universal Character DNA and Style as vendor-neutral specifications, you can route Episode 9 shots to Kling for realistic child interactions, Runway Gen-3 for fluid camera pans, or Luma for dynamic lighting, without corrupting your character identity truth.',
            'Các mô hình video AI thay đổi liên tục. Bằng cách chuẩn hóa dữ liệu sáng tạo độc lập, xưởng phim có thể chuyển đổi linh hoạt giữa Kling, Runway Gen-3, Luma hay Sora tùy theo thế mạnh từng cảnh mà không sợ bị sai lệch danh tính nhân vật.',
          )}
        </p>
      </div>

      {/* Grid of Provider Adapters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {adapters.map((adapter) => (
          <div
            key={adapter.id}
            className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all p-5 flex flex-col justify-between shadow-lg space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {adapter.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {adapter.description}
                  </p>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shrink-0">
                  {adapter.category}
                </span>
              </div>

              {/* Supported Specs list */}
              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">{formatLabel('Max Duration per Clip', 'Thời lượng tối đa / clip')}:</span>
                  <span className="font-semibold text-white">{adapter.maxDurationSeconds}s</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">{formatLabel('Adapter Status', 'Trạng thái adapter')}:</span>
                  <span className="font-semibold text-emerald-400">
                    {adapter.status}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">
                    {formatLabel('Supported Aspect Ratios', 'Tỷ lệ khung hình hỗ trợ')}:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {adapter.supportedRatios.map((ar, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {ar}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">
                    {formatLabel('Prompt Syntax Pattern', 'Cấu trúc khuôn mẫu prompt')}:
                  </span>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-emerald-300 break-words">
                    {adapter.promptSyntaxPattern}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">
                    {formatLabel('DNA Independence Guarantee', 'Bảo đảm độc lập DNA')}:
                  </span>
                  <p className="text-[11px] text-slate-300 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    "{adapter.dnaIndependenceGuarantee}"
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Status: Registered & Verified</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Pipeline
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
