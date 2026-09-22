import React from 'react';
import { Film } from 'lucide-react';
import { Project, LanguageMode } from '../../types';

interface HeaderProps {
  project: Project;
  language: LanguageMode;
  onLanguageChange: (lang: LanguageMode) => void;
  showLanguageSwitcher?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  language,
  onLanguageChange,
  showLanguageSwitcher = false,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Project Identity Display */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">
                {project.name}
              </span>
              <span className="text-slate-400 text-sm hidden sm:inline">
                / {project.vietnameseName}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Production Master
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {project.universe} • {project.targetAudience}
            </p>
          </div>
        </div>
      </div>

      {/* Control Actions: Only display Language Switcher if activated in System Settings */}
      <div className="flex items-center gap-3">
        {showLanguageSwitcher && (
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-medium animate-fadeIn">
            <button
              onClick={() => onLanguageChange('vi')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                language === 'vi'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tiếng Việt (Ngôn ngữ chính)"
            >
              Tiếng Việt
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                language === 'en'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="English"
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('bilingual')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                language === 'bilingual'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Song ngữ VI + EN (Bilingual Mode)"
            >
              VI + EN
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
