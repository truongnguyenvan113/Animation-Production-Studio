import React from 'react';
import {
  LayoutDashboard,
  Users,
  Dna,
  Image as ImageIcon,
  HeartHandshake,
  Palette,
  CalendarDays,
  Clapperboard,
  BookOpen,
  Layers,
  FileCode,
  Video,
  ListOrdered,
  Mic2,
  Scissors,
  History,
  Share2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { NavigationId } from './NavigationTypes';
import { LanguageMode } from '../../types';

interface SidebarProps {
  currentNav: NavigationId;
  onNavigate: (nav: NavigationId) => void;
  language: LanguageMode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  onNavigate,
  language,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    characters: true,
    visualStyle: true,
    storyboard: false,
    videoProduction: true,
    audio: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} (${vi})`;
  };

  const isActive = (id: NavigationId) => currentNav === id;

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col h-screen select-none shrink-0 overflow-hidden">
      {/* Brand Studio Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-3 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold text-lg ring-1 ring-white/20">
          P&K
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-sm tracking-tight text-white truncate">
              Pi & Kem Studio
            </h1>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {language === 'vi'
              ? 'Hệ thống Quản lý Sản xuất 3D'
              : '3D Animation Production Pipeline'}
          </p>
        </div>
      </div>

      {/* Core Principle Callout Banner */}
      <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
        <div className="text-[11px] leading-tight">
          <strong className="text-amber-300 block font-semibold uppercase tracking-wider text-[10px]">
            Core Architecture Rule
          </strong>
          {language === 'vi'
            ? 'Character DNA là nguồn chân lý bất biến'
            : 'Character DNA is the Source of Truth'}
        </div>
      </div>

      {/* Navigation Links Scrollable */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 text-sm font-medium">
        {/* Dashboard */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            isActive('dashboard')
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">{formatLabel('Dashboard', 'Tổng quan')}</span>
        </button>

        {/* Characters (With sub-items) */}
        <div className="pt-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>{formatLabel('Characters', 'Nhân vật')}</span>
            <button
              onClick={() => toggleSection('characters')}
              className="p-1 text-slate-400 hover:text-white"
            >
              {expandedSections.characters ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {expandedSections.characters && (
            <div className="space-y-0.5 mt-0.5 pl-1">
              <button
                onClick={() => onNavigate('characters')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('characters')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{formatLabel('All Characters', 'Tất cả nhân vật')}</span>
                <span className="ml-auto text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                  4+1
                </span>
              </button>

              <button
                onClick={() => onNavigate('character-dna')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('character-dna')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Dna className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{formatLabel('Character DNA', 'Bản chất & nhận diện')}</span>
                <span className="ml-auto text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded">
                  v1.0
                </span>
              </button>

              <button
                onClick={() => onNavigate('character-references')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('character-references')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span className="truncate">{formatLabel('Character References', 'Ảnh tham chiếu')}</span>
              </button>

              <button
                onClick={() => onNavigate('supporting-characters')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('supporting-characters')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span className="truncate">{formatLabel('Supporting Characters', 'Nhân vật phụ')}</span>
                <span className="ml-auto text-[10px] text-amber-400 font-mono">Mochi</span>
              </button>
            </div>
          )}
        </div>

        {/* Visual Style (Global Style) */}
        <div className="pt-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>{formatLabel('Visual Style', 'Phong cách')}</span>
            <button
              onClick={() => toggleSection('visualStyle')}
              className="p-1 text-slate-400 hover:text-white"
            >
              {expandedSections.visualStyle ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {expandedSections.visualStyle && (
            <div className="space-y-0.5 mt-0.5 pl-1">
              <button
                onClick={() => onNavigate('visual-style')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('visual-style')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{formatLabel('Global Style', 'Phong cách chung')}</span>
                <span className="ml-auto text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 py-0.2 rounded font-mono">
                  v1.0
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Seasons */}
        <button
          onClick={() => onNavigate('seasons')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            isActive('seasons')
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{formatLabel('Seasons', 'Mùa phim')}</span>
          <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
            Season 1
          </span>
        </button>

        {/* Episodes */}
        <button
          onClick={() => onNavigate('episodes')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            isActive('episodes')
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Clapperboard className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="truncate">{formatLabel('Episodes', 'Tập phim')}</span>
          <span className="ml-auto text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">
            Ep 9 Seed
          </span>
        </button>

        {/* Story Generator */}
        <button
          onClick={() => onNavigate('story-generator')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            isActive('story-generator')
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">{formatLabel('Story Generator', 'Trình phát triển truyện')}</span>
          <span className="ml-auto text-[9px] text-slate-400 font-mono">Stage 2</span>
        </button>

        {/* Storyboard */}
        <div className="pt-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>{formatLabel('Storyboard', 'Bảng phân cảnh')}</span>
            <button
              onClick={() => toggleSection('storyboard')}
              className="p-1 text-slate-400 hover:text-white"
            >
              {expandedSections.storyboard ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {expandedSections.storyboard && (
            <div className="space-y-0.5 mt-0.5 pl-1">
              <button
                onClick={() => onNavigate('storyboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('storyboard')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{formatLabel('Storyboard Panels', 'Khung cảnh')}</span>
              </button>

              <button
                onClick={() => onNavigate('storyboard-images')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('storyboard-images')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{formatLabel('Storyboard Images', 'Ảnh phân cảnh')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Master Prompts */}
        <button
          onClick={() => onNavigate('master-prompts')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            isActive('master-prompts')
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="truncate">{formatLabel('Master Prompts', 'Prompt tổng')}</span>
          <span className="ml-auto text-[9px] text-slate-400 font-mono">Stage 2</span>
        </button>

        {/* Video Production (Decoupled Provider Architecture) */}
        <div className="pt-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>{formatLabel('Video Production', 'Sản xuất video')}</span>
            <button
              onClick={() => toggleSection('videoProduction')}
              className="p-1 text-slate-400 hover:text-white"
            >
              {expandedSections.videoProduction ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {expandedSections.videoProduction && (
            <div className="space-y-0.5 mt-0.5 pl-1">
              <button
                onClick={() => onNavigate('video-production')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('video-production')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="truncate">{formatLabel('Provider Architecture', 'Kiến trúc nhà cấp')}</span>
                <span className="ml-auto text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded">
                  Decoupled
                </span>
              </button>

              <button
                onClick={() => onNavigate('video-production-google-flow')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('video-production-google-flow')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">Google Flow</span>
                <span className="ml-auto text-[9px] text-slate-400 font-mono">Adapter</span>
              </button>

              <button
                onClick={() => onNavigate('video-production-veo-api')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('video-production-veo-api')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Veo API</span>
                <span className="ml-auto text-[9px] text-slate-400 font-mono">Adapter</span>
              </button>

              <button
                onClick={() => onNavigate('video-production-runway')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('video-production-runway')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">Runway</span>
                <span className="ml-auto text-[9px] text-slate-400 font-mono">Adapter</span>
              </button>

              <button
                onClick={() => onNavigate('video-production-luma')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('video-production-luma')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span className="truncate">Luma</span>
                <span className="ml-auto text-[9px] text-slate-400 font-mono">Adapter</span>
              </button>

              <button
                onClick={() => onNavigate('video-production-kling')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('video-production-kling')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">Kling</span>
                <span className="ml-auto text-[9px] text-slate-400 font-mono">Adapter</span>
              </button>
            </div>
          )}
        </div>

        {/* Production Queue */}
        <button
          onClick={() => onNavigate('production-queue')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            isActive('production-queue')
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <ListOrdered className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{formatLabel('Production Queue', 'Hàng đợi sản xuất')}</span>
        </button>

        {/* Audio */}
        <div className="pt-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>{formatLabel('Audio', 'Âm thanh')}</span>
            <button
              onClick={() => toggleSection('audio')}
              className="p-1 text-slate-400 hover:text-white"
            >
              {expandedSections.audio ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {expandedSections.audio && (
            <div className="space-y-0.5 mt-0.5 pl-1">
              <button
                onClick={() => onNavigate('audio-voice')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('audio-voice')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Mic2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">{formatLabel('Voice', 'Giọng nói')}</span>
              </button>
              <button
                onClick={() => onNavigate('audio-music')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('audio-music')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Mic2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span className="truncate">{formatLabel('Music', 'Âm nhạc')}</span>
              </button>
              <button
                onClick={() => onNavigate('audio-sfx')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
                  isActive('audio-sfx')
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Mic2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{formatLabel('Sound Effects', 'Hiệu ứng âm thanh')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Video Editor */}
        <button
          onClick={() => onNavigate('video-editor')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            isActive('video-editor')
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Scissors className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="truncate">{formatLabel('Video Editor', 'Trình chỉnh sửa')}</span>
        </button>

        {/* Render History */}
        <button
          onClick={() => onNavigate('render-history')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            isActive('render-history')
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="truncate">{formatLabel('Render History', 'Lịch sử render')}</span>
        </button>

        {/* Export & Publish */}
        <button
          onClick={() => onNavigate('export-publish')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            isActive('export-publish')
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{formatLabel('Export & Publish', 'Xuất & đăng')}</span>
        </button>
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/50 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Pi & Kem Studio v1.0</span>
        <span className="text-amber-400 font-mono">Phase 1 Foundation</span>
      </div>
    </aside>
  );
};
