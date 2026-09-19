import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CharacterReference,
  Character,
  CharacterVersion,
  ReferenceType,
} from '../../types';
import { storageService } from '../../services/storageService';
import {
  CharacterReferenceService,
  CANONICAL_REFERENCE_TYPES,
  REFERENCE_TYPE_LABELS,
} from '../../services/characterReferenceService';
import { ReferenceCardPreview } from '../shared/ReferenceCardPreview';
import { ReferenceAssetPreviewModal } from './ReferenceAssetPreviewModal';
import { CharacterAvatar } from '../shared/CharacterAvatar';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Star,
  Eye,
  Lock,
  Upload,
  FolderTree,
  FileCheck,
  Filter,
  Layers,
  Copy,
  Check,
  Sparkles,
  Info,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface CharacterReferenceGalleryProps {
  initialCharacterId?: string;
  language: 'en' | 'vi';
  onOpenDNA: (characterId: string) => void;
}

export const CharacterReferenceGallery: React.FC<CharacterReferenceGalleryProps> = ({
  initialCharacterId,
  language,
  onOpenDNA,
}) => {
  const [db, setDb] = useState(storageService.getDatabase());
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    initialCharacterId || 'char_pi',
  );
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [previewAsset, setPreviewAsset] = useState<CharacterReference | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Upload modal form state
  const [uploadCharId, setUploadCharId] = useState<string>('char_pi');
  const [uploadVersionId, setUploadVersionId] = useState<string>('');
  const [uploadType, setUploadType] = useState<ReferenceType>('front');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [uploadIsPrimary, setUploadIsPrimary] = useState<boolean>(false);
  const [uploadImageFile, setUploadImageFile] = useState<File | null>(null);
  const [uploadImagePreview, setUploadImagePreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to storage changes
  useEffect(() => {
    return storageService.subscribe(() => {
      setDb(storageService.getDatabase());
    });
  }, []);

  const characters: Character[] = db.characters || [];
  const characterVersions: CharacterVersion[] = db.characterVersions || [];
  const allReferences: CharacterReference[] = db.characterReferences || [];

  // Update selected character if prop changes
  useEffect(() => {
    if (initialCharacterId && characters.some((c) => c.id === initialCharacterId)) {
      setSelectedCharacterId(initialCharacterId);
    }
  }, [initialCharacterId, characters]);

  // Current selected character object
  const currentCharacter = useMemo(
    () => characters.find((c) => c.id === selectedCharacterId) || characters[0],
    [characters, selectedCharacterId],
  );

  // Versions belonging strictly to current selected character
  const currentCharacterVersions = useMemo(
    () => characterVersions.filter((v) => v.characterId === selectedCharacterId),
    [characterVersions, selectedCharacterId],
  );

  // Default to active version if selectedVersionId is unset or invalid
  useEffect(() => {
    if (currentCharacterVersions.length > 0) {
      const match = currentCharacterVersions.find((v) => v.id === selectedVersionId);
      if (!match) {
        const activeVer =
          currentCharacterVersions.find((v) => v.id === currentCharacter?.activeVersionId) ||
          currentCharacterVersions[0];
        setSelectedVersionId(activeVer.id);
      }
    }
  }, [currentCharacterVersions, selectedVersionId, currentCharacter]);

  // Active version object
  const currentVersion = useMemo(
    () => currentCharacterVersions.find((v) => v.id === selectedVersionId),
    [currentCharacterVersions, selectedVersionId],
  );

  // References filtered strictly by character AND selected version (NEVER MIX ASSETS ACROSS VERSIONS)
  const versionReferences = useMemo(() => {
    if (!selectedVersionId) return [];
    return allReferences.filter(
      (r) =>
        r.characterId === selectedCharacterId &&
        r.characterVersionId === selectedVersionId,
    );
  }, [allReferences, selectedCharacterId, selectedVersionId]);

  // Filtered by type & query
  const displayedReferences = useMemo(() => {
    return versionReferences.filter((ref) => {
      if (selectedTypeFilter !== 'all') {
        const refType = (ref.type || '').toLowerCase();
        const filterType = selectedTypeFilter.toLowerCase();
        if (filterType === 'expression') {
          if (!refType.includes('expression')) return false;
        } else if (filterType === 'full-body') {
          if (refType !== 'full-body' && refType !== 'pose') return false;
        } else if (refType !== filterType) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ref.id.toLowerCase().includes(q) ||
          ref.storagePath.toLowerCase().includes(q) ||
          ref.type.toLowerCase().includes(q) ||
          (ref.description && ref.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [versionReferences, selectedTypeFilter, searchQuery]);

  // Handle open upload modal
  const handleOpenUpload = () => {
    setUploadCharId(selectedCharacterId);
    setUploadVersionId(selectedVersionId || currentCharacterVersions[0]?.id || '');
    setUploadType('front');
    setUploadDescription('');
    setUploadIsPrimary(versionReferences.length === 0);
    setUploadImageFile(null);
    setUploadImagePreview('');
    setUploadError(null);
    setIsUploadModalOpen(true);
  };

  // Sync upload versions when uploadCharId changes in modal
  const uploadCharacterVersions = useMemo(
    () => characterVersions.filter((v) => v.characterId === uploadCharId),
    [characterVersions, uploadCharId],
  );

  useEffect(() => {
    if (uploadCharacterVersions.length > 0) {
      if (!uploadCharacterVersions.some((v) => v.id === uploadVersionId)) {
        setUploadVersionId(uploadCharacterVersions[0].id);
      }
    }
  }, [uploadCharId, uploadCharacterVersions, uploadVersionId]);

  // Image file processing
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError(
        language === 'vi'
          ? 'Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP, SVG).'
          : 'Please select a valid image file (PNG, JPG, WEBP, SVG).',
      );
      return;
    }
    setUploadError(null);
    setUploadImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Generate canonical preview path for upload modal
  const previewStoragePath = useMemo(() => {
    const cleanFilename = uploadImageFile
      ? uploadImageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
      : `ref_${uploadType}_asset.png`;
    return `characters/${uploadCharId}/${uploadVersionId}/${cleanFilename}`;
  }, [uploadCharId, uploadVersionId, uploadType, uploadImageFile]);

  // Submit upload
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadCharId || !uploadVersionId) {
      setUploadError(
        language === 'vi'
          ? 'Vui lòng chọn nhân vật và phiên bản.'
          : 'Character and version are required.',
      );
      return;
    }

    // If no custom file was chosen, generate high-quality stylized placeholder svg as data URL
    let finalImageUrl = uploadImagePreview;
    if (!finalImageUrl) {
      // Create lightweight SVG data URL representing model sheet
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
        <rect width="600" height="600" fill="#0f172a"/>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#38bdf8" stroke-width="0.5" stroke-opacity="0.2"/>
        </pattern>
        <rect width="600" height="600" fill="url(#grid)" />
        <circle cx="300" cy="220" r="110" fill="#1e293b" stroke="#f59e0b" stroke-width="3"/>
        <circle cx="265" cy="210" r="16" fill="#f59e0b"/>
        <circle cx="335" cy="210" r="16" fill="#f59e0b"/>
        <path d="M 270 270 Q 300 300 330 270" stroke="#f59e0b" stroke-width="6" fill="none" stroke-linecap="round"/>
        <rect x="230" y="340" width="140" height="180" rx="20" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
        <text x="300" y="555" font-family="sans-serif" font-size="20" font-weight="bold" fill="#f8fafc" text-anchor="middle">${uploadCharId.toUpperCase()} • ${uploadType.toUpperCase()} VIEW</text>
        <text x="300" y="580" font-family="monospace" font-size="12" fill="#94a3b8" text-anchor="middle">${previewStoragePath}</text>
      </svg>`;
      finalImageUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    try {
      const addedRef = CharacterReferenceService.addReference({
        characterId: uploadCharId,
        characterVersionId: uploadVersionId,
        type: uploadType,
        image: finalImageUrl,
        description:
          uploadDescription.trim() ||
          `${uploadType} reference asset for ${uploadCharId} (${uploadVersionId})`,
        isPrimary: uploadIsPrimary,
        storagePath: previewStoragePath,
        fileSize: uploadImageFile?.size,
        mimeType: uploadImageFile?.type || 'image/png',
      });

      // Switch view to match uploaded character and version
      setSelectedCharacterId(uploadCharId);
      setSelectedVersionId(uploadVersionId);
      setIsUploadModalOpen(false);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to register reference asset.');
    }
  };

  // Actions
  const handleSetPrimary = (refId: string) => {
    CharacterReferenceService.setPrimaryReference(refId);
  };

  const handleDeleteReference = (refId: string) => {
    CharacterReferenceService.deleteReference(refId);
  };

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const isVi = language === 'vi';
  const formatLabel = (en: string, vi: string) => (isVi ? vi : en);

  // Canonical storage directory for active version
  const currentCanonicalRoot = `characters/${selectedCharacterId}/${selectedVersionId}/`;

  return (
    <div id="character-reference-asset-library" className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                <span>{formatLabel('Character Reference Asset Library', 'Thư Viện Ảnh Tham Chiếu Nhân Vật')}</span>
                <span className="text-[11px] font-mono font-normal bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Immutable per Version
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatLabel(
                  'Multi-angle orthographic model sheets, turnarounds, expressions, and posture references locked per Character Version.',
                  'Bản vẽ chiếu trực giao đa góc nhìn, bảng biểu cảm và tư thế chuẩn được khóa bất biến theo từng phiên bản nhân vật.',
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-open-dna-editor"
            onClick={() => onOpenDNA(selectedCharacterId)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>{formatLabel('Character DNA', 'Xem DNA Nhân Vật')}</span>
          </button>

          <button
            type="button"
            id="btn-upload-reference-asset"
            onClick={handleOpenUpload}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{formatLabel('Upload Reference Asset', 'Thêm Ảnh Tham Chiếu')}</span>
          </button>
        </div>
      </div>

      {/* Character Selector Pills / Cards */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          {formatLabel('1. Select Character', '1. Chọn Nhân Vật')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {characters.map((char) => {
            const isSelected = char.id === selectedCharacterId;
            const charRefs = allReferences.filter((r) => r.characterId === char.id);
            return (
              <button
                key={char.id}
                type="button"
                id={`char-select-${char.id}`}
                onClick={() => setSelectedCharacterId(char.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'bg-slate-800/90 border-amber-500/60 ring-2 ring-amber-500/20 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-400'
                }`}
              >
                <CharacterAvatar characterId={char.id} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-white truncate">
                    {char.displayName}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {char.role}
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                    {charRefs.length} {formatLabel('assets', 'ảnh')}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Character Version Selector Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {formatLabel('2. Locked Character Version Scope', '2. Phạm Vi Phiên Bản Nhân Vật')}
            </div>
            <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-2">
              <span>{currentCharacter?.displayName}</span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-emerald-400 font-mono">
                {currentVersion ? `Version ${currentVersion.version} (${currentVersion.id})` : selectedVersionId}
              </span>
            </div>
          </div>

          {/* Version Switcher Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {currentCharacterVersions.map((v) => {
              const isSelected = v.id === selectedVersionId;
              const isActive = v.id === currentCharacter?.activeVersionId;
              const verCount = allReferences.filter(
                (r) => r.characterId === currentCharacter?.id && r.characterVersionId === v.id,
              ).length;

              return (
                <button
                  key={v.id}
                  type="button"
                  id={`ver-select-${v.id}`}
                  onClick={() => setSelectedVersionId(v.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>v{v.version}</span>
                  {isActive && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-sans uppercase font-bold ${
                        isSelected ? 'bg-slate-950 text-amber-300' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {formatLabel('Active', 'Đang dùng')}
                    </span>
                  )}
                  <span className={`text-[10px] ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                    ({verCount})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Canonical Storage Path Banner & Architecture Rules */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs">
          <div className="md:col-span-8 flex items-center gap-2.5">
            <FolderTree className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 block font-medium">
                {formatLabel('Canonical Storage Path for this Version:', 'Đường dẫn thư mục lưu trữ phiên bản:')}
              </span>
              <div className="font-mono text-xs text-sky-300 font-semibold tracking-wide flex items-center gap-2 mt-0.5">
                <span className="truncate">{currentCanonicalRoot}</span>
                <button
                  type="button"
                  onClick={() => copyPath(currentCanonicalRoot)}
                  className="text-slate-500 hover:text-amber-400 p-0.5"
                  title="Copy path"
                >
                  {copiedPath === currentCanonicalRoot ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 flex items-center justify-start md:justify-end gap-2 text-[11px] text-emerald-400">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>
              {formatLabel(
                'Isolated per Version & Resolved by Storyboard',
                'Cô lập theo Version & Phân giải bởi Storyboard',
              )}
            </span>
          </div>
        </div>

        {/* Filters & Search Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Canonical Reference Type Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              id="filter-type-all"
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                selectedTypeFilter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {formatLabel('All Types', 'Tất cả')} ({versionReferences.length})
            </button>

            {CANONICAL_REFERENCE_TYPES.map((t) => {
              const isSel = selectedTypeFilter === t;
              const count = versionReferences.filter((r) => {
                const rType = (r.type || '').toLowerCase();
                if (t === 'expression') return rType.includes('expression');
                if (t === 'full-body') return rType === 'full-body' || rType === 'pose';
                return rType === t;
              }).length;

              return (
                <button
                  key={t}
                  type="button"
                  id={`filter-type-${t}`}
                  onClick={() => setSelectedTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-colors flex items-center gap-1.5 ${
                    isSel
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{t}</span>
                  <span className={`text-[10px] ${isSel ? 'text-slate-900' : 'text-slate-500'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={formatLabel('Search asset ID, path, notes...', 'Tìm asset ID, path, ghi chú...')}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* References Grid */}
      {displayedReferences.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-white">
              {formatLabel(
                'No Reference Assets Found in this Version',
                'Chưa có ảnh tham chiếu cho phiên bản này',
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {formatLabel(
                `Upload orthographic views, model sheets, or expression arrays into ${currentCanonicalRoot}`,
                `Hãy tải lên ảnh góc chiếu trực giao, bảng biểu cảm hoặc dáng chuẩn vào ${currentCanonicalRoot}`,
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenUpload}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>{formatLabel('Upload First Reference Image', 'Tải Lên Ảnh Tham Chiếu Đầu Tiên')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedReferences.map((ref) => {
            const isPrimary = ref.isPrimary;
            const typeInfo = REFERENCE_TYPE_LABELS[ref.type.toLowerCase()];

            return (
              <div
                key={ref.id}
                id={`reference-card-${ref.id}`}
                className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col group ${
                  isPrimary
                    ? 'border-amber-500/60 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Visual Preview Area */}
                <div
                  className="relative cursor-pointer"
                  onClick={() => setPreviewAsset(ref)}
                  title={formatLabel('Click to inspect full resolution asset', 'Nhấn để xem chi tiết ảnh')}
                >
                  <ReferenceCardPreview
                    characterId={ref.characterId}
                    type={ref.type}
                    image={ref.image}
                    storagePath={ref.storagePath}
                    isPrimary={ref.isPrimary}
                  />

                  {/* Hover Inspect Overlay */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-30">
                    <span className="px-3 py-1.5 bg-slate-900/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 shadow-lg">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      {formatLabel('Inspect Asset', 'Xem chi tiết')}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {/* Header line: Asset ID + Type Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-200 truncate" title={ref.id}>
                        {ref.id}
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                        {ref.type}
                      </span>
                    </div>

                    {/* Storage Path Chip */}
                    <div className="flex items-center justify-between bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80 text-[11px] font-mono text-sky-300">
                      <span className="truncate" title={ref.storagePath}>
                        {ref.storagePath}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyPath(ref.storagePath);
                        }}
                        className="text-slate-500 hover:text-amber-400 p-0.5 ml-1"
                        title="Copy storage path"
                      >
                        {copiedPath === ref.storagePath ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {ref.description || typeInfo?.description || formatLabel('Reference blueprint asset', 'Ảnh tư liệu mô hình')}
                    </p>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {isPrimary ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {formatLabel('Primary Ref', 'Tham chiếu chính')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        id={`btn-set-primary-${ref.id}`}
                        onClick={() => handleSetPrimary(ref.id)}
                        className="text-[11px] font-semibold text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" />
                        {formatLabel('Set Primary', 'Đặt làm ảnh chính')}
                      </button>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        id={`btn-preview-ref-${ref.id}`}
                        onClick={() => setPreviewAsset(ref)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        title={formatLabel('Inspect details', 'Xem chi tiết')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        id={`btn-delete-ref-${ref.id}`}
                        onClick={() => {
                          if (
                            confirm(
                              formatLabel(
                                `Delete reference asset "${ref.id}"?`,
                                `Xác nhận xóa ảnh tham chiếu "${ref.id}"?`,
                              ),
                            )
                          ) {
                            handleDeleteReference(ref.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title={formatLabel('Delete asset', 'Xóa ảnh')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Reference Asset Modal */}
      {isUploadModalOpen && (
        <div
          id="upload-reference-modal"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
        >
          <div
            className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {formatLabel('Upload Character Reference Asset', 'Tải Lên Ảnh Tham Chiếu Nhân Vật')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formatLabel(
                      'Store persistent reference images mapped to Character Version',
                      'Lưu trữ ảnh tham chiếu chuẩn gắn kết bất biến với Character Version',
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[78vh]">
              {uploadError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Character & Version Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {formatLabel('Target Character', 'Nhân vật')}
                  </label>
                  <select
                    value={uploadCharId}
                    onChange={(e) => setUploadCharId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.displayName} ({c.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {formatLabel('Character Version', 'Phiên bản nhân vật')}
                  </label>
                  <select
                    value={uploadVersionId}
                    onChange={(e) => setUploadVersionId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    {uploadCharacterVersions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.version} ({v.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Canonical Reference Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {formatLabel('Reference View Type (Required)', 'Loại góc chiếu / Tham chiếu')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CANONICAL_REFERENCE_TYPES.map((t) => {
                    const isSelected = uploadType === t;
                    const label = REFERENCE_TYPE_LABELS[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setUploadType(t)}
                        className={`p-2 rounded-lg border text-left text-xs transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="capitalize">{t}</div>
                        <div className="text-[10px] text-slate-500 truncate font-normal">
                          {label?.angle || t}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drag & Drop File Upload Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {formatLabel('Reference Image File', 'Tệp ảnh tham chiếu')}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-amber-500 bg-amber-500/10'
                      : uploadImagePreview
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-slate-700 bg-slate-950 hover:border-slate-600'
                  }`}
                >
                  {uploadImagePreview ? (
                    <div className="space-y-2 w-full flex flex-col items-center">
                      <img
                        src={uploadImagePreview}
                        alt="Preview"
                        className="max-h-36 max-w-full object-contain rounded-lg border border-slate-700 shadow-md"
                      />
                      <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                        <FileCheck className="w-4 h-4" />
                        <span>{uploadImageFile ? uploadImageFile.name : 'Image ready for storage'}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 underline hover:text-white">
                        {formatLabel('Click or drag to change image', 'Nhấn hoặc kéo ảnh khác để thay đổi')}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-semibold text-slate-200">
                        {formatLabel(
                          'Drag & drop reference image here, or click to browse',
                          'Kéo thả tệp ảnh vào đây, hoặc nhấn để duyệt tệp',
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        PNG, JPG, WEBP, SVG (Max 10MB)
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Real-time Canonical Storage Path Preview */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                  <span>{formatLabel('Target Storage Path:', 'Đường dẫn lưu trữ chuẩn:')}</span>
                </div>
                <div className="font-mono text-xs text-sky-300 break-all select-all">
                  {previewStoragePath}
                </div>
              </div>

              {/* Description / Pose Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {formatLabel('Pose Description / Model Sheet Notes', 'Mô tả tư thế & Ghi chú góc nhìn')}
                </label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder={
                    isVi
                      ? 'VD: Góc quay 3/4 thể hiện độ phồng má, nụ cười tinh nghịch, ghim cài sao vàng...'
                      : 'e.g. 3/4 turn showing cheek volume, playful grin, yellow star hairpin...'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Primary Flag Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-primary-reference"
                  checked={uploadIsPrimary}
                  onChange={(e) => setUploadIsPrimary(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <label htmlFor="chk-primary-reference" className="text-xs text-slate-300 cursor-pointer select-none">
                  {formatLabel(
                    'Set as Primary Reference for this Character Version',
                    'Đặt làm Ảnh Tham Chiếu Chính cho phiên bản nhân vật này',
                  )}
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  {formatLabel('Cancel', 'Hủy')}
                </button>
                <button
                  type="submit"
                  id="btn-confirm-upload-asset"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{formatLabel('Save Reference Asset', 'Lưu Ảnh Tham Chiếu')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Resolution Asset Preview Modal */}
      {previewAsset && (
        <ReferenceAssetPreviewModal
          reference={previewAsset}
          character={characters.find((c) => c.id === previewAsset.characterId)}
          version={characterVersions.find((v) => v.id === previewAsset.characterVersionId)}
          language={language}
          onClose={() => setPreviewAsset(null)}
          onSetPrimary={handleSetPrimary}
          onDelete={handleDeleteReference}
        />
      )}
    </div>
  );
};
