/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProductionPack, Shot, StudioDatabase } from '../../types';
import { CharacterImageResolver, isVisualImage } from '../../services/characterImageResolver';
import {
  Layers,
  Image as ImageIcon,
  Lock,
  ExternalLink,
  Eye,
  X,
  FileCode,
  Tag,
  Hash,
  ShieldCheck,
} from 'lucide-react';

interface TraceableReferencesTabProps {
  pack: ProductionPack | null;
  shot: Shot;
  db: StudioDatabase;
}

export const TraceableReferencesTab: React.FC<TraceableReferencesTabProps> = ({
  pack,
  shot,
  db,
}) => {
  const [selectedPreviewRef, setSelectedPreviewRef] = useState<any | null>(null);

  if (!pack || !pack.references || pack.references.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
        <Layers className="w-10 h-10 text-slate-400 mx-auto" />
        <h4 className="font-bold text-sm text-slate-700">Chưa có tài liệu tham chiếu</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Production Pack của Shot này chưa được biên dịch tài liệu tham chiếu chuẩn hóa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Information */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                TRACEABLE REFERENCES
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {pack.references.length} TÀI LIỆU CHUẨN HÓA
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Tài Liệu Tham Chiếu Sản Xuất (Traceable Reference Set)
            </h3>
            <p className="text-xs text-slate-400">
              Bộ tài liệu tham chiếu bất biến đính kèm vào Google Flow để kiểm soát tính nhất quán thị giác của từng khung hình.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 shrink-0">
            <div><strong>Thứ tự:</strong> Xác định (Deterministic)</div>
            <div><strong>Hash Guard:</strong> Khóa trong Input Hash</div>
          </div>
        </div>
      </div>

      {/* 2. Reference Cards Grid (Deterministic Order Preserved) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pack.references.map((ref, idx) => {
          // Resolve visual thumbnail
          let previewUrl: string | undefined = undefined;

          if (isVisualImage(ref.thumbnailUrl)) {
            previewUrl = ref.thumbnailUrl;
          } else if (isVisualImage(ref.url)) {
            previewUrl = ref.url;
          } else if (ref.characterId) {
            const charVisual = CharacterImageResolver.resolveShotCharacterVisual(shot, ref.characterId, db);
            previewUrl = charVisual.imageUrl;
          } else if (ref.reference_type === 'STYLE') {
            previewUrl = '/assets/aistudio/references/styles/warm_pixar_style.jpg';
          }

          const hasVisual = isVisualImage(previewUrl);

          return (
            <div
              key={ref.reference_id}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              {/* Visual Preview Header */}
              <div
                className="relative aspect-video bg-slate-950 border-b border-slate-100 cursor-pointer group flex items-center justify-center overflow-hidden"
                onClick={() => {
                  setSelectedPreviewRef({ ...ref, previewUrl });
                }}
              >
                {hasVisual ? (
                  <img
                    src={previewUrl}
                    alt={ref.reference_id}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center p-4 text-slate-500 text-xs space-y-1">
                    <ImageIcon className="w-8 h-8 text-slate-700 mx-auto" />
                    <span className="font-mono text-[10px] text-slate-400 block">{ref.source}</span>
                  </div>
                )}

                {/* Index badge */}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-slate-950/80 text-white font-mono text-[10px] font-bold border border-white/20">
                  #{idx + 1}
                </div>

                {/* Type badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      ref.reference_type === 'CHARACTER'
                        ? 'bg-emerald-500 text-white'
                        : ref.reference_type === 'STYLE'
                        ? 'bg-amber-500 text-slate-950'
                        : ref.reference_type === 'STORYBOARD_REFERENCE'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {ref.reference_type}
                  </span>
                </div>

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                  <Eye className="w-4 h-4" />
                  <span>Xem Chi Tiết</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-900 truncate" title={ref.reference_id}>
                      {ref.reference_id}
                    </span>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 shrink-0">
                      v{ref.version || '1.0'}
                    </span>
                  </div>

                  <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                    {ref.purpose || 'Tài liệu tham chiếu chuẩn cho quá trình sinh ảnh'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 font-mono text-[10px] text-slate-400">
                  <div className="truncate" title={ref.source}>
                    <strong>Source:</strong> {ref.source}
                  </div>
                  {ref.characterId && (
                    <div>
                      <strong>Character:</strong> {ref.characterId}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Lightbox Inspection Modal */}
      {selectedPreviewRef && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPreviewRef(null)}
        >
          <div
            className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                  {selectedPreviewRef.reference_type}
                </span>
                <h4 className="font-mono font-bold text-sm truncate">
                  {selectedPreviewRef.reference_id}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreviewRef(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Preview Area */}
            <div className="p-6 bg-slate-950/50 flex-1 flex items-center justify-center min-h-[300px] overflow-hidden">
              {isVisualImage(selectedPreviewRef.previewUrl) ? (
                <img
                  src={selectedPreviewRef.previewUrl}
                  alt={selectedPreviewRef.reference_id}
                  className="max-h-[500px] max-w-full object-contain rounded-xl shadow-lg border border-slate-800"
                />
              ) : (
                <div className="text-center text-slate-400 space-y-2">
                  <ImageIcon className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-xs">Tài liệu tham chiếu cấu trúc (Non-raster reference path)</p>
                </div>
              )}
            </div>

            {/* Modal Details Footer */}
            <div className="p-5 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 space-y-2 font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <strong className="text-slate-400">Đường dẫn nguồn:</strong> {selectedPreviewRef.source}
                </div>
                <div>
                  <strong className="text-slate-400">Phiên bản:</strong> v{selectedPreviewRef.version || '1.0'}
                </div>
                {selectedPreviewRef.characterId && (
                  <div>
                    <strong className="text-slate-400">Nhân vật:</strong> {selectedPreviewRef.characterId}
                  </div>
                )}
                <div>
                  <strong className="text-slate-400">URL / Asset:</strong> {selectedPreviewRef.url}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 text-slate-400 text-[11px] font-sans">
                <strong>Mục đích:</strong> {selectedPreviewRef.purpose}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
