import React, { useState } from 'react';
import { Character, LanguageMode } from '../../types';
import { CharacterService } from '../../services/characterService';
import { CharacterCard } from './CharacterCard';
import { VersionHistoryModal } from './VersionHistoryModal';
import { Dna, Sparkles, Filter } from 'lucide-react';

interface CharacterListViewProps {
  onOpenDNA: (characterId: string) => void;
  onOpenReferences: (characterId: string) => void;
  language: LanguageMode;
}

export const CharacterListView: React.FC<CharacterListViewProps> = ({
  onOpenDNA,
  onOpenReferences,
  language,
}) => {
  const characters = CharacterService.getAllCharacters();
  const [historyModalCharId, setHistoryModalCharId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');

  const filteredCharacters = characters.filter((c) => {
    if (filterRole === 'core') return !c.isSupporting;
    if (filterRole === 'supporting') return c.isSupporting;
    return true;
  });

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20">
            <Dna className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {formatLabel('Character DNA Registry', 'Sổ bộ Nhận diện Nhân vật (Character DNA)')}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {characters.length} Registered
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {formatLabel(
                'Source of Truth for facial identity, proportional anatomy, attire, personality, and master AI prompt blueprints.',
                'Nguồn chân lý cho cấu trúc khuôn mặt, tỷ lệ giải phẫu, trang phục, tính cách và chỉ dẫn tạo hình AI.',
              )}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:border-amber-500 focus:outline-none"
          >
            <option value="all">{formatLabel('All Characters', 'Tất cả nhân vật')}</option>
            <option value="core">{formatLabel('Core Family (4)', 'Gia đình hạt nhân (4)')}</option>
            <option value="supporting">{formatLabel('Supporting / Pets (1)', 'Nhân vật phụ / Thú cưng (1)')}</option>
          </select>
        </div>
      </div>

      {/* Grid of Characters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCharacters.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            onOpenDNA={onOpenDNA}
            onOpenReferences={onOpenReferences}
            onOpenHistory={(id) => setHistoryModalCharId(id)}
            language={language}
          />
        ))}
      </div>

      {/* Version History Modal */}
      {historyModalCharId && (
        <VersionHistoryModal
          characterId={historyModalCharId}
          isOpen={!!historyModalCharId}
          onClose={() => setHistoryModalCharId(null)}
          onSelectVersion={(versionId) => {
            onOpenDNA(historyModalCharId);
          }}
          language={language}
        />
      )}
    </div>
  );
};
