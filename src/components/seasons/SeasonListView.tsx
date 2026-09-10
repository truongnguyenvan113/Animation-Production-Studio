import React from 'react';
import { Season, LanguageMode } from '../../types';
import { SeasonService } from '../../services/seasonService';
import { SeasonCard } from './SeasonCard';
import { CalendarDays, Plus, Clapperboard, Sparkles } from 'lucide-react';

interface SeasonListViewProps {
  onOpenEpisodes: (seasonId: string) => void;
  language: LanguageMode;
}

export const SeasonListView: React.FC<SeasonListViewProps> = ({
  onOpenEpisodes,
  language,
}) => {
  const seasons = SeasonService.getAllSeasons();

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
          <div className="p-3 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {formatLabel('Production Seasons', 'Mùa phim (Seasons)')}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {seasons.length} {seasons.length === 1 ? 'Season' : 'Seasons'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {formatLabel(
                'Seasonal production schedules, character rosters, and thematic narrative arcs.',
                'Lộ trình sản xuất theo mùa, phân bổ nhân vật và các tuyến nội dung cốt lõi.',
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Season Cards List */}
      <div className="grid grid-cols-1 gap-5">
        {seasons.map((s) => (
          <SeasonCard
            key={s.id}
            season={s}
            onOpenEpisodes={onOpenEpisodes}
            language={language}
          />
        ))}
      </div>
    </div>
  );
};
