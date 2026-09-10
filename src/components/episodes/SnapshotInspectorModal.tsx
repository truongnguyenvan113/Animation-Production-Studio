import React from 'react';
import { Episode, LanguageMode } from '../../types';
import { EpisodeService } from '../../services/episodeService';
import { CharacterAvatar } from '../shared/CharacterAvatar';
import { StatusBadge } from '../shared/StatusBadge';
import {
  ShieldCheck,
  X,
  Dna,
  Palette,
  Lock,
  Calendar,
  Layers,
  Sparkles,
  Info,
  BookOpen,
  Film,
  Clock,
} from 'lucide-react';

interface SnapshotInspectorModalProps {
  episodeId: string;
  isOpen: boolean;
  onClose: () => void;
  language: LanguageMode;
}

export const SnapshotInspectorModal: React.FC<SnapshotInspectorModalProps> = ({
  episodeId,
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;

  const episode = EpisodeService.getEpisodeById(episodeId);
  if (!episode) return null;

  const snapshotDetails = EpisodeService.getEpisodeSnapshotDetails(episodeId);

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  {formatLabel('Historical Version Snapshot Audit', 'Kiểm định Snapshot Lịch sử')}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Episode {episode.episodeNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {episode.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Guiding Principle Banner */}
          <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300 uppercase tracking-wider text-[11px]">
              <Lock className="w-4 h-4" />
              {formatLabel('Immutable Creative Snapshot Guarantee', 'Cam kết Đóng băng Sáng tạo Bất biến')}
            </div>
            <p className="leading-relaxed text-slate-300">
              {formatLabel(
                `This episode is permanently anchored to the exact character DNA versions and visual style version captured at creation. If Pi or Kem subsequently update to DNA v2 or v3, Episode ${episode.episodeNumber} will NEVER be distorted or overwritten.`,
                `Tập phim này được cố định vĩnh viễn với phiên bản DNA và phong cách lúc tạo. Kể cả khi Pi hoặc Kem sau này nâng cấp lên DNA v2 hay v3, Tập ${episode.episodeNumber} sẽ TUYỆT ĐỐI KHÔNG bị biến dạng hay ghi đè.`,
              )}
            </p>
          </div>

          {/* Character DNA Snapshots */}
          <div>
            <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
              <Dna className="w-4 h-4 text-amber-400" />
              {formatLabel('Locked Character DNA Versions', 'Các bản DNA nhân vật đã khóa')}
            </h4>

            <div className="space-y-3">
              {snapshotDetails.characterSnapshots.map((item) => (
                <div
                  key={item.characterId}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <CharacterAvatar characterId={item.characterId} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {item.characterName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({item.role})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {item.versionData?.clothing || 'Attire snapshot locked'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:text-right">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                      DNA {item.version}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                      ID: {item.versionId.substring(0, 14)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Global Style Snapshot */}
          <div>
            <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              {formatLabel('Locked Global Style Snapshot', 'Bản phong cách hình ảnh đã khóa')}
            </h4>

            {snapshotDetails.styleSnapshot ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300">
                    Global Style {snapshotDetails.styleSnapshot.version}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {snapshotDetails.styleSnapshot.styleVersionId}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {snapshotDetails.styleSnapshot.styleData?.globalPrompt || 'Style rules snapshot locked.'}
                </p>
                <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 flex items-center gap-4">
                  <span>Aspect: {snapshotDetails.styleSnapshot.styleData?.aspectRatio || '16:9'}</span>
                  <span>FPS: {snapshotDetails.styleSnapshot.styleData?.fps || 24}</span>
                  <span>Lighting: {snapshotDetails.styleSnapshot.styleData?.lighting || 'Warm cinematic'}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-950 text-slate-500 rounded-lg">
                No explicit style version resolved.
              </div>
            )}
          </div>

          {/* Story Draft & Granular Scenes (Phase 2) */}
          {episode.storyDraft && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  {formatLabel('Story Draft & 3-Act Narrative', 'Kịch Bản 3 Hồi & Cốt Truyện')}
                </h4>
                <span className="text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                  {episode.scenes?.length || 0} Scenes
                </span>
              </div>

              {/* 3-Act Pills */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                    Act 1: Beginning
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {episode.storyDraft.beginning}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Act 2: Middle
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {episode.storyDraft.middle}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Act 3: Ending
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {episode.storyDraft.ending}
                  </p>
                </div>
              </div>

              {/* Granular Scene Summary */}
              {episode.scenes && episode.scenes.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    {formatLabel('Granular 3D Scenes & Character DNA Bindings', 'Phân Cảnh 3D & Khóa DNA')}
                  </span>
                  <div className="space-y-2">
                    {episode.scenes.map((sc) => (
                      <div
                        key={sc.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-300">
                            Scene {sc.sceneNumber}: {sc.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sc.location}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {sc.action}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {sc.characterIds.map((cId) => {
                            const ver = sc.characterDnaReferences[cId] || 'ver_1';
                            return (
                              <span
                                key={cId}
                                className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300 flex items-center gap-1 font-mono"
                              >
                                <span>{cId}</span>
                                <span className="text-emerald-400 font-bold">({ver})</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            {formatLabel(
              'Verified: Episode preserves snapshot integrity.',
              'Xác nhận: Tập phim bảo toàn tính toàn vẹn snapshot.',
            )}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            {formatLabel('Close', 'Đóng')}
          </button>
        </div>
      </div>
    </div>
  );
};
