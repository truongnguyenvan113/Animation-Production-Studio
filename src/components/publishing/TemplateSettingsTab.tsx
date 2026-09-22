import React, { useState } from 'react';
import {
  Sliders,
  Copy,
  Check,
  Save,
  CheckCircle2,
  Info,
  Youtube,
  Facebook,
  Tag,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  FileText,
  Sparkles,
  AlertCircle,
  X,
} from 'lucide-react';
import { PublishingTemplate } from '../../types';
import { publishingService } from '../../services/publishingService';

const SAMPLE_BRIEF = {
  title: 'Chiếc Đèn Lồng Đặc Biệt',
  theme: 'Tết Trung Thu & Tình Yêu Thương Gia Đình',
  storySummary:
    'Pi làm đèn lồng giấy bóng kính hình ngôi sao rất cẩn thận, Kem nghịch ngợm dán lệch và làm rách giấy một chút, nhưng Ba Trường và Mẹ Vân đã giúp hai chị em biến chỗ rách thành một mặt trăng cười độc đáo. Tối đó hai chị em cùng Mochi rước đèn quanh sân nhà rộn rã tiếng cười.',
  message:
    'Một món đồ không cần hoàn hảo để trở nên đặc biệt. Tình yêu thương gia đình và tiếng cười biến mọi điều dang dở thành kỷ niệm ấm áp.',
  episodeType: 'Tập đặc biệt (Special)',
};

export const TemplateSettingsTab: React.FC = () => {
  const [templates, setTemplates] = useState<PublishingTemplate[]>(() =>
    publishingService.getTemplates()
  );
  const [activeTemplateId, setActiveTemplateId] = useState<string>(
    templates[0]?.id || 'tpl_youtube_standard_v1'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'edit' | 'preview'>('edit');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New template form state
  const [newTplName, setNewTplName] = useState('');
  const [newTplPlatform, setNewTplPlatform] = useState<'youtube' | 'facebook' | 'hashtags'>('youtube');
  const [newTplTone, setNewTplTone] = useState('');
  const [newTplDesc, setNewTplDesc] = useState('');
  const [newTplContent, setNewTplContent] = useState('');

  const activeTemplate = templates.find((t) => t.id === activeTemplateId) || templates[0];

  const handleFieldChange = (field: keyof PublishingTemplate, value: any) => {
    if (!activeTemplate) return;
    const updated: PublishingTemplate = {
      ...activeTemplate,
      [field]: value,
      updatedAt: new Date().toISOString(),
    };
    if (field === 'content') {
      updated.contentStructure = value;
    }
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleSaveActiveTemplate = async () => {
    if (!activeTemplate) return;
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const saved = await publishingService.saveTemplate(activeTemplate);
      setTemplates((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      setIsSaving(false);
      setSavedSuccess(true);
      setStatusMessage('Đã lưu mẫu thành công vào cơ sở dữ liệu và đĩa!');
      setTimeout(() => {
        setSavedSuccess(false);
        setStatusMessage(null);
      }, 3500);
    } catch (err: any) {
      setIsSaving(false);
      setStatusMessage(`Lỗi lưu mẫu: ${err.message || 'Không thể ghi dữ liệu'}`);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Bạn có chắc muốn khôi phục toàn bộ các mẫu về trạng thái chuẩn ban đầu của Studio? Mọi tùy chỉnh hiện tại sẽ được thay thế.')) {
      return;
    }
    setIsSaving(true);
    try {
      const defaults = await publishingService.resetTemplatesToDefault();
      setTemplates(defaults);
      if (defaults.length > 0) {
        setActiveTemplateId(defaults[0].id);
      }
      setIsSaving(false);
      setSavedSuccess(true);
      setStatusMessage('Đã khôi phục toàn bộ mẫu chuẩn ban đầu của Kem Tivi!');
      setTimeout(() => {
        setSavedSuccess(false);
        setStatusMessage(null);
      }, 3500);
    } catch (err: any) {
      setIsSaving(false);
      setStatusMessage(`Lỗi khôi phục: ${err.message}`);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName.trim()) return;

    try {
      const created = await publishingService.createTemplate({
        name: newTplName.trim(),
        platform: newTplPlatform,
        type: newTplPlatform,
        tone: newTplTone.trim() || 'Ấm áp, tích cực, gần gũi',
        description: newTplDesc.trim() || 'Mẫu xuất bản tùy chỉnh',
        content: newTplContent.trim() || '{episode_title}\n\n{story_summary}\n\n{hashtags}',
        contentStructure: newTplContent.trim() || '{episode_title}\n\n{story_summary}\n\n{hashtags}',
      });

      setTemplates((prev) => [...prev, created]);
      setActiveTemplateId(created.id);
      setShowCreateModal(false);
      setNewTplName('');
      setNewTplTone('');
      setNewTplDesc('');
      setNewTplContent('');

      setSavedSuccess(true);
      setStatusMessage(`Đã tạo mẫu mới "${created.name}" thành công!`);
      setTimeout(() => {
        setSavedSuccess(false);
        setStatusMessage(null);
      }, 3500);
    } catch (err: any) {
      alert(`Lỗi tạo mẫu: ${err.message}`);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const tplToDelete = templates.find((t) => t.id === templateId);
    if (!tplToDelete) return;
    if (tplToDelete.isDefault) {
      alert('Không thể xóa mẫu mặc định của hệ thống. Bạn chỉ có thể sửa nội dung của nó hoặc khôi phục mặc định.');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mẫu "${tplToDelete.name}"?`)) {
      return;
    }

    await publishingService.deleteTemplate(templateId);
    const remaining = templates.filter((t) => t.id !== templateId);
    setTemplates(remaining);
    if (activeTemplateId === templateId && remaining.length > 0) {
      setActiveTemplateId(remaining[0].id);
    }
  };

  const copyVariable = (varName: string) => {
    navigator.clipboard.writeText(varName);
    setCopiedKey(varName);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const insertVariableIntoContent = (varName: string) => {
    if (!activeTemplate) return;
    const current = activeTemplate.content || activeTemplate.contentStructure || '';
    handleFieldChange('content', current + (current.endsWith('\n') ? '' : '\n') + varName);
    copyVariable(varName);
  };

  // Compute live preview text
  const previewText = activeTemplate
    ? publishingService.interpolateTemplate(
        activeTemplate.content || activeTemplate.contentStructure || '',
        SAMPLE_BRIEF
      )
    : '';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/30">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Thư Viện Mẫu Xuất Bản (Publishing Templates)</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/40">
                Đồng bộ đĩa trực tiếp
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tùy biến cấu trúc nội dung tự động cho YouTube và Facebook. Các mẫu này được lưu trực tiếp vào cơ sở dữ liệu và tệp dự án.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Thêm mẫu xuất bản mới"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Thêm Mẫu Mới</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isSaving}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Khôi phục mẫu gốc của Studio"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isSaving ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Khôi phục chuẩn</span>
          </button>

          <button
            type="button"
            onClick={handleSaveActiveTemplate}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 text-slate-950 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Đã lưu thành công!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu mẫu hiện tại</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 transition-all ${
            savedSuccess
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          {savedSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Template List Selector (4 cols) */}
        <div className="md:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            <span>Danh Sách Mẫu ({templates.length})</span>
            <span className="text-[10px] text-slate-500 font-normal">Nhấp để chọn mẫu</span>
          </div>

          <div className="space-y-2">
            {templates.map((tpl) => {
              const isSelected = activeTemplate?.id === tpl.id;
              const platformType = tpl.platform || tpl.type || 'youtube';
              const isYT = platformType === 'youtube';
              const isFB = platformType === 'facebook';
              return (
                <div
                  key={tpl.id}
                  onClick={() => setActiveTemplateId(tpl.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/40 text-white'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 truncate">
                      {isYT && <Youtube className="w-4 h-4 text-rose-400 shrink-0" />}
                      {isFB && <Facebook className="w-4 h-4 text-sky-400 shrink-0" />}
                      {!isYT && !isFB && <Tag className="w-4 h-4 text-amber-400 shrink-0" />}
                      <span className="text-xs font-bold truncate">{tpl.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {tpl.isDefault ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          Mặc định
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(tpl.id);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded"
                          title="Xóa mẫu này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">{tpl.description}</div>
                </div>
              );
            })}
          </div>

          {/* Supported Variables Guide */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between font-bold text-amber-400">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Biến số tự động chèn</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">Nhấp để chèn</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Hệ thống sẽ tự động thay thế các biến này bằng thông tin cụ thể của từng tập phim khi bấm "Tự động sinh":
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { tag: '{episode_title}', desc: 'Tên tập phim' },
                { tag: '{story_summary}', desc: 'Tóm tắt câu chuyện' },
                { tag: '{educational_lesson}', desc: 'Bài học giáo dục' },
                { tag: '{theme}', desc: 'Chủ đề tập phim' },
                { tag: '{hashtags}', desc: 'Thẻ tag phân loại' },
              ].map(({ tag, desc }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertVariableIntoContent(tag)}
                  title={`${desc} — Nhấp để chèn vào cuối mẫu và chép vào clipboard`}
                  className="px-2 py-1 rounded bg-slate-950 border border-slate-700 hover:border-amber-400 hover:text-amber-300 text-slate-300 font-mono text-[10px] transition-colors flex items-center gap-1"
                >
                  <span>{copiedKey === tag ? '✓ Đã chép' : tag}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Template Editor & Preview (8 cols) */}
        <div className="md:col-span-8 space-y-4">
          {activeTemplate ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              {/* Header with Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-amber-300 border border-slate-700 uppercase">
                      {String(activeTemplate.platform || activeTemplate.type || 'TEMPLATE').toUpperCase()}
                    </span>
                    <h4 className="text-sm font-bold text-white">{activeTemplate.name}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{activeTemplate.description}</p>
                </div>

                {/* View switcher tabs */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveViewMode('edit')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      activeViewMode === 'edit'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa mẫu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveViewMode('preview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      activeViewMode === 'preview'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem thử (EP010)</span>
                  </button>
                </div>
              </div>

              {activeViewMode === 'edit' ? (
                /* Edit Mode */
                <div className="space-y-4">
                  {/* Meta Config Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Tên mẫu hiển thị:</label>
                      <input
                        type="text"
                        value={activeTemplate.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Phong cách / Tone giọng:</label>
                      <input
                        type="text"
                        value={activeTemplate.tone || ''}
                        onChange={(e) => handleFieldChange('tone', e.target.value)}
                        placeholder="VD: Ấm áp, hài hước, giáo dục..."
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Mô tả mục đích sử dụng:</label>
                    <input
                      type="text"
                      value={activeTemplate.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  {/* Main Content Area */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-300">
                        Nội dung khung mẫu (Template Content):
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(activeTemplate.content || activeTemplate.contentStructure || '').length} ký tự
                      </span>
                    </div>
                    <textarea
                      rows={16}
                      value={activeTemplate.content || activeTemplate.contentStructure || ''}
                      onChange={(e) => handleFieldChange('content', e.target.value)}
                      className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono leading-relaxed focus:outline-hidden focus:border-amber-500 resize-y"
                      placeholder="Nhập nội dung mẫu với các biến {episode_title}, {story_summary}, {educational_lesson}, {theme}, {hashtags}..."
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-500">
                      Mẹo: Nhấn nút <strong>"Lưu mẫu hiện tại"</strong> ở trên để lưu vĩnh viễn vào hệ thống.
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveActiveTemplate}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Lưu thay đổi mẫu</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Live Preview Mode */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/30 flex items-center gap-2 text-xs text-sky-300">
                    <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>
                      Dưới đây là kết quả xem trước thực tế khi mẫu này được sinh tự động cho tập mẫu <strong>"Tập 10: Chiếc Đèn Lồng Đặc Biệt"</strong>:
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-sans leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                    {previewText}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(previewText);
                        setCopiedKey('preview_text');
                        setTimeout(() => setCopiedKey(null), 1500);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      {copiedKey === 'preview_text' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Đã chép bản xem thử</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Sao chép bản xem thử</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">Không tìm thấy mẫu nào.</div>
          )}
        </div>
      </div>

      {/* Modal: Create New Template */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white">Thêm Mẫu Xuất Bản Mới</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Tên mẫu:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Pi & Kem — YouTube Shorts Hài Hước v2"
                  value={newTplName}
                  onChange={(e) => setNewTplName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Nền tảng:</label>
                  <select
                    value={newTplPlatform}
                    onChange={(e) => setNewTplPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="hashtags">Hashtags</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Tone giọng:</label>
                  <input
                    type="text"
                    placeholder="VD: Hài hước, sôi nổi..."
                    value={newTplTone}
                    onChange={(e) => setNewTplTone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Mô tả ngắn:</label>
                <input
                  type="text"
                  placeholder="Mô tả khi nào nên dùng mẫu này..."
                  value={newTplDesc}
                  onChange={(e) => setNewTplDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nội dung mẫu ban đầu:</label>
                <textarea
                  rows={6}
                  placeholder="{episode_title}&#10;&#10;{story_summary}&#10;&#10;{educational_lesson}&#10;&#10;{hashtags}"
                  value={newTplContent}
                  onChange={(e) => setNewTplContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                >
                  Tạo Mẫu Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
