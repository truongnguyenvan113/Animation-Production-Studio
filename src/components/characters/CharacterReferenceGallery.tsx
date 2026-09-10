import React, { useState } from 'react';
import {
  Character,
  CharacterReference,
  ReferenceType,
  LanguageMode,
} from '../../types';
import { CharacterService } from '../../services/characterService';
import { ReferenceCardPreview } from '../shared/ReferenceCardPreview';
import { CharacterAvatar } from '../shared/CharacterAvatar';
import {
  Image as ImageIcon,
  Plus,
  Filter,
  CheckCircle2,
  Trash2,
  Tag,
  Sparkles,
} from 'lucide-react';

interface CharacterReferenceGalleryProps {
  initialCharacterId?: string;
  language: LanguageMode;
  onOpenDNA: (characterId: string) => void;
}

const REFERENCE_TYPES: ReferenceType[] = [
  'Front',
  'Side',
  '3/4',
  'Full Body',
  'Face',
  'Expression',
  'Clothing',
  'Pose',
  'Other',
];

export const CharacterReferenceGallery: React.FC<CharacterReferenceGalleryProps> = ({
  initialCharacterId,
  language,
  onOpenDNA,
}) => {
  const characters = CharacterService.getAllCharacters();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    initialCharacterId || 'all',
  );
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New reference form state
  const [newCharId, setNewCharId] = useState(characters[0]?.id || '');
  const [newType, setNewType] = useState<ReferenceType>('Front');
  const [newDescription, setNewDescription] = useState('');

  const references = CharacterService.getAllReferences();

  const filteredReferences = references.filter((r) => {
    const matchChar = selectedCharacterId === 'all' || r.characterId === selectedCharacterId;
    const matchType = selectedType === 'all' || r.type === selectedType;
    return matchChar && matchType;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    const char = CharacterService.getCharacterById(newCharId);
    CharacterService.addReference({
      characterId: newCharId,
      characterVersionId: char?.activeVersionId || 'ver_default',
      type: newType,
      image: `${newCharId}_${newType.toLowerCase()}`,
      description: newDescription.trim(),
      active: true,
    });

    setIsAddModalOpen(false);
    setNewDescription('');
  };

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {formatLabel('Character Reference Gallery', 'Thư viện ảnh tham chiếu nhân vật')}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
              {filteredReferences.length} {filteredReferences.length === 1 ? 'asset' : 'assets'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {formatLabel(
              'Orthographic angles, expression sheets, and attire references ensuring multi-angle 3D visual consistency.',
              'Góc chiếu trực giao, bảng biểu cảm, chi tiết trang phục phục vụ kết xuất 3D đồng nhất.',
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Character Filter */}
          <select
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:border-amber-500 focus:outline-none"
          >
            <option value="all">{formatLabel('All Characters', 'Tất cả nhân vật')}</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>

          {/* Reference Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:border-amber-500 focus:outline-none"
          >
            <option value="all">{formatLabel('All Reference Types', 'Tất cả loại ảnh')}</option>
            {REFERENCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{formatLabel('Add Reference Asset', 'Thêm ảnh tham chiếu')}</span>
          </button>
        </div>
      </div>

      {/* Reference Type Quick Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            selectedType === 'all'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          {formatLabel('All Types', 'Tất cả')}
        </button>
        {REFERENCE_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              selectedType === type
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Grid of References */}
      {filteredReferences.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-slate-400">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-semibold">{formatLabel('No references found', 'Không tìm thấy ảnh tham chiếu')}</p>
          <p className="text-xs text-slate-500 mt-1">
            {formatLabel(
              'Try changing your filter or add a new reference sheet.',
              'Hãy thử thay đổi bộ lọc hoặc thêm một ảnh tham chiếu mới.',
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReferences.map((ref) => {
            const char = CharacterService.getCharacterById(ref.characterId);
            return (
              <div
                key={ref.id}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all p-4 flex flex-col justify-between shadow-lg group"
              >
                <div>
                  {/* Top character badge & active toggle */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <CharacterAvatar characterId={ref.characterId} size="sm" />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {char?.displayName || ref.characterId}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {char?.role}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => CharacterService.toggleReferenceActive(ref.id)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors ${
                        ref.active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                      title="Toggle active reference state"
                    >
                      {ref.active ? 'Active' : 'Muted'}
                    </button>
                  </div>

                  {/* Visual Preview */}
                  <ReferenceCardPreview
                    characterId={ref.characterId}
                    type={ref.type}
                    image={ref.image}
                    storagePath={ref.storagePath}
                    isPrimary={ref.isPrimary}
                  />

                  {/* Description note & Canonical Storage */}
                  <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                    {ref.description}
                  </p>
                  {ref.storagePath && (
                    <p className="text-[10px] font-mono text-sky-400/80 truncate mt-1 bg-slate-950 p-1.5 rounded border border-slate-800/60">
                      {ref.storagePath}
                    </p>
                  )}
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-amber-400/90">
                      #{ref.type.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {ref.characterVersionId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenDNA(ref.characterId)}
                      className="text-xs text-slate-300 hover:text-amber-400 font-medium"
                    >
                      {formatLabel('DNA', 'Xem DNA')}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this reference asset?')) {
                          CharacterService.deleteReference(ref.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete reference"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reference Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  {formatLabel('Add Character Reference Asset', 'Thêm Ảnh Tham Chiếu Mới')}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatLabel(
                    'Attach multi-angle blueprint model sheets to character DNA.',
                    'Gán bản vẽ chiếu trực giao hoặc bảng biểu cảm vào nhận diện nhân vật.',
                  )}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {formatLabel('Target Character', 'Nhân vật')}
              </label>
              <select
                value={newCharId}
                onChange={(e) => setNewCharId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName} ({c.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {formatLabel('Reference View Type', 'Loại góc chiếu / Tham chiếu')}
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as ReferenceType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                {REFERENCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {formatLabel('Description / Pose Notes', 'Mô tả chi tiết / Ghi chú tư thế')}
              </label>
              <textarea
                rows={3}
                required
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={
                  language === 'vi'
                    ? 'VD: Góc quay 3/4 thể hiện độ phồng của tóc, nụ cười tinh nghịch...'
                    : 'e.g. 3/4 turn showing cheek volume and joyful dynamic pose...'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                {formatLabel('Cancel', 'Hủy')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
              >
                {formatLabel('Register Reference', 'Đăng ký ảnh tham chiếu')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
