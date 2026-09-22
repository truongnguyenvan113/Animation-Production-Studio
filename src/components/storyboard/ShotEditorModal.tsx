import React, { useState } from 'react';
import {
  Shot,
  ShotType,
  Character,
  CharacterVersion,
} from '../../types';
import {
  X,
  Lock,
  Save,
  Camera,
  Layers,
  Sparkles,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

interface ShotEditorModalProps {
  shot: Shot;
  characters: Character[];
  characterVersions: CharacterVersion[];
  onSave: (updatedShot: Shot) => void;
  onClose: () => void;
}

const AVAILABLE_SHOT_TYPES: ShotType[] = [
  'Establishing Shot',
  'Wide Shot',
  'Medium Shot',
  'Medium Close-Up',
  'Close-Up',
  'Extreme Close-Up',
  'Over-the-Shoulder',
  'Two-Shot',
  'Tracking Shot',
  'Insert Shot',
];

export const ShotEditorModal: React.FC<ShotEditorModalProps> = ({
  shot,
  characters,
  characterVersions,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Shot>({
    ...shot,
    continuityNotes: { ...(shot.continuityNotes || {}) },
  });

  const handleChange = (field: keyof Shot, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContinuityChange = (field: keyof typeof shot.continuityNotes, value: string) => {
    setFormData((prev) => ({
      ...prev,
      continuityNotes: {
        ...(prev.continuityNotes || {}),
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div
      id="shot-editor-modal"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold font-mono">
              #{formData.shotNumber}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Chỉnh sửa Phân cảnh Shot (Phase 3)
              </h3>
              <p className="text-xs text-slate-500">
                Shot ID: <span className="font-mono text-slate-700">{formData.id}</span> &bull; Scene #{formData.sceneNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* IMMUTABILITY BANNER */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 space-y-2">
            <div className="flex items-center font-bold text-emerald-950">
              <Lock className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
              Nguyên tắc Bất biến: Khóa Character DNA & Style Snapshot
            </div>
            <p className="text-emerald-800 leading-relaxed">
              Mỗi Shot thừa hưởng trực tiếp phiên bản nhân vật và style snapshot từ Episode. Để đảm bảo tính nhất quán của Character Registry, các trường tham chiếu DNA bên dưới là <strong>bất biến và được khóa bảo vệ</strong>.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-md font-mono text-[11px] border border-emerald-300 flex items-center">
                <Lock className="w-3 h-3 mr-1 text-emerald-700" />
                Style Snapshot: {formData.styleVersionSnapshotId}
              </span>
              {formData.characterIds.map((cId) => {
                const char = characters.find((c) => c.id === cId);
                const vId = formData.characterDnaReferences[cId];
                const v = characterVersions.find((ver) => ver.id === vId);
                return (
                  <span
                    key={cId}
                    className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-md font-mono text-[11px] border border-emerald-300 flex items-center"
                  >
                    <Lock className="w-3 h-3 mr-1 text-emerald-700" />
                    {char?.displayName || cId}: {v ? `v${v.version}` : vId}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Core Production Parameters */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
              <Camera className="w-4 h-4 mr-1.5 text-indigo-600" />
              Thông số Máy quay & Thời lượng
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loại Shot (Shot Type)
                </label>
                <select
                  value={formData.shotType}
                  onChange={(e) => handleChange('shotType', e.target.value as ShotType)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {AVAILABLE_SHOT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thời lượng (Giây)
                </label>
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={formData.durationSeconds}
                  onChange={(e) => handleChange('durationSeconds', parseInt(e.target.value) || 5)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bố cục khung hình (Framing)
                </label>
                <input
                  type="text"
                  value={formData.framing}
                  onChange={(e) => handleChange('framing', e.target.value)}
                  placeholder="Ví dụ: Trung cảnh hai nhân vật"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chuyển động máy (Camera Movement)
                </label>
                <input
                  type="text"
                  value={formData.cameraMovement}
                  onChange={(e) => handleChange('cameraMovement', e.target.value)}
                  placeholder="Ví dụ: Tracking Pan theo bước chân nhân vật"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Góc máy (Camera Angle)
                </label>
                <input
                  type="text"
                  value={formData.cameraAngle || ''}
                  onChange={(e) => handleChange('cameraAngle', e.target.value)}
                  placeholder="Ví dụ: Low-Angle 20° hoặc Eye-Level 0°"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chỉ đạo quay phim chi tiết (Camera Direction)
              </label>
              <textarea
                rows={2}
                value={formData.cameraDirection}
                onChange={(e) => handleChange('cameraDirection', e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action and Staging */}
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
              <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
              Diễn xuất, Hành động & Tâm điểm thị giác
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hành động & Diễn biến của nhân vật (Action)
              </label>
              <textarea
                rows={3}
                value={formData.action}
                onChange={(e) => handleChange('action', e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tâm điểm thị giác (Visual Focus)
                </label>
                <input
                  type="text"
                  value={formData.visualFocus || ''}
                  onChange={(e) => handleChange('visualFocus', e.target.value)}
                  placeholder="Ví dụ: Nụ cười rạng rỡ của Pi"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cảm xúc chủ đạo (Emotion)
                </label>
                <input
                  type="text"
                  value={formData.emotion}
                  onChange={(e) => handleChange('emotion', e.target.value)}
                  placeholder="Ví dụ: Hào hứng, ngây thơ"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dialogue */}
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
              <MessageSquare className="w-4 h-4 mr-1.5 text-blue-500" />
              Lời thoại & Nhân vật phát ngôn
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhân vật nói (Speaker)
                </label>
                <select
                  value={formData.speakerCharacterId || ''}
                  onChange={(e) => {
                    const charId = e.target.value;
                    const c = characters.find((char) => char.id === charId);
                    setFormData((prev) => ({
                      ...prev,
                      speakerCharacterId: charId,
                      speakerCharacterName: c?.displayName || '',
                    }));
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Không có thoại --</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName} ({c.vietnameseName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Câu thoại (Dialogue Line)
                </label>
                <input
                  type="text"
                  value={formData.dialogue || ''}
                  onChange={(e) => handleChange('dialogue', e.target.value)}
                  placeholder="Nhập câu thoại của nhân vật trong shot..."
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Continuity Notes */}
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
              <Layers className="w-4 h-4 mr-1.5 text-slate-600" />
              Ghi chú Tính liên tục (Continuity Notes)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vị trí nhân vật (Character Positions)
                </label>
                <input
                  type="text"
                  value={formData.continuityNotes?.characterPositions || ''}
                  onChange={(e) => handleContinuityChange('characterPositions', e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tính liên tục của Đạo cụ (Prop Continuity)
                </label>
                <input
                  type="text"
                  value={formData.continuityNotes?.propContinuity || ''}
                  onChange={(e) => handleContinuityChange('propContinuity', e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mối quan hệ với Shot trước (Previous Shot Relationship)
                </label>
                <input
                  type="text"
                  value={formData.continuityNotes?.previousShotRelationship || ''}
                  onChange={(e) => handleContinuityChange('previousShotRelationship', e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center text-xs text-slate-500">
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Thay đổi chỉ ảnh hưởng đến shot này và được lưu tự động.
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Lưu thông số Shot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
