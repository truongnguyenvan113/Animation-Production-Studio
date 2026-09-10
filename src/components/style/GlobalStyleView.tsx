import React, { useState, useEffect } from 'react';
import { GlobalStyle, GlobalStyleVersion, LanguageMode } from '../../types';
import { StyleService } from '../../services/styleService';
import {
  Palette,
  Layers,
  PlusCircle,
  Save,
  Check,
  Sparkles,
  Camera,
  Sun,
  Tv,
  Film,
  Copy,
  Info,
} from 'lucide-react';

interface GlobalStyleViewProps {
  language: LanguageMode;
}

export const GlobalStyleView: React.FC<GlobalStyleViewProps> = ({ language }) => {
  const style = StyleService.getGlobalStyle();
  const versions = StyleService.getAllStyleVersions();

  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    style.activeVersionId || versions[0]?.id || '',
  );

  const [formData, setFormData] = useState<GlobalStyleVersion | null>(null);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newVersionTag, setNewVersionTag] = useState('v1.2');
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [setAsActive, setSetAsActive] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const ver = StyleService.getStyleVersionById(selectedVersionId);
    if (ver) {
      setFormData({ ...ver });
    }
  }, [selectedVersionId]);

  if (!formData) return null;

  const isCurrentActive = style.activeVersionId === formData.id;

  const handleFieldChange = (field: keyof GlobalStyleVersion, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSaveCurrent = () => {
    if (!formData) return;
    StyleService.updateStyleVersion(formData.id, formData);
    setSuccessMessage(
      language === 'vi'
        ? `Đã lưu thành công phong cách ${formData.version}!`
        : `Successfully saved Global Style ${formData.version}!`,
    );
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleCreateNewVersionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !newVersionTag.trim()) return;

    const created = StyleService.createNewStyleVersion(
      formData.id,
      newVersionTag.trim(),
      formData,
      newVersionNotes.trim() || 'Iteration on global 3D style',
      setAsActive,
    );

    setIsNewVersionModalOpen(false);
    setSelectedVersionId(created.id);
    setSuccessMessage(
      language === 'vi'
        ? `Đã tạo phiên bản phong cách mới ${created.version}! Bản cũ được đóng băng an toàn.`
        : `Created new Global Style version ${created.version}! Historical snapshots remain preserved.`,
    );
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {formatLabel('Global Style & Visual Directives', 'Phong cách hình ảnh chung (Global Style)')}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {formData.version} {isCurrentActive ? '• Master Active' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {formatLabel(
                'Defines lighting, camera rules, color harmony, and Pixar-grade 3D aesthetic applied studio-wide.',
                'Định nghĩa quy chuẩn ánh sáng, góc máy, bảng màu và thẩm mỹ 3D chuẩn điện ảnh cho toàn bộ series.',
              )}
            </p>
          </div>
        </div>

        {/* Actions & Switcher */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Layers className="w-4 h-4 text-indigo-400" />
            <select
              value={selectedVersionId}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                  {v.version} {style.activeVersionId === v.id ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsNewVersionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{formatLabel('Fork New Style', 'Tạo bản mới')}</span>
          </button>

          <button
            onClick={handleSaveCurrent}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{formatLabel('Save Style', 'Lưu thay đổi')}</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Principle notice */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {formatLabel(
              'Style versions are bound as immutable snapshots to episodes. Changing parameters creates forward iterations without rewriting historical episodes.',
              'Mỗi tập phim gắn liền với snapshot của phiên bản phong cách này. Mọi thay đổi ở đây sẽ không ảnh hưởng hồi tố đến các tập trước.',
            )}
          </span>
        </div>

        {!isCurrentActive && (
          <button
            onClick={() => {
              StyleService.setActiveStyleVersion(formData.id);
              setSuccessMessage(
                language === 'vi'
                  ? `Đã kích hoạt phong cách ${formData.version} làm chuẩn mặc định!`
                  : `Activated style ${formData.version} as master default!`,
              );
              setTimeout(() => setSuccessMessage(null), 3000);
            }}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
          >
            {formatLabel('Set as Active Style', 'Đặt làm phong cách chính')}
          </button>
        )}
      </div>

      {/* Style Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Section 1: Visual Atmosphere */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sun className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              {formatLabel('Lighting & Atmosphere', 'Ánh sáng & Bầu không khí')}
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {formatLabel('Animation Style', 'Phong cách diễn hoạt')}
            </label>
            <input
              type="text"
              value={formData.animationStyle}
              onChange={(e) => handleFieldChange('animationStyle', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {formatLabel('Lighting Directives', 'Quy chuẩn ánh sáng')}
            </label>
            <textarea
              rows={2}
              value={formData.lighting}
              onChange={(e) => handleFieldChange('lighting', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {formatLabel('Color Palette', 'Bảng màu chính')}
            </label>
            <input
              type="text"
              value={formData.colorPalette}
              onChange={(e) => handleFieldChange('colorPalette', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {formatLabel('Environment & Set Style', 'Bối cảnh & Không gian nhà')}
            </label>
            <textarea
              rows={2}
              value={formData.environmentStyle}
              onChange={(e) => handleFieldChange('environmentStyle', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 2: Camera & Cinematography */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Camera className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm text-white">
              {formatLabel('Camera, Optics & Rendering', 'Góc máy, Quang học & Render')}
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {formatLabel('Camera Style & Child Perspective', 'Góc máy & Góc nhìn tầm mắt trẻ thơ')}
            </label>
            <textarea
              rows={2}
              value={formData.cameraStyle}
              onChange={(e) => handleFieldChange('cameraStyle', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {formatLabel('Character 3D Rendering Quality', 'Chất lượng bề mặt nhân vật 3D')}
            </label>
            <input
              type="text"
              value={formData.characterRendering}
              onChange={(e) => handleFieldChange('characterRendering', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {formatLabel('Textures & Materiality', 'Chất liệu vải, gỗ & lông thú')}
            </label>
            <input
              type="text"
              value={formData.texture}
              onChange={(e) => handleFieldChange('texture', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {formatLabel('Cinematography & Depth of Field', 'Bố cục điện ảnh & Độ sâu trường ảnh')}
            </label>
            <input
              type="text"
              value={formData.cinematography}
              onChange={(e) => handleFieldChange('cinematography', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Technical Specifications row */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800">
          <Tv className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white">
            {formatLabel('Master Technical Specifications', 'Thông số kỹ thuật sản xuất master')}
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              {formatLabel('Aspect Ratio', 'Tỷ lệ khung hình')}
            </label>
            <input
              type="text"
              value={formData.aspectRatio}
              onChange={(e) => handleFieldChange('aspectRatio', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              {formatLabel('Master Resolution', 'Độ phân giải')}
            </label>
            <input
              type="text"
              value={formData.resolution}
              onChange={(e) => handleFieldChange('resolution', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              {formatLabel('Frame Rate (FPS)', 'Tốc độ khung hình')}
            </label>
            <input
              type="number"
              value={formData.fps}
              onChange={(e) => handleFieldChange('fps', parseInt(e.target.value) || 24)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              {formatLabel('Target Platform', 'Nền tảng phát hành')}
            </label>
            <input
              type="text"
              value={formData.targetPlatform}
              onChange={(e) => handleFieldChange('targetPlatform', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Prompts Section */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {formatLabel('Global Master Prompt (Prefix Directives)', 'Prompt tổng thể chung (Chỉ dẫn phong cách)')}
            </label>
            <button
              onClick={() => {
                navigator.clipboard.writeText(formData.globalPrompt);
                alert('Copied global prompt!');
              }}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          <textarea
            rows={3}
            value={formData.globalPrompt}
            onChange={(e) => handleFieldChange('globalPrompt', e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-300 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {formatLabel('Global Negative Prompt (Quality Defense)', 'Negative Prompt chung (Bảo vệ chất lượng)')}
          </label>
          <textarea
            rows={3}
            value={formData.negativePrompt}
            onChange={(e) => handleFieldChange('negativePrompt', e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-rose-300 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Fork Modal */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewVersionSubmit}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  {formatLabel('Fork New Global Style Version', 'Tạo Phiên Bản Phong Cách Mới')}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatLabel(
                    `Base style ${formData.version} remains preserved for Season 1 episodes.`,
                    `Bản cũ ${formData.version} vẫn được lưu trữ nguyên vẹn cho các tập Mùa 1.`,
                  )}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {formatLabel('New Style Version Identifier', 'Mã phiên bản (VD: v1.2, v2.0)')}
              </label>
              <input
                type="text"
                required
                value={newVersionTag}
                onChange={(e) => setNewVersionTag(e.target.value)}
                placeholder="v1.2"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {formatLabel('Change Notes', 'Ghi chú thay đổi phong cách')}
              </label>
              <textarea
                rows={3}
                value={newVersionNotes}
                onChange={(e) => setNewVersionNotes(e.target.value)}
                placeholder={
                  language === 'vi'
                    ? 'VD: Tinh chỉnh ánh sáng hoàng hôn, làm ấm hơn gam màu phòng khách...'
                    : 'e.g. Warm twilight lighting optimization...'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="setStyleActiveCheck"
                checked={setAsActive}
                onChange={(e) => setSetAsActive(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 w-4 h-4"
              />
              <label htmlFor="setStyleActiveCheck" className="text-xs text-slate-300 cursor-pointer">
                {formatLabel('Set as master active style', 'Đặt làm phong cách chính mặc định')}
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
                className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
              >
                {formatLabel('Create Style Version', 'Xác nhận tạo phiên bản')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
