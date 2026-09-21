import React from 'react';
import { Character, CharacterVersion, LanguageMode } from '../../types';
import { CharacterService } from '../../services/characterService';
import { CharacterVersionService } from '../../services/characterVersionService';
import { CharacterAvatar } from '../shared/CharacterAvatar';
import {
  History,
  X,
  CheckCircle2,
  Lock,
  Layers,
  Calendar,
  Sparkles,
  ArrowRight,
  FileCheck,
} from 'lucide-react';

interface VersionHistoryModalProps {
  characterId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectVersion: (versionId: string) => void;
  language: LanguageMode;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  characterId,
  isOpen,
  onClose,
  onSelectVersion,
  language,
}) => {
  if (!isOpen) return null;

  const character = CharacterService.getCharacterById(characterId);
  if (!character) return null;

  const versions = CharacterVersionService.getVersionsForCharacter(characterId);

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <CharacterAvatar characterId={character.id} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  {character.displayName} — {formatLabel('DNA Version History', 'Lịch sử phiên bản DNA')}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {versions.length} {versions.length === 1 ? 'Snapshot' : 'Snapshots'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {formatLabel(
                  'Historical snapshots are immutable to ensure past episodes never alter visual identity.',
                  'Các phiên bản lịch sử được đóng băng vĩnh viễn nhằm bảo toàn tính nhất quán của các tập phim.',
                )}
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

        {/* Timeline Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {versions.map((ver, idx) => {
            const isCurrentActive = character.activeVersionId === ver.id;
            const referencingEpisodes = CharacterVersionService.getReferencingEpisodes(ver.id);

            return (
              <div
                key={ver.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrentActive
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <CharacterAvatar characterId={character.id} versionId={ver.id} size="sm" />
                    <span className="text-base font-mono font-bold text-amber-400">
                      {ver.version}
                    </span>
                    {isCurrentActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Active Default DNA
                      </span>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(ver.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectVersion(ver.id);
                      onClose();
                    }}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    <span>{formatLabel('Inspect DNA', 'Xem chi tiết')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Change notes */}
                <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                  <strong className="text-slate-400 font-medium">
                    {formatLabel('Change Notes', 'Ghi chú thay đổi')}:
                  </strong>{' '}
                  {ver.changeNotes || 'Initial baseline version'}
                </p>

                {/* Locked episode snapshots */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Lock className="w-3 h-3 text-indigo-400" />
                    {formatLabel('Locked Episodes', 'Tập phim liên kết')}:
                  </span>

                  {referencingEpisodes.length === 0 ? (
                    <span className="text-slate-400 text-[11px] italic">
                      {formatLabel('None (Available for future episodes)', 'Chưa liên kết tập nào')}
                    </span>
                  ) : (
                    referencingEpisodes.map((epTitle, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium"
                      >
                        {epTitle}
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            {formatLabel(
              'Rule: Historical episode snapshots remain protected at all times.',
              'Nguyên tắc: Các bản snapshot của tập phim lịch sử được bảo vệ tuyệt đối.',
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
