import React from 'react';
import { ReferenceType } from '../../types';
import { CharacterAvatar } from './CharacterAvatar';

interface ReferenceCardPreviewProps {
  characterId: string;
  type: ReferenceType;
  image?: string;
  storagePath?: string;
  isPrimary?: boolean;
  className?: string;
}

export const ReferenceCardPreview: React.FC<ReferenceCardPreviewProps> = ({
  characterId,
  type,
  image,
  storagePath,
  isPrimary,
  className = '',
}) => {
  const isDataUrlOrHttp = image && (image.startsWith('data:') || image.startsWith('http') || image.startsWith('/'));
  const normType = (type || '').toLowerCase();

  return (
    <div
      className={`relative w-full h-48 rounded-xl bg-slate-950/80 border ${
        isPrimary ? 'border-amber-500/60 ring-1 ring-amber-500/30' : 'border-slate-800'
      } overflow-hidden flex items-center justify-center p-3 group select-none ${className}`}
    >
      {/* Studio Blueprint Grid lines */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Lighting highlight */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute top-3 right-3 z-20 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-md flex items-center gap-1">
          <span>★</span> PRIMARY
        </div>
      )}

      {/* Main visual demonstration based on uploaded image or reference type */}
      {isDataUrlOrHttp ? (
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <img
            src={image}
            alt={`${characterId} ${type} reference`}
            className="max-h-full max-w-full object-contain rounded-lg shadow-md"
            onError={(e) => {
              // fallback if local file path isn't directly resolved
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center justify-center gap-2 text-center">
        {normType.includes('expression') ? (
          <div className="flex items-center gap-2">
            <div className="scale-75 opacity-70">
              <CharacterAvatar characterId={characterId} size="lg" />
            </div>
            <div className="scale-100 z-10 ring-2 ring-amber-400/60 rounded-2xl shadow-lg">
              <CharacterAvatar characterId={characterId} size="lg" />
            </div>
            <div className="scale-75 opacity-70">
              <CharacterAvatar characterId={characterId} size="lg" />
            </div>
          </div>
        ) : normType === 'side' ? (
          <div className="relative flex items-center justify-center">
            <div className="transform -rotate-6">
              <CharacterAvatar characterId={characterId} size="xl" />
            </div>
            {/* Angle Indicator badge */}
            <div className="absolute -bottom-2 bg-slate-900/90 text-sky-400 border border-sky-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full">
              PROFILE 90°
            </div>
          </div>
        ) : normType === '3/4' ? (
          <div className="relative flex items-center justify-center">
            <div className="transform rotate-3 scale-105">
              <CharacterAvatar characterId={characterId} size="xl" />
            </div>
            <div className="absolute -bottom-2 bg-slate-900/90 text-amber-400 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full">
              BEAUTY 45°
            </div>
          </div>
        ) : normType === 'full-body' || normType === 'pose' ? (
          <div className="relative flex items-center justify-center">
            <div className="animate-pulse">
              <CharacterAvatar characterId={characterId} size="xl" />
            </div>
            <div className="absolute -bottom-2 bg-slate-900/90 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full">
              FULL BODY 360°
            </div>
          </div>
        ) : normType === 'custom' ? (
          <div className="relative flex items-center justify-center">
            <CharacterAvatar characterId={characterId} size="xl" />
            <div className="absolute -bottom-2 bg-slate-900/90 text-purple-400 border border-purple-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full">
              CUSTOM DETAIL
            </div>
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            <CharacterAvatar characterId={characterId} size="xl" />
            <div className="absolute -bottom-2 bg-slate-900/90 text-indigo-400 border border-indigo-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full">
              MODEL SHEET 0°
            </div>
          </div>
        )}
      </div>
    )}

      {/* Bottom reference type overlay pill */}
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-sm border border-slate-700/80 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-300 flex items-center gap-1.5 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        {type} Reference
      </div>

      {/* Studio turntable indicator in bottom right */}
      <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-400/80 uppercase tracking-wider">
        3D TURN 24fps
      </div>
    </div>
  );
};
