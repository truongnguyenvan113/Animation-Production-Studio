import React, { useState, useEffect } from 'react';
import { Film, HardDrive } from 'lucide-react';
import { Project, LanguageMode } from '../../types';
import { storageService } from '../../services/storageService';

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
  const [syncStatus, setSyncStatus] = useState(() => storageService.getDiskSyncStatus());

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setSyncStatus(storageService.getDiskSyncStatus());
    });
    return unsub;
  }, []);

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

      {/* Control Actions & Storage Indicator */}
      <div className="flex items-center gap-3">
        {/* Project Folder Storage Badge */}
        <div
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] transition-colors"
          title={
            syncStatus.connected
              ? 'Dữ liệu được lưu tự động vào tệp data/database.json trong thư mục dự án'
              : 'Đang kết nối lưu trữ tệp dự án (offline cache active)'
          }
        >
          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          <span
            className={`w-2 h-2 rounded-full ${
              syncStatus.syncing
                ? 'bg-amber-400 animate-ping'
                : syncStatus.connected
                ? 'bg-emerald-400'
                : 'bg-slate-500'
            }`}
          />
          <span className="font-mono text-slate-300">data/database.json</span>
          {syncStatus.syncing && (
            <span className="text-amber-400 text-[10px] font-medium">Đang lưu...</span>
          )}
        </div>

        {/* Control Actions: Only display Language Switcher if activated in System Settings */}
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
