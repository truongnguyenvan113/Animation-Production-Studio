import React, { useState, useEffect } from 'react';
import { SystemSettings, LanguageMode } from '../../types';
import { systemSettingsService } from '../../services/systemSettingsService';
import { storageService } from '../../services/storageService';
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
  Download,
  Upload,
  Copy,
  Check,
  AlertTriangle,
  FileJson,
  Eye,
  CheckCircle,
} from 'lucide-react';

interface SystemSettingsViewProps {
  language?: LanguageMode;
  onOpenExportModal?: () => void;
  onOpenImportModal?: () => void;
  onResetSeed?: () => void;
  onRefreshAll?: () => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  language = 'vi',
  onOpenExportModal,
  onOpenImportModal,
  onResetSeed,
  onRefreshAll,
}) => {
  const [settings, setSettings] = useState<SystemSettings>(() => systemSettingsService.getSettings());
  const [activeCategory, setActiveCategory] = useState<string>('overview');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Backup & Storage States
  const [importJsonText, setImportJsonText] = useState('');
  const [copiedJson, setCopiedJson] = useState(false);
  const [storageStatusMessage, setStorageStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setSettings(systemSettingsService.getSettings());
  }, []);

  const handleSave = () => {
    systemSettingsService.updateSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetSettings = () => {
    if (window.confirm('Đặt lại toàn bộ Cài đặt Hệ thống về giá trị chuẩn mặc định?')) {
      const resetSettings = systemSettingsService.resetToDefaults();
      setSettings(resetSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  // Direct In-Page Export
  const handleDownloadBackup = () => {
    try {
      const jsonStr = storageService.exportDatabaseJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pi_kem_studio_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStorageStatusMessage({ type: 'success', text: 'Đã xuất file JSON sao lưu thành công!' });
      setTimeout(() => setStorageStatusMessage(null), 3000);
    } catch (err: any) {
      setStorageStatusMessage({ type: 'error', text: `Lỗi xuất dữ liệu: ${err.message}` });
    }
  };

  const handleCopyBackup = () => {
    try {
      const jsonStr = storageService.exportDatabaseJson();
      navigator.clipboard.writeText(jsonStr);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
      setStorageStatusMessage({ type: 'success', text: 'Đã sao chép toàn bộ JSON vào Clipboard!' });
      setTimeout(() => setStorageStatusMessage(null), 3000);
    } catch (err: any) {
      setStorageStatusMessage({ type: 'error', text: `Không thể sao chép: ${err.message}` });
    }
  };

  // Direct In-Page File Upload Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = storageService.importDatabaseJson(content);
        if (success) {
          setSettings(systemSettingsService.getSettings());
          onRefreshAll?.();
          setStorageStatusMessage({ type: 'success', text: `Đã nhập và phục hồi dữ liệu từ file "${file.name}" thành công!` });
        } else {
          setStorageStatusMessage({ type: 'error', text: 'Tệp sao lưu không hợp lệ. Cần chứa đối tượng project và mảng characters.' });
        }
      } catch (err: any) {
        setStorageStatusMessage({ type: 'error', text: `Lỗi đọc tệp JSON: ${err.message}` });
      }
      setTimeout(() => setStorageStatusMessage(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Direct In-Page Textarea Import
  const handleTextImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;

    try {
      const success = storageService.importDatabaseJson(importJsonText.trim());
      if (success) {
        setSettings(systemSettingsService.getSettings());
        setImportJsonText('');
        onRefreshAll?.();
        setStorageStatusMessage({ type: 'success', text: 'Đã phục hồi cơ sở dữ liệu từ chuỗi JSON thành công!' });
      } else {
        setStorageStatusMessage({ type: 'error', text: 'Cấu trúc JSON không khớp với chuẩn Studio Database.' });
      }
    } catch (err: any) {
      setStorageStatusMessage({ type: 'error', text: `Lỗi phân tích JSON: ${err.message}` });
    }
    setTimeout(() => setStorageStatusMessage(null), 4000);
  };

  // Direct In-Page Reset Seed
  const handleResetSeedFoundation = () => {
    if (
      window.confirm(
        'CẢNH BÁO NGUY HIỂM:\n\nBạn có chắc chắn muốn khôi phục toàn bộ dữ liệu xưởng phim về bản gốc khởi tạo (Seed Foundation)?\n\nMọi thay đổi chưa sao lưu sẽ được đặt lại về mẫu thiết kế mặc định của Pi & Kem.'
      )
    ) {
      storageService.resetToSeed();
      setSettings(systemSettingsService.getSettings());
      onRefreshAll?.();
      setStorageStatusMessage({ type: 'success', text: 'Đã khôi phục toàn bộ Studio về dữ liệu gốc mặc định!' });
      setTimeout(() => setStorageStatusMessage(null), 4000);
    }
  };

  // Only show categories that are either the Overview or truly EDITABLE sections!
  const categories = [
    {
      id: 'overview',
      label: 'Tổng Quan Hệ Thống & Quy Chuẩn',
      sub: 'Thông số kiến trúc & bất biến (Chỉ xem)',
      icon: Eye,
      isEditable: false,
    },
    {
      id: 'general',
      label: 'Cấu Hình Chung & Dự Án',
      sub: 'Tên studio, tên dự án, múi giờ',
      icon: Settings,
      isEditable: true,
    },
    {
      id: 'language',
      label: 'Ngôn Ngữ & Hiển Thị Ngoài',
      sub: 'Chuyển đổi ngôn ngữ, bật tắt ở Header',
      icon: Globe,
      isEditable: true,
    },
    {
      id: 'googleFlow',
      label: 'Google Flow Director',
      sub: 'Chế độ luồng, URL studio, tự động xuất',
      icon: Sparkles,
      isEditable: true,
    },
    {
      id: 'aiModel',
      label: 'Mô Hình AI & Bố Cục Khung Hình',
      sub: 'Mô hình sinh, quy tắc 9:16 Shorts',
      icon: Cpu,
      isEditable: true,
    },
    {
      id: 'storage',
      label: 'Sao Lưu & Quản Lý Dữ Liệu',
      sub: 'Xuất JSON, nhập sao lưu, khôi phục gốc',
      icon: Database,
      isEditable: true,
    },
  ];

  // Database metrics for storage view
  const db = storageService.getDatabase();
  const characterCount = db.characters?.length || 0;
  const versionCount = db.characterVersions?.length || 0;
  const referenceCount = db.characterReferences?.length || 0;
  const episodeCount = db.episodes?.length || 0;

  return (
    <div id="view-system-settings" className="space-y-6 pb-16">
      {/* Top Banner & Main Actions */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">Cài Đặt Hệ Thống (System Settings)</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Production Standard
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Quản lý cấu hình sản xuất, tùy chỉnh hiển thị ngôn ngữ ngoài giao diện, và thao tác sao lưu/phục hồi cơ sở dữ liệu Studio.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleResetSettings}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs inline-flex items-center gap-1.5 border border-slate-700 transition-colors"
            title="Khôi phục các giá trị cấu hình về mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Đặt lại cấu hình
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors"
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-950" /> : <Save className="w-4 h-4" />}
            {saveSuccess ? 'Đã lưu thành công!' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Categories List */}
        <div className="space-y-1.5 bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-sm h-fit">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 block">
            Danh Mục Quản Lý
          </span>

          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-start space-x-2.5 transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{cat.label}</span>
                    {cat.isEditable ? (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                        Chỉnh sửa
                      </span>
                    ) : (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        Tổng quan
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] block truncate font-normal ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                    {cat.sub}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Content Panels */}
        <div className="md:col-span-3 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-slate-200">
          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW (TỔNG QUAN HỆ THỐNG & CÁC HẠNG MỤC BẤT BIẾN) */}
          {/* ========================================================= */}
          {activeCategory === 'overview' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Tổng Quan Kiến Trúc & Quy Chuẩn Bất Biến</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Tổng hợp tất cả các thông số kỹ thuật cốt lõi, quy chuẩn chất lượng và kiến trúc kế thừa không thể bị sửa đổi tùy tiện để đảm bảo tính nhất quán tuyệt đối cho xưởng phim.
                </p>
              </div>

              {/* Precedence Hierarchy */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" />
                    Thứ Bậc Kế Thừa Cài Đặt (Settings Precedence Hierarchy)
                  </h4>
                  <span className="text-[10px] text-slate-400">Từ trái qua phải: Mức sau ghi đè mức trước</span>
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
                      <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-center">
                        <span className="font-bold text-slate-200 block text-xs">{item.label}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{item.en}</span>
                      </div>
                      {idx < arr.length - 1 && <span className="text-amber-400 font-bold text-sm">&rarr;</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Invariant Locks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Character DNA Lock */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      Khóa Character DNA (DNA Lock)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      BẤT BIẾN
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Bản sắc nhân vật (mắt, cấu trúc khuôn mặt, tuổi tác, tỉ lệ cơ thể) được khóa bất biến ở cấp Source of Truth. Tuyệt đối không bị prompt ngoại vi ghi đè hay làm trôi dạt nhận diện.
                  </p>
                </div>

                {/* Kem Hair Invariant */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      Ràng Buộc Tóc Kem (Leo Hair Lock)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                      STRICT CONSTRAINT
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Tóc húi cua cực ngắn sát da đầu (tightly cropped close to the scalp). Tuyệt đối cấm tóc mái (no bangs), cấm tóc phồng, cấm chỏm tóc nhọn, cấm tóc dài.
                  </p>
                </div>

                {/* Production Canvas & Aspect Ratio */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-sky-400" />
                      Khung Hình & Tỷ Lệ Chuẩn
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[10px] font-bold border border-sky-500/30">
                      16:9 MASTER
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Khung sản xuất gốc 16:9 ngang. Vùng an toàn (Safe Area) dành cho YouTube Shorts/TikTok 9:16 được cố định ở dải trung tâm (Center 33% - 66%).
                  </p>
                </div>

                {/* Video & Frame Rate */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-purple-400" />
                      Tiêu Chuẩn Video & FPS
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold border border-purple-500/30">
                      24 FPS CINEMATIC
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Tốc độ khung hình 24 khung hình/giây chuẩn điện ảnh hoạt hình. Định dạng kết xuất chuẩn MP4/H.264 với độ nén tối ưu hiển thị web.
                  </p>
                </div>

                {/* Audio & Voice Standard */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-pink-400" />
                      Quy Chuẩn Âm Thanh & Giọng Đọc
                    </span>
                    <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 text-[10px] font-bold border border-pink-500/30">
                      48,000 HZ / STEREO
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Tần số lấy mẫu 48 kHz. Mô hình giọng đọc tiếng Việt Studio (`gemini-voice-studio-vi`) với hồ sơ phân vai theo nhân vật (Kem, Pi, Ba Trường, Mẹ Vân).
                  </p>
                </div>

                {/* Quality Assurance (QA Engine) */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Tiêu Chuẩn Kiểm Định (QA Gate)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      STRICT QA
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Tự động xác thực định dạng MIME, kiểm tra tỷ lệ khung hình và tính liên tục trang phục/bối cảnh trước khi phê duyệt asset vào Storyboard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: GENERAL (CẤU HÌNH CHUNG & DỰ ÁN - CHỈNH SỬA ĐƯỢC) */}
          {/* ========================================================= */}
          {activeCategory === 'general' && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Cấu Hình Chung & Dự Án (Chỉnh sửa được)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Thiết lập thông tin định danh xưởng phim, tên sản phẩm và múi giờ làm việc.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Tên Xưởng Phim (Studio Name):</label>
                  <input
                    type="text"
                    value={settings.general.studioName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, studioName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Tên Dự Án Hoạt Hình (Project Name):</label>
                  <input
                    type="text"
                    value={settings.general.projectName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, projectName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Múi Giờ Sản Xuất (Timezone):</label>
                  <input
                    type="text"
                    value={settings.general.timezone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, timezone: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Tự Động Lưu Cục Bộ (Auto-Save):</label>
                  <div className="pt-2">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.general.autoSave}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            general: { ...settings.general, autoSave: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-500"
                      />
                      <span className="text-slate-300 font-semibold">Tự động đồng bộ vào bộ nhớ trình duyệt</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: LANGUAGE & LOCALIZATION (CHỈNH SỬA & TOGGLE HEADER) */}
          {/* ========================================================= */}
          {activeCategory === 'language' && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Ngôn Ngữ & Hiển Thị Ngoài Giao Diện</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Kiểm soát ngôn ngữ hoạt động và tùy chọn kích hoạt bộ chuyển đổi ngôn ngữ trên thanh Header.
                </p>
              </div>

              {/* LANGUAGE SWITCHER HEADER TOGGLE - CRITICAL USER REQUIREMENT */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-400" />
                      Hiển Thị Bộ Chuyển Ngôn Ngữ Ra Ngoài Thanh Header
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Khi bật, các nút chọn [Tiếng Việt | English | VI + EN] sẽ xuất hiện trên thanh tiêu đề trên cùng. Khi tắt, các nút này được ẩn hoàn toàn để giao diện gọn gàng, tránh hiển thị linh tinh.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={!!settings.language.showLanguageSwitcher}
                      onChange={(e) => {
                        const updated = {
                          ...settings,
                          language: {
                            ...settings.language,
                            showLanguageSwitcher: e.target.checked,
                          },
                        };
                        setSettings(updated);
                        systemSettingsService.updateSettings(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="text-[11px] p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                  {settings.language.showLanguageSwitcher ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Trạng thái: Đang bật — Nút chuyển ngôn ngữ đang hiển thị trên thanh Header.
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                      Trạng thái: Đang tắt — Nút chuyển ngôn ngữ được ẩn ở ngoài Header để tránh hiển thị linh tinh.
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Ngôn Ngữ Hoạt Động (Active Language):</label>
                  <select
                    value={settings.language.language || 'vi'}
                    onChange={(e) => {
                      const newLang = e.target.value as 'vi' | 'en' | 'bilingual';
                      const updated = {
                        ...settings,
                        language: {
                          ...settings.language,
                          language: newLang,
                          activeLanguage: newLang,
                          locale: newLang === 'en' ? 'en-US' : 'vi-VN',
                        },
                      };
                      setSettings(updated);
                      systemSettingsService.updateSettings(updated);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-medium focus:border-amber-500 focus:outline-none"
                  >
                    <option value="vi">Tiếng Việt (vi) — Chuẩn Bắt Buộc (Mặc định)</option>
                    <option value="en">English (en)</option>
                    <option value="bilingual">Song ngữ VI + EN (Bilingual Mode)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Ngôn Ngữ Dự Phòng (Fallback Locale):</label>
                  <select
                    value={settings.language.fallbackLocale}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        language: { ...settings.language, fallbackLocale: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-medium focus:border-amber-500 focus:outline-none"
                  >
                    <option value="en-US">English (en-US)</option>
                    <option value="vi-VN">Tiếng Việt (vi-VN)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={settings.language.bilingualMode}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        language: { ...settings.language, bilingualMode: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-300">
                    Bật hiển thị nhãn song ngữ bổ trợ (Bilingual Sub-labels)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: GOOGLE FLOW DIRECTOR (CHỈNH SỬA ĐƯỢC) */}
          {/* ========================================================= */}
          {activeCategory === 'googleFlow' && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Cấu Hình Google Flow Director (Chỉnh sửa được)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Điều phối sản xuất chuyển tiếp từ AI Studio sang Google Flow và quản lý kết quả đầu ra.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Chế Độ Thực Thi Mặc Định:</label>
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-medium focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ASSISTED_FLOW">ASSISTED_FLOW (Chuẩn bị gói và hỗ trợ thực thi trên Google Flow)</option>
                    <option value="LOCAL_ASSET">LOCAL_ASSET (Bản kết xuất cục bộ dùng cho phát triển offline)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Đường Dẫn Google Flow Studio URL:</label>
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
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
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-300">
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
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-300">
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
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-300">
                    Tự động chuyển tiếp Asset nhập từ Flow vào hàng đợi kiểm định QA (PENDING_QA)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: AI MODELS & COMPOSITION (CHỈNH SỬA ĐƯỢC) */}
          {/* ========================================================= */}
          {activeCategory === 'aiModel' && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Mô Hình AI & Bố Cục Khung Hình (Chỉnh sửa được)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cấu hình các mô hình AI tạo sinh ảnh/video và các bộ lọc bố cục hiển thị.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Mô Hình Hình Ảnh Đích (Image Model):</label>
                  <input
                    type="text"
                    value={settings.aiModel.defaultImageModel}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        aiModel: { ...settings.aiModel, defaultImageModel: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Mô Hình Video Đích (Video Model):</label>
                  <input
                    type="text"
                    value={settings.aiModel.defaultVideoModel}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        aiModel: { ...settings.aiModel, defaultVideoModel: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Mô Hình Dự Phòng (Fallback Model):</label>
                  <input
                    type="text"
                    value={settings.aiModel.fallbackModel}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        aiModel: { ...settings.aiModel, fallbackModel: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Thời Gian Chờ Tạo Sinh (Timeout Giây):</label>
                  <input
                    type="number"
                    value={settings.aiModel.timeoutSeconds}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        aiModel: { ...settings.aiModel, timeoutSeconds: Number(e.target.value) || 60 },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.aiModel.enableSafetyFilters}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        aiModel: { ...settings.aiModel, enableSafetyFilters: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-300">
                    Bật bộ lọc nội dung an toàn phù hợp trẻ em (Kid-Safe Filters)
                  </span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.composition.shortsSafeMode}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        composition: { ...settings.composition, shortsSafeMode: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-300">
                    Kích hoạt vùng an toàn tỷ lệ 9:16 Shorts (Shorts-Safe Mode)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: BACKUP, IMPORT, EXPORT & RESET (CHUYỂN TỪ HEADER VÀO ĐÂY) */}
          {/* ========================================================= */}
          {activeCategory === 'storage' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Sao Lưu & Quản Lý Dữ Liệu Xưởng Phim</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Đã chuyển toàn bộ tính năng Xuất file sao lưu (Export), Nhập dữ liệu (Import) và Khôi phục gốc (Reset Seed) từ Header vào trang Cài đặt Hệ thống để quản lý tập trung và an toàn.
                </p>
              </div>

              {/* Status Alert if any */}
              {storageStatusMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-fadeIn ${
                    storageStatusMessage.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {storageStatusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{storageStatusMessage.text}</span>
                </div>
              )}

              {/* Database Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Nhân Vật (Characters)</span>
                  <span className="text-lg font-bold text-white">{characterCount}</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Phiên Bản (Versions)</span>
                  <span className="text-lg font-bold text-amber-400">{versionCount}</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Ảnh Tham Chiếu (Refs)</span>
                  <span className="text-lg font-bold text-sky-400">{referenceCount}</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Tập Phim (Episodes)</span>
                  <span className="text-lg font-bold text-emerald-400">{episodeCount}</span>
                </div>
              </div>

              {/* SECTION 1: EXPORT */}
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-sky-400" />
                      1. Xuất Bản Sao Lưu (Export Database JSON)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Tải toàn bộ cơ sở dữ liệu xưởng phim về máy tính dưới dạng tệp tin JSON an toàn.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs inline-flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Tải tệp JSON sao lưu (.json)
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyBackup}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs inline-flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    {copiedJson ? 'Đã sao chép!' : 'Sao chép JSON'}
                  </button>

                  {onOpenExportModal && (
                    <button
                      type="button"
                      onClick={onOpenExportModal}
                      className="px-3 py-2 rounded-xl text-slate-400 hover:text-white text-xs inline-flex items-center gap-1.5 transition-colors"
                    >
                      <FileJson className="w-3.5 h-3.5" />
                      Mở bảng xem mã xuất
                    </button>
                  )}
                </div>
              </div>

              {/* SECTION 2: IMPORT */}
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-amber-400" />
                    2. Nhập Dữ Liệu Phục Hồi (Import Database JSON)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Phục hồi dữ liệu từ file sao lưu hoặc dán trực tiếp mã JSON vào ô bên dưới.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Upload file input */}
                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs cursor-pointer border border-slate-700 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Chọn tệp JSON sao lưu từ máy tính...</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Or paste JSON */}
                  <form onSubmit={handleTextImport} className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400 block">
                      Hoặc dán nội dung chuỗi JSON vào đây:
                    </label>
                    <textarea
                      rows={3}
                      value={importJsonText}
                      onChange={(e) => setImportJsonText(e.target.value)}
                      placeholder='{"project": {...}, "characters": [...], "characterVersions": [...]}'
                      className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white font-mono text-[11px] focus:border-amber-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={!importJsonText.trim()}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Nhập & Phục hồi cơ sở dữ liệu
                      </button>

                      {onOpenImportModal && (
                        <button
                          type="button"
                          onClick={onOpenImportModal}
                          className="px-3 py-1.5 text-slate-400 hover:text-white text-xs"
                        >
                          Mở bảng nhập modal
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* SECTION 3: RESET TO SEED FOUNDATION */}
              <div className="p-5 bg-rose-950/30 rounded-xl border border-rose-900/50 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      3. Khôi Phục Dữ Liệu Gốc (Reset Studio Seed Foundation)
                    </h4>
                    <p className="text-xs text-rose-200/70 leading-relaxed">
                      Đưa toàn bộ cơ sở dữ liệu xưởng phim về bản thiết kế gốc ban đầu (Kem, Pi, Ba Trường, Mẹ Vân, Mochi cùng các tập phim mẫu). Lưu ý: Hành động này sẽ xóa các phiên bản bạn tự tạo mới nếu chưa sao lưu!
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetSeedFoundation}
                    className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs inline-flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Khôi phục dữ liệu gốc (Reset Seed)
                  </button>

                  {onResetSeed && (
                    <button
                      type="button"
                      onClick={onResetSeed}
                      className="text-xs text-rose-400 hover:text-rose-300 underline"
                    >
                      Mở hộp thoại xác nhận chi tiết
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
