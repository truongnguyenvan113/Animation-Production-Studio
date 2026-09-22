import React, { useState } from 'react';
import { X, Image as ImageIcon, Check, Link as LinkIcon, Film, Sparkles } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface AssetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assetId: string, url: string) => void;
  currentAssetId?: string;
  currentUrl?: string;
  title?: string;
}

export const AssetSelectorModal: React.FC<AssetSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentAssetId,
  currentUrl,
  title = 'Chọn Hình Ảnh / Thumbnail Từ Thư Viện',
}) => {
  const [tab, setTab] = useState<'references' | 'shots' | 'custom'>('references');
  const [customInputUrl, setCustomInputUrl] = useState(currentUrl || '');

  if (!isOpen) return null;

  const db = storageService.getDatabase();
  const projectRefs = db.projectReferences || [];
  const charRefs = db.characterReferences || [];
  const storyboards = db.storyboards || [];

  // Extract shots with images
  const shotImages: Array<{ id: string; title: string; url: string; shotCode: string }> = [];
  storyboards.forEach((sb) => {
    sb.scenes?.forEach((sc) => {
      sc.shots?.forEach((shot) => {
        if (shot.activeImageOutputUrl) {
          shotImages.push({
            id: shot.id,
            shotCode: `Shot ${shot.sceneNumber}.${shot.shotNumber}`,
            title: shot.visualPurpose || shot.action || 'Shot Keyframe',
            url: shot.activeImageOutputUrl,
          });
        }
      });
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">
                Chọn từ kho tham chiếu, khung hình Storyboard hoặc dán liên kết ảnh trực tiếp
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

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setTab('references')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'references'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thư viện Tham chiếu ({projectRefs.length + charRefs.length})</span>
          </button>
          <button
            onClick={() => setTab('shots')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'shots'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Khung hình Storyboard ({shotImages.length})</span>
          </button>
          <button
            onClick={() => setTab('custom')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'custom'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Dán liên kết ảnh (URL)</span>
          </button>
        </div>

        {/* Content area */}
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          {tab === 'references' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {projectRefs.map((ref) => {
                const isSelected = currentAssetId === ref.id || currentUrl === ref.uri;
                return (
                  <div
                    key={ref.id}
                    onClick={() => {
                      onSelect(ref.id, ref.uri || ref.thumbnail || '');
                      onClose();
                    }}
                    className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all bg-slate-950 ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/40'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="aspect-video bg-slate-900 overflow-hidden relative">
                      <img
                        src={ref.thumbnail || ref.uri}
                        alt={ref.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-amber-500 text-slate-950 shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="p-2 text-[11px]">
                      <div className="font-semibold text-slate-200 truncate">{ref.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{ref.type}</div>
                    </div>
                  </div>
                );
              })}

              {charRefs.map((ref) => {
                const isSelected = currentAssetId === ref.id || currentUrl === ref.image;
                return (
                  <div
                    key={ref.id}
                    onClick={() => {
                      onSelect(ref.id, ref.image || ref.thumbnail || '');
                      onClose();
                    }}
                    className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all bg-slate-950 ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/40'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="aspect-square bg-slate-900 overflow-hidden relative">
                      <img
                        src={ref.thumbnail || ref.image}
                        alt={ref.description || ref.id}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-amber-500 text-slate-950 shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="p-2 text-[11px]">
                      <div className="font-semibold text-slate-200 truncate">
                        {ref.type} — {ref.characterId}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">Nhân vật tham chiếu</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'shots' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {shotImages.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 text-sm">
                  Chưa có khung hình Storyboard nào được kết xuất hình ảnh.
                </div>
              ) : (
                shotImages.map((shot) => {
                  const isSelected = currentAssetId === shot.id || currentUrl === shot.url;
                  return (
                    <div
                      key={shot.id}
                      onClick={() => {
                        onSelect(shot.id, shot.url);
                        onClose();
                      }}
                      className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all bg-slate-950 ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-400/40'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="aspect-video bg-slate-900 overflow-hidden relative">
                        <img
                          src={shot.url}
                          alt={shot.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-amber-500 text-slate-950 shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-amber-300">
                          {shot.shotCode}
                        </span>
                      </div>
                      <div className="p-2 text-[11px]">
                        <div className="font-semibold text-slate-200 truncate">{shot.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">Keyframe Storyboard</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'custom' && (
            <div className="max-w-md mx-auto py-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Đường dẫn ảnh (URL hoặc đường dẫn cục bộ):
                </label>
                <input
                  type="text"
                  value={customInputUrl}
                  onChange={(e) => setCustomInputUrl(e.target.value)}
                  placeholder="https://example.com/thumbnail.jpg hoặc /storage/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {customInputUrl && (
                <div className="rounded-xl border border-slate-800 p-2 bg-slate-950">
                  <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Xem trước ảnh:</div>
                  <div className="aspect-video rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img
                      src={customInputUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                disabled={!customInputUrl.trim()}
                onClick={() => {
                  onSelect(`custom_${Date.now()}`, customInputUrl.trim());
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Xác nhận sử dụng ảnh này</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
