/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  Film,
  Dna,
  Image as ImageIcon,
  Palette,
  Clapperboard,
  ShieldCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Lock,
  Layers,
  ChevronRight,
  Info,
  FolderArchive,
} from 'lucide-react';
import {
  Project,
  Character,
  Episode,
  GlobalStyleVersion,
  CharacterReference,
  LanguageMode,
} from '../../types';
import { CharacterService } from '../../services/characterService';
import { EpisodeService } from '../../services/episodeService';
import { StyleService } from '../../services/styleService';
import { CharacterAvatar } from '../shared/CharacterAvatar';
import { StatusBadge } from '../shared/StatusBadge';

interface DashboardViewProps {
  project: Project;
  characters?: Character[];
  episodes?: Episode[];
  activeStyle?: GlobalStyleVersion;
  references?: CharacterReference[];
  onNavigate: (view: string, id?: string) => void;
  language: LanguageMode;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  characters: propCharacters,
  episodes: propEpisodes,
  activeStyle: propActiveStyle,
  references: propReferences,
  onNavigate,
  language,
}) => {
  const [showArchDetails, setShowArchDetails] = useState(false);

  // Safe fallback to services ensures zero runtime crashes even if caller passes partial props
  const characters = propCharacters || CharacterService.getAllCharacters() || [];
  const episodes = propEpisodes || EpisodeService.getAllEpisodes() || [];
  const activeStyle = propActiveStyle || StyleService.getActiveStyleVersion();
  const references = propReferences || CharacterService.getAllReferences() || [];

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} (${vi})`;
  };

  const activeEpisode = episodes && episodes.length > 0 ? episodes[0] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Studio Header & Project Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 shadow-md">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {formatLabel('Production Universe', 'Vũ Trụ Hoạt Hình')}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              3D CGI Family Series
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {language === 'vi' ? 'Studio Sản Xuất Hoạt Hình Pi & Kem' : 'Pi & Kem Animation Production Studio'}
          </h2>
          <p className="text-sm text-slate-300">
            {language === 'vi'
              ? 'Hệ thống quản lý sản xuất phim hoạt hình 3D gia đình – Character DNA là nguồn chân lý duy nhất.'
              : 'Central production management system for Pi & Kem 3D Animation Universe – Character DNA is the Source of Truth.'}
          </p>
        </div>

        {/* Action / Architecture Guarantee Button */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('story-generator')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            <span>{formatLabel('Story Generator (Phase 2)', 'Tạo Cốt Truyện (Phase 2)')}</span>
          </button>

          <button
            onClick={() => onNavigate('reference-library')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition-all hover:scale-[1.02]"
          >
            <FolderArchive className="w-4 h-4 text-amber-400" />
            <span>{formatLabel('Reference Library (Phase 4.4)', 'Thư Viện Tham Chiếu (Phase 4.4)')}</span>
          </button>

          <button
            onClick={() => setShowArchDetails(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-all hover:scale-[1.02]"
            title="View Core Architecture Principles"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{formatLabel('Architecture Rules', 'Nguyên tắc kiến trúc')}</span>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Production Status Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Project Status */}
        <div
          onClick={() => onNavigate('seasons')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Calendar className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80">
              Season 1
            </span>
          </div>
          <div className="text-2xl font-black text-white">13 Episodes</div>
          <div className="text-xs text-slate-400 font-medium mt-1">
            {formatLabel('Production Pipeline Active', 'Mùa 1 đang triển khai')}
          </div>
        </div>

        {/* Canonical Characters */}
        <div
          onClick={() => onNavigate('characters')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Users className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400/80">
              Canonical Cast
            </span>
          </div>
          <div className="text-2xl font-black text-white">{characters.length} Registered</div>
          <div className="text-xs text-slate-400 font-medium mt-1">
            {formatLabel('Ethan, Emma, Pi, Kem, Mochi', 'Gia đình 4 người + Cún Mochi')}
          </div>
        </div>

        {/* Character DNA & References */}
        <div
          onClick={() => onNavigate('character-dna')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Dna className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/80">
              Source of Truth
            </span>
          </div>
          <div className="text-2xl font-black text-white">DNA v1.0 Locked</div>
          <div className="text-xs text-slate-400 font-medium mt-1">
            {formatLabel('5 Model Turnaround Sheets', '5 Bộ DNA & Model Sheet')}
          </div>
        </div>

        {/* Active Global Style */}
        <div
          onClick={() => onNavigate('style')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Palette className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400/80">
              Visual Aesthetic
            </span>
          </div>
          <div className="text-2xl font-black text-white">{activeStyle?.version || 'v1.0'}</div>
          <div className="text-xs text-slate-400 font-medium mt-1">
            {formatLabel('Warm Family 3D Cinematic', 'Ánh sáng 3D ấm áp')}
          </div>
        </div>
      </div>

      {/* Canonical Characters Roster */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {formatLabel('Canonical Character Bible', 'Dàn nhân vật chuẩn hóa (Canonical Bible)')}
            </h3>
            <p className="text-xs text-slate-400">
              {formatLabel(
                'Identity, personality, and physical DNA remain persistent across all episodes and video providers.',
                'Đặc điểm nhận dạng và DNA nhân vật bất biến qua mọi tập phim và công cụ render.',
              )}
            </p>
          </div>

          <button
            onClick={() => onNavigate('characters')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>{formatLabel('View All Details', 'Xem chi tiết')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {characters.map((char) => {
            const isEthan = char.id === 'char_ethan';
            const isEmma = char.id === 'char_emma';
            const isPi = char.id === 'char_pi';
            const isKem = char.id === 'char_kem';
            const isMochi = char.id === 'char_mochi';

            let occupationOrAge = '';
            let keyTrait = '';

            if (isEthan) {
              occupationOrAge = 'Programmer / Software Dev';
              keyTrait = 'Funny, caring, loves football';
            } else if (isEmma) {
              occupationOrAge = 'Career Consultant';
              keyTrait = 'Warm, patient, loves travel';
            } else if (isPi) {
              occupationOrAge = '5–7 years old';
              keyTrait = 'Energetic, dancing & adventure';
            } else if (isKem) {
              occupationOrAge = 'Approx 2–3 years old';
              keyTrait = 'Cute, curious & mischievous';
            } else if (isMochi) {
              occupationOrAge = 'Cream Puppy (Dog)';
              keyTrait = 'Fluffy, floppy ears, playful';
            }

            return (
              <div
                key={char.id}
                onClick={() => onNavigate('character-dna', char.id)}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 transition-all cursor-pointer flex flex-col items-center text-center group shadow-sm"
              >
                <CharacterAvatar characterId={char.id} size="xl" className="mb-3 ring-2 ring-slate-800 group-hover:ring-amber-500/40" />
                <h4 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                  {char.displayName}
                </h4>
                <p className="text-xs text-amber-400 font-semibold mt-0.5">
                  {char.role}
                </p>
                <div className="mt-2 w-full pt-2 border-t border-slate-800/80 space-y-1">
                  <p className="text-[11px] font-medium text-slate-300 truncate">
                    {occupationOrAge}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {keyTrait}
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  DNA v1.0 Active
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Production Pipeline Spotlight: Episode 9 */}
      {activeEpisode && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {formatLabel('Current Production Spotlight', 'Tiêu điểm sản xuất hiện tại')}
              </h3>
              <p className="text-xs text-slate-400">
                {formatLabel('Episode locked with immutable character & style snapshots.', 'Tập phim liên kết snapshot DNA và phong cách cố định.')}
              </p>
            </div>
            <button
              onClick={() => onNavigate('episodes')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>{formatLabel('View All Episodes', 'Xem tất cả tập')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    EPISODE {activeEpisode.episodeNumber}
                  </span>
                  <StatusBadge status={activeEpisode.status} language={language} />
                </div>
                <h4 className="text-lg font-bold text-white">
                  {activeEpisode.title}
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onNavigate('storyboard', activeEpisode.id)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>{formatLabel('Storyboard (Phase 3)', 'Storyboard (Phase 3)')}</span>
                </button>

                <button
                  onClick={() => onNavigate('image-generation')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{formatLabel('Image Pipeline (Phase 4)', 'Tạo Ảnh (Phase 4)')}</span>
                </button>

                <button
                  onClick={() => onNavigate('episodes')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
                >
                  {formatLabel('Episode Snapshot', 'Chi tiết Snapshot')}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="font-semibold text-amber-400">Story Logline: </span>
              "{activeEpisode.storyIdea}"
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="text-slate-400 text-xs font-medium">
                  {formatLabel('Cast Members', 'Nhân vật tham gia')}:
                </span>
                <div className="flex items-center -space-x-1.5">
                  {[...(activeEpisode.characterIds || []), ...(activeEpisode.supportingCharacterIds || [])].map((cid) => (
                    <CharacterAvatar key={cid} characterId={cid} size="sm" className="ring-2 ring-slate-900" />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {formatLabel('Immutable Snapshot: 5 Cast DNA v1.0 + Style v1.0', 'Đóng băng snapshot: 5 Nhân vật DNA v1.0 + Phong cách v1.0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Production Activity & Season Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Season 1 Production Roadmap */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>{formatLabel('Season 1 Production Target', 'Kế hoạch sản xuất Mùa 1')}</span>
            </h4>
            <span className="text-xs text-amber-400 font-mono">13 Episodes</span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-200 font-medium">Ep 1–8: Pre-Production & Concept Archival</span>
              </div>
              <span className="text-slate-400 font-mono">Completed</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-200 font-bold">Ep 9: Cùng nhau vẽ tranh (Drawing Together)</span>
              </div>
              <span className="text-amber-400 font-mono font-semibold">Active In-Pipeline</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                <span>Ep 10–13: Summer Picnic & Soccer Game with Ba Trường</span>
              </div>
              <span className="text-slate-500 font-mono">Upcoming</span>
            </div>
          </div>
        </div>

        {/* Studio Production Activity Log */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>{formatLabel('Studio Production Activity', 'Nhật ký sản xuất studio')}</span>
            </h4>
            <span className="text-xs text-emerald-400 font-mono">Live</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <div>
                <p className="text-slate-200 font-medium">
                  {formatLabel(
                    'Canonical Character Bible synchronized: Ethan (Programmer), Emma (Career Consultant), Mochi (Puppy).',
                    'Đồng bộ Canonical Character Bible: Ethan (Lập trình viên), Emma (Tư vấn nghề nghiệp), Mochi (Cún con).',
                  )}
                </p>
                <span className="text-[10px] text-slate-500">Today • Character Registry</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <div>
                <p className="text-slate-200 font-medium">
                  {formatLabel(
                    'Historical snapshot locked for Episode 9 with Character DNA v1.0.',
                    'Đóng băng snapshot lịch sử cho Tập 9 với Character DNA v1.0.',
                  )}
                </p>
                <span className="text-[10px] text-slate-500">Episode Pipeline</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <div>
                <p className="text-slate-200 font-medium">
                  {formatLabel(
                    'Video Provider abstraction layer configured: Google Flow, Veo, Runway, Luma, Kling decoupled from creative DNA.',
                    'Cấu hình tầng trừu tượng nhà cấp video: Google Flow, Veo, Runway, Luma, Kling tách rời khỏi creative DNA.',
                  )}
                </p>
                <span className="text-[10px] text-slate-500">Provider Engine</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Architecture Principles Slide-Over / Modal */}
      {showArchDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 text-slate-200">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {formatLabel('Studio Architecture Details', 'Chi Tiết Kiến Trúc Studio')}
                  </h3>
                  <p className="text-xs text-amber-400 font-semibold">
                    CHARACTER DNA IS THE SOURCE OF TRUTH
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowArchDetails(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-amber-300">
                  {formatLabel('1. Provider-Independent Creative Layer', '1. Tầng Sáng Tạo Độc Lập')}
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {formatLabel(
                    'Character DNA, Global Styles, and Storyboards are stored independently. They never bind permanently to any single AI video tool (Google Flow, Veo, Runway, Luma, Kling).',
                    'Dữ liệu nhân vật, DNA, phong cách và kịch bản được lưu trữ tách biệt hoàn toàn khỏi các nhà cung cấp video AI.',
                  )}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-amber-300">
                  {formatLabel('2. Historical Snapshot Rule', '2. Quy Tắc Snapshot Lịch Sử')}
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {formatLabel(
                    'Episodes bind immutable snapshots of Character DNA and Styles. When Pi upgrades to DNA v2.0 in future episodes, Episode 1 continues using Pi v1.0.',
                    'Mỗi tập phim liên kết với snapshot cố định. Khi nhân vật đổi sang phiên bản mới, các tập cũ vĩnh viễn không bị ghi đè.',
                  )}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-amber-300">
                  {formatLabel('3. Video Provider Adapters', '3. Tầng Chuyển Đổi Nhà Cung Cấp Video')}
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {formatLabel(
                    'Google Flow remains a manual creative workflow specification unless a real supported API is available. Adapters compile prompts on-the-fly from the locked DNA without modifying the underlying database.',
                    'Google Flow là quy trình làm việc thủ công trừ khi có API chính thức. Tầng chuyển đổi chỉ biên dịch prompt từ snapshot mà không làm biến dạng dữ liệu gốc.',
                  )}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowArchDetails(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
              >
                {formatLabel('Close', 'Đóng')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
