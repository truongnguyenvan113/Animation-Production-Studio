import React from 'react';
import {
  Shot,
  Character,
  CharacterVersion,
} from '../../types';
import { CharacterReferenceService } from '../../services/characterReferenceService';
import {
  Camera,
  Clock,
  MessageSquare,
  Sparkles,
  Edit3,
  Trash2,
  Lock,
  Eye,
  Layers,
  Compass,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react';

interface ShotCardProps {
  shot: Shot;
  characters: Character[];
  characterVersions: CharacterVersion[];
  onOpenPromptPreview: (shot: Shot) => void;
  onEditShot: (shot: Shot) => void;
  onDeleteShot?: (shot: Shot) => void;
  onGenerateImage?: (shot: Shot) => void;
  onViewImageOutput?: (shot: Shot) => void;
  canDelete?: boolean;
}

export const ShotCard: React.FC<ShotCardProps> = ({
  shot,
  characters,
  characterVersions,
  onOpenPromptPreview,
  onEditShot,
  onDeleteShot,
  onGenerateImage,
  onViewImageOutput,
  canDelete = false,
}) => {
  const [hasImageError, setHasImageError] = React.useState(false);
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);

  const displayImageUrl = React.useMemo(() => {
    if (!shot.activeImageOutputUrl) return undefined;
    let url = shot.activeImageOutputUrl;
    if (url.includes('&bull;') || url.includes('%26bull%3B')) {
      url = url.replaceAll('%26bull%3B', '%E2%80%A2').replaceAll('&bull;', '•');
    }
    return url;
  }, [shot.activeImageOutputUrl]);
  const getShotTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Establishing Shot':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Wide Shot':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Medium Shot':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Medium Close-Up':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Close-Up':
      case 'Extreme Close-Up':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Two-Shot':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Tracking Shot':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Insert Shot':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div
      id={`shot-card-${shot.id}`}
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
    >
      {/* Header bar */}
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
            Shot #{shot.shotNumber}
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getShotTypeBadgeColor(
              shot.shotType
            )}`}
          >
            {shot.shotType}
          </span>
          <span className="inline-flex items-center text-xs font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
            <Clock className="w-3 h-3 mr-1 text-slate-400" />
            {shot.durationSeconds}s
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
              shot.generationStatus === 'Approved'
                ? 'bg-purple-100 text-purple-800 border-purple-200 font-bold'
                : shot.generationStatus === 'Generated'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold'
                : shot.generationStatus === 'Queued'
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-slate-200/70 text-slate-500 border-slate-300'
            }`}
          >
            {shot.generationStatus}
          </span>
        </div>
      </div>

      {/* Rendered Frame Preview if Available */}
      {displayImageUrl && (
        <div
          onClick={() => onViewImageOutput && onViewImageOutput(shot)}
          className="relative bg-slate-950 aspect-video cursor-pointer group overflow-hidden border-b border-slate-200"
        >
          {hasImageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-4 text-center">
              <ImageIcon className="w-8 h-8 text-slate-500 mb-1" />
              <span className="text-xs font-semibold text-slate-300">Khung hình đang đồng bộ</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Nhấp để xem chi tiết kết xuất</span>
            </div>
          ) : (
            <img
              src={displayImageUrl}
              alt={`Rendered keyframe for Shot ${shot.shotNumber}`}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                isImageLoaded ? 'opacity-100' : 'opacity-90'
              }`}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setHasImageError(true)}
            />
          )}
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
            <span className="text-xs font-bold text-white bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Xem Khung Hình CGI
            </span>
          </div>
          {shot.generationStatus === 'Approved' && (
            <span className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
              Keyframe Đã Duyệt
            </span>
          )}
        </div>
      )}

      {/* Card Content Body */}
      <div className="p-4 space-y-3 flex-1 text-sm">
        {/* Camera and Movement Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
          <div className="flex items-start space-x-1.5">
            <Camera className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
            <span className="text-slate-600">
              <strong className="text-slate-800">Framing:</strong> {shot.framing}
            </span>
          </div>
          <div className="flex items-start space-x-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
            <span className="text-slate-600">
              <strong className="text-slate-800">Chuyển động:</strong> {shot.cameraMovement}
            </span>
          </div>
          {shot.cameraAngle && (
            <div className="col-span-1 sm:col-span-2 text-slate-500 text-[11px]">
              <strong>Góc máy:</strong> {shot.cameraAngle} &bull; <strong>Hướng:</strong> {shot.cameraDirection}
            </div>
          )}
        </div>

        {/* Action & Visual Focus */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center">
            <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
            Hành động & Diễn hoạt
          </h4>
          <p className="text-slate-700 leading-relaxed line-clamp-3 text-xs">
            {shot.action}
          </p>
          {shot.visualFocus && (
            <p className="text-[11px] text-slate-500 mt-1 italic">
              <strong>Tâm điểm thị giác:</strong> {shot.visualFocus}
            </p>
          )}
        </div>

        {/* Dialogue snippet if exists */}
        {shot.dialogue && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2 text-xs text-amber-900 flex items-start space-x-2">
            <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-950">
                {shot.speakerCharacterName || 'Thoại'}:
              </span>{' '}
              "{shot.dialogue}"
              {shot.emotion && (
                <span className="block text-[11px] text-amber-700 mt-0.5 italic">
                  Biểu cảm: {shot.emotion}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Immutable Character DNA References */}
        <div className="border-t border-slate-100 pt-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-600 flex items-center">
              <Lock className="w-3 h-3 mr-1 text-emerald-600" />
              Khóa Character DNA Snapshot:
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Style: {shot.styleVersionSnapshotId}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {shot.characterIds.map((charId) => {
              const char = characters.find((c) => c.id === charId);
              const versionId = shot.characterDnaReferences[charId];
              const ver = characterVersions.find((v) => v.id === versionId);
              const primaryRef = versionId ? CharacterReferenceService.getPrimaryReference(versionId) : undefined;

              return (
                <div
                  key={charId}
                  className="inline-flex items-center text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono"
                  title={`Character DNA Snapshot: ${char?.displayName || charId} locked to ${versionId}${primaryRef ? ` | Ref: ${primaryRef.storagePath}` : ''}`}
                >
                  <span className="font-sans font-semibold mr-1">
                    {char?.displayName || charId}:
                  </span>
                  <span className="text-emerald-700">
                    {ver ? `v${ver.version}` : versionId || 'locked'}
                  </span>
                  <Lock className="w-2.5 h-2.5 ml-1 text-emerald-600" />
                  {primaryRef && (
                    <span
                      className="ml-1 text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1 rounded flex items-center gap-0.5 font-sans capitalize"
                      title={`Resolved Reference: ${primaryRef.storagePath}`}
                    >
                      <ImageIcon className="w-2 h-2 text-amber-700" />
                      {primaryRef.type}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Continuity preview */}
        {shot.continuityNotes && (
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 space-y-0.5">
            <div className="font-semibold text-slate-700 flex items-center text-[10px] uppercase">
              <Layers className="w-3 h-3 mr-1 text-slate-400" /> Tính liên tục (Continuity)
            </div>
            {shot.continuityNotes.previousShotRelationship && (
              <div className="truncate">
                <ArrowRight className="w-2.5 h-2.5 inline mr-1 text-slate-400" />
                {shot.continuityNotes.previousShotRelationship}
              </div>
            )}
            {shot.continuityNotes.characterPositions && (
              <div className="truncate">
                &bull; Vị trí: {shot.continuityNotes.characterPositions}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Action Buttons */}
      <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <button
            id={`btn-prompt-preview-${shot.id}`}
            type="button"
            onClick={() => onOpenPromptPreview(shot)}
            className="inline-flex items-center text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Prompt
          </button>

          {onGenerateImage && (
            <button
              id={`btn-generate-shot-image-${shot.id}`}
              type="button"
              onClick={() => onGenerateImage(shot)}
              className={`inline-flex items-center text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                shot.activeImageOutputUrl
                  ? 'text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                  : 'text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-200 font-bold'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              {shot.activeImageOutputUrl ? 'Tạo Lại' : 'Render Frame'}
            </button>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            id={`btn-edit-shot-${shot.id}`}
            type="button"
            onClick={() => onEditShot(shot)}
            className="inline-flex items-center text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 p-1.5 rounded transition-colors"
            title="Chỉnh sửa thông số shot (DNA được bảo vệ bất biến)"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {canDelete && onDeleteShot && (
            <button
              id={`btn-delete-shot-${shot.id}`}
              type="button"
              onClick={() => onDeleteShot(shot)}
              className="inline-flex items-center text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded transition-colors"
              title="Xóa shot khỏi phân cảnh"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
