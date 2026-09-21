/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  Shot,
  ProductionPack,
  FlowGenerationJob,
  ProductionAsset,
  StudioDatabase,
} from '../../types';
import { googleFlowDirector } from '../../services/googleFlowDirector';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Lock,
  Layers,
  FileCheck,
  FileX,
  Hash,
  Sparkles,
  Award,
  Check,
  X,
  Flag,
} from 'lucide-react';

interface AuditProvenanceTabProps {
  shot: Shot;
  pack: ProductionPack | null;
  activeJob: FlowGenerationJob | null;
  latestAsset?: ProductionAsset;
  db: StudioDatabase;
  onRefresh?: () => void;
}

export type AuditStatusLevel = 'PASS' | 'WARNING' | 'BLOCKED' | 'WAITING';

interface AuditItem {
  id: string;
  category: string;
  title: string;
  status: AuditStatusLevel;
  value: string;
  details: string;
}

export const AuditProvenanceTab: React.FC<AuditProvenanceTabProps> = ({
  shot,
  pack,
  activeJob,
  latestAsset,
  db,
  onRefresh,
}) => {
  // Compute the 6 authoritative QA & Provenance checkpoints
  const auditItems: AuditItem[] = useMemo(() => {
    const items: AuditItem[] = [];

    // 1. Production Pack Integrity
    const hasHash = Boolean(pack?.canonical_input_hash && pack.canonical_input_hash.length === 64);
    items.push({
      id: 'pack_integrity',
      category: 'Gói Dữ Liệu Sản Xuất',
      title: 'Tính Toàn Vẹn Production Pack',
      status: hasHash ? 'PASS' : 'BLOCKED',
      value: pack?.pack_id || 'Chưa biên dịch',
      details: hasHash
        ? `Canonical Hash: ${pack?.canonical_input_hash.slice(0, 16)}... (64 hex sha256)`
        : 'Thiếu canonical_input_hash hợp lệ hoặc chưa biên dịch.',
    });

    // 2. Character DNA Locks
    const shotCharIds = shot.characterIds || [];
    const shotLocks = shot.characterDnaReferences || (shot.characterVersionSnapshots as any) || {};
    const allLocked = shotCharIds.length > 0
      ? shotCharIds.every((id) => Boolean(shotLocks[id]))
      : true;

    items.push({
      id: 'character_locks',
      category: 'Nhân Vật',
      title: 'Bất Biến Khóa DNA Nhân Vật',
      status: allLocked ? 'PASS' : 'BLOCKED',
      value: `${shotCharIds.length} nhân vật được khóa`,
      details: allLocked
        ? `Tất cả nhân vật có mặt trong shot (${shotCharIds.join(', ') || 'None'}) đều được neo vào version snapshot.`
        : 'Phát hiện nhân vật trong shot chưa được gán version snapshot cụ thể.',
    });

    // 3. Style Lock
    const hasStyle = Boolean(pack?.style.styleVersionId);
    items.push({
      id: 'style_lock',
      category: 'Phong Cách',
      title: 'Bất Biến Khóa Phong Cách (Style Lock)',
      status: hasStyle ? 'PASS' : 'BLOCKED',
      value: pack?.style.styleVersionId || 'Chưa khóa',
      details: hasStyle
        ? `Phong cách '${pack?.style.styleName}' (v1.0) đã được khóa vĩnh viễn vào Production Pack.`
        : 'Chưa có thông số phong cách nghệ thuật được khóa.',
    });

    // 4. Reference Set Traceability
    const refCount = pack?.references.length || 0;
    const allRefsValid = refCount > 0 && pack?.references.every((r) => r.reference_id && r.source);
    items.push({
      id: 'references_traceability',
      category: 'Tài Liệu Tham Chiếu',
      title: 'Kiểm Định Bộ Tham Chiếu (Traceable Set)',
      status: allRefsValid ? 'PASS' : refCount === 0 ? 'WARNING' : 'BLOCKED',
      value: `${refCount} tài liệu tham chiếu`,
      details: allRefsValid
        ? 'Tất cả tài liệu tham chiếu đều có ID định danh và nguồn lưu trữ rõ ràng.'
        : refCount === 0
        ? 'Không có tài liệu tham chiếu nào được đính kèm.'
        : 'Phát hiện tài liệu tham chiếu thiếu thông tin nguồn hoặc ID.',
    });

    // 5. Flow Job Status
    let jobStatus: AuditStatusLevel = 'WAITING';
    if (activeJob) {
      if (activeJob.status === 'READY' || activeJob.status === 'COMPLETED') {
        jobStatus = 'PASS';
      } else if (activeJob.status === 'FAILED') {
        jobStatus = 'BLOCKED';
      } else {
        jobStatus = 'WAITING';
      }
    }

    items.push({
      id: 'job_status',
      category: 'Thực Thi',
      title: 'Trạng Thái Tiến Trình Flow Job',
      status: jobStatus,
      value: activeJob ? `${activeJob.status} (${activeJob.execution_mode})` : 'Chưa kích hoạt job',
      details: activeJob
        ? `Job ID: ${activeJob.job_id} &bull; Chế độ: ${activeJob.execution_mode}`
        : 'Chưa tạo Flow Generation Job cho Shot này.',
    });

    // 6. Asset Provenance & Certification
    let provStatus: AuditStatusLevel = 'WAITING';
    if (latestAsset) {
      if (latestAsset.qa_status === 'PASSED') provStatus = 'PASS';
      else if (latestAsset.qa_status === 'FLAGGED') provStatus = 'WARNING';
      else if (latestAsset.qa_status === 'REJECTED') provStatus = 'BLOCKED';
      else provStatus = 'WAITING';
    }

    items.push({
      id: 'asset_provenance',
      category: 'Chứng Thực Xuất Xứ',
      title: 'Chứng Thực Nguồn Gốc & QA Khung Hình',
      status: provStatus,
      value: latestAsset ? `${latestAsset.qa_status} (${latestAsset.format})` : 'Chờ nạp kết xuất',
      details: latestAsset
        ? `Asset ID: ${latestAsset.asset_id} &bull; Hash: ${latestAsset.provenance.canonical_input_hash?.slice(0, 12)}... &bull; Kích thước: ${latestAsset.dimensions?.width}x${latestAsset.dimensions?.height}`
        : 'Chưa có tệp kết xuất nào được nhập từ Google Flow để kiểm chứng xuất xứ.',
    });

    return items;
  }, [shot, pack, activeJob, latestAsset]);

  // Overall Verdict
  const hasBlocked = auditItems.some((i) => i.status === 'BLOCKED');
  const hasWarning = auditItems.some((i) => i.status === 'WARNING');
  const hasWaiting = auditItems.some((i) => i.status === 'WAITING');

  const overallVerdict: AuditStatusLevel = hasBlocked
    ? 'BLOCKED'
    : hasWarning
    ? 'WARNING'
    : hasWaiting
    ? 'WAITING'
    : 'PASS';

  // Handle QA approval change
  const handleSetQaStatus = (status: 'PASSED' | 'FLAGGED' | 'REJECTED') => {
    if (!latestAsset) return;
    googleFlowDirector.updateQAStatus(latestAsset.asset_id, status);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Overall QA Verdict */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PROVENANCE AUDIT MATRIX
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                PI & KEM ENGINE QA
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Đối Soát Xuất Xứ & Kiểm Định Kỹ Thuật (Audit & Provenance QA)
            </h3>
            <p className="text-xs text-slate-400">
              Kiểm tra tính nhất quán toán học giữa Production Pack, Input Hash, Character DNA và khung hình kết xuất từ Google Flow.
            </p>
          </div>

          {/* Overall Verdict Badge */}
          <div className="shrink-0 flex items-center gap-3">
            <div
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 shadow-xs ${
                overallVerdict === 'PASS'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : overallVerdict === 'WARNING'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : overallVerdict === 'BLOCKED'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-sky-500/20 border-sky-500/40 text-sky-300'
              }`}
            >
              {overallVerdict === 'PASS' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {overallVerdict === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {overallVerdict === 'BLOCKED' && <XCircle className="w-4 h-4 text-rose-400" />}
              {overallVerdict === 'WAITING' && <Clock className="w-4 h-4 text-sky-400" />}
              <span>ĐÁNH GIÁ: {overallVerdict}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Audit Matrix Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Ma Trận Đối Soát 6 Trụ Cột (6-Pillar Audit Matrix)
          </h4>
          <span className="text-xs text-slate-400">
            {auditItems.filter((i) => i.status === 'PASS').length} / {auditItems.length} Tiêu Chuẩn Đạt
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {auditItems.map((item) => {
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                        item.status === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : item.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : item.status === 'BLOCKED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {item.status === 'PASS' && <Check className="w-3 h-3 text-emerald-600" />}
                      {item.status === 'WARNING' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                      {item.status === 'BLOCKED' && <X className="w-3 h-3 text-rose-600" />}
                      {item.status === 'WAITING' && <Clock className="w-3 h-3 text-slate-600" />}
                      {item.status}
                    </span>
                  </div>

                  <h5 className="font-bold text-xs text-slate-900 leading-snug">{item.title}</h5>
                  <div className="font-mono text-[11px] font-semibold text-slate-700 truncate" title={item.value}>
                    {item.value}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                  {item.details}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Latest Asset Provenance & QA Actions */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h4 className="font-bold text-sm text-slate-900">
              Kiểm Tra & Phê Duyệt Asset Kết Xuất (Output Asset Inspection)
            </h4>
          </div>
          {latestAsset && (
            <span className="font-mono text-xs text-slate-500">
              {latestAsset.asset_id}
            </span>
          )}
        </div>

        {latestAsset ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Preview (4 Cols) */}
            <div className="md:col-span-4 aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
              <img
                src={latestAsset.uri}
                alt="Latest asset output"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Metadata & Controls (8 Cols) */}
            <div className="md:col-span-8 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Định Dạng MIME</span>
                  <span className="font-bold text-slate-800">{latestAsset.mime_type}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Độ Phân Giải</span>
                  <span className="font-bold text-slate-800">
                    {latestAsset.dimensions ? `${latestAsset.dimensions.width} x ${latestAsset.dimensions.height}` : '1376 x 768'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Dung Lượng</span>
                  <span className="font-bold text-slate-800">
                    {latestAsset.file_size_bytes ? `${Math.round(latestAsset.file_size_bytes / 1024)} KB` : 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Chế Độ Thực Thi</span>
                  <span className="font-bold text-slate-800">{latestAsset.execution_mode}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Thời Gian Ghi Nhận</span>
                  <span className="font-bold text-slate-800">
                    {new Date(latestAsset.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Trạng Thái QA</span>
                  <span className="font-bold text-indigo-700">{latestAsset.qa_status}</span>
                </div>
              </div>

              {/* QA Actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <span className="font-bold text-slate-700 text-xs">Phê duyệt QA:</span>
                <button
                  type="button"
                  onClick={() => handleSetQaStatus('PASSED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors ${
                    latestAsset.qa_status === 'PASSED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Chấp Thuận (Pass)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQaStatus('FLAGGED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors ${
                    latestAsset.qa_status === 'FLAGGED'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  Gắn Cờ Lưu Ý (Flag)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQaStatus('REJECTED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors ${
                    latestAsset.qa_status === 'REJECTED'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  Từ Chối (Reject)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 text-center text-slate-500 text-xs space-y-1">
            <p className="font-medium">Chưa có kết xuất nào được lưu trữ xuất xứ cho Shot này.</p>
            <p className="text-[11px] text-slate-400">
              Hãy bấm &quot;Nhập Kết Quả Flow&quot; hoặc &quot;Nạp Local Preview&quot; trong tab Điều Phối Sản Xuất để khởi tạo hồ sơ xuất xứ.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
