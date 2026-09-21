/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Shot,
  ProductionPack,
  FlowGenerationJob,
  ProductionAsset,
  ProviderExecutionMode,
  Episode,
} from '../../types';
import { CharacterImageResolver } from '../../services/characterImageResolver';
import { CharacterAvatar } from '../shared/CharacterAvatar';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Compass,
  Film,
  Camera,
  Layers,
  Upload,
  ExternalLink,
  Play,
  Eye,
  Copy,
  Check,
  Download,
  Clock,
  Music,
  CheckCircle2,
} from 'lucide-react';

interface FlowWorkspaceTabProps {
  shot: Shot;
  episode: Episode;
  pack: ProductionPack | null;
  activeJob: FlowGenerationJob | null;
  latestAsset?: ProductionAsset;
  executionMode: ProviderExecutionMode;
  isExecutingLocal: boolean;
  copiedPrompt: boolean;
  onCopyPrompt: () => void;
  onDownloadPack: () => void;
  onOpenImportModal: () => void;
  onRunLocalAsset: () => void;
  onSelectTab: (tab: 'flow' | 'prompt' | 'dna' | 'refs' | 'provenance') => void;
}

export const FlowWorkspaceTab: React.FC<FlowWorkspaceTabProps> = ({
  shot,
  episode,
  pack,
  activeJob,
  latestAsset,
  executionMode,
  isExecutingLocal,
  copiedPrompt,
  onCopyPrompt,
  onDownloadPack,
  onOpenImportModal,
  onRunLocalAsset,
  onSelectTab,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Shot Identity & Production Pack Status Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Shot Identification */}
          <div className="space-y-1.5">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {episode.title} ({episode.id})
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Cảnh #{shot.sceneNumber} &bull; Shot #{shot.shotNumber}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {shot.id}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                PACK COMPILED & LOCKED
              </span>
            </div>

            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 pt-1">
              <span>{shot.description || pack?.scene_brief?.sceneTitle || 'Chi tiết khung hình'}</span>
            </h3>

            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 pt-0.5">
              <span><strong>Cỡ cảnh:</strong> {shot.shotType}</span>
              <span>&bull;</span>
              <span><strong>Thời lượng:</strong> {shot.durationSeconds}s</span>
              <span>&bull;</span>
              <span><strong>Góc máy:</strong> {shot.cameraAngle || 'Eye-level 0°'}</span>
              <span>&bull;</span>
              <span><strong>Khung hình:</strong> {shot.framing || 'Rule of Thirds'}</span>
              <span>&bull;</span>
              <span><strong>Chuyển động:</strong> {shot.cameraMovement || 'Static'}</span>
            </div>
          </div>

          {/* Right: Technical Lock Metadata */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs font-mono shrink-0">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Pack ID:</span>
              <span className="text-indigo-300 font-bold">{pack?.pack_id}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Input Hash:</span>
              <span className="text-emerald-400 font-bold" title={pack?.canonical_input_hash}>
                {pack?.canonical_input_hash ? `${pack.canonical_input_hash.slice(0, 14)}...` : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Canon Snapshot:</span>
              <span className="text-amber-300 font-bold">v{pack?.canon_snapshot.canonVersion || '1.0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Production Control Room: Left = 3-Step Flow, Right = Keyframe Render */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Workflow Execution (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Quy Trình Tạo Khung Hình Google Flow
              </h4>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                15 Phần Chuẩn Hóa
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </span>
                <div className="space-y-0.5">
                  <strong className="text-slate-900 block text-xs">Sao chép Master Prompt (15 Phần)</strong>
                  <p className="text-slate-600">
                    Prompt bao gồm đầy đủ 15 phần chuẩn hóa: Core Production Lock, Center-Safe 9:16, Character Master DNA bất biến, Style Lock, và Camera Timeline.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </span>
                <div className="space-y-0.5">
                  <strong className="text-slate-900 block text-xs">Mở Google Flow Studio & Tạo Khung Hình</strong>
                  <p className="text-slate-600">
                    Chuyển sang workspace sáng tạo của Google Flow, đính kèm gói tài liệu tham chiếu (Traceable References) và thực thi thế hệ ảnh/video.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </span>
                <div className="space-y-0.5">
                  <strong className="text-slate-900 block text-xs">Nhập Kết Quả & Đối Soát Kỹ Thuật (Provenance QA)</strong>
                  <p className="text-slate-600">
                    Nhập tệp hình ảnh (JPEG/PNG) hoặc video (MP4) kết xuất từ Flow để lưu trữ xuất xứ, kiểm chứng hash đầu vào và bàn giao sang QA.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onCopyPrompt}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedPrompt ? 'Đã Chép Prompt' : 'Chép Master Prompt (15 Phần)'}
            </button>

            <a
              href="https://labs.google/flow"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Mở Google Flow Studio
            </a>

            <button
              type="button"
              onClick={onOpenImportModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Nhập Kết Quả Flow
            </button>

            <button
              type="button"
              onClick={onDownloadPack}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
              title="Xuất gói dữ liệu Production Pack dạng JSON"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất JSON
            </button>
          </div>
        </div>

        {/* Right: Keyframe / Render Preview (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                Khung Hình / Keyframe Shot
              </h4>
              {latestAsset ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  {latestAsset.execution_mode}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400">Chưa có kết xuất</span>
              )}
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner group">
              {shot.activeImageOutputUrl ? (
                <img
                  src={shot.activeImageOutputUrl}
                  alt={shot.id}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6 text-slate-400 text-xs space-y-2">
                  <Film className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>Chưa có khung hình hoàn thiện cho shot này</p>
                  <p className="text-[10px] text-slate-500">
                    Sử dụng Google Flow Assisted hoặc nạp Local Development Preview
                  </p>
                </div>
              )}

              {/* Badges Overlay */}
              {shot.activeImageOutputUrl && (
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950/80 text-white border border-white/20">
                    {latestAsset?.execution_mode === 'LOCAL_ASSET'
                      ? 'LOCAL PREVIEW'
                      : latestAsset?.execution_mode === 'ASSISTED_FLOW'
                      ? 'FLOW IMPORTED'
                      : 'OUTPUT'}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                    {shot.outputMimeType?.toUpperCase() || 'JPEG'}
                  </span>
                </div>
              )}

              {/* 9:16 Center-Safe Crop Overlay Guide */}
              <div
                className="absolute inset-y-0 border-x border-dashed border-amber-400/40 pointer-events-none"
                style={{ left: '33.33%', right: '33.33%' }}
                title="Vùng an toàn 9:16 Shorts (Center-Safe Safe Zone)"
              >
                <span className="absolute bottom-1 left-1 text-[9px] font-mono font-bold bg-amber-950/80 text-amber-300 px-1 rounded">
                  9:16 Shorts Safe
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Hoặc thực thi bản kết xuất cục bộ:
            </span>
            <button
              type="button"
              onClick={onRunLocalAsset}
              disabled={isExecutingLocal}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Play className="w-3 h-3 text-blue-600" />
              {isExecutingLocal ? 'Đang nạp...' : 'Nạp Local Preview'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Staged Character Snapshot Preview (Thumbnails & Version Locks) */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-sm text-slate-900">
              Nhân Vật Đã Khóa Cho Shot Này (Locked Characters in Shot)
            </h4>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('dna')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            <span>Xem Chi Tiết Khóa DNA & Style</span>
            <span>&rarr;</span>
          </button>
        </div>

        {pack && pack.characters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pack.characters.map((c) => {
              const visual = CharacterImageResolver.resolveShotCharacterVisual(shot, c.characterId);

              return (
                <div
                  key={c.characterId}
                  className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/30 flex items-center gap-3 shadow-2xs hover:border-emerald-300 transition-all"
                >
                  <CharacterAvatar
                    characterId={c.characterId}
                    versionId={c.activeVersionId}
                    size="lg"
                    className="shrink-0 rounded-xl"
                  />
                  <div className="text-xs space-y-0.5 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 truncate">{c.displayName}</span>
                      <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-700 block">
                      {c.versionNumber} [{c.activeVersionId}]
                    </span>
                    <p className="text-[10px] text-slate-500 truncate" title={c.outfit}>
                      {c.outfit}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs text-center">
            Shot này là cảnh tĩnh/môi trường hoặc không có nhân vật chính xuất hiện.
          </div>
        )}
      </div>

      {/* 4. Scene Brief & Camera Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scene Brief Narrative (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Film className="w-4 h-4 text-indigo-600" />
              Bản Tóm Tắt Phân Cảnh (Structured Scene Brief)
            </h4>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              {pack?.scene_brief?.sceneTitle || `Cảnh #${shot.sceneNumber}`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">
                Ý đồ phân cảnh (Scene Intent)
              </span>
              <p className="text-slate-800 font-medium leading-relaxed">
                {pack?.scene_brief?.sceneIntent || 'Thiết lập không gian sân chơi nghệ thuật'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">
                Trạng thái cảm xúc (Emotion)
              </span>
              <p className="text-slate-800 font-medium">
                {pack?.scene_brief?.emotion || shot.emotion || 'Tự nhiên, ấm áp'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">
                Ý đồ âm thanh (Sound Intent)
              </span>
              <p className="text-slate-700 leading-relaxed flex items-start gap-1.5">
                <Music className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>{pack?.scene_brief?.soundIntent || 'Âm thanh nền tự nhiên sống động'}</span>
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">
                Ghi chú đặc biệt (Special Notes)
              </span>
              <p className="text-slate-700 leading-relaxed">
                {pack?.scene_brief?.specialNotes || 'Bảo toàn liên tục đạo cụ và trang phục'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">
                Diễn tiến hành động (Action)
              </span>
              <p className="text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                {pack?.scene_brief?.action || shot.action}
              </p>
            </div>
            {pack?.scene_brief?.dialogue && (
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">
                  Thoại (Dialogue)
                </span>
                <p className="text-indigo-900 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100 font-medium">
                  {pack.scene_brief.dialogue}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Camera Timeline (1 Col) */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                Chuyển Động Camera
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {shot.durationSeconds}s
              </span>
            </div>

            {pack?.camera_timeline && pack.camera_timeline.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Camera Timeline Beats:
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {pack.camera_timeline.map((beat, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-indigo-600 text-[11px]">
                          {beat.timeRange}
                        </span>
                        {beat.movement && (
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                            {beat.movement}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-800 text-[11px] leading-snug">{beat.description}</p>
                      {beat.focus && (
                        <span className="text-[10px] text-slate-500 block">
                          Trọng tâm: {beat.focus}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-600">
                <div><strong className="text-slate-800">Góc quay:</strong> {shot.cameraAngle || 'Eye-level 0°'}</div>
                <div><strong className="text-slate-800">Cỡ cảnh:</strong> {shot.shotType}</div>
                <div><strong className="text-slate-800">Khung hình:</strong> {shot.framing || 'Rule of Thirds'}</div>
                <div><strong className="text-slate-800">Chuyển động:</strong> {shot.cameraMovement || 'Static'}</div>
              </div>
            )}
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
            <Layers className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              <strong>Bảo toàn không gian:</strong> Camera timeline được chuẩn hóa vào hash bất biến để đảm bảo tái lập chính xác qua mọi tài khoản Google Flow.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
