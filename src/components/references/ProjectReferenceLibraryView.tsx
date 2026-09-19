/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  ProjectReference,
  ProjectReferenceType,
  ProjectReferenceSource,
  LanguageMode,
  Character,
  CharacterVersion,
  Shot,
} from '../../types';
import { StorageService } from '../../services/storageService';
import {
  ProjectReferenceService,
  createReferenceSvg,
} from '../../services/projectReferenceService';
import {
  FolderArchive,
  Image as ImageIcon,
  Video,
  Film,
  Sparkles,
  Upload,
  Plus,
  Search,
  Filter,
  Star,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Tag,
  Clock,
  Layers,
  Info,
  X,
  Play,
  Copy,
  RefreshCw,
  Eye,
  Camera,
  User,
  Sliders,
  Maximize2,
  Grid,
  List,
} from 'lucide-react';

interface ProjectReferenceLibraryViewProps {
  language?: LanguageMode;
  onNavigate?: (view: string) => void;
  onCreateJobWithRef?: (refId: string) => void;
}

export const ProjectReferenceLibraryView: React.FC<ProjectReferenceLibraryViewProps> = ({
  language = 'bilingual',
  onNavigate,
  onCreateJobWithRef,
}) => {
  const isVi = language === 'vi';
  const storage = StorageService.getInstance();
  const [db, setDb] = useState(() => storage.getDatabase());

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ProjectReferenceType | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<ProjectReferenceSource | 'all'>('all');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportKeyframeModalOpen, setIsImportKeyframeModalOpen] = useState(false);
  const [detailRef, setDetailRef] = useState<ProjectReference | null>(null);
  const [editingRef, setEditingRef] = useState<ProjectReference | null>(null);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync db state helper
  const refreshDb = () => {
    setDb({ ...storage.getDatabase() });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const projectReferences = useMemo(() => {
    return db.projectReferences || [];
  }, [db.projectReferences]);

  // Statistics
  const stats = useMemo(() => {
    const total = projectReferences.length;
    const images = projectReferences.filter((r) => r.type === 'image' || r.type === 'location' || r.type === 'prop').length;
    const videos = projectReferences.filter((r) => r.type === 'video').length;
    const characterRefs = projectReferences.filter((r) => r.type === 'character' || r.characterId).length;
    const styleRefs = projectReferences.filter((r) => r.type === 'style').length;
    const generated = projectReferences.filter((r) => r.source === 'generated_image' || r.source === 'generated_video').length;
    const favorites = projectReferences.filter((r) => r.isFavorite).length;

    return { total, images, videos, characterRefs, styleRefs, generated, favorites };
  }, [projectReferences]);

  // Unique Tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    projectReferences.forEach((r) => r.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [projectReferences]);

  // Filtered References
  const filteredReferences = useMemo(() => {
    return ProjectReferenceService.searchReferences({
      query: searchQuery,
      type: selectedType,
      source: selectedSource,
      characterId: selectedCharacterId,
      tag: selectedTag || undefined,
      favoritesOnly,
    });
  }, [projectReferences, searchQuery, selectedType, selectedSource, selectedCharacterId, selectedTag, favoritesOnly]);

  // Favorite toggle
  const handleToggleFavorite = (ref: ProjectReference, e: React.MouseEvent) => {
    e.stopPropagation();
    ProjectReferenceService.updateReference(ref.id, { isFavorite: !ref.isFavorite });
    refreshDb();
    showToast(
      ref.isFavorite
        ? (isVi ? 'Đã bỏ ghim khỏi yêu thích' : 'Removed from favorites')
        : (isVi ? 'Đã ghim vào mục yêu thích' : 'Added to favorites')
    );
  };

  // Delete reference
  const handleDeleteReference = (ref: ProjectReference, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmText = isVi
      ? `Bạn có chắc muốn xóa tham chiếu "${ref.name}"?\n(Lưu ý: Các Job kết xuất đã tạo trước đây vẫn giữ nguyên bản sao snapshot bất biến không đổi)`
      : `Delete reference "${ref.name}"?\n(Existing render jobs retain their immutable snapshot and will NOT be affected)`;

    if (window.confirm(confirmText)) {
      ProjectReferenceService.deleteReference(ref.id);
      refreshDb();
      if (detailRef?.id === ref.id) setDetailRef(null);
      showToast(isVi ? `Đã xóa tham chiếu ${ref.id}` : `Deleted reference ${ref.id}`);
    }
  };

  // Run integrity audit
  const handleRunAudit = () => {
    const res = ProjectReferenceService.auditIntegrity();
    refreshDb();
    const msg = isVi
      ? `Kiểm định thành công: Tổng cộng ${res.total} tham chiếu. Loại bỏ ${res.duplicatesRemoved} trùng lặp, làm sạch ${res.orphansCleaned} liên kết mồ côi.`
      : `Integrity Audit Passed: ${res.total} total references. Cleaned ${res.duplicatesRemoved} duplicates and ${res.orphansCleaned} orphan links.`;
    setAuditMessage(msg);
    setTimeout(() => setAuditMessage(null), 6000);
  };

  // Sync character references
  const handleSyncCharacterRefs = () => {
    const count = ProjectReferenceService.syncCharacterReferencesToProjectLibrary();
    refreshDb();
    showToast(
      isVi
        ? `Đã đồng bộ ${count} tài nguyên Character Reference vào thư viện dùng chung.`
        : `Synchronized ${count} character references into project library.`
    );
  };

  // Copy ID to clipboard
  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    showToast(isVi ? `Đã sao chép ID: ${id}` : `Copied ID: ${id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-500/40 flex items-center space-x-2 text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PHASE 4.4
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                IMMUTABLE SNAPSHOT CONTRACT
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <FolderArchive className="w-6 h-6 text-amber-400" />
              {isVi ? 'Thư Viện Tham Chiếu Dự Án' : 'Project Reference Library'}
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              {isVi
                ? 'Kho lưu trữ tài nguyên tham chiếu dùng chung toàn dự án (Ảnh tải lên, Video tải lên, Keyframe kết xuất được duyệt, Model Sheets nhân vật & Style Guides). Đảm bảo tính bất biến: chỉnh sửa hoặc xóa tham chiếu không bao giờ làm biến đổi các Job đã khởi tạo.'
                : 'Project-wide shared repository for visual references (Uploaded Images, Videos, Approved Keyframes, Character Turnarounds, and Style Guides). Immutability contract ensures editing or deleting references never modifies existing generation jobs.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              {isVi ? 'Thêm Tham Chiếu Mới' : 'Add Reference'}
            </button>

            <button
              onClick={() => setIsImportKeyframeModalOpen(true)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-emerald-400" />
              {isVi ? 'Nhập Từ Keyframe Đã Duyệt' : 'Import Keyframe'}
            </button>

            <button
              onClick={handleSyncCharacterRefs}
              className="inline-flex items-center px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs transition-all"
              title={isVi ? 'Đồng bộ từ bảng Character References' : 'Sync from Character References'}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1 text-indigo-400" />
              {isVi ? 'Đồng Bộ Turnarounds' : 'Sync Character Sheets'}
            </button>

            <button
              onClick={handleRunAudit}
              className="inline-flex items-center px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs transition-all"
              title={isVi ? 'Kiểm tra toàn vẹn & chống trùng lặp' : 'Check integrity and clean duplicates'}
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              {isVi ? 'Kiểm Định' : 'Audit'}
            </button>
          </div>
        </div>

        {/* Audit Notification Banner */}
        {auditMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{auditMessage}</span>
            </div>
            <button onClick={() => setAuditMessage(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">
            {isVi ? 'Tổng tài nguyên' : 'Total References'}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-white">{stats.total}</span>
            <span className="text-[10px] text-slate-500">assets</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block flex items-center gap-1">
            <ImageIcon className="w-3 h-3 text-blue-400" />
            {isVi ? 'Hình ảnh' : 'Images & Concepts'}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-blue-400">{stats.images}</span>
            <span className="text-[10px] text-slate-500">photos/art</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block flex items-center gap-1">
            <Video className="w-3 h-3 text-purple-400" />
            {isVi ? 'Video tham chiếu' : 'Video References'}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-purple-400">{stats.videos}</span>
            <span className="text-[10px] text-slate-500">clips</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block flex items-center gap-1">
            <User className="w-3 h-3 text-amber-400" />
            {isVi ? 'Gắn nhân vật' : 'Character Linked'}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-amber-400">{stats.characterRefs}</span>
            <span className="text-[10px] text-slate-500">DNA locked</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            {isVi ? 'Tạo từ AI / Render' : 'Generated Assets'}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-emerald-400">{stats.generated}</span>
            <span className="text-[10px] text-slate-500">keyframes</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            {isVi ? 'Yêu thích' : 'Favorites'}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-yellow-400">{stats.favorites}</span>
            <span className="text-[10px] text-slate-500">pinned</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isVi
                  ? 'Tìm kiếm theo tên, tag, nhân vật, episode, shot...'
                  : 'Search by name, tag, character, shot, or ID...'
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Character Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-slate-400 text-xs whitespace-nowrap font-medium">
              {isVi ? 'Nhân vật:' : 'Character:'}
            </label>
            <select
              value={selectedCharacterId}
              onChange={(e) => setSelectedCharacterId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="all">{isVi ? 'Tất cả nhân vật' : 'All Characters'}</option>
              {db.characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName} ({c.id})
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-slate-400 text-xs whitespace-nowrap font-medium">
              {isVi ? 'Nguồn:' : 'Source:'}
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="all">{isVi ? 'Tất cả nguồn' : 'All Sources'}</option>
              <option value="uploaded_image">{isVi ? 'Ảnh đã tải lên' : 'Uploaded Images'}</option>
              <option value="uploaded_video">{isVi ? 'Video đã tải lên' : 'Uploaded Videos'}</option>
              <option value="generated_image">{isVi ? 'Keyframe đã duyệt (AI)' : 'Approved Keyframes'}</option>
              <option value="generated_video">{isVi ? 'Video kết xuất (AI)' : 'Generated Videos'}</option>
              <option value="character_sheet">{isVi ? 'Bản vẽ nhân vật (Model Sheet)' : 'Character Sheets'}</option>
              <option value="style_guide">{isVi ? 'Hướng dẫn phong cách' : 'Style Guides'}</option>
            </select>
          </div>

          {/* Favorites toggle & view mode */}
          <div className="flex items-center space-x-1 border-l border-slate-800 pl-2">
            <button
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`p-2 rounded-lg border transition-colors ${
                favoritesOnly
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title={isVi ? 'Chỉ hiện mục yêu thích' : 'Favorites only'}
            >
              <Star className={`w-4 h-4 ${favoritesOnly ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-amber-400 border-slate-700'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-800 text-amber-400 border-slate-700'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Media Type Tabs & Tag Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: isVi ? 'Tất cả' : 'All', icon: Layers },
              { id: 'image', label: isVi ? 'Ảnh' : 'Images', icon: ImageIcon },
              { id: 'video', label: isVi ? 'Video' : 'Videos', icon: Video },
              { id: 'character', label: isVi ? 'Nhân vật' : 'Characters', icon: User },
              { id: 'style', label: isVi ? 'Phong cách' : 'Styles', icon: Sparkles },
              { id: 'location', label: isVi ? 'Bối cảnh' : 'Locations', icon: Camera },
              { id: 'prop', label: isVi ? 'Đạo cụ' : 'Props', icon: Tag },
            ].map((t) => {
              const IconComp = t.icon;
              const isSelected = selectedType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id as any)}
                  className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 mr-1" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Quick Tag Pills */}
          {allTags.length > 0 && (
            <div className="flex items-center space-x-1 overflow-x-auto max-w-full pb-1">
              <span className="text-[11px] text-slate-500 font-semibold mr-1">Tags:</span>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-semibold"
                >
                  {selectedTag} <X className="w-2.5 h-2.5" />
                </button>
              )}
              {allTags.slice(0, 7).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2 py-0.5 rounded-full text-[10px] transition-colors ${
                    selectedTag === tag
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reference Cards Display */}
      {filteredReferences.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredReferences.map((ref) => {
              const char = ref.characterId ? db.characters.find((c) => c.id === ref.characterId) : null;

              return (
                <div
                  key={ref.id}
                  onClick={() => setDetailRef(ref)}
                  className="group bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col"
                >
                  {/* Media Thumbnail Stage */}
                  <div className="relative aspect-video bg-slate-950 overflow-hidden flex items-center justify-center">
                    {ref.uri ? (
                      <img
                        src={ref.uri}
                        alt={ref.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-slate-600 flex flex-col items-center">
                        {ref.type === 'video' ? (
                          <Video className="w-8 h-8 mb-1" />
                        ) : (
                          <ImageIcon className="w-8 h-8 mb-1" />
                        )}
                        <span className="text-[10px] font-mono">No Preview</span>
                      </div>
                    )}

                    {/* Top Overlay Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold font-mono uppercase bg-slate-950/80 text-amber-300 border border-slate-700/80 backdrop-blur-xs">
                        {ref.type}
                      </span>
                      {ref.durationSeconds && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono bg-purple-950/80 text-purple-300 border border-purple-700/80 backdrop-blur-xs">
                          {ref.durationSeconds}s
                        </span>
                      )}
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => handleToggleFavorite(ref, e)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-900 text-slate-400 hover:text-yellow-400 transition-colors backdrop-blur-xs"
                      title={ref.isFavorite ? 'Bỏ ghim' : 'Ghim yêu thích'}
                    >
                      <Star className={`w-3.5 h-3.5 ${ref.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </button>

                    {/* Video Play Overlay */}
                    {ref.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 group-hover:bg-slate-950/10 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Exact Character Version Guarantee Badge */}
                    {ref.characterId && (
                      <div className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold backdrop-blur-xs flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {char?.displayName || ref.characterId.replace('char_', '')}: {ref.characterVersionId || 'v1.0'}
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-amber-400 transition-colors">
                          {ref.name}
                        </h3>
                      </div>
                      {ref.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {ref.description}
                        </p>
                      )}
                    </div>

                    {/* Tags */}
                    {ref.tags && ref.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ref.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded text-[9px] bg-slate-950 text-slate-400 border border-slate-800"
                          >
                            #{t}
                          </span>
                        ))}
                        {ref.tags.length > 3 && (
                          <span className="text-[9px] text-slate-500 self-center">
                            +{ref.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer Actions & Metadata */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="truncate max-w-[120px] font-mono" title={ref.id}>
                        {ref.id}
                      </span>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => handleCopyId(ref.id, e)}
                          className="p-1 hover:text-slate-300 rounded hover:bg-slate-800"
                          title="Copy ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRef(ref);
                          }}
                          className="p-1 hover:text-amber-400 rounded hover:bg-slate-800"
                          title="Sửa thông tin"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteReference(ref, e)}
                          className="p-1 hover:text-rose-400 rounded hover:bg-slate-800"
                          title="Xóa tham chiếu"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
            {filteredReferences.map((ref) => {
              const char = ref.characterId ? db.characters.find((c) => c.id === ref.characterId) : null;

              return (
                <div
                  key={ref.id}
                  onClick={() => setDetailRef(ref)}
                  className="p-4 hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                    {/* Thumbnail */}
                    <div className="w-16 h-12 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-800 relative">
                      {ref.uri ? (
                        <img
                          src={ref.uri}
                          alt={ref.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      {ref.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                          <Play className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </div>
                      )}
                    </div>

                    {/* Main details */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-200 truncate">
                          {ref.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-slate-800 text-amber-300">
                          {ref.type}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-950 text-slate-400">
                          {ref.source.replace('_', ' ')}
                        </span>
                        {ref.characterId && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                            {char?.displayName || ref.characterId}: {ref.characterVersionId || 'v1.0'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-xl">
                        {ref.description || ref.storagePath}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={(e) => handleToggleFavorite(ref, e)}
                      className="p-1.5 text-slate-400 hover:text-yellow-400 rounded-lg hover:bg-slate-800"
                    >
                      <Star className={`w-4 h-4 ${ref.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingRef(ref);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteReference(ref, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <FolderArchive className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">
            {isVi ? 'Không tìm thấy tham chiếu nào' : 'No references match your filter'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {isVi
              ? 'Thử thay đổi bộ lọc hoặc tải lên tài nguyên tham chiếu mới cho dự án của bạn.'
              : 'Try clearing search filters or add a new reference asset to the project library.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('all');
              setSelectedSource('all');
              setSelectedCharacterId('all');
              setSelectedTag(null);
              setFavoritesOnly(false);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            {isVi ? 'Xóa bộ lọc' : 'Clear Filters'}
          </button>
        </div>
      )}

      {/* Modal: Detail View */}
      {detailRef && (
        <DetailReferenceModal
          reference={detailRef}
          isVi={isVi}
          characters={db.characters}
          onClose={() => setDetailRef(null)}
          onEdit={() => {
            setEditingRef(detailRef);
            setDetailRef(null);
          }}
          onDelete={() => handleDeleteReference(detailRef)}
        />
      )}

      {/* Modal: Add New Reference */}
      {isAddModalOpen && (
        <AddReferenceModal
          isVi={isVi}
          characters={db.characters}
          characterVersions={db.characterVersions}
          onClose={() => setIsAddModalOpen(false)}
          onCreated={(newRef) => {
            refreshDb();
            setIsAddModalOpen(false);
            showToast(isVi ? `Đã thêm tham chiếu mới: ${newRef.name}` : `Added reference: ${newRef.name}`);
          }}
        />
      )}

      {/* Modal: Import from Approved Keyframes */}
      {isImportKeyframeModalOpen && (
        <ImportKeyframeModal
          isVi={isVi}
          storyboards={db.storyboards}
          onClose={() => setIsImportKeyframeModalOpen(false)}
          onImported={(newRef) => {
            refreshDb();
            setIsImportKeyframeModalOpen(false);
            showToast(isVi ? `Đã nhập keyframe vào thư viện: ${newRef.name}` : `Imported keyframe: ${newRef.name}`);
          }}
        />
      )}

      {/* Modal: Edit Reference */}
      {editingRef && (
        <EditReferenceModal
          reference={editingRef}
          isVi={isVi}
          characters={db.characters}
          onClose={() => setEditingRef(null)}
          onSaved={(updated) => {
            refreshDb();
            setEditingRef(null);
            showToast(isVi ? `Đã cập nhật: ${updated.name}` : `Updated: ${updated.name}`);
          }}
        />
      )}
    </div>
  );
};

// ==========================================
// SUB-MODAL COMPONENTS
// ==========================================

interface DetailModalProps {
  reference: ProjectReference;
  isVi: boolean;
  characters: Character[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const DetailReferenceModal: React.FC<DetailModalProps> = ({
  reference,
  isVi,
  characters,
  onClose,
  onEdit,
  onDelete,
}) => {
  const char = reference.characterId
    ? characters.find((c) => c.id === reference.characterId)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {reference.type}
            </span>
            <h3 className="text-base font-bold text-white truncate max-w-md">
              {reference.name}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs custom-scrollbar">
          {/* Large Media Stage */}
          <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
            {reference.uri ? (
              reference.type === 'video' && reference.uri.endsWith('.mp4') ? (
                <video src={reference.uri} controls className="w-full h-full object-contain" />
              ) : (
                <img
                  src={reference.uri}
                  alt={reference.name}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              )
            ) : (
              <div className="text-slate-500 text-center space-y-1">
                <ImageIcon className="w-8 h-8 mx-auto" />
                <p>No preview media available</p>
              </div>
            )}
          </div>

          {/* Golden Rule Notice */}
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {isVi
                  ? 'Bản ghi tham chiếu này được đóng băng bất biến trong các Job Snapshot đã tạo.'
                  : 'This reference is frozen into immutable job snapshots upon creation.'}
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-emerald-400">100% IMMUTABLE</span>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block">ID:</span>
              <span className="text-slate-200 select-all">{reference.id}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Canonical Storage Path:</span>
              <span className="text-slate-200 select-all truncate block" title={reference.storagePath}>
                {reference.storagePath}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block">Source:</span>
              <span className="text-amber-400">{reference.source}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Character DNA Link:</span>
              {reference.characterId ? (
                <span className="text-emerald-400">
                  {char?.displayName || reference.characterId} (Locked Version: {reference.characterVersionId || 'v1.0'})
                </span>
              ) : (
                <span className="text-slate-500">None (General Project Reference)</span>
              )}
            </div>

            {reference.episodeId && (
              <div>
                <span className="text-slate-500 block">Provenance:</span>
                <span className="text-slate-300">
                  Episode: {reference.episodeId} {reference.shotId ? `• Shot: ${reference.shotId}` : ''}
                </span>
              </div>
            )}

            {reference.durationSeconds && (
              <div>
                <span className="text-slate-500 block">Duration:</span>
                <span className="text-purple-400">{reference.durationSeconds}s</span>
              </div>
            )}

            <div>
              <span className="text-slate-500 block">Created At:</span>
              <span className="text-slate-400">{new Date(reference.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Description */}
          {reference.description && (
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block">
                {isVi ? 'Mô tả chi tiết:' : 'Description:'}
              </span>
              <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                {reference.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {reference.tags && reference.tags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-slate-400 font-bold block">Tags:</span>
              <div className="flex flex-wrap gap-1.5">
                {reference.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onDelete}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold transition-colors"
          >
            {isVi ? 'Xóa Tham Chiếu' : 'Delete Reference'}
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
            >
              {isVi ? 'Chỉnh Sửa' : 'Edit'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
            >
              {isVi ? 'Đóng' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ADD REFERENCE MODAL
// ==========================================

interface AddModalProps {
  isVi: boolean;
  characters: Character[];
  characterVersions: CharacterVersion[];
  onClose: () => void;
  onCreated: (newRef: ProjectReference) => void;
}

const AddReferenceModal: React.FC<AddModalProps> = ({
  isVi,
  characters,
  characterVersions,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ProjectReferenceType>('image');
  const [source, setSource] = useState<ProjectReferenceSource>('uploaded_image');
  const [characterId, setCharacterId] = useState<string>('');
  const [characterVersionId, setCharacterVersionId] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('Style, Reference');
  const [durationSeconds, setDurationSeconds] = useState<number>(3);
  const [imageUri, setImageUri] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available versions for selected character
  const availableVersions = useMemo(() => {
    if (!characterId) return [];
    return characterVersions.filter((v) => v.characterId === characterId);
  }, [characterId, characterVersions]);

  // Set default version when character selected
  const handleCharacterChange = (newCharId: string) => {
    setCharacterId(newCharId);
    if (!newCharId) {
      setCharacterVersionId('');
      return;
    }
    const vers = characterVersions.filter((v) => v.characterId === newCharId);
    if (vers.length > 0) {
      setCharacterVersionId(vers[0].id);
    }
  };

  // Handle file select (local upload simulation to DataURL)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!name) {
      setName(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageUri(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Pre-generate rich SVG if no file uploaded
  const handleGenerateSampleArt = () => {
    const sample = createReferenceSvg({
      title: name || 'Visual Concept Asset',
      type,
      source,
      badge: type.toUpperCase(),
      accentColor: type === 'video' ? '#8b5cf6' : type === 'character' ? '#ec4899' : '#f59e0b',
      secondaryColor: '#3b82f6',
      iconType: type === 'video' ? 'video' : type === 'character' ? 'character' : 'style',
      meta: 'User Created Reference',
    });
    setImageUri(sample);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(isVi ? 'Vui lòng nhập tên tham chiếu!' : 'Please enter reference name!');
      return;
    }

    const finalUri = imageUri || createReferenceSvg({
      title: name,
      type,
      source,
      badge: type.toUpperCase(),
      accentColor: '#f59e0b',
      secondaryColor: '#6366f1',
      iconType: type === 'video' ? 'video' : 'style',
    });

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newRef = ProjectReferenceService.createReference({
      name: name.trim(),
      description: description.trim(),
      type,
      source,
      uri: finalUri,
      storagePath: `references/${type}s/pref_${Date.now()}.${type === 'video' ? 'mp4' : 'png'}`,
      thumbnail: finalUri,
      characterId: characterId || undefined,
      characterVersionId: (characterId && characterVersionId) ? characterVersionId : undefined,
      tags: parsedTags,
      durationSeconds: type === 'video' ? durationSeconds : undefined,
      aspectRatio: '16:9',
      width: 1920,
      height: 1080,
      isFavorite: false,
    });

    onCreated(newRef);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {isVi ? 'Thêm Tài Nguyên Tham Chiếu Mới' : 'Add New Project Reference'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs custom-scrollbar">
          {/* Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {isVi ? 'Tên tham chiếu (*):' : 'Reference Name (*):'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hanoi Autumn Street Lighting"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {isVi ? 'Loại tài nguyên (Type):' : 'Media Type:'}
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value as ProjectReferenceType;
                  setType(newType);
                  if (newType === 'video') setSource('uploaded_video');
                  else if (newType === 'character') setSource('character_sheet');
                  else if (newType === 'style') setSource('style_guide');
                  else setSource('uploaded_image');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="image">{isVi ? 'Hình ảnh (Image)' : 'Image'}</option>
                <option value="video">{isVi ? 'Video tham chiếu (Video)' : 'Video'}</option>
                <option value="character">{isVi ? 'Nhân vật (Character Turnaround)' : 'Character'}</option>
                <option value="style">{isVi ? 'Phong cách (Style Guide)' : 'Style Guide'}</option>
                <option value="location">{isVi ? 'Bối cảnh (Location Concept)' : 'Location'}</option>
                <option value="prop">{isVi ? 'Đạo cụ (Prop)' : 'Prop'}</option>
              </select>
            </div>
          </div>

          {/* Source & Video Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                {isVi ? 'Nguồn tài nguyên (Source):' : 'Reference Source:'}
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="uploaded_image">Uploaded Image (Tải lên từ máy)</option>
                <option value="uploaded_video">Uploaded Video (Video tham chiếu)</option>
                <option value="generated_image">Generated Image / Keyframe</option>
                <option value="generated_video">Generated Video</option>
                <option value="character_sheet">Character Turnaround Sheet</option>
                <option value="style_guide">Global Style Guide</option>
              </select>
            </div>

            {type === 'video' && (
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  {isVi ? 'Thời lượng video (giây):' : 'Video Duration (seconds):'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* Character DNA Link */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-slate-300 block">
              {isVi ? 'Liên kết Nhân vật & Phiên bản (Character DNA Link):' : 'Character DNA Link:'}
            </span>
            <p className="text-[11px] text-slate-500">
              {isVi
                ? 'Nếu đây là tham chiếu nhân vật, chọn chính xác phiên bản (Version) để đảm bảo tính bất biến của Character DNA.'
                : 'If linking to a character, select the exact locked version to enforce character DNA immutability.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  {isVi ? 'Nhân vật:' : 'Character:'}
                </label>
                <select
                  value={characterId}
                  onChange={(e) => handleCharacterChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                >
                  <option value="">{isVi ? '-- Không liên kết nhân vật --' : '-- No character link --'}</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              {characterId && (
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    {isVi ? 'Phiên bản khóa (Version):' : 'Locked Version:'}
                  </label>
                  <select
                    value={characterVersionId}
                    onChange={(e) => setCharacterVersionId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                  >
                    {availableVersions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.version} ({v.id}) {v.changeNotes ? `• ${v.changeNotes.slice(0, 30)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              {isVi ? 'Mô tả tham chiếu:' : 'Description:'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Warm lighting composition, high contrast studio rim light for living room shots."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              {isVi ? 'Tags (phân cách bằng dấu phẩy):' : 'Tags (comma separated):'}
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Style, Hanoi, Warm, 3D CGI"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Upload File / Preview */}
          <div className="space-y-2">
            <label className="block text-slate-400 font-semibold">
              {isVi ? 'Hình ảnh / Tệp tham chiếu:' : 'Image / Reference File:'}
            </label>

            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                {isVi ? 'Chọn tệp từ máy' : 'Upload from Device'}
              </button>

              <button
                type="button"
                onClick={handleGenerateSampleArt}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                {isVi ? 'Tạo Vector Mẫu' : 'Generate Vector Sample'}
              </button>
            </div>

            {imageUri && (
              <div className="mt-2 w-48 aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative">
                <img src={imageUri} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUri('')}
                  className="absolute top-1 right-1 p-1 bg-slate-950/80 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            {isVi ? 'Hủy bỏ' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
          >
            {isVi ? 'Lưu Vào Thư Viện' : 'Save to Library'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// IMPORT APPROVED KEYFRAME MODAL
// ==========================================

interface ImportModalProps {
  isVi: boolean;
  storyboards: any[];
  onClose: () => void;
  onImported: (newRef: ProjectReference) => void;
}

const ImportKeyframeModal: React.FC<ImportModalProps> = ({
  isVi,
  storyboards,
  onClose,
  onImported,
}) => {
  // Collect shots with generated images
  const shotsWithRenders = useMemo(() => {
    const list: Array<{ shot: Shot; episodeId: string; sceneNumber: number; imageUrl: string }> = [];
    storyboards.forEach((sb) => {
      sb.scenes?.forEach((sc: any) => {
        sc.shots?.forEach((sh: Shot) => {
          if (sh.activeImageOutputUrl) {
            list.push({
              shot: sh,
              episodeId: sb.episodeId,
              sceneNumber: sc.sceneNumber,
              imageUrl: sh.activeImageOutputUrl,
            });
          }
        });
      });
    });
    return list;
  }, [storyboards]);

  const [importError, setImportError] = useState<string | null>(null);

  const handleImport = (item: { shot: Shot; episodeId: string; imageUrl: string }) => {
    setImportError(null);
    try {
      const newRef = ProjectReferenceService.importKeyframeAsReference({
        shot: item.shot,
        episodeId: item.episodeId,
        imageUrl: item.imageUrl,
      });
      onImported(newRef);
    } catch (err: any) {
      setImportError(err.message || 'Lỗi khi nhập tài nguyên tham chiếu.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              {isVi ? 'Nhập Từ Keyframe Đã Duyệt Trong Storyboard' : 'Import from Approved Keyframes'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs custom-scrollbar">
          <p className="text-slate-400">
            {isVi
              ? 'Tái sử dụng các keyframe kết xuất đã phê duyệt làm tài nguyên tham chiếu chính thức mà không cần tải lên lại. Lưu ý: Chỉ các khung hình sản xuất thực tế (Raster PNG/JPEG) mới được phép nhập; khung hình Mock Studio SVG bị từ chối.'
              : 'Reuse existing approved storyboard keyframes as project reference assets without re-uploading. Note: Only genuine production raster frames (PNG/JPEG) are permitted; mock SVG frames are rejected.'}
          </p>

          {importError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 flex items-center space-x-2">
              <X className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {shotsWithRenders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shotsWithRenders.map((item) => {
                const isMock = Boolean(
                  item.shot.isMockOutput === true ||
                    item.imageUrl?.startsWith('data:image/svg+xml') ||
                    item.imageUrl?.includes('<svg') ||
                    item.shot.outputMimeType === 'image/svg+xml'
                );

                return (
                  <div
                    key={item.shot.id}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-3"
                  >
                    <div className="w-20 aspect-video rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-800 relative">
                      <img
                        src={item.imageUrl}
                        alt={item.shot.action}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {isMock ? (
                        <span className="absolute bottom-0 inset-x-0 bg-amber-600/90 text-slate-950 font-black text-[8px] text-center uppercase tracking-wider py-0.5">
                          Mock SVG
                        </span>
                      ) : (
                        <span className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-white font-bold text-[8px] text-center uppercase tracking-wider py-0.5">
                          Production
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center space-x-1 font-bold text-slate-200 truncate">
                        <span>Shot #{item.shot.shotNumber}</span>
                        <span className="text-[10px] text-slate-500">
                          (Scene {item.sceneNumber} • {item.episodeId})
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {item.shot.action}
                      </p>

                      {isMock ? (
                        <span className="inline-block text-[9px] text-amber-400/90 font-medium">
                          Khung hình Mock (không thể nhập)
                        </span>
                      ) : (
                        <button
                          onClick={() => handleImport(item)}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-colors"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {isVi ? 'Lưu vào Thư Viện' : 'Import Asset'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Camera className="w-8 h-8 mx-auto text-slate-600" />
              <p>
                {isVi
                  ? 'Chưa có Shot nào hoàn thành kết xuất ảnh trong Storyboard.'
                  : 'No storyboard shots have rendered images yet.'}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            {isVi ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// EDIT REFERENCE MODAL
// ==========================================

interface EditModalProps {
  reference: ProjectReference;
  isVi: boolean;
  characters: Character[];
  onClose: () => void;
  onSaved: (updated: ProjectReference) => void;
}

const EditReferenceModal: React.FC<EditModalProps> = ({
  reference,
  isVi,
  characters,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState(reference.name);
  const [description, setDescription] = useState(reference.description || '');
  const [tagsInput, setTagsInput] = useState((reference.tags || []).join(', '));
  const [isFavorite, setIsFavorite] = useState(reference.isFavorite || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updated = ProjectReferenceService.updateReference(reference.id, {
      name: name.trim(),
      description: description.trim(),
      tags: parsedTags,
      isFavorite,
    });

    if (updated) {
      onSaved(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {isVi ? 'Chỉnh Sửa Thông Tin Tham Chiếu' : 'Edit Reference Details'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs custom-scrollbar">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              {isVi ? 'Tên tham chiếu:' : 'Reference Name:'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              {isVi ? 'Mô tả chi tiết:' : 'Description:'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              {isVi ? 'Tags (phân cách bằng dấu phẩy):' : 'Tags (comma separated):'}
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="edit-favorite"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-950 border-slate-700"
            />
            <label htmlFor="edit-favorite" className="text-slate-300 font-semibold cursor-pointer">
              {isVi ? 'Ghim vào mục yêu thích (Favorite)' : 'Pin as Favorite'}
            </label>
          </div>
        </form>

        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            {isVi ? 'Hủy bỏ' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
          >
            {isVi ? 'Cập Nhật' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
