import React from 'react';
import { Download, Upload, RotateCcw, Globe, Sparkles, Film } from 'lucide-react';
import { Project, LanguageMode } from '../../types';
import { storageService } from '../../services/storageService';

interface HeaderProps {
  project: Project;
  language: LanguageMode;
  onLanguageChange: (lang: LanguageMode) => void;
  onOpenExportModal: () => void;
  onOpenImportModal: () => void;
  onResetSeed: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  language,
  onLanguageChange,
  onOpenExportModal,
  onOpenImportModal,
  onResetSeed,
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

      {/* Control Actions & Language Switcher */}
      <div className="flex items-center gap-3">
        {/* Language selector */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
          <button
            onClick={() => onLanguageChange('bilingual')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              language === 'bilingual'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="English + Tiếng Việt"
          >
            EN + VI
          </button>
          <button
            onClick={() => onLanguageChange('vi')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              language === 'vi'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tiếng Việt"
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
        </div>

        {/* JSON Backup & Restore Actions */}
        <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
            title="Export Studio Database as JSON"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Export Backup</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
            title="Import Studio Database JSON"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Import</span>
          </button>

          <button
            onClick={onResetSeed}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900 transition-colors"
            title="Reset Studio to Seed Foundation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Reset Seed</span>
          </button>
        </div>
      </div>
    </header>
  );
};
