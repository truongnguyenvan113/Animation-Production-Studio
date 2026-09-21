import React from 'react';
import { Character, CharacterVersion, LanguageMode } from '../../types';
import { CharacterAvatar } from '../shared/CharacterAvatar';
import { CharacterVersionService } from '../../services/characterVersionService';
import { Dna, Image as ImageIcon, History, Sparkles, Tag, ArrowRight } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  onOpenDNA: (characterId: string) => void;
  onOpenReferences: (characterId: string) => void;
  onOpenHistory: (characterId: string) => void;
  language: LanguageMode;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onOpenDNA,
  onOpenReferences,
  onOpenHistory,
  language,
}) => {
  const activeVersion: CharacterVersion | undefined =
    CharacterVersionService.getActiveVersionForCharacter(character.id);

  const versions = CharacterVersionService.getVersionsForCharacter(character.id);

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all p-5 flex flex-col justify-between shadow-lg relative group overflow-hidden">
      {/* Accent glow corner */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: character.colorScheme.primary }}
      />

      <div>
        {/* Top bar with role & version pill */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <CharacterAvatar characterId={character.id} versionId={activeVersion?.id} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {character.displayName}
                </h3>
                {character.isSupporting && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                    Supporting
                  </span>
                )}
              </div>

              <p className="text-xs font-medium text-amber-400">
                {character.role} •{' '}
                <span className="text-slate-400">
                  {character.englishName} ({character.vietnameseName})
                </span>
              </p>

              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <Dna className="w-3 h-3 text-emerald-400" />
                  DNA {activeVersion?.version || 'v1.0'} Active
                </span>
                <span className="text-[11px] text-slate-400">
                  {versions.length} {versions.length > 1 ? 'versions' : 'version'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Personality & Visual summary preview */}
        {activeVersion && (
          <div className="space-y-2.5 py-3 border-t border-b border-slate-800/80 my-3 text-xs text-slate-300">
            {/* Canonical Role / Occupation / Age highlight */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-amber-400 font-bold uppercase tracking-wider">
                  {activeVersion.occupation || (character.isSupporting ? 'Species' : 'Age Proportions')}
                </span>
                <span className="text-slate-400 text-[10px]">
                  {activeVersion.age}
                </span>
              </div>
              {activeVersion.species && (
                <p className="text-[11px] font-medium text-emerald-400">
                  {activeVersion.species}
                </p>
              )}
              {activeVersion.likes && (
                <p className="text-[11px] text-slate-300">
                  <span className="text-slate-400 font-medium">Likes: </span>
                  {activeVersion.likes}
                </p>
              )}
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-0.5 text-[11px] uppercase tracking-wider">
                {language === 'vi' ? 'Tính cách & Hành vi' : 'Personality & Behavior'}:
              </span>
              <p className="text-slate-300 line-clamp-2 leading-relaxed">
                {activeVersion.personality} — {activeVersion.behavior}
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-0.5 text-[11px] uppercase tracking-wider">
                {language === 'vi' ? 'Trang phục cốt lõi' : 'Signature Attire'}:
              </span>
              <p className="text-slate-300 line-clamp-2 leading-relaxed">
                {activeVersion.clothing}
              </p>
            </div>

            {/* Visual Keywords tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeVersion.visualKeywords.slice(0, 4).map((kw, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
                >
                  #{kw}
                </span>
              ))}
              {activeVersion.visualKeywords.length > 4 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  +{activeVersion.visualKeywords.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center gap-2">
        <button
          onClick={() => onOpenDNA(character.id)}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
        >
          <Dna className="w-3.5 h-3.5" />
          <span>{formatLabel('Manage DNA', 'Quản lý DNA')}</span>
        </button>

        <button
          onClick={() => onOpenReferences(character.id)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          title="Character References Gallery"
        >
          <ImageIcon className="w-4 h-4 text-sky-400" />
        </button>

        <button
          onClick={() => onOpenHistory(character.id)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          title="Version History & Episode Snapshots"
        >
          <History className="w-4 h-4 text-emerald-400" />
        </button>
      </div>
    </div>
  );
};
