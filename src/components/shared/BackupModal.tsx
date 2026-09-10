import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { Download, Upload, Copy, Check, X, AlertTriangle, RotateCcw } from 'lucide-react';
import { LanguageMode } from '../../types';

interface BackupModalProps {
  isOpen: boolean;
  mode: 'export' | 'import' | 'reset';
  onClose: () => void;
  onRefreshAll: () => void;
  language: LanguageMode;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  mode,
  onClose,
  onRefreshAll,
  language,
}) => {
  if (!isOpen) return null;

  const [importJsonText, setImportJsonText] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const exportDataString = JSON.stringify(storageService.exportState(), null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportDataString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportDataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pi_kem_studio_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const parsed = JSON.parse(importJsonText.trim());
      const success = storageService.importState(parsed);
      if (success) {
        onRefreshAll();
        onClose();
      } else {
        setErrorMessage('Invalid database structure. Please provide a valid Studio export JSON.');
      }
    } catch (err: any) {
      setErrorMessage(`JSON parsing failed: ${err.message}`);
    }
  };

  const handleResetConfirm = () => {
    storageService.resetToSeed();
    onRefreshAll();
    onClose();
  };

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            {mode === 'export' && <Download className="w-5 h-5 text-sky-400" />}
            {mode === 'import' && <Upload className="w-5 h-5 text-amber-400" />}
            {mode === 'reset' && <RotateCcw className="w-5 h-5 text-rose-400" />}

            {mode === 'export' && formatLabel('Export Studio Database JSON', 'Xuất bản sao lưu cơ sở dữ liệu Studio')}
            {mode === 'import' && formatLabel('Import Studio Database JSON', 'Nhập dữ liệu sao lưu Studio')}
            {mode === 'reset' && formatLabel('Reset Studio to Seed Foundation', 'Khôi phục dữ liệu gốc khởi tạo')}
          </h3>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {mode === 'export' && (
            <div className="space-y-4">
              <p className="text-slate-300">
                {formatLabel(
                  'Your creative database (Project, Characters, DNA Versions, References, Global Styles, Seasons, and Episodes) is compiled into a single JSON package below.',
                  'Toàn bộ cơ sở dữ liệu sáng tạo của bạn đã được xuất thành gói JSON dưới đây.',
                )}
              </p>

              <div className="relative">
                <textarea
                  readOnly
                  rows={12}
                  value={exportDataString}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-sky-300 select-all focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-lg font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>
          )}

          {mode === 'import' && (
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <p className="text-slate-300">
                {formatLabel(
                  'Paste your previously exported Studio JSON below. This will replace the local production state with the imported data.',
                  'Dán chuỗi JSON đã sao lưu vào khung bên dưới để khôi phục dữ liệu sản xuất.',
                )}
              </p>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs">
                  {errorMessage}
                </div>
              )}

              <textarea
                rows={10}
                required
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{ "project": {...}, "characters": [...], "characterVersions": [...] }'
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-amber-300 focus:border-amber-500 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg font-semibold text-slate-300 hover:bg-slate-800"
                >
                  {formatLabel('Cancel', 'Hủy')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-md"
                >
                  <Upload className="w-4 h-4" />
                  <span>{formatLabel('Apply Import', 'Áp dụng nhập dữ liệu')}</span>
                </button>
              </div>
            </form>
          )}

          {mode === 'reset' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3 text-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-sm">
                    {formatLabel('Confirm Studio Foundation Reset', 'Xác nhận khôi phục cài đặt gốc')}
                  </span>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    {formatLabel(
                      'This will re-initialize the studio with the official seed characters (Ethan, Emma, Pi, Kem, Mochi), Global Style v1.0, Season 1, and Episode 9 "Tập 9 – Cùng nhau vẽ tranh". Any unsaved experimental iterations will be reset.',
                      'Hành động này sẽ tải lại dữ liệu gốc ban đầu bao gồm 5 nhân vật chính, phong cách v1.0, Mùa 1 và Tập 9 "Tập 9 – Cùng nhau vẽ tranh".',
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg font-semibold text-slate-300 hover:bg-slate-800"
                >
                  {formatLabel('Cancel', 'Hủy')}
                </button>
                <button
                  type="button"
                  onClick={handleResetConfirm}
                  className="px-4 py-2 rounded-lg font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{formatLabel('Confirm Reset to Seed', 'Đồng ý khôi phục gốc')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
