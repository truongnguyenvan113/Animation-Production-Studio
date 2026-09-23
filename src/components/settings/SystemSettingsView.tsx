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
  HardDrive,
  RefreshCw,
  FolderCheck,
  ArrowRight,
  FolderTree,
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
  const [diskStatus, setDiskStatus] = useState(() => storageService.getDiskSyncStatus());
  const [isSavingDisk, setIsSavingDisk] = useState(false);
  const [isReloadingDisk, setIsReloadingDisk] = useState(false);

  // Legacy migration states
  const [hasLocalStorage, setHasLocalStorage] = useState(() => storageService.hasLocalStorageData());
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationReport, setMigrationReport] = useState<any | null>(null);

  // AI Provider & API Key States
  const [serverAiConfig, setServerAiConfig] = useState<{
    hasGeminiKey: boolean;
    geminiKeyMasked: string;
    provider: string;
    pollinationsModel: string;
  } | null>(null);
  const [inputGeminiKey, setInputGeminiKey] = useState('');
  const [aiTestLoading, setAiTestLoading] = useState<string | null>(null);
  const [aiTestResult, setAiTestResult] = useState<{
    provider: string;
    status: 'ok' | 'warning' | 'error';
    message: string;
    latencyMs?: number;
  } | null>(null);

  useEffect(() => {
    setSettings(systemSettingsService.getSettings());
    const unsub = storageService.subscribe(() => {
      setDiskStatus(storageService.getDiskSyncStatus());
      setHasLocalStorage(storageService.hasLocalStorageData());
    });

    // Load server AI config
    fetch('/api/settings/ai-config')
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'ok') {
          setServerAiConfig(data);
        }
      })
      .catch(() => {});

    return unsub;
  }, []);

  const handleMigrateFromLocalStorage = async () => {
    if (!window.confirm('Chuyển đổi toàn bộ dữ liệu từ trình duyệt (LocalStorage) vào tệp data/database.json và ánh xạ ảnh sang thư mục mới?')) {
      return;
    }
    setIsMigrating(true);
    setMigrationReport(null);
    try {
      const raw = storageService.getLocalStorageRawData();
      const res = await storageService.migrateLegacyData(raw);
      if (res.success) {
        setMigrationReport(res.stats);
        setStorageStatusMessage({ type: 'success', text: res.message });
        if (onRefreshAll) onRefreshAll();
      } else {
        setStorageStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStorageStatusMessage({ type: 'error', text: `Lỗi: ${err.message}` });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleMigrateFromUploadedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsMigrating(true);
    setMigrationReport(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await storageService.migrateLegacyData(parsed);
      if (res.success) {
        setMigrationReport(res.stats);
        setStorageStatusMessage({ type: 'success', text: `Đã nạp file "${file.name}" và chuyển đổi vào cấu trúc thư mục mới thành công!` });
        if (onRefreshAll) onRefreshAll();
      } else {
        setStorageStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStorageStatusMessage({ type: 'error', text: `Lỗi đọc file: ${err.message}` });
    } finally {
      setIsMigrating(false);
      e.target.value = '';
    }
  };

  const handleForceSyncDisk = async () => {
    setIsSavingDisk(true);
    try {
      const ok = await storageService.saveToDisk();
      if (ok) {
        setStorageStatusMessage({ type: 'success', text: 'Đã lưu toàn bộ cơ sở dữ liệu vào tệp data/database.json trong dự án thành công!' });
      } else {
        setStorageStatusMessage({ type: 'error', text: 'Không thể ghi vào tệp data/database.json trên máy chủ.' });
      }
    } catch (err: any) {
      setStorageStatusMessage({ type: 'error', text: `Lỗi: ${err.message}` });
    } finally {
      setIsSavingDisk(false);
      setTimeout(() => setStorageStatusMessage(null), 3500);
    }
  };

  const handleReloadFromDisk = async () => {
    if (!window.confirm('Tải lại toàn bộ dữ liệu từ tệp data/database.json trên đĩa? Dữ liệu đang hiển thị sẽ được đồng bộ theo tệp trên đĩa.')) {
      return;
    }
    setIsReloadingDisk(true);
    try {
      const res = await storageService.reloadFromDisk();
      if (res.success) {
        setStorageStatusMessage({ type: 'success', text: res.message });
        if (onRefreshAll) onRefreshAll();
      } else {
        setStorageStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStorageStatusMessage({ type: 'error', text: `Lỗi: ${err.message}` });
    } finally {
      setIsReloadingDisk(false);
      setTimeout(() => setStorageStatusMessage(null), 3500);
    }
  };

  const handleSave = async () => {
    systemSettingsService.updateSettings(settings);

    // Persist AI provider and optional key to server
    try {
      await fetch('/api/settings/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings.aiModel.imageProvider || 'auto',
          pollinationsModel: settings.aiModel.pollinationsModel || 'flux',
          geminiApiKey: inputGeminiKey.trim() || undefined,
        }),
      });
      const res = await fetch('/api/settings/ai-config');
      const data = await res.json();
      if (data.status === 'ok') setServerAiConfig(data);
      if (inputGeminiKey.trim()) setInputGeminiKey('');
    } catch (err) {
      console.warn('Could not sync ai-config to server:', err);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestAi = async (provider: 'pollinations' | 'gemini') => {
    setAiTestLoading(provider);
    setAiTestResult(null);
    try {
      const res = await fetch('/api/settings/test-ai-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      setAiTestResult({
        provider,
        status: data.status === 'ok' ? 'ok' : data.status === 'warning' ? 'warning' : 'error',
        message: data.message || 'Kiểm tra hoàn tất',
        latencyMs: data.latencyMs,
      });
    } catch (err: any) {
      setAiTestResult({
        provider,
        status: 'error',
        message: `Lỗi kết nối: ${err.message}`,
      });
    } finally {
      setAiTestLoading(null);
    }
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
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Bộ Chuyển Đổi Engine AI & Quản Lý API Key</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Linh hoạt chuyển đổi giữa Google Gemini API và Pollinations AI (Miễn phí 100%, không cần Key, phù hợp Mac mini 2018 / Local).
                </p>
              </div>

              {/* 1. Engine Provider Selection Cards */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>1. Chọn Engine Tạo Ảnh AI:</span>
                  <span className="text-[11px] font-mono text-amber-400">
                    Đang chọn: {settings.aiModel.imageProvider === 'pollinations' ? 'Pollinations AI (Free)' : settings.aiModel.imageProvider === 'gemini' ? 'Google Gemini API' : 'Tự Động (Auto Fallback)'}
                  </span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Option 1: Pollinations */}
                  <div
                    onClick={() =>
                      setSettings({
                        ...settings,
                        aiModel: { ...settings.aiModel, imageProvider: 'pollinations' },
                      })
                    }
                    className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                      settings.aiModel.imageProvider === 'pollinations'
                        ? 'bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/40 shadow-lg shadow-rose-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🌸</span>
                        <div>
                          <h4 className="text-xs font-bold text-white">Pollinations AI</h4>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">100% Miễn Phí</span>
                        </div>
                      </div>
                      {settings.aiModel.imageProvider === 'pollinations' && (
                        <CheckCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                      Không cần API key, không giới hạn lượt tạo, không bao giờ lo lỗi 429 Quota Exceeded. Tối ưu hoàn hảo cho Mac mini 2018 (Intel GPU).
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-rose-300 font-mono">
                      <span>FLUX 3D Engine</span>
                      <span className="text-emerald-400">● Unlimited</span>
                    </div>
                  </div>

                  {/* Option 2: Auto Fallback (Recommended) */}
                  <div
                    onClick={() =>
                      setSettings({
                        ...settings,
                        aiModel: { ...settings.aiModel, imageProvider: 'auto' },
                      })
                    }
                    className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                      settings.aiModel.imageProvider === 'auto' || !settings.aiModel.imageProvider
                        ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⚡</span>
                        <div>
                          <h4 className="text-xs font-bold text-white">Tự Động (Auto)</h4>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Khuyên Dùng</span>
                        </div>
                      </div>
                      {(settings.aiModel.imageProvider === 'auto' || !settings.aiModel.imageProvider) && (
                        <CheckCircle className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                      Ưu tiên Gemini API; nếu hết quota (429) hoặc tài khoản ở Free Tier thì tự động chuyển sang Pollinations tạo ảnh mới độc bản!
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-amber-300 font-mono">
                      <span>Gemini ➔ Pollinations</span>
                      <span className="text-emerald-400">● 100% Uptime</span>
                    </div>
                  </div>

                  {/* Option 3: Gemini Cloud API */}
                  <div
                    onClick={() =>
                      setSettings({
                        ...settings,
                        aiModel: { ...settings.aiModel, imageProvider: 'gemini' },
                      })
                    }
                    className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                      settings.aiModel.imageProvider === 'gemini'
                        ? 'bg-sky-950/30 border-sky-400 ring-2 ring-sky-400/40 shadow-lg shadow-sky-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">💎</span>
                        <div>
                          <h4 className="text-xs font-bold text-white">Google Gemini API</h4>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">Paid Key</span>
                        </div>
                      </div>
                      {settings.aiModel.imageProvider === 'gemini' && (
                        <CheckCircle className="w-4 h-4 text-sky-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                      Sử dụng trực tiếp Google GenAI SDK. Yêu cầu API Key thuộc dự án Google Cloud có kích hoạt Billing (Paid Tier) để tạo ảnh.
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-sky-300 font-mono">
                      <span>Google AI Studio</span>
                      <span className={serverAiConfig?.hasGeminiKey ? 'text-emerald-400' : 'text-amber-400'}>
                        {serverAiConfig?.hasGeminiKey ? '● Đã có Key' : '○ Chưa có Key'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Provider Detailed Config */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Cấu Hình Chi Tiết Engine & Thử Nghiệm Kết Nối</span>
                  </h4>
                  {/* Ping Test Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={aiTestLoading !== null}
                      onClick={() => handleTestAi('pollinations')}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 text-[11px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {aiTestLoading === 'pollinations' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>🌸</span>}
                      Ping Pollinations
                    </button>
                    <button
                      type="button"
                      disabled={aiTestLoading !== null}
                      onClick={() => handleTestAi('gemini')}
                      className="px-2.5 py-1 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-800/80 text-[11px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {aiTestLoading === 'gemini' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>💎</span>}
                      Ping Gemini API
                    </button>
                  </div>
                </div>

                {/* Ping Test Result Alert */}
                {aiTestResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                      aiTestResult.status === 'ok'
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : aiTestResult.status === 'warning'
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                        : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    <span className="text-base leading-none">
                      {aiTestResult.status === 'ok' ? '✅' : aiTestResult.status === 'warning' ? '⚠️' : '❌'}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>Kết quả kiểm tra {aiTestResult.provider === 'pollinations' ? 'Pollinations AI' : 'Gemini API'}:</span>
                        {aiTestResult.latencyMs !== undefined && (
                          <span className="font-mono text-[10px] opacity-80">{aiTestResult.latencyMs}ms</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] opacity-90">{aiTestResult.message}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Pollinations Model Setting */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300 flex items-center gap-1.5">
                      <span>🌸 Kiểu Mô Hình Pollinations:</span>
                    </label>
                    <select
                      value={settings.aiModel.pollinationsModel || 'flux'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          aiModel: {
                            ...settings.aiModel,
                            pollinationsModel: e.target.value as any,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-white font-medium focus:border-amber-500 focus:outline-none"
                    >
                      <option value="flux">FLUX.1 3D Pixar Cinematic (Chuẩn đẹp nhất, chi tiết cao)</option>
                      <option value="turbo">FLUX Turbo Fast (Siêu tốc độ 3 - 5 giây)</option>
                      <option value="flux-realism">FLUX Realism (Ánh sáng tả thực)</option>
                      <option value="flux-anime">FLUX Anime (Phong cách Anime sinh động)</option>
                    </select>
                    <p className="text-[10px] text-slate-400">
                      Được tối ưu sẵn lời nhắc phong cách 3D Pixar hoạt hình cho Pi & Kem.
                    </p>
                  </div>

                  {/* Gemini API Key Management */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300 flex items-center justify-between">
                      <span>💎 Google Gemini API Key:</span>
                      {serverAiConfig?.hasGeminiKey && (
                        <span className="text-[10px] font-mono text-emerald-400">
                          Đã cấu hình: {serverAiConfig.geminiKeyMasked}
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      placeholder={serverAiConfig?.hasGeminiKey ? 'Đã có key. Nhập key mới nếu muốn đổi...' : 'Dán API Key (AIzaSy...) tại đây...'}
                      value={inputGeminiKey}
                      onChange={(e) => setInputGeminiKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono text-xs focus:border-sky-500 focus:outline-none"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Tự động cập nhật vào biến môi trường khi bấm "Lưu cài đặt".</span>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:underline inline-flex items-center gap-0.5"
                      >
                        Lấy API Key Google ↗
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Advanced Parameters */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span>2. Thông Số Kỹ Thuật Mô Hình & Khung Hình:</span>
                </h4>

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

              {/* SECTION 0: LOCAL PROJECT FOLDER STORAGE */}
              <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-xl border border-amber-500/30 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-sm text-white">
                        Lưu Trữ Tệp Dự Án (Project Folder: data/database.json)
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        diskStatus.connected
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {diskStatus.connected ? 'Máy Chủ Local Đang Kết Nối' : 'Chế Độ Dự Phòng'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Toàn bộ nhân vật, phiên bản DNA, prompt chuẩn hóa, kịch bản tập phim và storyboard hiện được lưu trực tiếp vào tệp <code className="text-amber-300 font-mono font-semibold bg-slate-900 px-1.5 py-0.5 rounded">data/database.json</code> trong thư mục dự án của bạn.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Đường dẫn tệp trên đĩa:</span>
                    <span className="font-mono text-amber-400 text-[11px] font-semibold break-all">data/database.json</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Trạng thái tự động ghi:</span>
                    <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Tự động lưu sau mỗi thao tác (Auto-save)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Lần lưu tệp gần nhất:</span>
                    <span className="text-slate-300 text-[11px]">
                      {diskStatus.lastSaved ? new Date(diskStatus.lastSaved).toLocaleTimeString('vi-VN') : 'Vừa khởi tạo'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleForceSyncDisk}
                    disabled={isSavingDisk}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs inline-flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {isSavingDisk ? 'Đang lưu vào data/database.json...' : 'Ghi ngay vào tệp data/database.json'}
                  </button>

                  <button
                    type="button"
                    onClick={handleReloadFromDisk}
                    disabled={isReloadingDisk}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold text-xs inline-flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 text-sky-400 ${isReloadingDisk ? 'animate-spin' : ''}`} />
                    {isReloadingDisk ? 'Đang nạp lại...' : 'Tải lại dữ liệu từ tệp dự án'}
                  </button>
                </div>
              </div>

              {/* SECTION 0.5: LEGACY DATA TO NEW FOLDER FORMAT MAPPER */}
              <div className="p-5 bg-slate-950 rounded-xl border border-sky-500/30 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                        <FolderTree className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-sm text-white">
                        Ánh Xạ Dữ Liệu Cũ Vào Định Dạng Thư Mục Mới (Legacy Data & Folder Mapper)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/30">
                        Tự Động Chuẩn Hóa
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Bạn có thể tiếp tục sử dụng toàn bộ dữ liệu xưởng phim đã làm trước đây (từ LocalStorage hoặc tệp JSON cũ). Hệ thống sẽ tự động:
                      <br />• <strong>Chuẩn hóa ID nhân vật:</strong> Ánh xạ bí danh cũ (Nancy ➔ Pi, Leo ➔ Kem, v.v.)
                      <br />• <strong>Tổ chức thư mục chuẩn:</strong> Trích xuất toàn bộ ảnh Base64 thành các tệp ảnh thực tế trong thư mục <code className="text-sky-300 font-mono bg-slate-900 px-1 py-0.5 rounded">public/storage/characters/&#123;characterId&#125;/&#123;versionId&#125;/</code>
                      <br />• <strong>Tối ưu hóa Database:</strong> Ghi cấu trúc sạch sẽ, gọn nhẹ vào <code className="text-amber-300 font-mono bg-slate-900 px-1 py-0.5 rounded">data/database.json</code>
                    </p>
                  </div>
                </div>

                {/* Visual Architecture Mapping Schema */}
                <div className="bg-slate-900/90 rounded-lg p-3.5 border border-slate-800 text-xs font-mono">
                  <div className="text-[11px] text-slate-400 font-sans font-semibold mb-2">
                    Sơ đồ luồng ánh xạ dữ liệu:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-400">
                      <span className="text-rose-400 font-bold block mb-1">Dữ Liệu Cũ (Legacy)</span>
                      • LocalStorage cũ<br />
                      • Tệp JSON xuất trước đây<br />
                      • Ảnh Base64 nặng chục MB<br />
                      • ID cũ: char_nancy, char_leo
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded border border-sky-500/30 flex flex-col justify-center items-center text-center text-sky-300">
                      <span className="text-sky-400 font-bold block mb-1">Bộ Ánh Xạ (Folder Mapper)</span>
                      <ArrowRight className="w-5 h-5 my-1 text-sky-400" />
                      Tự động trích xuất file & chuẩn hóa schema
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded border border-emerald-500/30 text-emerald-300">
                      <span className="text-emerald-400 font-bold block mb-1">Định Dạng Thư Mục Mới</span>
                      📁 data/database.json<br />
                      📁 data/backups/...<br />
                      📁 public/storage/characters/<br />
                      &nbsp;&nbsp;└── char_kem/ver_kem_v1/
                    </div>
                  </div>
                </div>

                {/* Migration Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Action 1: Migrate from LocalStorage */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FolderCheck className="w-4 h-4 text-emerald-400" />
                        Cách 1: Lấy từ trình duyệt (LocalStorage)
                      </span>
                      {hasLocalStorage ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          Phát hiện có dữ liệu
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Trống</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Chuyển dữ liệu đã lưu trong bộ nhớ trình duyệt của bạn vào tệp data/database.json và tạo các thư mục ảnh thật.
                    </p>
                    <button
                      type="button"
                      onClick={handleMigrateFromLocalStorage}
                      disabled={isMigrating || !hasLocalStorage}
                      className="w-full mt-1 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isMigrating ? 'Đang xử lý ánh xạ...' : 'Ánh xạ dữ liệu LocalStorage vào Folder mới'}
                    </button>
                  </div>

                  {/* Action 2: Migrate from Old JSON File */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-sky-400" />
                        Cách 2: Tải lên tệp JSON cũ từ máy tính
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Chọn tệp sao lưu JSON cũ từ máy tính. Hệ thống sẽ giải mã và phân bổ ngay vào các thư mục theo chuẩn mới.
                    </p>
                    <label className="w-full mt-1 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 cursor-pointer text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors shadow-sm text-center">
                      <Upload className="w-4 h-4" />
                      <span>{isMigrating ? 'Đang chuyển đổi...' : 'Chọn tệp JSON cũ để chuyển đổi (.json)'}</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        disabled={isMigrating}
                        onChange={handleMigrateFromUploadedFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Migration Report if completed */}
                {migrationReport && (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Kết Quả Ánh Xạ Dữ Liệu Thành Công:</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                      <div className="bg-slate-950/80 p-2 rounded border border-emerald-500/20">
                        <span className="text-slate-400 block text-[10px]">Nhân vật đã map:</span>
                        <span className="font-bold text-white">{migrationReport.charactersCount}</span>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded border border-emerald-500/20">
                        <span className="text-slate-400 block text-[10px]">Phiên bản DNA:</span>
                        <span className="font-bold text-amber-400">{migrationReport.versionsCount}</span>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded border border-emerald-500/20">
                        <span className="text-slate-400 block text-[10px]">Tài nguyên tham chiếu:</span>
                        <span className="font-bold text-sky-400">{migrationReport.referencesCount}</span>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded border border-emerald-500/20">
                        <span className="text-slate-400 block text-[10px]">Ảnh trích xuất thành file:</span>
                        <span className="font-bold text-emerald-400">{migrationReport.extractedImagesCount} tệp</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      📁 Cấu trúc thư mục: <span className="text-amber-300">{migrationReport.folderStructure}</span> | File DB: <span className="text-amber-300">{migrationReport.databasePath}</span>
                    </div>
                  </div>
                )}
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
