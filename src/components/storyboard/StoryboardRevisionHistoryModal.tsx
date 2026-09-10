import React, { useState } from 'react';
import { Storyboard, StoryboardRevision, Shot } from '../../types';
import {
  History,
  X,
  RotateCcw,
  Clock,
  Film,
  Layers,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface StoryboardRevisionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyboard: Storyboard;
  onRestoreRevision?: (revisionId: string) => void;
}

export const StoryboardRevisionHistoryModal: React.FC<StoryboardRevisionHistoryModalProps> = ({
  isOpen,
  onClose,
  storyboard,
  onRestoreRevision,
}) => {
  const [selectedRevId, setSelectedRevId] = useState<string | null>(null);

  if (!isOpen) return null;

  const revisions: StoryboardRevision[] = storyboard.revisions || [];
  const activeRev = revisions.find((r) => r.id === selectedRevId) || revisions[revisions.length - 1];

  const currentRevNum = typeof storyboard.revisionNumber === 'number'
    ? storyboard.revisionNumber
    : (Number(storyboard.episodeVersion) || 1);

  return (
    <div
      id="storyboard-revision-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">
                  Lịch sử Revisions Storyboard
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Revision hiện tại: v{currentRevNum}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Regeneration Safety &bull; Bảo toàn toàn bộ các bản chỉnh sửa sản xuất trước khi tạo lại
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Revisions List */}
          <div className="p-4 space-y-3 overflow-y-auto max-h-[500px]">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
              <span>Danh sách Revisions</span>
              <span>{revisions.length} bản lưu trữ</span>
            </div>

            {/* Current Active Working Revision */}
            <div className="p-3.5 rounded-xl border-2 border-indigo-500 bg-indigo-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold font-mono text-indigo-700">
                  Revision #{currentRevNum} (Đang làm việc)
                </span>
                <span className="text-[10px] px-2 py-0.5 font-bold uppercase rounded bg-indigo-600 text-white">
                  Hiện tại
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center space-x-2">
                  <Film className="w-3.5 h-3.5 text-slate-400" />
                  <span>{storyboard.totalShots} shots &bull; {storyboard.scenes.length} cảnh</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{storyboard.totalDurationSeconds}s tổng thời lượng</span>
                </div>
              </div>
            </div>

            {/* Archived Revisions */}
            {revisions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Chưa có bản lưu trữ cũ. Khi bạn bấm "Tạo lại Storyboard", bản hiện tại sẽ được tự động lưu vào đây.
              </div>
            ) : (
              revisions
                .slice()
                .reverse()
                .map((rev) => {
                  const isSelected = activeRev?.id === rev.id;
                  return (
                    <button
                      key={rev.id}
                      type="button"
                      onClick={() => setSelectedRevId(rev.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-950 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold font-mono">
                          Revision #{rev.revisionNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(rev.archivedAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center justify-between">
                        <span>{rev.totalShots} shots &bull; {rev.totalDurationSeconds}s</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      {rev.note && (
                        <p className="text-[11px] text-slate-500 mt-1 truncate">
                          {rev.note}
                        </p>
                      )}
                    </button>
                  );
                })
            )}
          </div>

          {/* Revision Preview Details */}
          <div className="md:col-span-2 p-5 overflow-y-auto max-h-[500px] space-y-4">
            {activeRev ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center">
                      Chi tiết Revision #{activeRev.revisionNumber}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        (Lưu trữ lúc: {new Date(activeRev.archivedAt).toLocaleString('vi-VN')})
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeRev.totalShots} shots &bull; {activeRev.totalDurationSeconds}s &bull; Trạng thái: {activeRev.status}
                    </p>
                  </div>

                  {onRestoreRevision && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Bạn có chắc chắn muốn khôi phục Revision #${activeRev.revisionNumber}? Bản hiện tại sẽ được tự động lưu trữ an toàn.`
                          )
                        ) {
                          onRestoreRevision(activeRev.id);
                          onClose();
                        }
                      }}
                      className="inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Khôi phục bản này
                    </button>
                  )}
                </div>

                {/* Scenes breakdown in this revision */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Phân cảnh & Shots trong Revision #{activeRev.revisionNumber}:
                  </span>
                  <div className="space-y-2">
                    {activeRev.scenes.map((sc) => (
                      <div
                        key={sc.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span className="font-mono">
                            Cảnh {sc.sceneNumber}: {sc.title || `Scene ${sc.sceneNumber}`}
                          </span>
                          <span className="text-[11px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {sc.shots.length} shots &bull;{' '}
                            {sc.shots.reduce((acc: number, s: Shot) => acc + (s.durationSeconds || 0), 0)}s
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Bối cảnh: {sc.location} &bull; Thời gian: {sc.timeOfDay}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                          {sc.shots.map((sh) => (
                            <div
                              key={sh.id}
                              className="bg-white p-2 rounded-lg border border-slate-200 text-[10px]"
                            >
                              <div className="font-bold font-mono text-slate-700">
                                Shot #{sh.shotNumber} ({sh.durationSeconds}s)
                              </div>
                              <div className="text-slate-500 truncate">{sh.shotType}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Chọn một Revision từ danh sách bên trái để xem chi tiết.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-1 text-emerald-700 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tất cả các bản Storyboard đều được bảo vệ toàn vẹn và không bị ghi đè.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
