import React, { useState } from 'react';
import { Episode, EpisodeStatus, LanguageMode } from '../../types';
import { EpisodeService } from '../../services/episodeService';
import { SeasonService } from '../../services/seasonService';
import { CharacterService } from '../../services/characterService';
import { CharacterAvatar } from '../shared/CharacterAvatar';
import {
  Clapperboard,
  X,
  Lock,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';

interface EpisodeEditorModalProps {
  episodeId?: string; // If provided, edit mode
  seasonId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (episode: Episode) => void;
  language: LanguageMode;
}

const EPISODE_STATUSES: EpisodeStatus[] = [
  'Idea',
  'Draft',
  'Story Generated',
  'Storyboard Generated',
  'Prompts Ready',
  'Rendering',
  'Editing',
  'Completed',
  'Published',
];

export const EpisodeEditorModal: React.FC<EpisodeEditorModalProps> = ({
  episodeId,
  seasonId,
  isOpen,
  onClose,
  onSaved,
  language,
}) => {
  if (!isOpen) return null;

  const seasons = SeasonService.getAllSeasons();
  const allCharacters = CharacterService.getAllCharacters();
  const existingEpisode = episodeId ? EpisodeService.getEpisodeById(episodeId) : null;

  const [formData, setFormData] = useState({
    seasonId: existingEpisode?.seasonId || seasonId || seasons[0]?.id || '',
    episodeNumber: existingEpisode?.episodeNumber ?? 10,
    title: existingEpisode?.title || '',
    storyIdea: existingEpisode?.storyIdea || '',
    theme: existingEpisode?.theme || 'Tình cảm gia đình / Chia sẻ',
    educationalMessage:
      existingEpisode?.educationalMessage ||
      'Dạy trẻ biết yêu thương, chia sẻ đồ chơi và giúp đỡ cha mẹ.',
    location: existingEpisode?.location || 'Phòng khách nhà Pi & Kem',
    duration: existingEpisode?.duration || '3:30',
    targetPlatform: existingEpisode?.targetPlatform || 'YouTube Kids / TikTok',
    status: existingEpisode?.status || ('Idea' as EpisodeStatus),
    characterIds: existingEpisode?.characterIds || ['char_pi', 'char_kem', 'char_emma', 'char_ethan'],
    supportingCharacterIds: existingEpisode?.supportingCharacterIds || ['char_mochi'],
  });

  const toggleCharacter = (id: string, isSupporting: boolean) => {
    if (isSupporting) {
      const exists = formData.supportingCharacterIds.includes(id);
      setFormData({
        ...formData,
        supportingCharacterIds: exists
          ? formData.supportingCharacterIds.filter((c) => c !== id)
          : [...formData.supportingCharacterIds, id],
      });
    } else {
      const exists = formData.characterIds.includes(id);
      setFormData({
        ...formData,
        characterIds: exists
          ? formData.characterIds.filter((c) => c !== id)
          : [...formData.characterIds, id],
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.storyIdea.trim()) return;

    if (existingEpisode) {
      const updated = EpisodeService.updateEpisode(existingEpisode.id, {
        seasonId: formData.seasonId,
        episodeNumber: Number(formData.episodeNumber),
        title: formData.title.trim(),
        storyIdea: formData.storyIdea.trim(),
        theme: formData.theme.trim(),
        educationalMessage: formData.educationalMessage.trim(),
        location: formData.location.trim(),
        duration: formData.duration.trim(),
        targetPlatform: formData.targetPlatform.trim(),
        status: formData.status,
        characterIds: formData.characterIds,
        supportingCharacterIds: formData.supportingCharacterIds,
      });
      if (updated) onSaved(updated);
    } else {
      const created = EpisodeService.createEpisode({
        seasonId: formData.seasonId,
        episodeNumber: Number(formData.episodeNumber),
        title: formData.title.trim(),
        storyIdea: formData.storyIdea.trim(),
        theme: formData.theme.trim(),
        educationalMessage: formData.educationalMessage.trim(),
        characterIds: formData.characterIds,
        supportingCharacterIds: formData.supportingCharacterIds,
        location: formData.location.trim(),
        duration: formData.duration.trim(),
        targetPlatform: formData.targetPlatform.trim(),
        status: formData.status,
      });
      onSaved(created);
    }

    onClose();
  };

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Clapperboard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {existingEpisode
                  ? formatLabel('Edit Episode Metadata', 'Chỉnh sửa Tập Phim')
                  : formatLabel('Create New Episode & Lock Snapshot', 'Tạo Tập Phim Mới & Khóa Snapshot')}
              </h3>
              <p className="text-xs text-slate-400">
                {formatLabel(
                  'Registers episode into pipeline and freezes character & style snapshots.',
                  'Ghi nhận tập phim vào quy trình sản xuất và khóa cứng các bản snapshot.',
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {!existingEpisode && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">
                  {formatLabel('Automatic Creative Snapshot Rule', 'Quy tắc Đóng băng Snapshot Tự động')}
                </span>
                <span className="text-slate-300">
                  {formatLabel(
                    'Creating this episode will snapshot the current active Character DNA and Global Style. Even if future episodes upgrade to DNA v2/v3, this episode will remain forever linked to its initial snapshot.',
                    'Khi tạo mới, tập phim sẽ tự động chụp lại (snapshot) phiên bản DNA và Style hiện tại. Các tập sau dù nâng cấp phiên bản mới cũng không làm biến dạng tập này.',
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {formatLabel('Target Season', 'Mùa phim')}
              </label>
              <select
                value={formData.seasonId}
                onChange={(e) => setFormData({ ...formData, seasonId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    Season {s.seasonNumber}: {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {formatLabel('Episode Number', 'Số thứ tự tập')}
              </label>
              <input
                type="number"
                required
                value={formData.episodeNumber}
                onChange={(e) =>
                  setFormData({ ...formData, episodeNumber: parseInt(e.target.value) || 1 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {formatLabel('Production Status', 'Trạng thái')}
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as EpisodeStatus })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {EPISODE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {formatLabel('Episode Title', 'Tiêu đề tập phim')}
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Tập 10 – Buổi dã ngoại bất ngờ"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {formatLabel('Story Idea & Premise', 'Ý tưởng cốt truyện')}
            </label>
            <textarea
              rows={3}
              required
              value={formData.storyIdea}
              onChange={(e) => setFormData({ ...formData, storyIdea: e.target.value })}
              placeholder="Tóm tắt tình huống khởi đầu, diễn biến hành động vui nhộn và bài học cuối tập..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white leading-relaxed focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {formatLabel('Theme', 'Chủ đề')}
              </label>
              <input
                type="text"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {formatLabel('Educational Message', 'Giá trị giáo dục')}
              </label>
              <input
                type="text"
                value={formData.educationalMessage}
                onChange={(e) =>
                  setFormData({ ...formData, educationalMessage: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {formatLabel('Primary Location', 'Bối cảnh')}
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {formatLabel('Target Duration', 'Thời lượng dự kiến')}
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {formatLabel('Distribution Platform', 'Nền tảng')}
              </label>
              <input
                type="text"
                value={formData.targetPlatform}
                onChange={(e) =>
                  setFormData({ ...formData, targetPlatform: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Cast Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              {formatLabel('Participating Cast & Characters', 'Các nhân vật tham gia')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {allCharacters.map((c) => {
                const isSelected = c.isSupporting
                  ? formData.supportingCharacterIds.includes(c.id)
                  : formData.characterIds.includes(c.id);

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCharacter(c.id, c.isSupporting)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <CharacterAvatar characterId={c.id} size="sm" />
                    <div>
                      <span className="font-bold block text-white text-xs leading-none">
                        {c.displayName}
                      </span>
                      <span className="text-[10px] text-slate-400">{c.role}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-semibold text-slate-300 hover:bg-slate-800"
            >
              {formatLabel('Cancel', 'Hủy')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>
                {existingEpisode
                  ? formatLabel('Update Episode', 'Cập nhật')
                  : formatLabel('Create Episode & Lock Snapshot', 'Tạo & Khóa Snapshot')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
