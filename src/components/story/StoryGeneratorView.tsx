import React, { useState } from 'react';
import {
  Character,
  CharacterVersion,
  GlobalStyleVersion,
  LanguageMode,
  Scene,
  StoryDraft,
} from '../../types';
import { CharacterService } from '../../services/characterService';
import { CharacterVersionService } from '../../services/characterVersionService';
import { StyleService } from '../../services/styleService';
import { EpisodeService } from '../../services/episodeService';
import {
  StoryGeneratorService,
  StoryPreset,
} from '../../services/storyGeneratorService';
import { CharacterAvatar } from '../shared/CharacterAvatar';
import {
  Sparkles,
  BookOpen,
  Dna,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Users,
  Film,
  Layers,
  ArrowRight,
  RefreshCw,
  Save,
  FileCode,
  Lightbulb,
  Check,
  Heart,
  Smile,
  Compass,
  Eye,
  AlertCircle,
} from 'lucide-react';

interface StoryGeneratorViewProps {
  language: LanguageMode;
  onNavigate: (view: string, id?: string) => void;
  onEpisodeCreated?: (episodeId: string) => void;
}

export const StoryGeneratorView: React.FC<StoryGeneratorViewProps> = ({
  language,
  onNavigate,
  onEpisodeCreated,
}) => {
  const characters = CharacterService.getAllCharacters();
  const activeStyle = StyleService.getActiveStyleVersion();
  const presets = StoryGeneratorService.getStoryPresets();

  // Form Input States
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset_football');
  const [title, setTitle] = useState('Tập 10 – Trận bóng mini và tinh thần đồng đội');
  const [storyIdea, setStoryIdea] = useState(
    'Ba Trường (Ethan) tổ chức một giải bóng đá mini ở sân sau với khung thành xếp bằng hai chiếc gối mềm cho Pi, Kem và Mochi cùng tham gia.',
  );
  const [theme, setTheme] = useState(
    'Thể thao gia đình & Tinh thần đồng đội (Family Sports & Teamwork)',
  );
  const [educationalLesson, setEducationalLesson] = useState(
    'Chiến thắng không quan trọng bằng niềm vui tham gia, tinh thần đồng đội, và sự kiên nhẫn khi hướng dẫn em nhỏ.',
  );
  const [additionalNotes, setAdditionalNotes] = useState(
    'Ba Trường thể hiện niềm yêu thích bóng đá cuồng nhiệt nhưng luôn nhường nhịn và khuyến khích Kem sút bóng. Mochi chạy lon ton làm trọng tài bất đắc dĩ.',
  );
  const [targetAudience, setTargetAudience] = useState('3–7 tuổi (Preschool & Early Elementary)');
  const [targetDuration, setTargetDuration] = useState('07:00 (Phút)');
  const [location, setLocation] = useState('Sân cỏ sau nhà ngập nắng ấm (Backyard Mini Pitch)');
  
  // Canonical character selection
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([
    'char_ethan',
    'char_pi',
    'char_kem',
    'char_mochi',
  ]);

  // Generation & View States
  const [activeTab, setActiveTab] = useState<'input' | 'draft' | 'scenes'>('input');
  const [generatedDraft, setGeneratedDraft] = useState<StoryDraft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [savedEpisodeId, setSavedEpisodeId] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  const handleApplyPreset = (preset: StoryPreset) => {
    setSelectedPresetId(preset.id);
    setTitle(preset.title);
    setStoryIdea(preset.storyIdea);
    setTheme(preset.theme || 'Tình cảm gia đình & Tinh thần đồng đội');
    setEducationalLesson(preset.educationalLesson);
    setAdditionalNotes(preset.additionalNotes);
    setTargetAudience(preset.targetAudience);
    setTargetDuration(preset.targetDuration);
    setLocation(preset.location);
    setSelectedCharacterIds(Array.from(new Set([...preset.characterIds, ...preset.supportingCharacterIds])));
  };

  const toggleCharacter = (charId: string) => {
    if (selectedCharacterIds.includes(charId)) {
      if (selectedCharacterIds.length <= 1) return; // Keep at least one character
      setSelectedCharacterIds(selectedCharacterIds.filter((id) => id !== charId));
    } else {
      setSelectedCharacterIds([...selectedCharacterIds, charId]);
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setSaveSuccessMessage(null);

    setTimeout(() => {
      const primaryChars = selectedCharacterIds.filter((id) => {
        const c = CharacterService.getCharacterById(id);
        return c && !c.isSupporting;
      });
      const supportingChars = selectedCharacterIds.filter((id) => {
        const c = CharacterService.getCharacterById(id);
        return c && c.isSupporting;
      });

      const draft = StoryGeneratorService.generateStoryDraft({
        title,
        storyIdea,
        theme,
        educationalLesson,
        additionalNotes,
        targetAudience,
        targetDuration,
        characterIds: primaryChars.length > 0 ? primaryChars : selectedCharacterIds,
        supportingCharacterIds: supportingChars,
        location,
      });

      setGeneratedDraft(draft);
      setIsGenerating(false);
      setActiveTab('draft');
    }, 450);
  };

  const handleSaveToPipeline = () => {
    if (!generatedDraft) return;

    try {
      const createdEp = StoryGeneratorService.commitDraftToEpisode({
        draft: generatedDraft,
        seasonId: 'season_001',
      });

      setSavedEpisodeId(createdEp.id);
      setSaveSuccessMessage(
        language === 'vi'
          ? `Đã lưu thành công ${createdEp.title} vào danh sách tập phim với trạng thái Story Generated.`
          : `Successfully committed ${createdEp.title} into the Production Pipeline with Story Generated status.`,
      );

      if (onEpisodeCreated) {
        onEpisodeCreated(createdEp.id);
      }
    } catch (err: any) {
      alert(`Error saving episode: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in text-slate-100">
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Phase 2 — Story Generator
              </span>
              <span className="text-xs font-mono text-slate-400">
                Pipeline Stage 2
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {formatLabel('Story Generator & Scene Breakdown', 'Khởi Tạo Cốt Truyện & Phân Cảnh')}
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              {formatLabel(
                'Generate structured narrative episodes and granular 3D scenes strictly bound to canonical Character DNA and Global Style snapshots.',
                'Tạo kịch bản tập phim 3 hồi và phân cảnh 3D chi tiết dựa trên nền tảng Character DNA chuẩn và phong cách thẩm mỹ bất biến.',
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                  {formatLabel('Source of Truth', 'Nguồn Chân Lý')}
                </span>
                <span className="font-semibold text-emerald-300">
                  Character DNA v1.0
                </span>
              </div>
            </div>

            {generatedDraft && (
              <button
                onClick={() => setShowJsonModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors"
                title={formatLabel('Inspect JSON schema', 'Xem dữ liệu JSON')}
              >
                <FileCode className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">JSON</span>
              </button>
            )}
          </div>
        </div>

        {/* Workspace Mode Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'input'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{formatLabel('1. Story Parameters', '1. Ý Tưởng & Thiết Lập')}</span>
          </button>

          <button
            onClick={() => {
              if (generatedDraft) setActiveTab('draft');
              else handleGenerate();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'draft'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{formatLabel('2. Episode Draft & 3-Act', '2. Kịch Bản 3 Hồi')}</span>
            {generatedDraft && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => {
              if (generatedDraft) setActiveTab('scenes');
              else handleGenerate();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'scenes'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>
              {formatLabel('3. Scene Breakdown (6 Scenes)', '3. Phân Cảnh Chi Tiết (6 Cảnh)')}
            </span>
            {generatedDraft && (
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-amber-300">
                {generatedDraft.scenes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Save Success Banner */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">{saveSuccessMessage}</p>
              <p className="text-emerald-300/80 text-[11px]">
                {formatLabel(
                  'Immutable snapshots for characters and global style have been locked permanently into the episode record.',
                  'Bản ghi snapshot vĩnh viễn cho nhân vật và phong cách đã được cố định vào cơ sở dữ liệu tập phim.',
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('episodes')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>{formatLabel('View in Episodes Pipeline', 'Xem trong Danh sách Tập')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: STORY PARAMETERS & INPUT FORM */}
      {activeTab === 'input' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Input Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Canonical Preset Seeds */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">
                    {formatLabel('Canonical Story Presets', 'Mẫu Cốt Truyện Chuẩn Thế Giới Pi & Kem')}
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {formatLabel('Click to load', 'Nhấn để áp dụng')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {presets.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="font-semibold text-xs text-white block truncate">
                          {preset.title}
                        </span>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {preset.storyIdea}
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{preset.targetDuration}</span>
                        <span className="text-amber-400 font-medium">
                          {preset.characterIds.length + preset.supportingCharacterIds.length} {formatLabel('Characters', 'Nhân vật')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Structured Story Input Fields */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <BookOpen className="w-4 h-4 text-amber-400" />
                {formatLabel('Episode Narrative Parameters', 'Thông Số Kịch Bản Tập Phim')}
              </h3>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>{formatLabel('Episode Title', 'Tên Tập Phim')}</span>
                  <span className="text-[11px] text-amber-400/80 font-mono">Bilingual Recommended</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Tập 10 – Trận bóng mini và tinh thần đồng đội"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white text-xs placeholder:text-slate-400 transition-all font-medium"
                />
              </div>

              {/* Story Premise / Idea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {formatLabel('Story Idea & Core Premise', 'Ý Tưởng & Tiền Đề Cốt Truyện')}
                </label>
                <textarea
                  rows={3}
                  value={storyIdea}
                  onChange={(e) => setStoryIdea(e.target.value)}
                  placeholder="Mô tả bối cảnh và hoạt động cốt lõi của tập phim..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white text-xs placeholder:text-slate-400 transition-all leading-relaxed"
                />
              </div>

              {/* Theme */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{formatLabel('Theme', 'Chủ Đề Cốt Lõi')}</span>
                </label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. Thể thao gia đình & Tinh thần đồng đội"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white text-xs placeholder:text-slate-400 transition-all"
                />
              </div>

              {/* Educational / Moral Lesson */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>{formatLabel('Educational / Moral Lesson', 'Bài Học Giáo Dục & Giá Trị Đạo Đức')}</span>
                </label>
                <textarea
                  rows={2}
                  value={educationalLesson}
                  onChange={(e) => setEducationalLesson(e.target.value)}
                  placeholder="Thông điệp giáo dục giúp bé hình thành nhân cách tốt..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white text-xs placeholder:text-slate-400 transition-all leading-relaxed"
                />
              </div>

              {/* Location & Audience Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {formatLabel('Location', 'Bối Cảnh / Địa Điểm')}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Sân sau, Phòng khách, v.v."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-white text-xs placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {formatLabel('Target Age Range', 'Độ Tuổi Mục Tiêu')}
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. 3–7 tuổi"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-white text-xs placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {formatLabel('Duration', 'Thời Lượng Ước Tính')}
                  </label>
                  <input
                    type="text"
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(e.target.value)}
                    placeholder="e.g. 07:00 (Phút)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-white text-xs placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Optional Story Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {formatLabel('Additional Story / Comic Notes', 'Ghi Chú Kịch Bản & Yếu Tố Hài Hước Thêm')}
                </label>
                <textarea
                  rows={2}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Ghi chú thêm về lời thoại, cử chỉ hài hước của Mochi hay ba mẹ..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-white text-xs placeholder:text-slate-400 transition-all leading-relaxed"
                />
              </div>

              {/* Generate CTA Button */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  {formatLabel(
                    'Generates a 3-act draft and 6 detailed 3D scenes.',
                    'Tự động tổng hợp kịch bản 3 hồi và 6 phân cảnh 3D chuẩn.',
                  )}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || selectedCharacterIds.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{formatLabel('Synthesizing Story...', 'Đang tổng hợp kịch bản...')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{formatLabel('Generate Story & Scenes', 'Khởi Tạo Kịch Bản & Phân Cảnh')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Canonical Character Binding Sidebar (1 col) */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-sm text-white">
                    {formatLabel('Canonical Character Selection', 'Chọn Nhân Vật Tham Gia')}
                  </h3>
                </div>
                <span className="text-xs bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-mono">
                  {selectedCharacterIds.length}/5
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {formatLabel(
                  'The Story Generator references existing Canonical Character IDs and their active Character DNA versions. No duplicate character records are created.',
                  'Trình tạo cốt truyện tham chiếu trực tiếp mã nhân vật chuẩn và phiên bản Character DNA hiện hữu. Không tạo bản sao nhân vật trùng lặp.',
                )}
              </p>

              <div className="space-y-2.5">
                {characters.map((char) => {
                  const isChecked = selectedCharacterIds.includes(char.id);
                  const activeVer = CharacterVersionService.getVersionById(char.activeVersionId);

                  return (
                    <div
                      key={char.id}
                      onClick={() => toggleCharacter(char.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-slate-950 border-amber-500/50 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800/80 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CharacterAvatar characterId={char.id} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white truncate">
                              {char.displayName}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate">
                              ({char.vietnameseName})
                            </span>
                          </div>
                          <span className="block text-[11px] text-slate-400 truncate">
                            {char.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-amber-500 border-amber-500 text-slate-950'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                          {activeVer?.version || 'v1.0'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Style Snapshot Assurance */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-indigo-300 font-semibold text-[11px]">
                  <span>{formatLabel('Active 3D Style Locked', 'Phong Cách 3D Đang Khóa')}</span>
                  <span className="font-mono text-indigo-400">
                    {activeStyle?.version || 'v1.0'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {formatLabel(
                    'Every generated scene automatically embeds the active global 3D style configuration.',
                    'Mỗi phân cảnh tạo ra sẽ tự động liên kết với cấu hình thẩm mỹ 3D toàn cục.',
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GENERATED EPISODE DRAFT & 3-ACT STRUCTURE */}
      {activeTab === 'draft' && generatedDraft && (
        <div className="space-y-6">
          {/* Episode Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                    Structured Episode Draft
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {generatedDraft.targetDuration}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {generatedDraft.title}
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl">
                  {generatedDraft.location}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSaveToPipeline}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{formatLabel('Save to Pipeline', 'Lưu Vào Danh Sách Tập')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('scenes')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <span>{formatLabel('View Scene Breakdown', 'Xem Phân Cảnh Chi Tiết')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Premise and Lesson Pill Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] block">
                  {formatLabel('Story Premise', 'Tiền Đề Cốt Truyện')}
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {generatedDraft.premise}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <span className="font-bold text-rose-400 uppercase tracking-wider text-[10px] block">
                  {formatLabel('Educational & Moral Message', 'Thông Điệp & Bài Học Giáo Dục')}
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {generatedDraft.educationalLesson}
                </p>
              </div>
            </div>

            {/* Emotional Arc */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3 text-xs">
              <Compass className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {formatLabel('Emotional Progression Arc', 'Đường Cong Tiến Trình Cảm Xúc')}
                </span>
                <span className="font-medium text-indigo-300">
                  {generatedDraft.emotionalArc}
                </span>
              </div>
            </div>
          </div>

          {/* 3-Act Narrative Architecture Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Beginning / Act 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                    1
                  </span>
                  <h4 className="font-bold text-sm text-white">
                    {formatLabel('Beginning', 'Khởi Đầu (Act 1)')}
                  </h4>
                </div>
                <span className="text-[10px] uppercase font-mono text-slate-400">Setup</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {generatedDraft.beginning}
              </p>
              <div className="pt-2 text-[11px] text-blue-400 font-medium">
                {formatLabel('Inciting Incident & Morning Excitement', 'Kích hoạt mục tiêu & Niềm háo hức')}
              </div>
            </div>

            {/* Middle / Act 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                    2
                  </span>
                  <h4 className="font-bold text-sm text-white">
                    {formatLabel('Middle', 'Thử Thách & Nút Thắt (Act 2)')}
                  </h4>
                </div>
                <span className="text-[10px] uppercase font-mono text-slate-400">Climax</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {generatedDraft.middle}
              </p>
              <div className="pt-2 text-[11px] text-amber-400 font-medium">
                {formatLabel('Complication & Teamwork Solution', 'Sự cố vui nhộn & Đồng lòng giải quyết')}
              </div>
            </div>

            {/* Ending / Act 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                    3
                  </span>
                  <h4 className="font-bold text-sm text-white">
                    {formatLabel('Ending', 'Kết Thúc & Bài Học (Act 3)')}
                  </h4>
                </div>
                <span className="text-[10px] uppercase font-mono text-slate-400">Resolution</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {generatedDraft.ending}
              </p>
              <div className="pt-2 text-[11px] text-emerald-400 font-medium">
                {formatLabel('Moral Realization & Warm Family Wrap', 'Đúc kết bài học & Gắn kết gia đình')}
              </div>
            </div>
          </div>

          {/* Cast Participation & DNA Snapshots Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Dna className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  {formatLabel('Character DNA Version Locking for this Episode', 'Khóa Phiên Bản DNA Nhân Vật Cho Tập Này')}
                </h3>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                {formatLabel('Immutable Guarantee', 'Cam Kết Bất Biến')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {generatedDraft.characterParticipation.map((part) => (
                <div
                  key={part.characterId}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3"
                >
                  <CharacterAvatar characterId={part.characterId} size="md" />
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white truncate">
                        {part.characterName}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                        {part.versionSnapshotId}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {part.participationRole}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCENE BREAKDOWN (Consumable directly by future Storyboard phase) */}
      {activeTab === 'scenes' && generatedDraft && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div>
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-base text-white">
                  {formatLabel('Granular Scene Breakdown', 'Phân Cảnh Kịch Bản Chi Tiết')}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono">
                  {generatedDraft.scenes.length} Scenes Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {formatLabel(
                  'Structured scene specs with camera direction, dialogues, character actions, and DNA bindings. Designed for future Storyboard ingestion.',
                  'Thông số phân cảnh có hướng quay, lời thoại, hành động và liên kết DNA. Sẵn sàng cho giai đoạn Storyboard tương lai.',
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToPipeline}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{formatLabel('Commit Episode to Pipeline', 'Lưu Tập Vào Pipeline')}</span>
              </button>
            </div>
          </div>

          {/* Scene List Cards */}
          <div className="space-y-4">
            {generatedDraft.scenes.map((scene) => (
              <div
                key={scene.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-colors"
              >
                {/* Scene Meta Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold flex items-center justify-center text-xs">
                      #{scene.sceneNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {scene.title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {scene.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                      {scene.timeOfDay}
                    </span>
                    {scene.estimatedDurationSeconds && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {scene.estimatedDurationSeconds}s
                      </span>
                    )}
                  </div>
                </div>

                {/* Cast and DNA Reference Chips */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {formatLabel('Cast & DNA Version:', 'Diễn viên & Phiên bản DNA:')}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {scene.characterIds.map((charId) => {
                      const verId = scene.characterDnaReferences[charId] || 'ver_1';
                      return (
                        <div
                          key={charId}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800"
                        >
                          <CharacterAvatar characterId={charId} size="xs" />
                          <span className="font-medium text-slate-200 text-xs">
                            {CharacterService.getCharacterById(charId)?.displayName}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-1 py-0.2 rounded">
                            {verId}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3D Visual Action & Lighting */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      {formatLabel('3D Animation Action & Physical Blocking', 'Hành Động Diễn Xuất & Chuyển Động 3D')}
                    </span>
                    <p className="text-slate-200 leading-relaxed">
                      {scene.action}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                      {formatLabel('3D Lighting & Atmosphere Spec', 'Ánh Sáng & Không Khí 3D')}
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {scene.lighting}
                    </p>
                    {scene.cameraDirection && (
                      <div className="pt-2 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">Camera: </span>
                        {scene.cameraDirection}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dialogue Script */}
                {scene.dialogue && scene.dialogue.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {formatLabel('Dialogue Script', 'Kịch Bản Lời Thoại')}
                    </span>
                    <div className="space-y-2">
                      {scene.dialogue.map((d, dIdx) => (
                        <div
                          key={dIdx}
                          className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/70 flex items-start gap-3 text-xs"
                        >
                          <CharacterAvatar characterId={d.characterId} size="xs" />
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-300">
                                {d.characterName}
                              </span>
                              {d.emotion && (
                                <span className="text-[10px] italic text-slate-400">
                                  ({d.emotion})
                                </span>
                              )}
                            </div>
                            <p className="text-slate-200 italic leading-relaxed">
                              "{d.line}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Purpose Footer Badges */}
                <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div>
                    <span className="font-semibold text-slate-300">
                      {formatLabel('Story Purpose: ', 'Mục đích kịch bản: ')}
                    </span>
                    <span>{scene.storyPurpose}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-rose-400">
                      {formatLabel('Educational Goal: ', 'Mục tiêu giáo dục: ')}
                    </span>
                    <span>{scene.educationalPurpose}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JSON Schema Inspection Modal */}
      {showJsonModal && generatedDraft && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  {formatLabel('Story Draft JSON Schema', 'Cấu Trúc Dữ Liệu JSON Kịch Bản')}
                </h3>
              </div>
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                {formatLabel('Close', 'Đóng')}
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-amber-200/90 bg-slate-950 custom-scrollbar">
              <pre>{JSON.stringify(generatedDraft, null, 2)}</pre>
            </div>
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <span>{generatedDraft.scenes.length} Scenes Encoded</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(generatedDraft, null, 2));
                  alert(
                    language === 'vi'
                      ? 'Đã sao chép dữ liệu JSON kịch bản vào clipboard!'
                      : 'Copied structured story JSON to clipboard!',
                  );
                }}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs"
              >
                {formatLabel('Copy JSON', 'Sao chép JSON')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
