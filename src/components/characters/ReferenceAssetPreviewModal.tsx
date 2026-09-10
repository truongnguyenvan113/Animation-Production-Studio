import React, { useState } from 'react';
import { CharacterReference, Character, CharacterVersion } from '../../types';
import { CharacterReferenceService } from '../../services/characterReferenceService';
import {
  X,
  Star,
  Trash2,
  Copy,
  Check,
  Download,
  FolderTree,
  Tag,
  Calendar,
  Lock,
  ExternalLink,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { ReferenceCardPreview } from '../shared/ReferenceCardPreview';

interface ReferenceAssetPreviewModalProps {
  reference: CharacterReference;
  character?: Character;
  version?: CharacterVersion;
  language?: 'en' | 'vi';
  onClose: () => void;
  onSetPrimary?: (referenceId: string) => void;
  onDelete?: (referenceId: string) => void;
}

export const ReferenceAssetPreviewModal: React.FC<ReferenceAssetPreviewModalProps> = ({
  reference,
  character,
  version,
  language = 'en',
  onClose,
  onSetPrimary,
  onDelete,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownload = () => {
    if (!reference.image) return;
    const link = document.createElement('a');
    link.href = reference.image;
    link.download = `${reference.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isVi = language === 'vi';

  return (
    <div
      id="reference-asset-preview-modal"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  {reference.id}
                </h3>
                {reference.isPrimary ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shadow-sm">
                    <Star className="w-3 h-3 fill-slate-950" />
                    {isVi ? 'THAM CHIẾU CHÍNH' : 'PRIMARY'}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                    {isVi ? 'Tham chiếu phụ' : 'Secondary'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{character?.displayName || reference.characterId}</span>
                <span>&bull;</span>
                <span className="font-mono text-emerald-400">
                  {version ? `v${version.version}` : reference.characterVersionId}
                </span>
                <span>&bull;</span>
                <span className="capitalize text-amber-300 font-semibold">
                  {reference.type} view
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
              title={isVi ? 'Tải ảnh về máy' : 'Download image'}
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
              title={isVi ? 'Đóng' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Image Canvas */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950 rounded-xl border border-slate-800/80 p-4 min-h-[320px] relative group overflow-hidden">
            {/* Blueprint Grid Background */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {reference.image && (reference.image.startsWith('data:') || reference.image.startsWith('http') || reference.image.startsWith('/')) ? (
              <img
                src={reference.image}
                alt={reference.description || reference.id}
                className="max-h-[460px] max-w-full object-contain rounded-lg shadow-2xl relative z-10"
              />
            ) : (
              <div className="w-full h-80 flex items-center justify-center">
                <ReferenceCardPreview
                  characterId={reference.characterId}
                  type={reference.type}
                  image={reference.image}
                  storagePath={reference.storagePath}
                  isPrimary={reference.isPrimary}
                  className="h-full w-full"
                />
              </div>
            )}

            {/* Immutability pill */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-[11px] px-2.5 py-1 rounded-md font-mono">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Version Locked ({reference.characterVersionId})</span>
            </div>
          </div>

          {/* Right Column: Metadata & Technical Specs */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Storage Path Card */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <FolderTree className="w-3.5 h-3.5" />
                    {isVi ? 'Đường dẫn lưu trữ chuẩn (Storage Path)' : 'Canonical Storage Path'}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(reference.storagePath, 'path')}
                    className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1"
                  >
                    {copiedField === 'path' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">{isVi ? 'Đã chép' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{isVi ? 'Sao chép' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xs text-sky-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                  {reference.storagePath}
                </div>
                <p className="text-[10px] text-slate-500">
                  {isVi
                    ? 'Đường dẫn chuẩn: characters/{characterId}/{versionId}/{filename}'
                    : 'Fixed directory structure: characters/{characterId}/{versionId}/{filename}'}
                </p>
              </div>

              {/* Asset Metadata Grid */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {isVi ? 'Thông số kỹ thuật' : 'Asset Specifications'}
                </h4>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">
                      {isVi ? 'Mã tài nguyên (Asset ID)' : 'Asset ID'}
                    </span>
                    <span className="font-mono text-slate-200 text-[11px] break-all">
                      {reference.id}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">
                      {isVi ? 'Loại góc chiếu' : 'Reference Type'}
                    </span>
                    <span className="font-semibold text-amber-400 capitalize">
                      {reference.type}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">
                      {isVi ? 'Phiên bản nhân vật' : 'Character Version'}
                    </span>
                    <span className="font-mono text-emerald-400 text-xs">
                      {reference.characterVersionId}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">
                      {isVi ? 'Ngày tạo' : 'Registered Date'}
                    </span>
                    <span className="text-slate-300 text-xs">
                      {new Date(reference.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Description & Model Sheet Notes */}
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">
                    {isVi ? 'Mô tả góc chiếu & Ghi chú Model Sheet' : 'Pose Description & Notes'}
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {reference.description || (isVi ? 'Chưa có ghi chú chi tiết' : 'No description provided')}
                  </p>
                </div>
              </div>

              {/* Version Isolation Notice */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>{isVi ? 'Nguyên tắc bất biến theo phiên bản:' : 'Per-Version Immutability:'}</strong>{' '}
                  {isVi
                    ? 'Tài nguyên tham chiếu này được khóa bất biến với Character Version. Storyboard Shots sử dụng Snapshot này sẽ luôn phân giải chính xác hình ảnh này.'
                    : 'This reference asset is locked to this Character Version. Storyboard Shots referencing this snapshot will strictly resolve this visual asset.'}
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(isVi ? 'Xóa ảnh tham chiếu này khỏi thư viện?' : 'Delete this reference asset?')) {
                      onDelete(reference.id);
                      onClose();
                    }
                  }}
                  className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Xóa tài nguyên' : 'Delete Asset'}</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {!reference.isPrimary && onSetPrimary && (
                  <button
                    type="button"
                    onClick={() => {
                      onSetPrimary(reference.id);
                      onClose();
                    }}
                    className="px-3 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Star className="w-3.5 h-3.5 fill-slate-950" />
                    <span>{isVi ? 'Đặt làm Ảnh Chính' : 'Set as Primary'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
                >
                  {isVi ? 'Đóng' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
