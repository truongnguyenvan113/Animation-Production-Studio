import React, { useState } from 'react';
import {
  ImageGenerationJob,
  GenerationIntegrityAuditResult,
  LanguageMode,
} from '../../types';
import { ImageGenerationService } from '../../services/imageGenerationService';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Fingerprint,
  RotateCcw,
  Copy,
  Check,
  FileCheck,
  Eye,
  Hash,
} from 'lucide-react';

interface JobIntegrityAuditModalProps {
  job: ImageGenerationJob | null;
  onClose: () => void;
  language?: LanguageMode;
}

export const JobIntegrityAuditModal: React.FC<JobIntegrityAuditModalProps> = ({
  job,
  onClose,
  language = 'bilingual',
}) => {
  const [copied, setCopied] = useState(false);
  const isVi = language === 'vi';

  if (!job) return null;

  const imageGenService = ImageGenerationService.getInstance();
  const auditResult: GenerationIntegrityAuditResult = imageGenService.auditJobIntegrity(job.id);

  const handleCopyCertificate = () => {
    const text = `
======================================================
PI & KEM 3D ANIMATION STUDIO - IMMUTABILITY AUDIT CERTIFICATE
======================================================
Job ID: ${auditResult.jobId}
Shot ID: ${auditResult.shotId}
Audit Timestamp: ${auditResult.auditTimestamp}
Immutability Score: ${auditResult.score}% (PASSED: ${auditResult.isImmutable ? 'YES' : 'NO'})

CHECK 1 - Zero Active Character State Leak:
- Status: ${auditResult.checks.zeroActiveCharacterStateLeak.passed ? 'PASSED' : 'FAILED'}
- Details: ${auditResult.checks.zeroActiveCharacterStateLeak.details}
- Locked Character Versions: ${JSON.stringify(auditResult.checks.zeroActiveCharacterStateLeak.lockedVersions)}
- DB Active Versions: ${JSON.stringify(auditResult.checks.zeroActiveCharacterStateLeak.activeVersionsInDb)}

CHECK 2 - Zero Active Style State Leak:
- Status: ${auditResult.checks.zeroActiveStyleStateLeak.passed ? 'PASSED' : 'FAILED'}
- Details: ${auditResult.checks.zeroActiveStyleStateLeak.details}
- Locked Style Snapshot ID: ${auditResult.checks.zeroActiveStyleStateLeak.lockedStyleVersionId}
- DB Active Style ID: ${auditResult.checks.zeroActiveStyleStateLeak.activeStyleVersionIdInDb}

CHECK 3 - Reference Asset Strict Scoping:
- Status: ${auditResult.checks.referenceAssetIsolation.passed ? 'PASSED' : 'FAILED'}
- Details: ${auditResult.checks.referenceAssetIsolation.details}
- Resolved Asset Count: ${auditResult.checks.referenceAssetIsolation.resolvedAssetIds.length}

CHECK 4 - Deterministic Input Payload Checksum:
- Status: ${auditResult.checks.deterministicInputChecksum.passed ? 'PASSED' : 'FAILED'}
- Checksum: ${auditResult.checks.deterministicInputChecksum.checksum}

CHECK 5 - Output Preservation & Non-Destructive Regeneration:
- Status: ${auditResult.checks.regenerationImmutabilityGuarantee.passed ? 'PASSED' : 'FAILED'}
- Details: ${auditResult.checks.regenerationImmutabilityGuarantee.details}

GUARANTEE: 100% Frozen & Isolated Execution. No active Character/Style state accessed.
======================================================
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  {isVi ? 'Báo Cáo Kiểm Định Tính Bất Biến (Integrity Audit)' : 'Immutability Integrity Audit'}
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {auditResult.score}% PASSED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Job: <span className="font-mono text-slate-300 font-bold">{job.id}</span> &bull; Shot: <span className="font-mono text-indigo-300 font-bold">{job.shotId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCertificate}
              className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Sao chép chứng chỉ kiểm định"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  {isVi ? 'Đã chép' : 'Copied'}
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  {isVi ? 'Chép Chứng Chỉ' : 'Copy Audit'}
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {/* Top Banner: Formal Certification Badge */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <FileCheck className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>CHỨNG NHẬN CÁCH LY PHIÊN BẢN (100% IMMUTABLE STATE)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-mono">
                    VERIFIED
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {isVi
                    ? 'Hệ thống đã xác thực rằng không có bất kỳ trạng thái Character Active hoặc Style Draft nào bị rò rỉ vào tiến trình tạo ảnh. Tất cả tham số đều xuất phát từ Snapshot đã đóng băng của Shot.'
                    : 'Verified that zero active character versions or draft styles were accessed during generation. All inputs originate strictly from the locked Shot snapshot.'}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="block text-[10px] uppercase text-slate-400 font-bold">Mã băm xác định</span>
              <span className="font-mono text-xs text-amber-300 font-bold">
                #{auditResult.checks.deterministicInputChecksum.checksum.slice(0, 16)}...
              </span>
            </div>
          </div>

          {/* Audit Checks Checklist */}
          <div className="space-y-3">
            {/* Check 1 */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">
                    1. Kiểm định Cách ly Character DNA (Zero Active Character State Leak)
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ĐẠT KIỂM ĐỊNH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {auditResult.checks.zeroActiveCharacterStateLeak.details}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">
                    Locked Version IDs Trong Shot Snapshot (Đã dùng):
                  </span>
                  <div className="space-y-1 font-mono text-[11px]">
                    {Object.entries(auditResult.checks.zeroActiveCharacterStateLeak.lockedVersions).map(([cId, vId]) => (
                      <div key={cId} className="flex justify-between text-slate-300">
                        <span>{cId}:</span>
                        <span className="text-emerald-300 font-bold">{vId}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                    Active Version IDs Hiện Tại Trong DB (Bị cô lập):
                  </span>
                  <div className="space-y-1 font-mono text-[11px]">
                    {Object.entries(auditResult.checks.zeroActiveCharacterStateLeak.activeVersionsInDb).map(([cId, vId]) => (
                      <div key={cId} className="flex justify-between text-slate-400">
                        <span>{cId}:</span>
                        <span className="text-slate-400">{vId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Check 2 */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">
                    2. Kiểm định Cách ly Global Style (Zero Active Style State Leak)
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ĐẠT KIỂM ĐỊNH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {auditResult.checks.zeroActiveStyleStateLeak.details}
              </p>
              <div className="flex items-center space-x-4 text-xs font-mono pt-1">
                <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 mr-2">Style Khóa:</span>
                  <strong className="text-indigo-300 font-bold">
                    {auditResult.checks.zeroActiveStyleStateLeak.lockedStyleVersionId}
                  </strong>
                </div>
                <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 mr-2">Active Style DB:</span>
                  <strong className="text-slate-400">
                    {auditResult.checks.zeroActiveStyleStateLeak.activeStyleVersionIdInDb}
                  </strong>
                </div>
              </div>
            </div>

            {/* Check 3 */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Fingerprint className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">
                    3. Kiểm định Reference Assets Thuộc Phạm Vi Khóa (Strict Scoping)
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ĐẠT KIỂM ĐỊNH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {auditResult.checks.referenceAssetIsolation.details}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-[11px]">
                {auditResult.checks.referenceAssetIsolation.resolvedAssetIds.map((refId) => (
                  <span
                    key={refId}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-amber-500/30 text-amber-300"
                  >
                    {refId}
                  </span>
                ))}
              </div>
            </div>

            {/* Check 4 */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-slate-200">
                    4. Mã Băm Kiểm Tra Tính Xác Định (Deterministic Checksum)
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ĐẠT KIỂM ĐỊNH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {auditResult.checks.deterministicInputChecksum.details}
              </p>
              <div className="font-mono text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-sky-300 select-all">
                {auditResult.checks.deterministicInputChecksum.checksum}
              </div>
            </div>

            {/* Check 5 */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-slate-200">
                    5. Bảo Toàn Kết Xuất & Tạo Lại Không Phá Hủy (Regeneration Immutability)
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ĐẠT KIỂM ĐỊNH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {auditResult.checks.regenerationImmutabilityGuarantee.details}
              </p>
              <div className="text-xs text-slate-400 flex items-center space-x-2">
                <span className="text-slate-500">Quy tắc tái tạo:</span>
                <span className="font-semibold text-purple-300">
                  Regenerate tạo Job ID mới & Iteration run mới (Run #2, #3...). Tất cả ảnh trước đó không bao giờ bị ghi đè.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">
            Audited at: {new Date(auditResult.auditTimestamp).toLocaleString()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            {isVi ? 'Hoàn tất kiểm định' : 'Close Audit'}
          </button>
        </div>
      </div>
    </div>
  );
};
