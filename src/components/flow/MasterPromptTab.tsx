/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ProductionPack } from '../../types';
import { FlowPromptCompiler } from '../../services/flowPromptCompiler';
import {
  FileCode,
  Copy,
  Check,
  Download,
  ListOrdered,
  Eye,
  Layers,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface MasterPromptTabProps {
  pack: ProductionPack | null;
  copiedPrompt: boolean;
  onCopyPrompt: () => void;
  onDownloadPack: () => void;
}

export const MasterPromptTab: React.FC<MasterPromptTabProps> = ({
  pack,
  copiedPrompt,
  onCopyPrompt,
  onDownloadPack,
}) => {
  const [viewMode, setViewMode] = useState<'full' | 'sections'>('full');
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number | null>(null);

  const fullPrompt = useMemo(() => {
    if (!pack) return '';
    return FlowPromptCompiler.compile(pack);
  }, [pack]);

  // Parse prompt into 15 structured sections for inspector mode
  const parsedSections = useMemo(() => {
    if (!fullPrompt) return [];
    const rawBlocks = fullPrompt.split(/(?=\[\d+\.\s+[^\]]+\])/g);
    return rawBlocks
      .map((block) => {
        const match = block.match(/\[(\d+)\.\s+([^\]]+)\]/);
        if (!match) return null;
        const sectionNumber = parseInt(match[1], 10);
        const sectionTitle = match[2].trim();
        const content = block.replace(/\[\d+\.\s+[^\]]+\]\s*/, '').trim();
        return {
          number: sectionNumber,
          title: sectionTitle,
          header: `[${sectionNumber}. ${sectionTitle}]`,
          content,
          raw: block.trim(),
        };
      })
      .filter(Boolean) as Array<{
        number: number;
        title: string;
        header: string;
        content: string;
        raw: string;
      }>;
  }, [fullPrompt]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                15 SECTIONS STANDARDIZED
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PI & KEM &bull; MASTER PRODUCTION PROMPT
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Google Flow Master Prompt (Chuẩn Đầu Vào Sản Xuất 15 Phần)
            </h3>
            <p className="text-xs text-slate-400">
              Biên dịch từ Production Pack bất biến để sao chép trực tiếp vào Google Flow Studio với độ tái lập 100%.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('full')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                  viewMode === 'full'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                Toàn Văn
              </button>
              <button
                type="button"
                onClick={() => setViewMode('sections')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                  viewMode === 'sections'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                15 Phần
              </button>
            </div>

            <button
              type="button"
              onClick={onCopyPrompt}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedPrompt ? 'Đã Sao Chép!' : 'Chép Prompt'}
            </button>

            <button
              type="button"
              onClick={onDownloadPack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Xuất gói JSON Production Pack"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Technical Production Constraints Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] block">Tỷ Lệ / Vùng An Toàn</span>
          <span className="font-bold text-slate-800">16:9 (Crop 9:16 Shorts)</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] block">Phong Cách Khóa</span>
          <span className="font-bold text-slate-800 truncate block" title={pack?.style.styleName}>
            {pack?.style.styleName || '3D Animation'}
          </span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] block">Số Lượng Nhân Vật</span>
          <span className="font-bold text-slate-800">{pack?.characters.length || 0} nhân vật khóa</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] block">Số Tài Liệu Tham Chiếu</span>
          <span className="font-bold text-slate-800">{pack?.references.length || 0} tài liệu</span>
        </div>
      </div>

      {/* 3. Prompt View Area */}
      {viewMode === 'full' ? (
        /* Full Formatted Monospace View */
        <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>GOOGLE_FLOW_MASTER_PRODUCTION_PROMPT.txt</span>
            </div>
            <span>{fullPrompt.length} ký tự &bull; 15 Sections</span>
          </div>

          <pre className="p-5 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto max-h-[640px] whitespace-pre-wrap select-all">
            {fullPrompt}
          </pre>
        </div>
      ) : (
        /* 15 Sections Interactive Grid / Breakdown */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Section List (4 Cols) */}
          <div className="lg:col-span-4 space-y-2 max-h-[640px] overflow-y-auto pr-1 custom-scrollbar">
            {parsedSections.map((sec) => {
              const isSelected = selectedSectionIdx === sec.number;
              return (
                <button
                  key={sec.number}
                  type="button"
                  onClick={() => setSelectedSectionIdx(sec.number)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-6 h-6 rounded-lg font-mono font-bold flex items-center justify-center text-[11px] shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {sec.number}
                    </span>
                    <span className="font-bold truncate">{sec.title}</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-60 shrink-0">
                    {sec.content.length} ký tự
                  </span>
                </button>
              );
            })}
          </div>

          {/* Section Content Detail (8 Cols) */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-950 border border-slate-800 text-white space-y-4 shadow-inner">
            {(() => {
              const active =
                parsedSections.find((s) => s.number === selectedSectionIdx) ||
                parsedSections[0];

              if (!active) {
                return <div className="text-slate-500 text-xs">Không có dữ liệu phần.</div>;
              }

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs border border-indigo-500/30">
                        PHẦN {active.number}
                      </span>
                      <h4 className="font-bold text-sm text-white">{active.title}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(active.raw);
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors inline-flex items-center gap-1 font-mono"
                    >
                      <Copy className="w-3 h-3" />
                      Chép Phần Này
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                    {active.content}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
