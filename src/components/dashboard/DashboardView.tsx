import React from 'react';
import { Project, LanguageMode } from '../../types';
import { CharacterService } from '../../services/characterService';
import { StyleService } from '../../services/styleService';
import { SeasonService } from '../../services/seasonService';
import { EpisodeService } from '../../services/episodeService';
import { CharacterAvatar } from '../shared/CharacterAvatar';
import { StatusBadge } from '../shared/StatusBadge';
import {
  Film,
  Dna,
  Palette,
  Image as ImageIcon,
  CalendarDays,
  Clapperboard,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface DashboardViewProps {
  project: Project;
  onNavigate: (view: string, id?: string) => void;
  language: LanguageMode;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  onNavigate,
  language,
}) => {
  const characters = CharacterService.getAllCharacters();
  const references = CharacterService.getAllReferences();
  const seasons = SeasonService.getAllSeasons();
  const episodes = EpisodeService.getAllEpisodes();
  const activeStyle = StyleService.getActiveStyleVersion();

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Studio Header Card */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Film className="w-3.5 h-3.5" />
              <span>{formatLabel('3D Animation Production Pipeline', 'Quy trình sản xuất hoạt hình 3D')}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {project.name}
            </h1>
            <h2 className="text-base sm:text-lg font-bold text-amber-400">
              {project.vietnameseName}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
              {project.description}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={() => onNavigate('characters')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md"
            >
              <Dna className="w-4 h-4" />
              <span>{formatLabel('Manage Character DNA', 'Quản lý DNA Nhân vật')}</span>
            </button>

            <button
              onClick={() => onNavigate('episodes')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all shadow-sm"
            >
              <Clapperboard className="w-4 h-4 text-rose-400" />
              <span>{formatLabel('Production Pipeline', 'Tiến độ tập phim')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Core Studio Architecture Card (Highlighting Character DNA as Source of Truth) */}
      <div className="rounded-2xl bg-amber-950/20 border border-amber-500/30 p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm text-amber-200 tracking-wide uppercase">
            {formatLabel(
              'Core Architecture Principle: Character DNA is the Source of Truth',
              'Nguyên Tắc Kiến Trúc Cốt Lõi: Character DNA Là Nguồn Chân Lý',
            )}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <span className="font-bold text-amber-400 block text-xs">
              1. {formatLabel('Provider-Independent Creative Layer', 'Tầng Dữ Liệu Sáng Tạo Độc Lập')}
            </span>
            <p className="text-slate-300 leading-relaxed">
              {formatLabel(
                'Projects, Characters, DNA, Global Styles, and Storyboards are stored independently. They never bind permanently to any single AI video tool.',
                'Dữ liệu nhân vật, DNA, phong cách và kịch bản được lưu trữ tách biệt hoàn toàn khỏi các nhà cung cấp video AI.',
              )}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <span className="font-bold text-amber-400 block text-xs">
              2. {formatLabel('Historical Version Snapshots', 'Quy Tắc Đóng Băng Snapshot Lịch Sử')}
            </span>
            <p className="text-slate-300 leading-relaxed">
              {formatLabel(
                'Episodes bind immutable snapshots of Character DNA and Styles. When Pi upgrades to DNA v2.0 in future episodes, Episode 1 continues using Pi v1.0.',
                'Mỗi tập phim liên kết với snapshot cố định. Khi nhân vật đổi sang phiên bản mới, các tập cũ vĩnh viễn không bị ghi đè.',
              )}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('characters')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Dna className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Registry</span>
          </div>
          <div className="text-2xl font-black text-white">{characters.length}</div>
          <div className="text-xs text-slate-400 font-medium">
            {formatLabel('Characters (5 Main)', '5 Nhân vật chính')}
          </div>
        </div>

        <div
          onClick={() => onNavigate('references')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <ImageIcon className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Sheets</span>
          </div>
          <div className="text-2xl font-black text-white">{references.length}</div>
          <div className="text-xs text-slate-400 font-medium">
            {formatLabel('Reference Sheets', 'Ảnh tham chiếu 3D')}
          </div>
        </div>

        <div
          onClick={() => onNavigate('style')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Palette className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Aesthetic</span>
          </div>
          <div className="text-2xl font-black text-white">{activeStyle?.version || 'v1.0'}</div>
          <div className="text-xs text-slate-400 font-medium">
            {formatLabel('Active Global Style', 'Phong cách 3D chung')}
          </div>
        </div>

        <div
          onClick={() => onNavigate('episodes')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Clapperboard className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Pipeline</span>
          </div>
          <div className="text-2xl font-black text-white">{episodes.length}</div>
          <div className="text-xs text-slate-400 font-medium">
            {formatLabel('Episodes in System', 'Tập phim đã đăng ký')}
          </div>
        </div>
      </div>

      {/* Characters Roster Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {formatLabel('Core Family Animation Roster', 'Dàn nhân vật chính trong vũ trụ')}
            </h3>
            <p className="text-xs text-slate-400">
              {formatLabel('Every character possesses dedicated DNA versions and multi-angle turnarounds.', 'Mỗi nhân vật đều có bộ DNA và góc chiếu đa chiều riêng biệt.')}
            </p>
          </div>

          <button
            onClick={() => onNavigate('characters')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>{formatLabel('View All', 'Xem toàn bộ')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {characters.map((char) => (
            <div
              key={char.id}
              onClick={() => onNavigate('character-dna', char.id)}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/80 transition-all cursor-pointer flex flex-col items-center text-center group"
            >
              <CharacterAvatar characterId={char.id} size="xl" className="mb-3" />
              <h4 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                {char.displayName}
              </h4>
              <p className="text-[11px] text-amber-400 font-medium mt-0.5">
                {char.role}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {char.englishName} ({char.vietnameseName})
              </p>
              <span className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                DNA Active
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Production Pipeline Highlight: Seed Episode 9 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white tracking-tight">
            {formatLabel('Active Production Spotlight', 'Tiêu điểm sản xuất hiện tại')}
          </h3>
          <button
            onClick={() => onNavigate('episodes')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>{formatLabel('View Pipeline', 'Xem tiến độ')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {episodes.slice(0, 1).map((ep) => (
          <div
            key={ep.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-lg space-y-3"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    EPISODE {ep.episodeNumber}
                  </span>
                  <StatusBadge status={ep.status} language={language} />
                </div>
                <h4 className="text-base font-bold text-white">
                  {ep.title}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('episodes')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
                >
                  {formatLabel('Manage Episode', 'Quản lý tập')}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              "{ep.storyIdea}"
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">{formatLabel('Participating Cast', 'Nhân vật')}:</span>
                <div className="flex items-center -space-x-1.5">
                  {[...ep.characterIds, ...ep.supportingCharacterIds].map((cid) => (
                    <CharacterAvatar key={cid} characterId={cid} size="sm" className="ring-2 ring-slate-900" />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Locked DNA Snapshot: 5 Characters + Style v1.0</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
