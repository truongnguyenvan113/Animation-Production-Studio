import React, { useState, useEffect, useMemo } from 'react';
import {
  Character,
  CharacterVersion,
  CharacterStatus,
  LanguageMode,
} from '../../types';
import { CharacterVersionService } from '../../services/characterVersionService';
import { CharacterService } from '../../services/characterService';
import { storageService } from '../../services/storageService';
import { CharacterAvatar } from '../shared/CharacterAvatar';
import { CharacterVersionReferenceLibrary } from './CharacterVersionReferenceLibrary';
import {
  Dna,
  Save,
  PlusCircle,
  History,
  AlertCircle,
  Check,
  Tag,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  Layers,
  Copy,
  Info,
  Image as ImageIcon,
} from 'lucide-react';

interface CharacterDNAEditorProps {
  characterId: string;
  initialVersionId?: string;
  onBack: () => void;
  language: LanguageMode;
  onOpenReferences: (characterId: string) => void;
  onOpenHistory: (characterId: string) => void;
}

export const CharacterDNAEditor: React.FC<CharacterDNAEditorProps> = ({
  characterId,
  initialVersionId,
  onBack,
  language,
  onOpenReferences,
  onOpenHistory,
}) => {
  const character = CharacterService.getCharacterById(characterId);
  const versions = CharacterVersionService.getVersionsForCharacter(characterId);

  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    initialVersionId || character?.activeVersionId || (versions[0]?.id ?? ''),
  );

  const [formData, setFormData] = useState<CharacterVersion | null>(() => {
    const initId = initialVersionId || character?.activeVersionId || (versions[0]?.id ?? '');
    return CharacterVersionService.getVersionById(initId) || null;
  });
  const [activeTab, setActiveTab] = useState<'physical' | 'facial' | 'attire' | 'personality' | 'prompts' | 'references'>('physical');
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newVersionTag, setNewVersionTag] = useState('v1.1');
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [setAsActive, setSetAsActive] = useState(true);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Sync selectedVersionId when character changes
  useEffect(() => {
    if (character) {
      const targetVersionId = initialVersionId || character.activeVersionId || versions[0]?.id;
      if (targetVersionId) {
        setSelectedVersionId(targetVersionId);
      }
    }
  }, [character?.id, character?.activeVersionId, initialVersionId]);

  // Sync formData when selectedVersionId changes
  useEffect(() => {
    const ver = CharacterVersionService.getVersionById(selectedVersionId);
    if (ver) {
      setFormData({ ...ver });
    }
  }, [selectedVersionId]);

  // Keep references in sync with database updates
  useEffect(() => {
    return storageService.subscribe(() => {
      const ver = CharacterVersionService.getVersionById(selectedVersionId);
      if (ver) {
        setFormData((prev) => {
          if (!prev || prev.id !== ver.id) return { ...ver };
          return {
            ...prev,
            references: ver.references || [],
            referenceAssetIds: ver.referenceAssetIds || [],
            primaryReferenceAssetId: ver.primaryReferenceAssetId,
          };
        });
      }
    });
  }, [selectedVersionId]);

  if (!character || !formData) {
    return (
      <div className="p-8 text-center text-slate-400">
        Character or version data not found.
      </div>
    );
  }

  const referencingEpisodes = CharacterVersionService.getReferencingEpisodes(formData.id);
  const isCurrentlyActive = character.activeVersionId === formData.id;

  const isDirty = useMemo(() => {
    if (!formData) return false;
    const stored = CharacterVersionService.getVersionById(formData.id);
    if (!stored) return false;
    return JSON.stringify(formData) !== JSON.stringify(stored);
  }, [formData]);

  const handleFieldChange = (field: keyof CharacterVersion, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSaveCurrent = () => {
    if (!formData) return;
    // Always fetch latest reference state to guarantee DNA save never overwrites or drops references
    const latest = CharacterVersionService.getVersionById(formData.id);
    const payloadToSave: CharacterVersion = {
      ...formData,
      references: latest?.references || formData.references || [],
      referenceAssetIds: latest?.referenceAssetIds || formData.referenceAssetIds || [],
      primaryReferenceAssetId: latest?.primaryReferenceAssetId || formData.primaryReferenceAssetId,
    };
    CharacterVersionService.updateVersion(formData.id, payloadToSave);
    setSaveSuccessMessage(
      language === 'vi'
        ? `Đã lưu thành công phiên bản DNA ${formData.version}!`
        : `Successfully saved DNA version ${formData.version}!`,
    );
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleCreateNewVersionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !newVersionTag.trim()) return;

    const created = CharacterVersionService.createNewVersion(
      character.id,
      formData.id,
      newVersionTag.trim(),
      formData,
      newVersionNotes.trim() || 'Iteration from previous DNA version',
      setAsActive,
    );

    setIsNewVersionModalOpen(false);
    setSelectedVersionId(created.id);
    setSaveSuccessMessage(
      language === 'vi'
        ? `Đã tạo phiên bản mới ${created.version}! Các tập phim cũ vẫn an toàn giữ nguyên bản snapshot lịch sử.`
        : `Created new version ${created.version}! Historical episode snapshots remain preserved.`,
    );
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  const handleAddVisualKeyword = (kw: string) => {
    if (!kw.trim() || formData.visualKeywords.includes(kw.trim())) return;
    setFormData({
      ...formData,
      visualKeywords: [...formData.visualKeywords, kw.trim()],
    });
  };

  const handleRemoveVisualKeyword = (index: number) => {
    const updated = [...formData.visualKeywords];
    updated.splice(index, 1);
    setFormData({ ...formData, visualKeywords: updated });
  };

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Back to characters"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <CharacterAvatar characterId={character.id} versionId={formData.id} size="lg" />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {character.displayName}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {character.role}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {character.englishName} ({character.vietnameseName}) • {formatLabel('Character DNA Registry', 'Sổ bộ nhận diện')}
            </p>
          </div>
        </div>

        {/* Version Switcher & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">{formatLabel('Version', 'Phiên bản')}:</span>
            <select
              value={selectedVersionId}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                  {v.version} {character.activeVersionId === v.id ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsNewVersionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{formatLabel('New Version', 'Tạo bản mới')}</span>
          </button>

          <button
            onClick={handleSaveCurrent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{formatLabel('Save DNA', 'Lưu thay đổi')}</span>
          </button>
        </div>
      </div>

      {/* Toast banner message */}
      {saveSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Historical Snapshot Audit Alert */}
      <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-indigo-200">
              {formatLabel(
                `Version ${formData.version} Historical Integrity Status:`,
                `Tính vẹn toàn lịch sử của phiên bản ${formData.version}:`,
              )}
            </span>
            {referencingEpisodes.length > 0 ? (
              <p className="text-indigo-300/90 mt-0.5">
                {formatLabel(
                  `Locked by ${referencingEpisodes.length} episode snapshot(s): ${referencingEpisodes.join(', ')}. Changing character DNA here will not disrupt past locked episodes.`,
                  `Được cố định bởi ${referencingEpisodes.length} tập phim: ${referencingEpisodes.join(', ')}. Các chỉnh sửa sẽ tuân thủ nguyên tắc không làm thay đổi các tập đã kết xuất trước đó.`,
                )}
              </p>
            ) : (
              <p className="text-indigo-300/90 mt-0.5">
                {formatLabel(
                  'No historical episodes are currently locked to this specific version.',
                  'Chưa có tập phim nào bị khóa cứng vào phiên bản này.',
                )}
              </p>
            )}
          </div>
        </div>

        {!isCurrentlyActive && (
          <button
            onClick={() => {
              CharacterVersionService.setActiveVersion(character.id, formData.id);
              setSaveSuccessMessage(
                language === 'vi'
                  ? `Đã kích hoạt ${formData.version} làm DNA mặc định cho các tập tương lai!`
                  : `Activated ${formData.version} as the current default DNA for upcoming episodes!`,
              );
              setTimeout(() => setSaveSuccessMessage(null), 3000);
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
          >
            {formatLabel('Set as Active DNA', 'Đặt làm bản Active')}
          </button>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto pb-1 text-xs font-medium">
        <button
          onClick={() => setActiveTab('physical')}
          className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
            activeTab === 'physical'
              ? 'border-amber-400 text-amber-400 bg-slate-900 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          1. {formatLabel('Physical & Proportions', 'Thể hình & Tỷ lệ')}
        </button>
        <button
          onClick={() => setActiveTab('facial')}
          className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
            activeTab === 'facial'
              ? 'border-amber-400 text-amber-400 bg-slate-900 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          2. {formatLabel('Facial Identity & Expressions', 'Khuôn mặt & Biểu cảm')}
        </button>
        <button
          onClick={() => setActiveTab('attire')}
          className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
            activeTab === 'attire'
              ? 'border-amber-400 text-amber-400 bg-slate-900 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          3. {formatLabel('Attire & Signature Props', 'Trang phục & Phụ kiện')}
        </button>
        <button
          onClick={() => setActiveTab('personality')}
          className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
            activeTab === 'personality'
              ? 'border-amber-400 text-amber-400 bg-slate-900 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          4. {formatLabel('Personality, Voice & Behavior', 'Tính cách, Giọng & Hành vi')}
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
            activeTab === 'prompts'
              ? 'border-amber-400 text-amber-400 bg-slate-900 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          5. {formatLabel('Visual Keywords & AI Prompts', 'Từ khóa & Prompts')}
        </button>
        <button
          onClick={() => setActiveTab('references')}
          className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'references'
              ? 'border-amber-400 text-amber-400 bg-slate-900 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>6. {formatLabel('Upload Reference Images & Library', 'Tải lên ảnh tham chiếu & Thư viện')}</span>
          {formData.referenceAssetIds && formData.referenceAssetIds.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
              {formData.referenceAssetIds.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Physical & Proportions */}
      {activeTab === 'physical' && (
        <div className="space-y-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
          {/* Canonical Bible Core Specification */}
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>{formatLabel('Canonical Character Bible Attributes', 'Thuộc Tính Chuẩn Hóa Theo Kinh Thánh Nhân Vật')}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {formatLabel('Canonical Occupation / Role Description', 'Nghề nghiệp / Mô tả vai trò')}
                </label>
                <input
                  type="text"
                  value={formData.occupation || ''}
                  placeholder="e.g. Programmer / Software Developer or Career Consultant"
                  onChange={(e) => handleFieldChange('occupation', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {formatLabel('Likes & Hobbies', 'Sở thích & Niềm đam mê')}
                </label>
                <input
                  type="text"
                  value={formData.likes || ''}
                  placeholder="e.g. Sports, football, travelling, dancing, etc."
                  onChange={(e) => handleFieldChange('likes', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {formatLabel('Visual Identity Mandate', 'Quy chuẩn nhận diện thị giác')}
                </label>
                <input
                  type="text"
                  value={formData.visualIdentity || ''}
                  placeholder="e.g. Must be represented as a father in a warm family-oriented 3D children's animation universe."
                  onChange={(e) => handleFieldChange('visualIdentity', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {character.isSupporting && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {formatLabel('Species & Character Type (e.g. Dog, NOT a cat)', 'Loài & Phân loại nhân vật (Cún con, không phải mèo)')}
                  </label>
                  <input
                    type="text"
                    value={formData.species || ''}
                    placeholder="Small fluffy cream-colored puppy (Dog)"
                    onChange={(e) => handleFieldChange('species', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {formatLabel('Age Range', 'Độ tuổi')}
              </label>
              <input
                type="text"
                value={formData.age}
                onChange={(e) => handleFieldChange('age', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {formatLabel('Gender', 'Giới tính')}
              </label>
              <input
                type="text"
                value={formData.gender}
                onChange={(e) => handleFieldChange('gender', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {formatLabel('Height & Scale', 'Chiều cao & Tỷ lệ cơ thể')}
              </label>
              <input
                type="text"
                value={formData.height}
                onChange={(e) => handleFieldChange('height', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {formatLabel('Body Proportions (Stylized CGI)', 'Tỷ lệ thân hình (Heads scale)')}
              </label>
              <input
                type="text"
                value={formData.bodyProportions}
                onChange={(e) => handleFieldChange('bodyProportions', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {formatLabel('Skin Tone & Subsurface Scattering', 'Màu da & Ánh sáng xuyên da')}
              </label>
              <input
                type="text"
                value={formData.skinTone}
                onChange={(e) => handleFieldChange('skinTone', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Facial Identity & Expressions */}
      {activeTab === 'facial' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {formatLabel('Face Shape & Cheeks', 'Dáng mặt & Gò má')}
            </label>
            <input
              type="text"
              value={formData.faceShape}
              onChange={(e) => handleFieldChange('faceShape', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {formatLabel('Hair Style & Grooming', 'Kiểu tóc & Độ bóng')}
            </label>
            <input
              type="text"
              value={formData.hair}
              onChange={(e) => handleFieldChange('hair', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {formatLabel('Eyes & Gaze Reflections', 'Đôi mắt & Ánh nhìn')}
            </label>
            <input
              type="text"
              value={formData.eyes}
              onChange={(e) => handleFieldChange('eyes', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {formatLabel('Nose Shape', 'Dáng mũi')}
            </label>
            <input
              type="text"
              value={formData.nose}
              onChange={(e) => handleFieldChange('nose', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {formatLabel('Mouth & Teeth Structure', 'Khuôn miệng & Nụ cười')}
            </label>
            <input
              type="text"
              value={formData.mouth}
              onChange={(e) => handleFieldChange('mouth', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {formatLabel('Signature Facial Expressions', 'Biểu cảm đặc trưng')}
            </label>
            <input
              type="text"
              value={formData.facialExpression}
              onChange={(e) => handleFieldChange('facialExpression', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Attire & Props */}
      {activeTab === 'attire' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {formatLabel('Main Clothing & Fabrics', 'Trang phục chính & Chất liệu')}
            </label>
            <textarea
              rows={2}
              value={formData.clothing}
              onChange={(e) => handleFieldChange('clothing', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {formatLabel('Shoes / Footwear', 'Giày dép / Bước chân')}
            </label>
            <input
              type="text"
              value={formData.shoes}
              onChange={(e) => handleFieldChange('shoes', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {formatLabel('Accessories & Signature Props', 'Phụ kiện & Vật dụng kèm theo')}
            </label>
            <input
              type="text"
              value={formData.accessories}
              onChange={(e) => handleFieldChange('accessories', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Tab 4: Personality & Behavior */}
      {activeTab === 'personality' && (
        <div className="space-y-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {formatLabel('Personality Traits', 'Đặc điểm tính cách')}
              </label>
              <textarea
                rows={2}
                value={formData.personality}
                onChange={(e) => handleFieldChange('personality', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {formatLabel('Typical Behavior & Reactions', 'Hành vi & Phản ứng tiêu biểu')}
              </label>
              <textarea
                rows={2}
                value={formData.behavior}
                onChange={(e) => handleFieldChange('behavior', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {formatLabel('Voice Description', 'Mô tả chất giọng')}
              </label>
              <input
                type="text"
                value={formData.voiceDescription}
                onChange={(e) => handleFieldChange('voiceDescription', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {formatLabel('Typical Gestures', 'Cử chỉ đặc trưng')}
              </label>
              <input
                type="text"
                value={formData.typicalGestures}
                onChange={(e) => handleFieldChange('typicalGestures', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {formatLabel('Family Relationships', 'Mối quan hệ trong gia đình')}
              </label>
              <input
                type="text"
                value={formData.relationships}
                onChange={(e) => handleFieldChange('relationships', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Visual Keywords & AI Prompts */}
      {activeTab === 'prompts' && (
        <div className="space-y-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
          {/* Visual Keywords */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {formatLabel('Visual Identity Keywords', 'Từ khóa nhận diện thị giác')}
            </label>
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl mb-3">
              {formData.visualKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-slate-800 text-amber-300 border border-slate-700"
                >
                  #{kw}
                  <button
                    type="button"
                    onClick={() => handleRemoveVisualKeyword(i)}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={language === 'vi' ? 'Nhập từ khóa mới...' : 'Type new visual keyword and press Add...'}
                id="newKeywordInput"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVisualKeyword((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('newKeywordInput') as HTMLInputElement;
                  if (input) {
                    handleAddVisualKeyword(input.value);
                    input.value = '';
                  }
                }}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
              >
                + Add Tag
              </button>
            </div>
          </div>

          {/* Master Character Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {formatLabel('Master Character Prompt (Source of Truth)', 'Prompt nhân vật chuẩn (Nguồn chân lý)')}
              </label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(formData.characterPrompt);
                  alert('Copied prompt to clipboard!');
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <textarea
              rows={3}
              value={formData.characterPrompt}
              onChange={(e) => handleFieldChange('characterPrompt', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-300 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Negative Prompt */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {formatLabel('Negative Prompt (Identity Protection)', 'Negative Prompt (Bảo vệ nhận diện)')}
            </label>
            <textarea
              rows={2}
              value={formData.negativePrompt}
              onChange={(e) => handleFieldChange('negativePrompt', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-rose-300 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Tab 6: Reference Images & Isolated Version Library */}
      {activeTab === 'references' && (
        <div className="space-y-4">
          <CharacterVersionReferenceLibrary
            characterId={character.id}
            characterVersionId={formData.id}
            language={language}
            onAssetChanged={() => {
              const updated = CharacterVersionService.getVersionById(formData.id);
              if (updated) {
                setFormData({ ...updated });
              }
            }}
          />
        </div>
      )}

      {/* Persistent Bottom Save / Persistence Action Bar */}
      <div className="sticky bottom-0 z-20 mt-6 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-white">
              {character.displayName} • {formData.version}
            </span>
          </div>
          {isDirty ? (
            <span className="text-xs text-amber-300 font-medium bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
              {language === 'vi' ? 'Có thay đổi chưa lưu' : 'Unsaved changes pending'}
            </span>
          ) : (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {language === 'vi' ? 'Đã lưu trên bộ nhớ' : 'Saved to persistent storage'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={() => {
                const stored = CharacterVersionService.getVersionById(formData.id);
                if (stored) setFormData({ ...stored });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              {language === 'vi' ? 'Hủy thay đổi' : 'Discard'}
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveCurrent}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>
              {language === 'vi' ? `Lưu Phiên Bản DNA (${formData.version})` : `Save DNA Version (${formData.version})`}
            </span>
          </button>
        </div>
      </div>

      {/* Modal: Create New Version */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewVersionSubmit}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Dna className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  {formatLabel('Fork New Character DNA Version', 'Tạo Phiên Bản DNA Mới')}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatLabel(
                    `Base version: ${formData.version} will remain frozen for historical episodes.`,
                    `Bản gốc: ${formData.version} sẽ được đóng băng nguyên vẹn cho các tập phim cũ.`,
                  )}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {formatLabel('New Version Identifier', 'Mã phiên bản mới (VD: v1.1, v2.0)')}
              </label>
              <input
                type="text"
                required
                value={newVersionTag}
                onChange={(e) => setNewVersionTag(e.target.value)}
                placeholder="v1.1"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {formatLabel('Change Notes / Reason', 'Ghi chú thay đổi / Lý do nâng cấp')}
              </label>
              <textarea
                rows={3}
                value={newVersionNotes}
                onChange={(e) => setNewVersionNotes(e.target.value)}
                placeholder={
                  language === 'vi'
                    ? 'Ví dụ: Điều chỉnh kiểu tóc mùa hè, cập nhật họa tiết trang phục mới...'
                    : 'e.g. Summer outfit revision, improved facial curvature...'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="setAsActiveCheckbox"
                checked={setAsActive}
                onChange={(e) => setSetAsActive(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 w-4 h-4"
              />
              <label htmlFor="setAsActiveCheckbox" className="text-xs text-slate-300 cursor-pointer">
                {formatLabel(
                  'Set as the active default version for new episodes',
                  'Đặt làm phiên bản mặc định cho các tập phim tiếp theo',
                )}
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewVersionModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                {formatLabel('Cancel', 'Hủy')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
              >
                {formatLabel('Confirm & Create', 'Xác nhận tạo phiên bản')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
