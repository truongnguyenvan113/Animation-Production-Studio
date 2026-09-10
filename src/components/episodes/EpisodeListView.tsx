import React, { useState } from 'react';
import { Episode, EpisodeStatus, LanguageMode } from '../../types';
import { EpisodeService } from '../../services/episodeService';
import { SeasonService } from '../../services/seasonService';
import { EpisodeCard } from './EpisodeCard';
import { EpisodeEditorModal } from './EpisodeEditorModal';
import { SnapshotInspectorModal } from './SnapshotInspectorModal';
import {
  Clapperboard,
  Plus,
  Filter,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface EpisodeListViewProps {
  initialSeasonId?: string;
  onOpenStoryboard?: (episodeId: string) => void;
  language: LanguageMode;
}

export const EpisodeListView: React.FC<EpisodeListViewProps> = ({
  initialSeasonId,
  onOpenStoryboard,
  language,
}) => {
  const seasons = SeasonService.getAllSeasons();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(
    initialSeasonId || 'all',
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEpisodeId, setEditingEpisodeId] = useState<string | undefined>(undefined);
  const [inspectingEpisodeId, setInspectingEpisodeId] = useState<string | null>(null);

  const [episodes, setEpisodes] = useState<Episode[]>(EpisodeService.getAllEpisodes());

  const refreshEpisodes = () => {
    setEpisodes(EpisodeService.getAllEpisodes());
  };

  const filteredEpisodes = episodes.filter((ep) => {
    const matchSeason = selectedSeasonId === 'all' || ep.seasonId === selectedSeasonId;
    const matchStatus = selectedStatus === 'all' || ep.status === selectedStatus;
    return matchSeason && matchStatus;
  });

  const handleCreateNew = () => {
    setEditingEpisodeId(undefined);
    setIsEditorOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingEpisodeId(id);
    setIsEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    EpisodeService.deleteEpisode(id);
    refreshEpisodes();
  };

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-rose-600 to-orange-600 text-white shadow-lg shadow-rose-600/20">
            <Clapperboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {formatLabel('Episode Production Pipeline', 'Quy trình sản xuất tập phim')}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                {filteredEpisodes.length} {filteredEpisodes.length === 1 ? 'Episode' : 'Episodes'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {formatLabel(
                'Episodes anchor locked Character DNA & Style snapshots to guarantee cross-provider continuity.',
                'Mỗi tập phim sở hữu bản snapshot DNA & phong cách cố định, chống trôi ngoại hình xuyên suốt quá trình render.',
              )}
            </p>
          </div>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:border-amber-500 focus:outline-none"
          >
            <option value="all">{formatLabel('All Seasons', 'Tất cả mùa')}</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                Season {s.seasonNumber}: {s.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{formatLabel('Create Episode', 'Tạo tập mới')}</span>
          </button>
        </div>
      </div>

      {/* Episode Cards Grid */}
      {filteredEpisodes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-slate-400">
          <Clapperboard className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-semibold">{formatLabel('No episodes found', 'Không có tập phim nào')}</p>
          <button
            onClick={handleCreateNew}
            className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Episode</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredEpisodes.map((ep) => (
            <EpisodeCard
              key={ep.id}
              episode={ep}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onInspectSnapshot={(id) => setInspectingEpisodeId(id)}
              onOpenStoryboard={onOpenStoryboard}
              language={language}
            />
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <EpisodeEditorModal
          isOpen={isEditorOpen}
          episodeId={editingEpisodeId}
          seasonId={selectedSeasonId !== 'all' ? selectedSeasonId : undefined}
          onClose={() => setIsEditorOpen(false)}
          onSaved={() => {
            refreshEpisodes();
          }}
          language={language}
        />
      )}

      {/* Snapshot Inspector Modal */}
      {inspectingEpisodeId && (
        <SnapshotInspectorModal
          isOpen={!!inspectingEpisodeId}
          episodeId={inspectingEpisodeId}
          onClose={() => setInspectingEpisodeId(null)}
          language={language}
        />
      )}
    </div>
  );
};
