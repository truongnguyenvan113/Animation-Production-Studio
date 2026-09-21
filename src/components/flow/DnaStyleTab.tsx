/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  Shot,
  ProductionPack,
  Character,
  CharacterVersion,
  StyleVersion,
  StudioDatabase,
} from '../../types';
import { CharacterImageResolver } from '../../services/characterImageResolver';
import { CharacterAvatar } from '../shared/CharacterAvatar';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Palette,
  Layers,
  Info,
} from 'lucide-react';

interface DnaStyleTabProps {
  shot: Shot;
  pack: ProductionPack | null;
  db: StudioDatabase;
}

export type CharacterLockStatus = 'LOCKED' | 'NOT_IN_SHOT' | 'NOT_ALLOWED';

export interface CharacterCardData {
  character: Character;
  status: CharacterLockStatus;
  lockedVersionId?: string;
  lockedVersion?: CharacterVersion;
  visualImageUrl?: string;
  compiledChar?: ProductionPack['characters'][0];
  exclusionReason?: string;
}

export const DnaStyleTab: React.FC<DnaStyleTabProps> = ({ shot, pack, db }) => {
  // Resolve character lock statuses for ALL characters in the project universe
  const characterCardsData: CharacterCardData[] = useMemo(() => {
    const shotCharIds = shot.characterIds || [];
    const shotLocks: Record<string, string> =
      shot.characterDnaReferences || (shot.characterVersionSnapshots as Record<string, string>) || {};

    const excludedList =
      (shot.continuityNotes as any)?.excludedCharacters ||
      (shot as any).excludedCharacterIds ||
      [];

    return db.characters.map((char) => {
      const isExcluded = Array.isArray(excludedList) && excludedList.includes(char.id);
      const isInShot = shotCharIds.includes(char.id);
      const lockedVerId = shotLocks[char.id];

      // 1. Check if excluded by continuity constraint
      if (isExcluded) {
        return {
          character: char,
          status: 'NOT_ALLOWED',
          exclusionReason: 'Bị loại trừ theo quy tắc liên tục (Continuity Exclusion Rule)',
          visualImageUrl: undefined,
        };
      }

      // 2. Check if locked in this shot
      if (isInShot && lockedVerId) {
        const lockedVer = db.characterVersions.find((v) => v.id === lockedVerId);
        const compiledChar = pack?.characters.find((c) => c.characterId === char.id);
        const visual = CharacterImageResolver.resolveShotCharacterVisual(shot, char.id, db);

        return {
          character: char,
          status: 'LOCKED',
          lockedVersionId: lockedVerId,
          lockedVersion: lockedVer,
          visualImageUrl: visual.imageUrl,
          compiledChar,
        };
      }

      // 3. Otherwise, character belongs to the project universe but is not staged in this shot
      return {
        character: char,
        status: 'NOT_IN_SHOT',
        lockedVersionId: undefined,
        lockedVersion: undefined,
        visualImageUrl: undefined,
      };
    });
  }, [shot, pack, db]);

  // Group characters by status for clear hierarchy
  const lockedCharacters = characterCardsData.filter((c) => c.status === 'LOCKED');
  const notInShotCharacters = characterCardsData.filter((c) => c.status === 'NOT_IN_SHOT');
  const excludedCharacters = characterCardsData.filter((c) => c.status === 'NOT_ALLOWED');

  // Resolved Style Version
  const styleVersion: StyleVersion | undefined = useMemo(() => {
    const styleId = pack?.style.styleVersionId || db.settings?.activeStyleVersionId || 'style_ver_1_0';
    return db.styleVersions?.find((s) => s.id === styleId) || db.styleVersions?.[0];
  }, [pack?.style.styleVersionId, db.styleVersions, db.settings]);

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                SOURCE OF TRUTH LOCK
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                CANON SNAPSHOT v{pack?.canon_snapshot.canonVersion || '1.0'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Khóa Nhận Diện Nhân Vật & Phong Cách (Character DNA & Style Locks)
            </h3>
            <p className="text-xs text-slate-400">
              Mỗi nhân vật và phong cách trong Shot này được khóa cứng từ bản chụp Canon Snapshot bất biến, không suy diễn từ danh sách động toàn cục.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono shrink-0">
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">Nhân vật trong Shot</span>
              <span className="text-emerald-400 font-bold text-sm">{lockedCharacters.length}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">Phong cách</span>
              <span className="text-amber-400 font-bold text-sm">v{styleVersion?.version || '1.0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION: Nhân Vật Đã Khóa Cho Shot Này (LOCKED CHARACTERS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-sm text-slate-900">
              Nhân Vật Đã Khóa Vào Shot Này (Locked Characters &bull; {lockedCharacters.length})
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            Trích xuất trực tiếp từ <code className="text-slate-800 font-mono">shot.characterVersionSnapshots</code>
          </span>
        </div>

        {lockedCharacters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lockedCharacters.map((item) => {
              const { character, lockedVersionId, lockedVersion, compiledChar, visualImageUrl } = item;

              return (
                <div
                  key={character.id}
                  className="rounded-2xl border border-emerald-300 bg-white p-5 shadow-sm space-y-4 relative overflow-hidden"
                >
                  {/* Top Status & Title */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Visual Artwork / Thumbnail Avatar */}
                      <div className="relative shrink-0">
                        <CharacterAvatar
                          characterId={character.id}
                          versionId={lockedVersionId}
                          imageUrl={visualImageUrl}
                          size="xl"
                          className="rounded-2xl border-2 border-emerald-500/40 shadow-md"
                        />
                        <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-600 text-white shadow-xs">
                          <Lock className="w-3 h-3" />
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-base text-slate-900">
                            {character.displayName}
                          </h5>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {character.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {character.englishName} ({character.vietnameseName})
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-emerald-800 font-bold">
                          <span className="px-2 py-0.5 rounded bg-emerald-100/80 border border-emerald-200">
                            v{lockedVersion?.version || compiledChar?.versionNumber || '1.0'}
                          </span>
                          <span className="text-slate-400">&bull;</span>
                          <span className="text-slate-600 truncate max-w-[140px]" title={lockedVersionId}>
                            {lockedVersionId}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ĐÃ KHÓA
                    </span>
                  </div>

                  {/* Character DNA Attributes */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">
                        Trang Phục (Outfit Lock)
                      </span>
                      <p className="text-slate-800 font-medium leading-snug">
                        {compiledChar?.outfit || lockedVersion?.clothing || 'Trang phục chuẩn'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">
                        Kiểu Tóc (Hair Lock)
                      </span>
                      <p className="text-slate-800 font-medium leading-snug">
                        {compiledChar?.hairStyle || lockedVersion?.hair || 'Đặc điểm tóc chuẩn'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">
                        Tỉ Lệ / Hình Thể
                      </span>
                      <p className="text-slate-800 font-medium leading-snug">
                        {compiledChar?.facialFeatures || lockedVersion?.bodyProportions || 'Chuẩn Pixar'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">
                        Màu Da (Skin Tone)
                      </span>
                      <p className="text-slate-800 font-medium leading-snug">
                        {compiledChar?.skinTone || lockedVersion?.skinTone || 'Tự nhiên'}
                      </p>
                    </div>
                  </div>

                  {/* DNA Constraints list */}
                  {compiledChar && compiledChar.dnaConstraints.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                        Ràng Buộc DNA Bất Biến (Strict DNA Constraints):
                      </span>
                      <ul className="space-y-1 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100">
                        {compiledChar.dnaConstraints.map((constraint, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px] leading-snug">
                            <span className="text-emerald-500 font-bold shrink-0">&bull;</span>
                            <span>{constraint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
            Không có nhân vật nào được khóa vào Shot này.
          </div>
        )}
      </div>

      {/* 3. SECTION: Nhân Vật Khác Trong Vũ Trụ Gia Đình (NOT IN SHOT / EXCLUDED) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-slate-500" />
            <h4 className="font-bold text-sm text-slate-800">
              Nhân Vật Khác Trong Vũ Trụ Gia Đình ({notInShotCharacters.length + excludedCharacters.length})
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            Phân định rõ ràng giữa nhân vật có mặt và không có mặt trong Shot này
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Not In Shot characters */}
          {notInShotCharacters.map((item) => {
            const { character } = item;
            return (
              <div
                key={character.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 opacity-85 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <CharacterAvatar characterId={character.id} size="md" className="grayscale-30" />
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">{character.displayName}</h5>
                      <span className="text-[11px] text-slate-500">{character.role}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                    KHÔNG CÓ TRONG SHOT
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Nhân vật thuộc dự án nhưng không được dàn dựng trong Shot này. Không xuất hiện trong Master Prompt.
                </p>
              </div>
            );
          })}

          {/* Excluded characters */}
          {excludedCharacters.map((item) => {
            const { character, exclusionReason } = item;
            return (
              <div
                key={character.id}
                className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <CharacterAvatar characterId={character.id} size="md" className="grayscale opacity-50" />
                    <div>
                      <h5 className="font-bold text-xs text-rose-900">{character.displayName}</h5>
                      <span className="text-[11px] text-rose-600">{character.role}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    BỊ LOẠI TRỪ
                  </span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed font-medium">
                  {exclusionReason}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SECTION: Khóa Phong Cách Nghệ Thuật (STYLE VERSION LOCK) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-600" />
            <h4 className="font-bold text-sm text-slate-900">
              Khóa Phong Cách Nghệ Thuật Toàn Cục (Style Version Lock)
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            Quy định ánh sáng, bảng màu và thẩm mỹ thị giác 3D
          </span>
        </div>

        <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50/30 grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-xs">
          {/* Style Reference Image (4 Cols) */}
          <div className="md:col-span-4 relative aspect-video md:aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-amber-200/80 shadow-md">
            <img
              src="/assets/aistudio/references/styles/warm_pixar_style.jpg"
              alt="Warm Pixar Style Reference"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback placeholder
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute top-2 left-2 bg-amber-950/80 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
              STYLE REFERENCE v{styleVersion?.version || '1.0'}
            </div>
          </div>

          {/* Style Metadata (8 Cols) */}
          <div className="md:col-span-8 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Phong Cách Khóa Vào Production Pack
                </span>
                <h5 className="font-bold text-base text-slate-900">
                  {pack?.style.styleName || styleVersion?.animationStyle || 'Warm Pixar 3D Animation'}
                </h5>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono text-xs font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                {styleVersion?.id || pack?.style.styleVersionId || 'style_ver_1_0'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 bg-white rounded-xl border border-amber-100">
                <strong className="text-slate-800 block mb-1">Quy tắc ánh sáng (Lighting):</strong>
                <p className="text-slate-600 leading-snug">
                  {pack?.style.lightingRule || styleVersion?.lighting || 'Ánh sáng vàng ấm áp, bóng đổ mềm mại tự nhiên'}
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-amber-100">
                <strong className="text-slate-800 block mb-1">Bảng màu (Color Palette):</strong>
                <p className="text-slate-600 leading-snug">
                  {pack?.style.colorPaletteRule || styleVersion?.colorPalette || 'Tông màu pastel ấm, tương phản thân thiện'}
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>Bất biến phong cách:</strong> Đảm bảo tất cả khung hình trong cùng tập phim đồng nhất về chất liệu da, mắt, tóc và bề mặt vải.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
