import React from 'react';
import { EpisodeStatus, CharacterStatus, SeasonStatus } from '../../types';

interface StatusBadgeProps {
  status: EpisodeStatus | CharacterStatus | SeasonStatus | string;
  size?: 'sm' | 'md';
  language?: 'bilingual' | 'vi' | 'en';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  language = 'bilingual',
}) => {
  const getTranslations = (st: string) => {
    switch (st) {
      // Episode Statuses
      case 'Idea':
        return { en: 'Idea', vi: 'Ý tưởng', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
      case 'Draft':
        return { en: 'Draft', vi: 'Bản nháp', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'Story Generated':
        return { en: 'Story Gen', vi: 'Đã tạo truyện', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
      case 'Storyboard Generated':
        return { en: 'Storyboard', vi: 'Phân cảnh', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'Prompts Ready':
        return { en: 'Prompts Ready', vi: 'Prompt sẵn sàng', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' };
      case 'Rendering':
        return { en: 'Rendering', vi: 'Đang kết xuất', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' };
      case 'Editing':
        return { en: 'Editing', vi: 'Đang dựng', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'Completed':
        return { en: 'Completed', vi: 'Hoàn thành', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'Published':
        return { en: 'Published', vi: 'Đã phát hành', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };

      // Character & Season Statuses
      case 'Active':
        return { en: 'Active DNA', vi: 'Đang dùng', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'In Production':
        return { en: 'In Production', vi: 'Đang sản xuất', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'Planning':
        return { en: 'Planning', vi: 'Kế hoạch', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
      case 'Archived':
        return { en: 'Archived', vi: 'Lưu trữ', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
      default:
        return { en: st, vi: st, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const meta = getTranslations(status);
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  let label = `${meta.en} · ${meta.vi}`;
  if (language === 'vi') label = meta.vi;
  if (language === 'en') label = meta.en;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-md whitespace-nowrap ${meta.color} ${sizeClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
};
