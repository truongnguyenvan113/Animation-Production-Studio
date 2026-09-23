import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Sparkles,
  FileText,
  Youtube,
  Facebook,
  Share2,
  History,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Calendar,
} from 'lucide-react';
import { PublishingPack, Episode } from '../../types';
import { storageService } from '../../services/storageService';
import { publishingService } from '../../services/publishingService';
import { EpisodeBriefTab } from './EpisodeBriefTab';
import { YouTubeTab } from './YouTubeTab';
import { FacebookTab } from './FacebookTab';
import { ExportPackageTab } from './ExportPackageTab';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { TemplateSettingsTab } from './TemplateSettingsTab';

interface PublishingStudioWorkspaceProps {
  initialEpisodeId: string;
  onBackToLibrary: () => void;
}

export const PublishingStudioWorkspace: React.FC<PublishingStudioWorkspaceProps> = ({
  initialEpisodeId,
  onBackToLibrary,
}) => {
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>(initialEpisodeId);
  const [pack, setPack] = useState<PublishingPack>(() =>
    publishingService.getOrCreatePublishingPack(initialEpisodeId)
  );
  const [activeTab, setActiveTab] = useState<
    'brief' | 'youtube' | 'facebook' | 'export' | 'history' | 'templates'
  >('youtube');
  const [copiedHeader, setCopiedHeader] = useState(false);

  const db = storageService.getDatabase();
  const episodes = db.episodes || [];
  const currentEpisode = episodes.find((e) => e.id === selectedEpisodeId);

  // Sync pack whenever episodeId changes or initialEpisodeId updates
  useEffect(() => {
    if (initialEpisodeId && initialEpisodeId !== selectedEpisodeId) {
      setSelectedEpisodeId(initialEpisodeId);
      const currentPack = publishingService.getOrCreatePublishingPack(initialEpisodeId);
      setPack(currentPack);
    }
  }, [initialEpisodeId]);

  const handleSelectEpisode = (newEpisodeId: string) => {
    setSelectedEpisodeId(newEpisodeId);
    const updatedPack = publishingService.getOrCreatePublishingPack(newEpisodeId);
    setPack(updatedPack);
  };

  const handlePackUpdated = (updatedPack: PublishingPack) => {
    setPack(updatedPack);
  };

  const handleQuickCopyPack = () => {
    const fullText = `=== GÓI XUẤT BẢN KEM TIVI ===
Tập: ${pack.episodeBrief.title}
YouTube Title: ${pack.youtube.title}
YouTube Tags: ${pack.youtube.hashtags.join(' ')}
Facebook Post:
${pack.facebook.post}`;
    navigator.clipboard.writeText(fullText);
    setCopiedHeader(true);
    setTimeout(() => setCopiedHeader(false), 2000);
  };

  // Readiness stats from canonical pack.status
  const isVideoReady = pack.status?.videoReady ?? !!(pack.assets?.finalVideoUrl || pack.youtube?.videoUrl || pack.assets?.finalVideoAssetId || pack.youtube?.videoAssetId);
  const isThumbReady = pack.status?.thumbnailReady ?? !!(pack.assets?.thumbnailUrl || pack.youtube?.thumbnailUrl || pack.assets?.thumbnailAssetId || pack.youtube?.thumbnailAssetId);
  const isYTReady = pack.status?.youtubeReady ?? !!(pack.youtube?.title && pack.youtube?.description);
  const isFBReady = pack.status?.facebookReady ?? !!(pack.facebook?.post);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Breadcrumb & Episode Switcher Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToLibrary}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center justify-center shrink-0"
            title="Quay lại Thư viện phát hành"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Không Gian Phát Hành (Publishing Workspace)
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-400">{pack.id}</span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              {/* Episode Dropdown */}
              <div className="relative inline-block">
                <select
                  value={selectedEpisodeId}
                  onChange={(e) => handleSelectEpisode(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-bold text-sm focus:outline-hidden focus:border-amber-500 cursor-pointer"
                >
                  {episodes.map((ep) => (
                    <option key={ep.id} value={ep.id}>
                      {ep.title} (EP{ep.episodeNumber})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {pack.episodeBrief.theme && (
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                  {pack.episodeBrief.theme}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Readiness Badges & Quick Action */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lifecycle Status selector */}
          <div className="relative inline-block">
            <select
              value={pack.overallStatus || 'draft'}
              onChange={(e) => {
                const updated = publishingService.updateOverallStatus(pack.episodeId, e.target.value as any);
                setPack(updated);
              }}
              className={`appearance-none pl-2.5 pr-7 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                pack.overallStatus === 'published'
                  ? 'bg-purple-950/40 text-purple-300 border-purple-500/50'
                  : pack.overallStatus === 'scheduled'
                  ? 'bg-blue-950/40 text-blue-300 border-blue-500/50'
                  : pack.overallStatus === 'ready'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-950 text-slate-400 border-slate-700'
              }`}
            >
              <option value="draft">Bản nháp (Draft)</option>
              <option value="ready">Sẵn sàng (Ready)</option>
              <option value="scheduled">Đã lên lịch (Scheduled)</option>
              <option value="published">Đã phát hành (Published)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status chips */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
            <span className="text-slate-400">Tiến độ:</span>
            <span
              className={`font-semibold ${
                isVideoReady ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              Video {isVideoReady ? '✓' : '—'}
            </span>
            <span className="text-slate-700">|</span>
            <span
              className={`font-semibold ${
                isThumbReady ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              Thumb {isThumbReady ? '✓' : '—'}
            </span>
            <span className="text-slate-700">|</span>
            <span
              className={`font-semibold ${
                isYTReady ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              YT {isYTReady ? '✓' : '—'}
            </span>
            <span className="text-slate-700">|</span>
            <span
              className={`font-semibold ${
                isFBReady ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              FB {isFBReady ? '✓' : '—'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleQuickCopyPack}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Sao chép nhanh tóm tắt gói phát hành"
          >
            {copiedHeader ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Sao chép nhanh</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto custom-scrollbar pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('brief')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'brief'
              ? 'bg-slate-900 border-t border-x border-slate-700 text-amber-300'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>1. Thông tin tập (Brief)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('youtube')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'youtube'
              ? 'bg-slate-900 border-t border-x border-slate-700 text-rose-300'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Youtube className="w-4 h-4 text-rose-500" />
          <span>2. YouTube Studio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('facebook')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'facebook'
              ? 'bg-slate-900 border-t border-x border-slate-700 text-sky-300'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Facebook className="w-4 h-4 text-sky-500" />
          <span>3. Facebook Fanpage</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'export'
              ? 'bg-slate-900 border-t border-x border-slate-700 text-emerald-300'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Share2 className="w-4 h-4 text-emerald-400" />
          <span>4. Gói xuất bản & Sao chép</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-slate-900 border-t border-x border-slate-700 text-indigo-300'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <History className="w-4 h-4 text-indigo-400" />
          <span>5. Lịch sử ({pack.history?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'templates'
              ? 'bg-slate-900 border-t border-x border-slate-700 text-slate-200'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-500" />
          <span>6. Thư viện mẫu</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-slate-950 rounded-2xl">
        {activeTab === 'brief' && (
          <EpisodeBriefTab
            key={pack.episodeId}
            pack={pack}
            episode={currentEpisode}
            onPackUpdated={handlePackUpdated}
            onNavigateToTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'youtube' && (
          <YouTubeTab key={pack.episodeId} pack={pack} onPackUpdated={handlePackUpdated} />
        )}

        {activeTab === 'facebook' && (
          <FacebookTab key={pack.episodeId} pack={pack} onPackUpdated={handlePackUpdated} />
        )}

        {activeTab === 'export' && (
          <ExportPackageTab
            key={pack.episodeId}
            pack={pack}
            onNavigateToTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'history' && (
          <RevisionHistoryTab key={pack.episodeId} pack={pack} onPackUpdated={handlePackUpdated} />
        )}

        {activeTab === 'templates' && <TemplateSettingsTab />}
      </div>
    </div>
  );
};
