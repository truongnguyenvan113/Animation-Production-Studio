import React, { useState, useEffect } from 'react';
import {
  Storyboard,
  StoryboardScene,
  Shot,
  Episode,
  Character,
  CharacterVersion,
  GlobalStyleVersion,
} from '../../types';
import { StoryboardService, PromptPreviewResult } from '../../services/storyboardService';
import { ImageGenerationService } from '../../services/imageGenerationService';
import { StorageService } from '../../services/storageService';
import { ShotCard } from './ShotCard';
import { ShotEditorModal } from './ShotEditorModal';
import { ShotPromptPreviewModal } from './ShotPromptPreviewModal';
import { ImmutabilityAuditModal } from './ImmutabilityAuditModal';
import { StoryboardRevisionHistoryModal } from './StoryboardRevisionHistoryModal';
import {
  Film,
  Plus,
  Lock,
  Layers,
  Sparkles,
  ShieldCheck,
  Download,
  Clock,
  Camera,
  RotateCcw,
  LayoutGrid,
  ListFilter,
  CheckCircle2,
  Tv,
  History,
} from 'lucide-react';

interface StoryboardViewProps {
  initialEpisodeId?: string;
  onNavigateToEpisode?: (episodeId: string) => void;
  onNavigateToImageGeneration?: (episodeId?: string) => void;
}

export const StoryboardView: React.FC<StoryboardViewProps> = ({
  initialEpisodeId,
  onNavigateToEpisode,
  onNavigateToImageGeneration,
}) => {
  const storyboardService = StoryboardService.getInstance();
  const imageGenService = ImageGenerationService.getInstance();
  const storage = StorageService.getInstance();

  const [db, setDb] = useState(() => storage.getDatabase());
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>(
    initialEpisodeId || 'ep_009'
  );
  const [activeSceneTab, setActiveSceneTab] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  // Modals state
  const [editingShot, setEditingShot] = useState<{
    shot: Shot;
    sceneId: string;
  } | null>(null);

  const [previewingShot, setPreviewingShot] = useState<{
    shot: Shot;
    promptData: PromptPreviewResult;
  } | null>(null);

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  // Sync DB on changes
  useEffect(() => {
    const refresh = () => setDb(storage.getDatabase());
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, [storage]);

  // Selected episode and storyboard
  const episode = db.episodes.find((e) => e.id === selectedEpisodeId) || db.episodes[0];
  const storyboard = episode
    ? db.storyboards.find((sb) => sb.episodeId === episode.id)
    : undefined;

  const currentScene = storyboard?.scenes.find(
    (s) => s.sceneNumber === activeSceneTab
  );

  const handleGenerateStoryboard = () => {
    if (!episode) return;
    try {
      storyboardService.generateStoryboardForEpisode(episode);
      setDb(storage.getDatabase());
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo storyboard');
    }
  };

  const handleRestoreRevision = (revisionId: string) => {
    if (!storyboard) return;
    try {
      storyboardService.restoreRevision(storyboard.id, revisionId);
      setDb(storage.getDatabase());
    } catch (err: any) {
      alert(err.message || 'Lỗi khi khôi phục revision');
    }
  };

  const handleGenerateShotImage = async (shot: Shot) => {
    if (!storyboard) return;
    try {
      const job = imageGenService.createJobFromShot(
        shot,
        selectedEpisodeId,
        storyboard.id,
        'mock-studio'
      );
      await imageGenService.runJob(job.id);
      setDb(storage.getDatabase());
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo ảnh cho shot');
    }
  };

  const episodeJobsCount = (db.imageGenerationJobs || []).filter(
    (j) => j.episodeId === selectedEpisodeId
  ).length;

  const handleSaveShot = (updatedShot: Shot) => {
    if (!storyboard || !editingShot) return;
    try {
      storyboardService.updateShot(
        storyboard.id,
        editingShot.sceneId,
        updatedShot.id,
        updatedShot
      );
      setEditingShot(null);
      setDb(storage.getDatabase());
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu shot');
    }
  };

  const handleAddShot = (sceneId: string) => {
    if (!storyboard) return;
    try {
      storyboardService.addShotToScene(storyboard.id, sceneId);
      setDb(storage.getDatabase());
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteShot = (sceneId: string, shot: Shot) => {
    if (!storyboard) return;
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa Shot #${shot.shotNumber} khỏi Scene? Phân cảnh phải duy trì tối thiểu 2 shots.`
      )
    ) {
      try {
        storyboardService.deleteShot(storyboard.id, sceneId, shot.id);
        setDb(storage.getDatabase());
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleOpenPromptPreview = (shot: Shot) => {
    const promptData = storyboardService.generatePromptPreview(shot);
    setPreviewingShot({ shot, promptData });
  };

  const handleExportJson = () => {
    if (!storyboard) return;
    const jsonStr = JSON.stringify(storyboard, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyboard_${storyboard.episodeId}_phase3.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="storyboard-phase3-view" className="space-y-6">
      {/* Top Bar: Episode Selector & High-level Status */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900">
                Phase 3: Storyboard & Shot Breakdown
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Production-Ready
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Phân rã 6 Phân cảnh Kịch bản thành các Shots chi tiết &bull; Bảo toàn Character DNA & Style Snapshot bất biến
            </p>
          </div>
        </div>

        {/* Episode selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Chọn Tập phim:
          </label>
          <select
            id="storyboard-episode-selector"
            value={selectedEpisodeId}
            onChange={(e) => setSelectedEpisodeId(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {db.episodes.map((ep) => (
              <option key={ep.id} value={ep.id}>
                {ep.episodeNumber ? `Tập ${ep.episodeNumber}: ` : ''}
                {ep.title} ({ep.scenes?.length || 0} cảnh)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Episode Context & Immutability Header */}
      {episode && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                  {episode.id}
                </span>
                <span className="text-xs text-slate-400">&bull;</span>
                <span className="text-xs font-semibold text-indigo-600">
                  Thời lượng dự kiến: {episode.targetDuration || episode.duration || '7 phút 30 giây'}
                </span>
                <span className="text-xs text-slate-400">&bull;</span>
                <span className="text-xs text-slate-500 flex items-center">
                  <Tv className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {episode.targetPlatform || 'YouTube Kids & TV'}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                {episode.title}
              </h3>
              {episode.storyDraft?.premise && (
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  <strong className="text-slate-800">Tiền đề:</strong> {episode.storyDraft.premise}
                </p>
              )}
            </div>

            {/* Actions for Storyboard */}
            <div className="flex flex-wrap items-center gap-2">
              {storyboard ? (
                <>
                  {onNavigateToImageGeneration && (
                    <button
                      id="btn-nav-image-pipeline"
                      type="button"
                      onClick={() => onNavigateToImageGeneration(selectedEpisodeId)}
                      className="inline-flex items-center text-xs font-bold px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-colors"
                      title="Xem Hàng Đợi Render Ảnh CGI Giai Đoạn 4"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Hàng Đợi Render Phase 4 ({episodeJobsCount})
                    </button>
                  )}

                  <button
                    id="btn-audit-immutability"
                    type="button"
                    onClick={() => setShowAuditModal(true)}
                    className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 shadow-sm transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Kiểm định DNA Snapshot (Audit)
                  </button>

                  <button
                    id="btn-view-revisions"
                    type="button"
                    onClick={() => setShowRevisionModal(true)}
                    className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 shadow-sm transition-colors"
                    title="Xem lịch sử các bản sửa đổi Storyboard"
                  >
                    <History className="w-4 h-4 mr-1.5 text-indigo-600" />
                    Lịch sử Revisions ({(storyboard.revisions || []).length})
                  </button>

                  <button
                    id="btn-export-storyboard-json"
                    type="button"
                    onClick={handleExportJson}
                    className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1.5 text-slate-500" />
                    Xuất JSON
                  </button>

                  <button
                    id="btn-regenerate-storyboard"
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          'Tạo lại Storyboard sẽ kích hoạt Regeneration Safety: lưu trữ bản hiện tại thành một Revision lịch sử, tăng số hiệu phiên bản, bảo toàn các shot và chỉnh sửa sản xuất đã có. Tiếp tục?'
                        )
                      ) {
                        handleGenerateStoryboard();
                      }
                    }}
                    className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="Tạo lại Storyboard với cơ chế Regeneration Safety (Lưu Revision an toàn)"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Tạo lại (Lưu Revision)
                  </button>
                </>
              ) : (
                <button
                  id="btn-create-storyboard"
                  type="button"
                  onClick={handleGenerateStoryboard}
                  className="inline-flex items-center text-xs font-bold px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Tạo Phân cảnh Storyboard từ 6 Cảnh Kịch bản
                </button>
              )}
            </div>
          </div>

          {/* Immutability & Production Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Phiên bản & Phân cảnh</span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="font-bold text-slate-900 text-base">
                  {storyboard?.scenes.length || episode.scenes?.length || 0} Cảnh
                </span>
                {storyboard && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Rev v{storyboard.revisionNumber || storyboard.episodeVersion || 1}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Tổng số Shots Sản xuất</span>
              <span className="font-bold text-indigo-700 text-base">
                {storyboard?.totalShots || 0} Shots
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Tổng Thời lượng Storyboard</span>
              <span className="font-bold text-slate-900 text-base flex items-center">
                <Clock className="w-4 h-4 mr-1 text-slate-400" />
                {storyboard
                  ? `${Math.floor(storyboard.totalDurationSeconds / 60)}m ${
                      storyboard.totalDurationSeconds % 60
                    }s`
                  : '--'}
              </span>
            </div>

            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80">
              <span className="text-emerald-800 block text-[11px] font-semibold flex items-center">
                <Lock className="w-3 h-3 mr-1 text-emerald-600" />
                Character DNA Snapshots
              </span>
              <span className="font-mono text-emerald-950 text-xs font-bold truncate block mt-0.5">
                {Object.keys(
                  storyboard?.characterVersionSnapshots ||
                    episode.characterVersionSnapshots ||
                    {}
                ).length}{' '}
                Nhân vật Khóa Bất biến
              </span>
            </div>
          </div>

          {/* Locked snapshots pill list */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-semibold flex items-center">
              <Lock className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Snapshots đã đóng băng:
            </span>
            <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-mono text-[11px]">
              Style: {storyboard?.styleVersionSnapshotId || episode.styleVersionSnapshotId || 'style_ver_1_0'}
            </span>
            {Object.entries(
              storyboard?.characterVersionSnapshots ||
                episode.characterVersionSnapshots ||
                {}
            ).map(([charId, verId]) => {
              const c = db.characters.find((char) => char.id === charId);
              return (
                <span
                  key={charId}
                  className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono text-[11px] flex items-center"
                >
                  <span className="font-sans font-semibold mr-1">
                    {c?.displayName || charId}:
                  </span>
                  {verId}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Storyboard Scenes and Shots Content */}
      {storyboard ? (
        <div className="space-y-6">
          {/* Navigation Bar for 6 Scenes */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Điều hướng 6 Phân cảnh (Scene Breakdown)
                </span>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('single')}
                  className={`inline-flex items-center px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    viewMode === 'single'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5 mr-1" />
                  Từng Scene ({activeSceneTab}/6)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  className={`inline-flex items-center px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    viewMode === 'all'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 mr-1" />
                  Toàn bộ 6 Cảnh ({storyboard.totalShots} shots)
                </button>
              </div>
            </div>

            {/* 6 Scene Tab Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {storyboard.scenes.map((scene) => {
                const isActive = activeSceneTab === scene.sceneNumber;
                return (
                  <button
                    key={scene.id}
                    id={`scene-tab-${scene.sceneNumber}`}
                    type="button"
                    onClick={() => {
                      setActiveSceneTab(scene.sceneNumber);
                      setViewMode('single');
                    }}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isActive && viewMode === 'single'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold font-mono">
                        Cảnh #{scene.sceneNumber}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200">
                        {scene.shots.length} shots
                      </span>
                    </div>
                    <div className="text-xs font-semibold truncate">
                      {scene.title || `Scene ${scene.sceneNumber}`}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {scene.location}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Render Scenes and Shots */}
          {viewMode === 'single' && currentScene ? (
            <div className="space-y-4">
              {/* Scene Detail Header */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2 text-xs mb-1">
                      <span className="font-bold font-mono px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                        Phân cảnh {currentScene.sceneNumber} / 6
                      </span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="font-semibold text-slate-700">
                        Bối cảnh: {currentScene.location}
                      </span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-slate-500">
                        Thời gian: {currentScene.timeOfDay}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900">
                      {currentScene.title || `Phân cảnh ${currentScene.sceneNumber}`}
                    </h4>
                  </div>

                  {/* Add Shot Button and Duration Synchronization Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    {(() => {
                      const sourceScene = episode?.scenes?.find(
                        (s) => s.id === currentScene.episodeSceneId || s.sceneNumber === currentScene.sceneNumber
                      );
                      const targetDuration = sourceScene?.estimatedDurationSeconds;
                      const currentSum = currentScene.shots.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
                      const isDurationSynced = targetDuration ? currentSum === targetDuration : true;

                      return (
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg border font-mono font-bold flex items-center ${
                              isDurationSynced
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                            title={`Tổng thời lượng các shot: ${currentSum}s / Kịch bản: ${targetDuration || '--'}s`}
                          >
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {currentSum}s {targetDuration ? `/ ${targetDuration}s` : ''}
                            {isDurationSynced && (
                              <CheckCircle2 className="w-3.5 h-3.5 ml-1 text-emerald-600" />
                            )}
                          </span>
                          <span className="text-xs text-slate-500">
                            {currentScene.shots.length} / 8 shots
                          </span>
                        </div>
                      );
                    })()}
                    <button
                      id={`btn-add-shot-scene-${currentScene.sceneNumber}`}
                      type="button"
                      onClick={() => handleAddShot(currentScene.id)}
                      disabled={currentScene.shots.length >= 8}
                      className={`inline-flex items-center text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-xs ${
                        currentScene.shots.length >= 8
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                      title={
                        currentScene.shots.length >= 8
                          ? 'Đã đạt giới hạn tối đa 8 shot cho phân cảnh này'
                          : 'Thêm shot mới'
                      }
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Thêm Shot vào Scene {currentScene.sceneNumber}
                    </button>
                  </div>
                </div>

                {currentScene.lighting && (
                  <p className="text-xs text-slate-500 italic">
                    <strong>Ánh sáng & Nhiệt độ màu:</strong> {currentScene.lighting}
                  </p>
                )}
              </div>

              {/* Shots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentScene.shots.map((shot) => (
                  <ShotCard
                    key={shot.id}
                    shot={shot}
                    characters={db.characters}
                    characterVersions={db.characterVersions}
                    onOpenPromptPreview={handleOpenPromptPreview}
                    onEditShot={(s) => setEditingShot({ shot: s, sceneId: currentScene.id })}
                    onDeleteShot={(s) => handleDeleteShot(currentScene.id, s)}
                    onGenerateImage={handleGenerateShotImage}
                    onViewImageOutput={() => {
                      if (onNavigateToImageGeneration) {
                        onNavigateToImageGeneration(selectedEpisodeId);
                      }
                    }}
                    canDelete={currentScene.shots.length > 2}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* ALL SCENES CONTINUOUS VIEW */
            <div className="space-y-8">
              {storyboard.scenes.map((scene) => (
                <div key={scene.id} className="space-y-4">
                  {/* Scene bar */}
                  <div className="bg-slate-100/90 border border-slate-200 px-5 py-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-sm text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Cảnh #{scene.sceneNumber}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {scene.title || `Phân cảnh ${scene.sceneNumber}`}
                      </h4>
                      <span className="text-xs text-slate-500">
                        &bull; {scene.location} ({scene.timeOfDay})
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {(() => {
                        const sourceScene = episode?.scenes?.find(
                          (s) => s.id === scene.episodeSceneId || s.sceneNumber === scene.sceneNumber
                        );
                        const targetDuration = sourceScene?.estimatedDurationSeconds;
                        const currentSum = scene.shots.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
                        const isDurationSynced = targetDuration ? currentSum === targetDuration : true;

                        return (
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex items-center ${
                              isDurationSynced
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                            title={`Tổng thời lượng các shot: ${currentSum}s / Kịch bản: ${targetDuration || '--'}s`}
                          >
                            <Clock className="w-3 h-3 mr-1 text-slate-400" />
                            {scene.shots.length} shots &bull; {currentSum}s
                            {targetDuration ? ` / ${targetDuration}s` : ''}
                            {isDurationSynced && (
                              <CheckCircle2 className="w-3 h-3 ml-1 text-emerald-600" />
                            )}
                          </span>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={() => handleAddShot(scene.id)}
                        disabled={scene.shots.length >= 8}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        + Shot
                      </button>
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {scene.shots.map((shot) => (
                      <ShotCard
                        key={shot.id}
                        shot={shot}
                        characters={db.characters}
                        characterVersions={db.characterVersions}
                        onOpenPromptPreview={handleOpenPromptPreview}
                        onEditShot={(s) => setEditingShot({ shot: s, sceneId: scene.id })}
                        onDeleteShot={(s) => handleDeleteShot(scene.id, s)}
                        onGenerateImage={handleGenerateShotImage}
                        onViewImageOutput={() => {
                          if (onNavigateToImageGeneration) {
                            onNavigateToImageGeneration(selectedEpisodeId);
                          }
                        }}
                        canDelete={scene.shots.length > 2}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Empty State: Prompt to generate Storyboard */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Film className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-slate-900">
              Chưa có Storyboard cho {episode?.title || 'tập phim này'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Phân rã tự động 6 phân cảnh kịch bản Phase 2 thành 18–30 shots chi tiết theo quy chuẩn điện ảnh, đồng thời kế thừa Character DNA Snapshot bất biến.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateStoryboard}
            className="inline-flex items-center text-xs font-bold px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Tạo Storyboard & Shot Breakdown ngay
          </button>
        </div>
      )}

      {/* MODALS */}

      {/* 1. Shot Editor Modal */}
      {editingShot && (
        <ShotEditorModal
          shot={editingShot.shot}
          characters={db.characters}
          characterVersions={db.characterVersions}
          onSave={handleSaveShot}
          onClose={() => setEditingShot(null)}
        />
      )}

      {/* 2. Prompt Preview Modal */}
      {previewingShot && (
        <ShotPromptPreviewModal
          shot={previewingShot.shot}
          promptData={previewingShot.promptData}
          characters={db.characters}
          characterVersions={db.characterVersions}
          styleVersions={db.globalStyleVersions}
          onClose={() => setPreviewingShot(null)}
        />
      )}

      {/* 3. Immutability Audit Modal */}
      {showAuditModal && storyboard && (
        <ImmutabilityAuditModal
          storyboardId={storyboard.id}
          onClose={() => setShowAuditModal(false)}
        />
      )}

      {/* 4. Storyboard Revision History Modal */}
      {showRevisionModal && storyboard && (
        <StoryboardRevisionHistoryModal
          isOpen={showRevisionModal}
          onClose={() => setShowRevisionModal(false)}
          storyboard={storyboard}
          onRestoreRevision={handleRestoreRevision}
        />
      )}
    </div>
  );
};
