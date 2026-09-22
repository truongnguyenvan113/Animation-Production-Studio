import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  Eye,
  Youtube,
  Facebook,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { PublishingPack, PublishingRevision } from '../../types';
import { publishingService } from '../../services/publishingService';

interface RevisionHistoryTabProps {
  pack: PublishingPack;
  onPackUpdated: (updatedPack: PublishingPack) => void;
}

export const RevisionHistoryTab: React.FC<RevisionHistoryTabProps> = ({
  pack,
  onPackUpdated,
}) => {
  const [selectedRev, setSelectedRev] = useState<PublishingRevision | null>(
    pack.history && pack.history.length > 0 ? pack.history[0] : null
  );
  const [restoredSuccess, setRestoredSuccess] = useState(false);

  const historyList = pack.history || [];

  const handleRestore = (rev: PublishingRevision) => {
    const updated = publishingService.restoreRevision(pack.episodeId, rev.id);
    if (updated) {
      onPackUpdated(updated);
      setRestoredSuccess(true);
      setTimeout(() => setRestoredSuccess(false), 2500);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Lịch Sử Phiên Bản Gói Xuất Bản</h3>
            <p className="text-xs text-slate-400">
              Mỗi lần tạo mới hoặc lưu dấu mốc quan trọng, hệ thống sẽ tự động lưu lại một ảnh chụp (Snapshot) độc lập.
            </p>
          </div>
        </div>

        {restoredSuccess && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã khôi phục thành công!</span>
          </div>
        )}
      </div>

      {historyList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <History className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400">Chưa có phiên bản lịch sử nào được ghi nhận.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Version List (5 cols) */}
          <div className="md:col-span-5 space-y-2.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Danh Sách Phiên Bản ({historyList.length})
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
              {historyList.map((rev) => {
                const isSelected = selectedRev?.id === rev.id;
                return (
                  <div
                    key={rev.id}
                    onClick={() => setSelectedRev(rev)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-bold">
                          v{rev.version}
                        </span>
                        <span className="text-xs font-semibold text-slate-200 truncate max-w-[180px]">
                          {rev.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(rev.createdAt)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      Tiêu đề: {rev.snapshot.youtube?.title || 'Không có tiêu đề'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Version Detail (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            {selectedRev ? (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold">
                        Phiên bản v{selectedRev.version}
                      </span>
                      <h4 className="text-sm font-bold text-white">{selectedRev.label}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Đã lưu vào: {formatDate(selectedRev.createdAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestore(selectedRev)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục phiên bản này</span>
                  </button>
                </div>

                {/* YouTube Snapshot */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                    <Youtube className="w-3.5 h-3.5" />
                    <span>Tiêu Đề & Nội Dung YouTube Đã Lưu</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="font-semibold text-slate-100">
                      {selectedRev.snapshot.youtube?.title || 'Chưa có tiêu đề'}
                    </div>
                    <div className="text-slate-400 text-[11px] line-clamp-4 leading-relaxed whitespace-pre-wrap font-mono">
                      {selectedRev.snapshot.youtube?.description || 'Chưa có mô tả'}
                    </div>
                  </div>
                </div>

                {/* Facebook Snapshot */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold uppercase tracking-wider text-[11px]">
                    <Facebook className="w-3.5 h-3.5" />
                    <span>Bài Viết Facebook Đã Lưu</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[11px] line-clamp-4 leading-relaxed whitespace-pre-wrap">
                    {selectedRev.snapshot.facebook?.post || 'Chưa có bài viết'}
                  </div>
                </div>

                {/* Brief Snapshot */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Tóm Tắt Episode Brief</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1 text-slate-400">
                    <div>
                      <strong className="text-slate-200">Tên tập:</strong>{' '}
                      {selectedRev.snapshot.brief?.title}
                    </div>
                    <div>
                      <strong className="text-slate-200">Chủ đề:</strong>{' '}
                      {selectedRev.snapshot.brief?.theme}
                    </div>
                    <div>
                      <strong className="text-slate-200">Thông điệp:</strong>{' '}
                      {selectedRev.snapshot.brief?.message}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-xs">
                Chọn một phiên bản bên trái để xem nội dung chi tiết.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
