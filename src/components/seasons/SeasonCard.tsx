import React from 'react';
import { Season, LanguageMode } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';
import { CharacterService } from '../../services/characterService';
import { EpisodeService } from '../../services/episodeService';
import { StyleService } from '../../services/styleService';
import { CharacterAvatar } from '../shared/CharacterAvatar';
import {
  CalendarDays,
  Clapperboard,
  Palette,
  Users,
  ArrowRight,
  Plus,
  Sparkles,
} from 'lucide-react';

interface SeasonCardProps {
  season: Season;
  onOpenEpisodes: (seasonId: string) => void;
  language: LanguageMode;
}

export const SeasonCard: React.FC<SeasonCardProps> = ({
  season,
  onOpenEpisodes,
  language,
}) => {
  const episodes = EpisodeService.getEpisodesForSeason(season.id);
  const styleVersion = StyleService.getStyleVersionById(season.styleVersionId);

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all p-6 shadow-xl space-y-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              SEASON {season.seasonNumber}
            </span>
            <StatusBadge status={season.status} language={language} />
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">
            {season.title}
          </h3>
          {season.vietnameseTitle && (
            <p className="text-xs text-slate-400">{season.vietnameseTitle}</p>
          )}
        </div>

        <button
          onClick={() => onOpenEpisodes(season.id)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm shrink-0"
        >
          <span>{formatLabel('View Episodes', 'Xem danh sách tập')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
        {season.description}
      </p>

      {/* Theme & Meta Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">
            {formatLabel('Season Theme', 'Chủ đề mùa')}
          </span>
          <span className="text-slate-300 font-medium line-clamp-1">{season.theme}</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">
            {formatLabel('Episodes Capacity', 'Quy mô tập')}
          </span>
          <span className="text-slate-300 font-medium">
            {episodes.length} / {season.episodeCount} episodes
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">
            {formatLabel('Baseline Style', 'Phong cách quy chuẩn')}
          </span>
          <span className="text-amber-400 font-mono text-xs font-bold">
            {styleVersion?.version || 'v1.0'}
          </span>
        </div>
      </div>

      {/* Season Cast */}
      <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            {formatLabel('Main Cast', 'Dàn nhân vật')}:
          </span>
          <div className="flex items-center -space-x-1.5">
            {season.seasonCharacters.map((charId) => (
              <CharacterAvatar
                key={charId}
                characterId={charId}
                size="sm"
                className="ring-2 ring-slate-900"
              />
            ))}
          </div>
        </div>

        <span className="text-[11px] text-slate-500">
          {season.startDate} → {season.endDate}
        </span>
      </div>
    </div>
  );
};
