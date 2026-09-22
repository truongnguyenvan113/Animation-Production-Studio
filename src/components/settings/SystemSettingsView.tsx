import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../../types';
import { systemSettingsService } from '../../services/systemSettingsService';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Layers,
  Film,
  Camera,
  Music,
  Sliders,
  Database,
  Globe,
  Lock,
  Sparkles,
  Compass,
} from 'lucide-react';

export const SystemSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(() => systemSettingsService.getSettings());
  const [activeCategory, setActiveCategory] = useState<string>('googleFlow');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setSettings(systemSettingsService.getSettings());
  }, []);

  const handleSave = () => {
    systemSettingsService.updateSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm('Đặt lại toàn bộ Cài đặt Hệ thống về giá trị chuẩn mặc định?')) {
      const resetSettings = systemSettingsService.resetToDefaults();
      setSettings(resetSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const categories = [
    { id: 'googleFlow', label: 'Google Flow Director', icon: Sparkles },
    { id: 'general', label: 'Chung (General)', icon: Settings },
    { id: 'language', label: 'Ngôn Ngữ & Bản Địa Hóa', icon: Globe },
    { id: 'aiModel', label: 'AI & Mô Hình Sinh', icon: Cpu },
    { id: 'image', label: 'Hình Ảnh & Render', icon: Camera },
    { id: 'video', label: 'Video & Chuyển Động', icon: Film },
    { id: 'audioVoice', label: 'Âm Thanh & Giọng Nói', icon: Music },
    { id: 'characterConsistency', label: 'Nhân Vật & DNA Lock', icon: ShieldCheck },
    { id: 'continuity', label: 'Tính Liên Tục (Continuity)', icon: Compass },
    { id: 'composition', label: 'Bố Cục & 9:16 Shorts', icon: Sliders },
    { id: 'references', label: 'Tài Liệu Tham Chiếu', icon: Layers },
    { id: 'qa', label: 'Kiểm Định Chất Lượng (QA)', icon: CheckCircle2 },
    { id: 'storage', label: 'Lưu Trữ & Hệ Thống', icon: Database },
  ];

  return (
    <div id="view-system-settings" className="space-y-6 pb-16">
      {/* Top Banner & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Cài Đặt Hệ Thống (System Settings)</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Phase 4.7 Active
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Thiết lập cấu hình toàn cục cho Pi & Kem Animation Studio: Quản lý bộ quy tắc phân giải thiết lập (precedence hierarchy), chuẩn hóa luồng Google Flow Director và khóa bất biến Character DNA.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Khôi phục mặc định
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors"
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            {saveSuccess ? 'Đã lưu thành công!' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>

      {/* Precedence Hierarchy Diagram */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Sliders className="w-4 h-4" />
            Quy Tắc Thứ Bậc Kế Thừa Cài Đặt (Settings Precedence Hierarchy)
          </h3>
          <span className="text-[10px] text-slate-400">
            Từ trái qua phải: mức sau được phép ghi đè mức trước
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { label: 'Cài Đặt Hệ Thống', en: 'System Settings' },
            { label: 'Cài Đặt Dự Án', en: 'Project Settings' },
            { label: 'Cài Đặt Tập Phim', en: 'Episode Settings' },
            { label: 'Cài Đặt Cảnh', en: 'Scene Settings' },
            { label: 'Cài Đặt Shot', en: 'Shot Settings' },
          ].map((item, idx, arr) => (
            <React.Fragment key={item.label}>
              <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-center">
                <span className="font-bold text-slate-200 block text-xs">{item.label}</span>
                <span className="text-[9px] text-slate-400 font-mono">{item.en}</span>
              </div>
              {idx < arr.length - 1 && (
                <span className="text-indigo-400 font-bold text-sm">&rarr;</span>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="text-[11px] text-amber-300 bg-amber-950/50 p-2.5 rounded-xl border border-amber-500/30 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Bảo Toàn Bất Biến (Invariant Lock):</strong> Bản sắc nhân vật (Character DNA) và phong cách thẩm mỹ (Style DNA) thuộc về Source of Truth độc lập, <strong>tuyệt đối không bao giờ</strong> bị ghi đè bởi bất kỳ mức cài đặt nào.
          </span>
        </div>
      </div>

      {/* Main Layout: Sidebar & Form */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Categories List */}
        <div className="space-y-1 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 block">
            Danh Mục Cấu Hình
          </span>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Form Panels */}
        <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          {/* CATEGORY: GOOGLE FLOW */}
          {activeCategory === 'googleFlow' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Cấu Hình Google Flow Director</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Điều phối sản xuất chuyển tiếp từ AI Studio sang Google Flow và quản lý kết quả đầu ra.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Chế độ thực thi mặc định (Default Execution Mode):</label>
                  <select
                    value={settings.googleFlow.defaultExecutionMode}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        googleFlow: {
                          ...settings.googleFlow,
                          defaultExecutionMode: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="ASSISTED_FLOW">ASSISTED_FLOW (Chuẩn bị gói và hỗ trợ thực thi trên Google Flow)</option>
                    <option value="LOCAL_ASSET">LOCAL_ASSET (Bản kết xuất cục bộ dùng cho phát triển offline)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Đường dẫn Google Flow Studio:</label>
                  <input
                    type="text"
                    value={settings.googleFlow.flowStudioUrl}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        googleFlow: {
                          ...settings.googleFlow,
                          flowStudioUrl: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.googleFlow.autoExportPackage}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        googleFlow: {
                          ...settings.googleFlow,
                          autoExportPackage: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">
                    Tự động đóng gói Production Pack (JSON) khi mở Flow Director
                  </span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.googleFlow.autoValidateMime}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        googleFlow: {
                          ...settings.googleFlow,
                          autoValidateMime: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">
                    Tự động kiểm tra tính hợp lệ định dạng MIME và kích thước raster khi nhập Asset
                  </span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.googleFlow.autoSendToQA}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        googleFlow: {
                          ...settings.googleFlow,
                          autoSendToQA: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">
                    Tự động chuyển tiếp Asset nhập từ Flow vào hàng đợi kiểm định QA (PENDING_QA)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* CATEGORY: GENERAL */}
          {activeCategory === 'general' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Cấu Hình Chung</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tên Studio:</label>
                  <input
                    type="text"
                    value={settings.general.studioName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, studioName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tên Dự Án:</label>
                  <input
                    type="text"
                    value={settings.general.projectName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, projectName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Múi Giờ Sản Xuất:</label>
                  <input
                    type="text"
                    value={settings.general.timezone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, timezone: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY: LANGUAGE */}
          {activeCategory === 'language' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Ngôn Ngữ & Bản Địa Hóa</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Ngôn ngữ hiển thị hoạt động (Active Language):</label>
                  <select
                    value={settings.language.language || (settings.language.primaryLocale === 'vi-VN' ? 'vi' : 'en')}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        language: {
                          ...settings.language,
                          language: e.target.value as 'vi' | 'en' | 'bilingual',
                          activeLanguage: e.target.value as 'vi' | 'en' | 'bilingual',
                          locale: e.target.value === 'en' ? 'en-US' : 'vi-VN',
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
                  >
                    <option value="vi">Tiếng Việt (vi) — Chuẩn Bắt Buộc (Mặc định)</option>
                    <option value="en">English (en)</option>
                    <option value="bilingual">Song ngữ VI + EN (Bilingual Mode)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Ngôn ngữ giao diện chuẩn (Primary Locale):</label>
                  <select
                    value={settings.language.primaryLocale}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-600 font-semibold"
                  >
                    <option value="vi-VN">Tiếng Việt (vi-VN) — Chuẩn Bắt Buộc</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Ngôn ngữ phụ (Fallback):</label>
                  <select
                    value={settings.language.fallbackLocale}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        language: { ...settings.language, fallbackLocale: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                  >
                    <option value="en-US">English (en-US)</option>
                    <option value="vi-VN">Tiếng Việt (vi-VN)</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={settings.language.bilingualMode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      language: { ...settings.language, bilingualMode: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span className="font-medium text-slate-700">Bật hiển thị nhãn song ngữ bổ trợ</span>
              </label>
            </div>
          )}

          {/* CATEGORY: AI & MODEL */}
          {activeCategory === 'aiModel' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">AI & Mô Hình Sinh</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mô hình hình ảnh đích:</label>
                  <input
                    type="text"
                    value={settings.aiModel.defaultImageModel}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        aiModel: { ...settings.aiModel, defaultImageModel: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mô hình video đích:</label>
                  <input
                    type="text"
                    value={settings.aiModel.defaultVideoModel}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        aiModel: { ...settings.aiModel, defaultVideoModel: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY: CHARACTER CONSISTENCY */}
          {activeCategory === 'characterConsistency' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Nhân Vật & Tính Nhất Quán (DNA Lock)</h3>
                <p className="text-xs text-slate-500">Kiểm soát các cơ chế chống trôi dạt nhận diện.</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <strong className="text-emerald-950 block font-bold">Khóa DNA Nhân Vật Bắt Buộc (Enforce DNA Lock)</strong>
                    <span className="text-emerald-800 text-[11px]">
                      Ngăn chặn hoàn toàn mọi ghi đè khuôn mặt, tỷ lệ cơ thể và tuổi tác từ prompt ngoại vi.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]">
                    LOCKED (IMMUTABLE)
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block font-bold">Ràng Buộc Tóc Cho Kem (Kem Short Hair Constraint)</strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Extremely short hair. Hair tightly cropped close to the scalp. No bangs. No fringe. No fluffy hair. No spikes. No hair tuft. No long hair.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY: COMPOSITION */}
          {activeCategory === 'composition' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Bố Cục & Tương Thích 9:16 Shorts</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tỷ lệ khung hình chuẩn:</label>
                  <input
                    type="text"
                    value="16:9 (Horizontal)"
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Vùng an toàn (Safe Area):</label>
                  <input
                    type="text"
                    value="CENTER (33% - 66%)"
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 font-bold text-slate-700"
                  />
                </div>
              </div>
              <label className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={settings.composition.shortsSafeMode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      composition: { ...settings.composition, shortsSafeMode: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span className="font-bold text-slate-800">
                  Kích hoạt quy tắc cắt dọc an toàn 9:16 Shorts (Shorts-Safe Mode)
                </span>
              </label>
            </div>
          )}

          {/* OTHER CATEGORIES: IMAGE, VIDEO, AUDIO, CONTINUITY, REFS, QA, STORAGE */}
          {!['googleFlow', 'general', 'language', 'aiModel', 'characterConsistency', 'composition'].includes(activeCategory) && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {categories.find((c) => c.id === activeCategory)?.label}
                </h3>
              </div>
              <p className="text-slate-600">
                Các thông số cho mục này đã được kích hoạt theo cấu hình chuẩn của xưởng phim Pi & Kem. Bạn có thể lưu lại để áp dụng cho các chuỗi sản xuất tiếp theo.
              </p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <pre className="font-mono text-[11px] text-slate-700 overflow-x-auto">
                  {JSON.stringify((settings as any)[activeCategory], null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
