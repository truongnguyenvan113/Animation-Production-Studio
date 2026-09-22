import React, { useState } from 'react';
import { Sliders, Copy, Check, Save, CheckCircle2, Info, Youtube, Facebook, Tag } from 'lucide-react';
import { PublishingTemplate } from '../../types';
import { publishingService } from '../../services/publishingService';

export const TemplateSettingsTab: React.FC = () => {
  const [templates, setTemplates] = useState<PublishingTemplate[]>(() =>
    publishingService.getTemplates()
  );
  const [activeTemplateId, setActiveTemplateId] = useState<string>(
    templates[0]?.id || 'tpl_youtube_standard_v1'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeTemplate = templates.find((t) => t.id === activeTemplateId) || templates[0];

  const handleTemplateContentChange = (content: string) => {
    if (!activeTemplate) return;
    const updated = { ...activeTemplate, content, updatedAt: new Date().toISOString() };
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleSaveActiveTemplate = () => {
    if (!activeTemplate) return;
    publishingService.saveTemplate(activeTemplate);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const copyVariable = (varName: string) => {
    navigator.clipboard.writeText(varName);
    setCopiedKey(varName);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/30">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Thư Viện Mẫu Xuất Bản (Publishing Templates)</h3>
            <p className="text-xs text-slate-400">
              Cấu hình các mẫu văn bản gốc dùng để sinh tự động nội dung YouTube và bài viết Facebook
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveActiveTemplate}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Đã lưu mẫu</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Lưu mẫu hiện tại</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Template List Selector (4 cols) */}
        <div className="md:col-span-4 space-y-2.5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Mẫu Đang Hoạt Động ({templates.length})
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
                  <div className="flex items-center gap-2 mb-1">
                    {isYT && <Youtube className="w-4 h-4 text-rose-400" />}
                    {isFB && <Facebook className="w-4 h-4 text-sky-400" />}
                    {!isYT && !isFB && <Tag className="w-4 h-4 text-amber-400" />}
                    <span className="text-xs font-bold truncate">{tpl.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">{tpl.description}</div>
                </div>
              );
            })}
          </div>

          {/* Supported Variables Guide */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Info className="w-3.5 h-3.5" />
              <span>Biến số hỗ trợ (Nhấp để chép)</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                '{episode_title}',
                '{story_summary}',
                '{educational_lesson}',
                '{theme}',
                '{hashtags}',
              ].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => copyVariable(v)}
                  className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 hover:border-amber-400 text-slate-300 font-mono text-[10px] transition-colors"
                >
                  {copiedKey === v ? '✓ Đã chép' : v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Template Editor (8 cols) */}
        <div className="md:col-span-8 space-y-4">
          {activeTemplate ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">{activeTemplate.name}</h4>
                  <p className="text-xs text-slate-400">{activeTemplate.description}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-amber-300 border border-slate-700">
                  {String(activeTemplate.platform || activeTemplate.type || 'TEMPLATE').toUpperCase()}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Cấu trúc nội dung mẫu (Template Content):
                </label>
                <textarea
                  rows={16}
                  value={activeTemplate.content || activeTemplate.contentStructure || ''}
                  onChange={(e) => handleTemplateContentChange(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono leading-relaxed focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">Không tìm thấy mẫu.</div>
          )}
        </div>
      </div>
    </div>
  );
};
