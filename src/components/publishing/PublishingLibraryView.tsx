import React, { useState } from 'react';
import {
  Share2,
  Search,
  Filter,
  Youtube,
  Facebook,
  CheckCircle2,
  Clock,
  Calendar,
  Image as ImageIcon,
  Video,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { publishingService } from '../../services/publishingService';
import { PublishingPack, Episode } from '../../types';

interface PublishingLibraryViewProps {
  onSelectEpisode: (episodeId: string) => void;
}

export const PublishingLibraryView: React.FC<PublishingLibraryViewProps> = ({
  onSelectEpisode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'scheduled' | 'published'>('all');
  const [copiedEpisodeId, setCopiedEpisodeId] = useState<string | null>(null);

  const db = storageService.getDatabase();
  const episodes = db.episodes || [];
  const publishingPacks = publishingService.getPublishingPacks();

  // Map each episode with its publishing pack
  const episodesWithPacks = episodes.map((ep) => {
    let pack = publishingPacks.find((p) => p.episodeId === ep.id);
    if (!pack) {
      pack = publishingService.getOrCreatePublishingPack(ep.id);
    }
    return {
      episode: ep,
      pack,
    };
  });

  // Filter episodes
  const filtered = episodesWithPacks.filter(({ episode, pack }) => {
    const matchesSearch =
      episode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (episode.theme && episode.theme.toLowerCase().includes(searchQuery.toLowerCase())) ||
      `tập ${episode.episodeNumber}`.includes(searchQuery.toLowerCase()) ||
      `ep${episode.episodeNumber}`.includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'draft') {
      return pack.youtube.publishStatus === 'draft' && pack.facebook.status === 'draft';
    }
    if (statusFilter === 'scheduled') {
      return pack.youtube.publishStatus === 'scheduled' || pack.facebook.status === 'ready';
    }
    if (statusFilter === 'published') {
      return pack.youtube.publishStatus === 'published' || pack.facebook.status === 'published';
    }
    return true;
  });

  // Summary counts
  const totalEpisodes = episodes.length;
  const readyPacks = episodesWithPacks.filter(
    ({ pack }) => pack.status?.youtubeReady && pack.status?.facebookReady
  ).length;
  const scheduledPacks = episodesWithPacks.filter(
    ({ pack }) => pack.youtube.publishStatus === 'scheduled'
  ).length;
  const publishedPacks = episodesWithPacks.filter(
    ({ pack }) => pack.youtube.publishStatus === 'published'
  ).length;

  const handleQuickCopy = (e: React.MouseEvent, pack: PublishingPack) => {
    e.stopPropagation();
    const text = `TIÊU ĐỀ YOUTUBE:
${pack.youtube.title}

MÔ TẢ:
${pack.youtube.description}

HASHTAGS:
${pack.youtube.hashtags.join(' ')}

BÀI VIẾT FACEBOOK:
${pack.facebook.post}`;

    navigator.clipboard.writeText(text);
    setCopiedEpisodeId(pack.episodeId);
    setTimeout(() => setCopiedEpisodeId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
              <Share2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Trung Tâm Xuất Bản (Publishing Studio)
              </h2>
              <p className="text-xs text-slate-400">
                Quản lý đóng gói xuất bản YouTube, Facebook, Ảnh Thumbnail và Lịch phát sóng cho từng tập phim sau khi dựng hoàn thiện.
              </p>
            </div>
          </div>
        </div>

        {/* Highlight Stats Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-base font-bold text-white">{totalEpisodes}</div>
            <div className="text-[10px] text-slate-400 font-medium">Tổng số tập</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-base font-bold text-emerald-400">{readyPacks}</div>
            <div className="text-[10px] text-slate-400 font-medium">Sẵn sàng</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-base font-bold text-sky-400">{scheduledPacks}</div>
            <div className="text-[10px] text-slate-400 font-medium">Đã lên lịch</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-base font-bold text-rose-400">{publishedPacks}</div>
            <div className="text-[10px] text-slate-400 font-medium">Đã phát hành</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên tập, chủ đề, số thứ tự..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-hidden focus:border-amber-500 transition-colors shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất cả ({episodes.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'draft'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Bản nháp
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('scheduled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'scheduled'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Đã lên lịch
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'published'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Đã phát hành
          </button>
        </div>
      </div>

      {/* Episodes Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <Share2 className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Không tìm thấy tập phim nào phù hợp</p>
          <p className="text-xs text-slate-500">Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(({ episode, pack }) => {
            const thumbnail =
              pack.youtube.thumbnailUrl ||
              pack.assets.thumbnailUrl ||
              pack.facebook.imageUrl ||
              'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80';

            const isCopied = copiedEpisodeId === pack.episodeId;
            const hasVideo = !!(pack.assets.finalVideoUrl || pack.youtube.videoUrl);
            const hasThumbnail = !!(pack.assets.thumbnailUrl || pack.youtube.thumbnailUrl);

            return (
              <div
                key={episode.id}
                onClick={() => onSelectEpisode(episode.id)}
                className="group relative rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-amber-500/5 flex flex-col cursor-pointer overflow-hidden"
              >
                {/* Thumbnail Preview Area */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden">
                  <img
                    src={thumbnail}
                    alt={episode.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black tracking-wider uppercase">
                      EP{episode.episodeNumber < 10 ? `0${episode.episodeNumber}` : episode.episodeNumber}
                    </span>
                    {episode.duration && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs text-slate-300 text-[10px] font-mono">
                        {episode.duration}
                      </span>
                    )}
                  </div>

                  {/* Quick Copy Action */}
                  <button
                    type="button"
                    onClick={(e) => handleQuickCopy(e, pack)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-950/80 hover:bg-amber-500 text-slate-300 hover:text-slate-950 backdrop-blur-xs transition-colors shadow-sm"
                    title="Sao chép nhanh gói xuất bản"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Bottom Image Overlay Info */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          hasVideo
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-900/80 text-slate-500'
                        }`}
                      >
                        <Video className="w-2.5 h-2.5" />
                        <span>{hasVideo ? 'Video' : 'Chưa video'}</span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          hasThumbnail
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-900/80 text-slate-500'
                        }`}
                      >
                        <ImageIcon className="w-2.5 h-2.5" />
                        <span>{hasThumbnail ? 'Thumb' : 'Chưa thumb'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                      {episode.title}
                    </h3>
                    {episode.theme && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {episode.theme}
                      </p>
                    )}
                  </div>

                  {/* Platform Status Bars */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-800 text-[11px]">
                    {/* YouTube status */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Youtube className="w-3.5 h-3.5 text-rose-500" />
                        <span>YouTube:</span>
                      </span>
                      <span
                        className={`font-semibold capitalize ${
                          pack.youtube.publishStatus === 'published'
                            ? 'text-rose-400'
                            : pack.youtube.publishStatus === 'scheduled'
                            ? 'text-sky-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {pack.youtube.publishStatus === 'published'
                          ? 'Đã phát hành'
                          : pack.youtube.publishStatus === 'scheduled'
                          ? `Lên lịch (${pack.youtube.scheduledDate || 'Sắp chiếu'})`
                          : 'Bản nháp'}
                      </span>
                    </div>

                    {/* Facebook status */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Facebook className="w-3.5 h-3.5 text-sky-500" />
                        <span>Facebook:</span>
                      </span>
                      <span
                        className={`font-semibold capitalize ${
                          pack.facebook.status === 'published'
                            ? 'text-sky-400'
                            : pack.facebook.status === 'ready'
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {pack.facebook.status === 'published'
                          ? 'Đã đăng'
                          : pack.facebook.status === 'ready'
                          ? 'Sẵn sàng'
                          : 'Bản nháp'}
                      </span>
                    </div>
                  </div>

                  {/* Open Publishing CTA Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 group-hover:bg-amber-500 text-slate-300 group-hover:text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mở Gói Xuất Bản</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
