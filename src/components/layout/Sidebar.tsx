/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Dna,
  Image as ImageIcon,
  Palette,
  CalendarDays,
  Clapperboard,
  Video,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Info,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Character, LanguageMode } from '../../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, id?: string) => void;
  characters?: Character[];
  selectedCharacterId?: string;
  language: LanguageMode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  characters = [],
  selectedCharacterId,
  language,
}) => {
  const [charactersOpen, setCharactersOpen] = useState(true);
  const [seasonsOpen, setSeasonsOpen] = useState(true);
  const [pipelineRoadmapOpen, setPipelineRoadmapOpen] = useState(false);
  const [showArchModal, setShowArchModal] = useState(false);

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} (${vi})`;
  };

  const isActive = (view: string) => currentView === view;

  return (
    <>
      <aside className="w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col h-screen select-none shrink-0 overflow-hidden text-slate-200">
        {/* Studio Branding */}
        <div className="p-4 border-b border-slate-800/80 flex items-center gap-3 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-extrabold text-base ring-1 ring-white/20 shrink-0">
            P&K
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm tracking-tight text-white truncate">
                Pi & Kem Studio
              </h1>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Production System Active" />
            </div>
            <p className="text-xs text-slate-400 truncate">
              {language === 'vi' ? 'Studio Sản Xuất Hoạt Hình' : 'Animation Production Studio'}
            </p>
          </div>
        </div>

        {/* Core Architecture Principle Pill (With Interactive Modal Trigger) */}
        <div className="mx-3 mt-3">
          <button
            onClick={() => setShowArchModal(true)}
            className="w-full px-3 py-2 rounded-xl bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/30 text-amber-200 flex items-center justify-between gap-2 transition-all text-left group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {language === 'vi' ? 'Nguyên tắc cốt lõi' : 'Core Rule'}
                </span>
                <span className="block text-xs font-semibold text-slate-200 truncate">
                  Character DNA as Truth
                </span>
              </div>
            </div>
            <Info className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 custom-scrollbar text-sm">
          {/* Dashboard */}
          <button
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left font-medium transition-all ${
              isActive('dashboard')
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm font-semibold'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">{formatLabel('Dashboard', 'Tổng quan')}</span>
          </button>

          {/* Characters Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>{formatLabel('Characters', 'Nhân vật')}</span>
              <button
                onClick={() => setCharactersOpen(!charactersOpen)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                {charactersOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            {charactersOpen && (
              <div className="space-y-1 mt-1 pl-1">
                <button
                  onClick={() => onNavigate('characters')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                    isActive('characters')
                      ? 'bg-slate-800 text-amber-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="truncate">{formatLabel('All Characters', 'Tất cả nhân vật')}</span>
                  <span className="ml-auto text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                    5
                  </span>
                </button>

                <button
                  onClick={() => onNavigate('character-dna')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                    isActive('character-dna')
                      ? 'bg-slate-800 text-amber-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Dna className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{formatLabel('Character DNA', 'Nhận diện DNA')}</span>
                  <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                    v1.0
                  </span>
                </button>

                <button
                  onClick={() => onNavigate('references')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                    isActive('references')
                      ? 'bg-slate-800 text-amber-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-pink-400 shrink-0" />
                  <span className="truncate">{formatLabel('Model References', 'Ảnh tham chiếu 3D')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Visual Style */}
          <div className="pt-2">
            <button
              onClick={() => onNavigate('style')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left font-medium transition-all ${
                isActive('style')
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{formatLabel('Global 3D Style', 'Phong cách 3D chung')}</span>
              <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono">
                v1.0
              </span>
            </button>
          </div>

          {/* Seasons & Episodes */}
          <div className="pt-2">
            <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>{formatLabel('Production Pipeline', 'Sản xuất phim')}</span>
              <button
                onClick={() => setSeasonsOpen(!seasonsOpen)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                {seasonsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            {seasonsOpen && (
              <div className="space-y-1 mt-1 pl-1">
                <button
                  onClick={() => onNavigate('seasons')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                    isActive('seasons')
                      ? 'bg-slate-800 text-amber-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{formatLabel('Seasons', 'Mùa phim')}</span>
                  <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                    Season 1
                  </span>
                </button>

                <button
                  onClick={() => onNavigate('episodes')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                    isActive('episodes')
                      ? 'bg-slate-800 text-amber-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Clapperboard className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="truncate">{formatLabel('Episodes & Snapshots', 'Tập phim & Snapshot')}</span>
                  <span className="ml-auto text-xs bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">
                    Tập 9
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Providers Architecture */}
          <div className="pt-2">
            <button
              onClick={() => onNavigate('providers')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left font-medium transition-all ${
                isActive('providers')
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4 text-orange-400 shrink-0" />
              <div className="truncate">
                <span className="block truncate">{formatLabel('Video Providers', 'Nhà cấp video')}</span>
              </div>
              <span className="ml-auto text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-1.5 py-0.5 rounded font-mono">
                Decoupled
              </span>
            </button>
          </div>

          {/* Upcoming Pipeline Roadmap (Collapsible preview without cluttering current phase) */}
          <div className="pt-3 border-t border-slate-800/80 mt-3">
            <button
              onClick={() => setPipelineRoadmapOpen(!pipelineRoadmapOpen)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatLabel('Next Pipeline Stages', 'Các giai đoạn tiếp theo')}</span>
              </div>
              {pipelineRoadmapOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {pipelineRoadmapOpen && (
              <div className="mt-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                  <span>Stage 2: Story Generator & Script</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                  <span>Stage 3: Storyboard & Panels</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                  <span>Stage 4: Video Generation Jobs</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                  <span>Stage 5: Audio & Video Editor</span>
                </div>
                <p className="text-[11px] text-amber-400/80 italic pt-1">
                  {language === 'vi'
                    ? 'Đang ở Giai đoạn Nền tảng 1: Chuẩn hóa Character DNA.'
                    : 'Currently in Stage 1 Foundation: Character DNA is Source of Truth.'}
                </p>
              </div>
            )}
          </div>
        </nav>

        {/* Footer Info */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/50 text-xs text-slate-400 flex items-center justify-between">
          <span className="font-medium text-slate-300">Pi & Kem Studio</span>
          <span className="text-amber-400 font-mono text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            Phase 1 Foundation
          </span>
        </div>
      </aside>

      {/* Interactive Architecture Principles Detail Modal */}
      {showArchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 text-slate-200">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {formatLabel('Core Architecture Principles', 'Nguyên Tắc Kiến Trúc Cốt Lõi')}
                  </h3>
                  <p className="text-xs text-amber-400 font-semibold">
                    CHARACTER DNA IS THE SOURCE OF TRUTH
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowArchModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-amber-300">
                  1. {formatLabel('Provider-Independent Creative Layer', 'Tầng Dữ Liệu Sáng Tạo Độc Lập')}
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
                  2. {formatLabel('Historical Version Snapshots Guarantee', 'Quy Tắc Đóng Băng Snapshot Lịch Sử')}
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
                  3. {formatLabel('Decoupled Video Engines & Manual Flow', 'Tách Biệt Động Cơ & Quy Trình Thủ Công')}
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {formatLabel(
                    'Google Flow remains a manual workflow specification unless a real supported API is available. No fake video generation or simulated endpoints are allowed.',
                    'Google Flow duy trì dưới dạng quy trình làm việc thủ công trừ khi có API chính thức. Tuyệt đối không tạo API ảo.',
                  )}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowArchModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
              >
                {formatLabel('Close', 'Đóng')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
