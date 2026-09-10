import React from 'react';
import { Episode, LanguageMode } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';
import { CharacterAvatar } from '../shared/CharacterAvatar';
import { CharacterService } from '../../services/characterService';
import { StyleService } from '../../services/styleService';
import {
  Clapperboard,
  ShieldCheck,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Users,
  Lock,
  Sparkles,
  BookOpen,
  Film,
} from 'lucide-react';

interface EpisodeCardProps {
  episode: Episode;
  onEdit: (episodeId: string) => void;
  onDelete: (episodeId: string) => void;
  onInspectSnapshot: (episodeId: string) => void;
  onOpenStoryboard?: (episodeId: string) => void;
  language: LanguageMode;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  onEdit,
  onDelete,
  onInspectSnapshot,
  onOpenStoryboard,
  language,
}) => {
  const allCharacters = [
    ...episode.characterIds,
    ...episode.supportingCharacterIds,
  ];

  const styleVersion = StyleService.getStyleVersionById(
    episode.styleVersionSnapshotId,
  );

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all p-6 shadow-xl space-y-4 relative group">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
              EPISODE {episode.episodeNumber}
            </span>
            <StatusBadge status={episode.status} language={language} />
            {episode.scenes && episode.scenes.length > 0 && (
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {episode.scenes.length} Scenes
              </span>
            )}
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {episode.duration}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">
            {episode.title}
          </h3>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onOpenStoryboard && (
            <button
              onClick={() => onOpenStoryboard(episode.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors shadow-xs"
              title="Mở Storyboard & Shot Breakdown Phase 3"
            >
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatLabel('Storyboard & Shots', 'Storyboard')}</span>
            </button>
          )}

          <button
            onClick={() => onInspectSnapshot(episode.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-colors"
            title="Inspect historical DNA & Style snapshot"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formatLabel('Inspect Snapshot', 'Xem Snapshot')}</span>
          </button>

          <button
            onClick={() => onEdit(episode.id)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Edit episode metadata"
          >
            <Edit className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={() => {
              if (confirm(`Delete Episode ${episode.episodeNumber}: ${episode.title}?`)) {
                onDelete(episode.id);
              }
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-900 transition-colors"
            title="Delete episode"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Story Idea Box */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
          {formatLabel('Story Idea', 'Ý tưởng cốt truyện')}:
        </span>
        <p className="text-slate-200 text-sm leading-relaxed font-medium">
          "{episode.storyIdea}"
        </p>

        {episode.educationalMessage && (
          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-900">
            <strong className="text-slate-300 font-semibold">
              {formatLabel('Educational Message', 'Giá trị giáo dục')}:
            </strong>{' '}
            {episode.educationalMessage}
          </p>
        )}
      </div>

      {/* Meta & Location */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-rose-400" />
          {episode.location}
        </span>
        <span>•</span>
        <span>Platform: {episode.targetPlatform}</span>
      </div>

      {/* Character & Historical Snapshot Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            {formatLabel('Cast', 'Nhân vật')}:
          </span>
          <div className="flex items-center -space-x-1.5">
            {allCharacters.map((charId) => (
              <CharacterAvatar
                key={charId}
                characterId={charId}
                size="sm"
                className="ring-2 ring-slate-900"
              />
            ))}
          </div>
        </div>

        {/* Snapshot Quick Pill */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Locked to:</span>
          <span className="text-amber-400 font-mono font-semibold">
            {Object.keys(episode.characterVersionSnapshots).length} DNA
          </span>
          <span>+</span>
          <span className="text-indigo-400 font-mono font-semibold">
            Style {styleVersion?.version || 'v1.0'}
          </span>
        </div>
      </div>
    </div>
  );
};
