import React, { useState, useRef, useEffect } from 'react';
import {
  CharacterReference,
  ReferenceType,
  LanguageMode,
} from '../../types';
import { CharacterReferenceService } from '../../services/characterReferenceService';
import { CharacterService } from '../../services/characterService';
import { storageService } from '../../services/storageService';
import { processReferenceFile } from '../../services/imageAssetStorage';
import { CharacterAvatar } from '../shared/CharacterAvatar';
import { ReferenceCardPreview } from '../shared/ReferenceCardPreview';
import {
  Image as ImageIcon,
  Upload,
  Star,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  FileCode,
  ShieldCheck,
  Sparkles,
  Info,
  Save,
} from 'lucide-react';

interface CharacterVersionReferenceLibraryProps {
  characterId: string;
  characterVersionId: string;
  language: LanguageMode;
  onAssetChanged?: () => void;
}

const SUPPORTED_REFERENCE_TYPES: { type: ReferenceType; labelEn: string; labelVi: string; desc: string }[] = [
  {
    type: 'Front',
    labelEn: 'Front Orthographic',
    labelVi: 'Mặt trước trực giao',
    desc: 'Góc nhìn chính diện 0° chuẩn tỷ lệ khuôn mặt và hình thể.',
  },
  {
    type: '3/4',
    labelEn: '3/4 Angle (Beauty View)',
    labelVi: 'Góc ba phần tư (3/4)',
    desc: 'Góc xoay 45° tôn vinh chiều sâu hình khối 3D và gò má.',
  },
  {
    type: 'Side',
    labelEn: 'Side Profile',
    labelVi: 'Góc nghiêng trực giao (Profile)',
    desc: 'Góc nhìn 90° cố định cấu trúc sống mũi, cằm và độ cong cơ thể.',
  },
  {
    type: 'Expression',
    labelEn: 'Expressions Sheet',
    labelVi: 'Bảng biểu cảm',
    desc: 'Tập hợp các sắc thái vui vẻ, ngạc nhiên, suy tư, kiên định.',
  },
  {
    type: 'Full Body',
    labelEn: 'Full Body Staging',
    labelVi: 'Toàn thân tỷ lệ chuẩn',
    desc: 'Bản vẽ từ đầu đến chân kiểm soát chiều cao và trang phục toàn diện.',
  },
  {
    type: 'Custom',
    labelEn: 'Custom / Signature Prop',
    labelVi: 'Tùy biến / Phụ kiện đặc thù',
    desc: 'Chi tiết đạo cụ, họa tiết áo hoặc chi tiết tạo hình riêng biệt.',
  },
];

export const CharacterVersionReferenceLibrary: React.FC<CharacterVersionReferenceLibraryProps> = ({
  characterId,
  characterVersionId,
  language,
  onAssetChanged,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const character = CharacterService.getCharacterById(characterId);

  const [references, setReferences] = useState<CharacterReference[]>(() =>
    CharacterReferenceService.getReferencesForVersion(characterVersionId),
  );
  const [selectedFilterType, setSelectedFilterType] = useState<string>('all');
  const [activePreviewRef, setActivePreviewRef] = useState<CharacterReference | null>(null);

  // Upload state
  const [uploadType, setUploadType] = useState<ReferenceType>('Front');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [isPrimaryForVersion, setIsPrimaryForVersion] = useState<boolean>(false);
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState<string | null>(null);
  const [selectedFileThumbnail, setSelectedFileThumbnail] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [pendingUploads, setPendingUploads] = useState<
    Array<{
      file: File;
      name: string;
      preview: string;
      thumbnail?: string;
      type: ReferenceType;
      fileSize?: number;
      mimeType?: string;
    }>
  >([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const refreshReferences = () => {
    const list = CharacterReferenceService.getReferencesForVersion(characterVersionId);
    setReferences(list);
    // If no primary exists and list is not empty, ensure primary
    if (list.length > 0 && !list.some((r) => r.isPrimary)) {
      CharacterReferenceService.setPrimaryReference(list[0].id);
      setReferences(CharacterReferenceService.getReferencesForVersion(characterVersionId));
    }
  };

  useEffect(() => {
    refreshReferences();
    return storageService.subscribe(() => {
      refreshReferences();
    });
  }, [characterId, characterVersionId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const inferTypeFromFilename = (filename: string): ReferenceType | null => {
    const lower = filename.toLowerCase();
    if (lower.includes('three_quarter_left') || lower.includes('3_4_left') || lower.includes('34_left')) return '3/4';
    if (lower.includes('three_quarter_right') || lower.includes('3_4_right') || lower.includes('34_right')) return '3/4';
    if (lower.includes('hero_three_quarter') || lower.includes('hero_3_4') || lower.includes('hero')) return '3/4';
    if (lower.includes('three_quarter') || lower.includes('3_4') || lower.includes('34') || lower.includes('beauty') || lower.includes('3-4')) return '3/4';
    if (lower.includes('left_side') || lower.includes('side_left') || lower.includes('ben_trai')) return 'Side';
    if (lower.includes('right_side') || lower.includes('side_right') || lower.includes('ben_phai')) return 'Side';
    if (lower.includes('front') || lower.includes('chinh_dien') || lower.includes('truoc') || lower.includes('mat_truoc')) return 'Front';
    if (lower.includes('side') || lower.includes('profile') || lower.includes('nghieng')) return 'Side';
    if (lower.includes('expression') || lower.includes('bieu_cam') || lower.includes('cam_xuc')) return 'Expression';
    if (lower.includes('full') || lower.includes('body') || lower.includes('stance') || lower.includes('toan_than')) return 'Full Body';
    if (lower.includes('custom') || lower.includes('prop') || lower.includes('dao_cu') || lower.includes('phu_kien')) return 'Custom';
    // If filename has no specific keyword, return null to keep the user's selected type (Front by default)
    return null;
  };

  const handleFilesSelect = async (files: FileList | File[]) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (valid.length === 0) {
      alert(language === 'vi' ? 'Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).' : 'Please choose a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const items: typeof pendingUploads = [];
    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      try {
        const processed = await processReferenceFile(file);
        const inferred = inferTypeFromFilename(file.name);
        items.push({
          file,
          name: file.name,
          preview: processed.dataUrl,
          thumbnail: processed.thumbnailUrl,
          type: inferred || uploadType || 'Front',
          fileSize: processed.fileSize,
          mimeType: processed.mimeType,
        });
      } catch (err) {
        console.error('Failed to process image:', file.name, err);
      }
    }

    if (items.length > 0) {
      setPendingUploads(items);
      setSelectedFileDataUrl(items[0].preview);
      setSelectedFileThumbnail(items[0].thumbnail || items[0].preview);
      setSelectedFileName(items[0].name);
      const firstInferred = inferTypeFromFilename(items[0].name);
      if (firstInferred) {
        setUploadType(firstInferred);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesSelect(files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileDataUrl && pendingUploads.length === 0) {
      alert(language === 'vi' ? 'Vui lòng tải lên tệp ảnh tham chiếu!' : 'Please upload a reference image file!');
      return;
    }

    setIsUploading(true);

    try {
      if (pendingUploads.length > 1) {
        // Atomic batch upload
        const batchItems = pendingUploads.map((item, idx) => ({
          characterId,
          characterVersionId,
          type: item.type,
          image: item.preview,
          thumbnail: item.thumbnail || item.preview,
          description: `${item.type} reference model sheet for ${character?.displayName || characterId} (${characterVersionId})`,
          isPrimary: idx === 0 && (isPrimaryForVersion || references.length === 0),
          customFilename: item.name,
          fileSize: item.fileSize,
          mimeType: item.mimeType,
        }));

        CharacterReferenceService.addMultipleReferences(batchItems);
        refreshReferences();
        onAssetChanged?.();

        setPendingUploads([]);
        setSelectedFileDataUrl(null);
        setSelectedFileThumbnail(null);
        setSelectedFileName('');
        setUploadDescription('');
        setIsPrimaryForVersion(false);
        if (fileInputRef.current) fileInputRef.current.value = '';

        showToast(
          language === 'vi'
            ? `Đã lưu thành công ${batchItems.length} ảnh tham chiếu vào kho!`
            : `Successfully persisted ${batchItems.length} reference assets to storage!`,
        );
      } else {
        const cleanType = uploadType.toLowerCase().replace(/[^a-z0-9]/g, '');
        const assetFilename = selectedFileName
          ? selectedFileName.replace(/\s+/g, '_')
          : `ref_${characterId.replace('char_', '')}_${cleanType}_${Date.now().toString(36)}.png`;

        const added = CharacterReferenceService.addReference({
          characterId,
          characterVersionId,
          type: uploadType,
          image: selectedFileDataUrl!,
          thumbnail: selectedFileThumbnail || selectedFileDataUrl!,
          storagePath: CharacterReferenceService.getCanonicalStoragePath(
            characterId,
            characterVersionId,
            assetFilename,
          ),
          description:
            uploadDescription.trim() ||
            `${uploadType} reference model sheet for ${character?.displayName || characterId} (${characterVersionId})`,
          isPrimary: isPrimaryForVersion || references.length === 0,
        });

        refreshReferences();
        onAssetChanged?.();

        // Reset form
        setPendingUploads([]);
        setSelectedFileDataUrl(null);
        setSelectedFileThumbnail(null);
        setSelectedFileName('');
        setUploadDescription('');
        setIsPrimaryForVersion(false);
        if (fileInputRef.current) fileInputRef.current.value = '';

        showToast(
          language === 'vi'
            ? `Đã lưu ảnh tham chiếu ${uploadType} vào kho ${added.storagePath}!`
            : `Saved ${uploadType} reference asset to ${added.storagePath}!`,
        );
      }
    } catch (err: any) {
      alert(err?.message || 'Error saving reference asset.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetPrimary = (referenceId: string) => {
    CharacterReferenceService.setPrimaryReference(referenceId);
    refreshReferences();
    onAssetChanged?.();
    showToast(
      language === 'vi'
        ? 'Đã đặt làm Ảnh tham chiếu chính (Primary Reference) cho phiên bản này!'
        : 'Set as Primary Reference for this Character Version!',
    );
  };

  const handleDelete = (referenceId: string) => {
    if (
      !confirm(
        language === 'vi'
          ? 'Xóa ảnh tham chiếu này khỏi phiên bản nhân vật? (Các phiên bản khác sẽ không bị ảnh hưởng)'
          : 'Delete this reference asset from this version? (Other versions will remain isolated and unaffected)',
      )
    ) {
      return;
    }

    CharacterReferenceService.deleteReference(referenceId);
    refreshReferences();
    onAssetChanged?.();
    showToast(language === 'vi' ? 'Đã xóa ảnh tham chiếu thành công.' : 'Reference asset deleted.');
  };

  const filtered = references.filter((r) => {
    if (selectedFilterType === 'all') return true;
    return r.type === selectedFilterType;
  });

  const primaryRef = references.find((r) => r.isPrimary) || references[0];

  const canonicalRoot = `characters/${characterId}/${characterVersionId}/`;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header & Canonical Storage Blueprint Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {language === 'vi'
                    ? 'Thư Viện Ảnh Tham Chiếu (Reference Asset Library)'
                    : 'Character Reference Asset Library'}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                  {references.length} {references.length === 1 ? 'asset' : 'assets'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'vi'
                  ? 'Bản vẽ chiếu trực giao cố định hình khối, khuôn mặt và trang phục để AI render không bị biến dạng.'
                  : 'Orthographic model sheets & facial turnarounds conditioning generation models directly.'}
              </p>
            </div>
          </div>

          {/* Canonical Storage Path Badge */}
          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">
                {language === 'vi' ? 'ĐƯỜNG DẪN LƯU TRỮ' : 'CANONICAL STORAGE'}
              </span>
              <span className="text-xs font-mono font-bold text-sky-300">
                {canonicalRoot}
              </span>
            </div>
          </div>
        </div>

        {/* Version Isolation Notice */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-200 font-semibold">
              {language === 'vi' ? 'Nguyên tắc bất biến theo phiên bản:' : 'Version Isolation Guarantee:'}{' '}
            </span>
            <span>
              {language === 'vi'
                ? `Mọi ảnh tham chiếu trong thư mục này chỉ gắn kết độc quyền với phiên bản "${characterVersionId}". Khi tạo phiên bản mới, hệ thống tự động nhân bản độc lập để không bao giờ làm sai lệch các tập phim đã kết xuất.`
                : `All assets in this directory are strictly quarantined to version "${characterVersionId}". When cloning to a new version, references are deep-copied to ensure past episodes are never disrupted.`}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Reference Highlight Card */}
      {primaryRef && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 overflow-hidden shrink-0 flex items-center justify-center">
              {primaryRef.image && primaryRef.image.startsWith('data:') ? (
                <img src={primaryRef.image} alt="Primary" className="w-full h-full object-cover" />
              ) : (
                <CharacterAvatar characterId={characterId} size="md" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {language === 'vi' ? 'ẢNH THAM CHIẾU CHÍNH (PRIMARY REFERENCE)' : 'PRIMARY REFERENCE ASSET'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  #{primaryRef.type}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-mono">
                {primaryRef.storagePath}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 md:text-right">
            <span className="block text-[11px] text-amber-300/80">
              {language === 'vi'
                ? 'Tự động kích hoạt làm điều kiện đầu vào cho prompt Storyboard & Video'
                : 'Conditioned into Storyboard prompt previews and video models'}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              Asset ID: {primaryRef.id}
            </span>
          </div>
        </div>
      )}

      {/* Upload Reference Images Section */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Upload className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-bold text-white">
            {language === 'vi' ? 'Tải Lên Ảnh Tham Chiếu Mới' : 'Upload Reference Images'}
          </h4>
          <span className="text-[11px] text-slate-400">
            ({language === 'vi' ? 'Lưu trữ theo chuẩn: ' : 'Target storage: '}
            <code className="text-amber-400 font-mono">{canonicalRoot}</code>)
          </span>
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {/* Drag and Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-amber-400 bg-amber-500/10'
                : 'border-slate-700 hover:border-slate-600 bg-slate-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {pendingUploads.length > 1 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                  <span>
                    ✓ {pendingUploads.length} {language === 'vi' ? 'ảnh tham chiếu sẵn sàng lưu trữ' : 'reference images ready to persist'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal underline hover:text-white">
                    {language === 'vi' ? 'Bấm để thêm ảnh' : 'Click to add more'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {pendingUploads.map((item, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 flex flex-col items-center">
                      <img src={item.thumbnail || item.preview} alt={item.name} className="w-full h-14 object-contain rounded bg-slate-950" />
                      <span className="text-[10px] text-amber-300 font-bold mt-1 uppercase truncate max-w-full font-mono">{item.type}</span>
                      <span className="text-[9px] text-slate-400 truncate max-w-full font-mono">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedFileDataUrl ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <img
                  src={selectedFileDataUrl}
                  alt="Selected Preview"
                  className="w-24 h-24 object-contain rounded-lg border border-slate-700 shadow-md bg-slate-900"
                />
                <div className="text-left">
                  <span className="text-xs font-bold text-white block">
                    {selectedFileName || 'image_reference.png'}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium block mt-0.5">
                    ✓ {language === 'vi' ? 'Đã sẵn sàng lưu' : 'Ready to save'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    {language === 'vi' ? 'Bấm để đổi tệp khác' : 'Click to choose another image'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageIcon className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">
                  {language === 'vi'
                    ? 'Kéo thả tệp ảnh vào đây hoặc bấm để chọn tệp từ máy tính'
                    : 'Drag & drop reference image here, or click to browse'}
                </p>
                <p className="text-[11px] text-slate-500">
                  PNG, JPG, WEBP • Max 20MB • {language === 'vi' ? 'Hỗ trợ góc trực giao, biểu cảm, toàn thân' : 'Front, 3/4, side, expression, full-body'}
                </p>
              </div>
            )}
          </div>

          {/* Form Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reference Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {language === 'vi' ? 'Loại ảnh tham chiếu (Reference Type)' : 'Reference Type'}
              </label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as ReferenceType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                {SUPPORTED_REFERENCE_TYPES.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.type} — {language === 'vi' ? t.labelVi : t.labelEn}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                {SUPPORTED_REFERENCE_TYPES.find((t) => t.type === uploadType)?.desc}
              </p>
            </div>

            {/* Set as Primary Checkbox */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={isPrimaryForVersion}
                  onChange={(e) => setIsPrimaryForVersion(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 bg-slate-900"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">
                    {language === 'vi' ? 'Đặt làm Ảnh tham chiếu chính (Primary)' : 'Set as Primary Reference'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {language === 'vi'
                      ? 'Dùng trực tiếp làm visual conditioning cho mọi phân cảnh của tập phim'
                      : 'Used as default conditioning input for episode shots'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {language === 'vi' ? 'Mô tả chi tiết & Ghi chú tạo hình' : 'Description & Conditioning Notes'}
            </label>
            <input
              type="text"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder={
                language === 'vi'
                  ? 'Ví dụ: Tóc ngắn nâu, mắt to tròn, áo len vàng có hình phi thuyền...'
                  : 'E.g., Orthographic front turnaround, canonical proportions, yellow knit sweater...'
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {(selectedFileDataUrl || pendingUploads.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFileDataUrl(null);
                  setSelectedFileThumbnail(null);
                  setSelectedFileName('');
                  setPendingUploads([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
              >
                {language === 'vi' ? 'Hủy chọn' : 'Clear Selection'}
              </button>
            )}

            <button
              type="submit"
              disabled={isUploading || (!selectedFileDataUrl && pendingUploads.length === 0)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                selectedFileDataUrl || pendingUploads.length > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {isUploading
                  ? language === 'vi' ? 'Đang lưu vào kho...' : 'Persisting to Storage...'
                  : pendingUploads.length > 1
                  ? language === 'vi' ? `Lưu & Khóa ${pendingUploads.length} Ảnh Vào Phiên Bản` : `Save & Persist ${pendingUploads.length} Images`
                  : language === 'vi' ? 'Lưu & Khóa Vào Phiên Bản' : 'Save & Persist to Version'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Reference Assets Gallery & Controls */}
      <div className="space-y-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedFilterType('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedFilterType === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {language === 'vi' ? 'Tất cả' : 'All Types'} ({references.length})
            </button>
            {SUPPORTED_REFERENCE_TYPES.map((t) => {
              const count = references.filter((r) => r.type === t.type).length;
              return (
                <button
                  key={t.type}
                  onClick={() => setSelectedFilterType(t.type)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    selectedFilterType === t.type
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {t.type} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            {language === 'vi' ? 'Hiển thị:' : 'Showing:'} {filtered.length} / {references.length}
          </span>
        </div>

        {/* Reference Assets Grid */}
        {filtered.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-slate-400">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-semibold">
              {language === 'vi' ? 'Chưa có ảnh tham chiếu cho loại này' : 'No reference assets found'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'vi'
                ? 'Hãy tải lên ảnh chiếu trực giao (Front, Side, 3/4...) vào phiên bản này ở biểu mẫu phía trên.'
                : 'Upload orthographic sheets or expression turnarounds above to establish model consistency.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((ref) => (
              <div
                key={ref.id}
                className={`rounded-2xl bg-slate-900 border transition-all p-4 flex flex-col justify-between shadow-lg group ${
                  ref.isPrimary
                    ? 'border-amber-500/60 ring-1 ring-amber-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar: Type & Primary status */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                      #{String(ref.type || 'ref').toUpperCase()}
                    </span>

                    {ref.isPrimary ? (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950 shadow-sm">
                        <Star className="w-3 h-3 fill-slate-950" />
                        PRIMARY
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetPrimary(ref.id)}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-400 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-800 transition-colors"
                        title="Set as primary reference for this version"
                      >
                        <Star className="w-3 h-3" />
                        <span>{language === 'vi' ? 'Đặt làm chính' : 'Set Primary'}</span>
                      </button>
                    )}
                  </div>

                  {/* Visual Preview */}
                  <div className="cursor-pointer" onClick={() => setActivePreviewRef(ref)}>
                    <ReferenceCardPreview
                      characterId={ref.characterId}
                      type={ref.type}
                      image={ref.image}
                      storagePath={ref.storagePath}
                      isPrimary={ref.isPrimary}
                    />
                  </div>

                  {/* Metadata & Storage Path */}
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                      {ref.description}
                    </p>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-mono">Storage Path:</span>
                      <span className="text-[11px] font-mono text-sky-300 truncate block">
                        {ref.storagePath}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Preview & Delete */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-xs">
                  <button
                    onClick={() => setActivePreviewRef(ref)}
                    className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Xem chi tiết' : 'Preview'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      {ref.id}
                    </span>
                    <button
                      onClick={() => handleDelete(ref.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete reference asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full-Screen / Zoom Preview Modal */}
      {activePreviewRef && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  #{String(activePreviewRef.type || 'ref').toUpperCase()}
                </span>
                <h4 className="text-base font-bold text-white">
                  {character?.displayName || characterId} ({characterVersionId})
                </h4>
                {activePreviewRef.isPrimary && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                    ★ PRIMARY
                  </span>
                )}
              </div>

              <button
                onClick={() => setActivePreviewRef(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Image Stage */}
            <div className="w-full h-80 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center p-4 relative">
              {activePreviewRef.image && activePreviewRef.image.startsWith('data:') ? (
                <img
                  src={activePreviewRef.image}
                  alt={activePreviewRef.description}
                  className="max-h-full max-w-full object-contain rounded shadow-lg"
                />
              ) : (
                <ReferenceCardPreview
                  characterId={activePreviewRef.characterId}
                  type={activePreviewRef.type}
                  image={activePreviewRef.image}
                  storagePath={activePreviewRef.storagePath}
                  isPrimary={activePreviewRef.isPrimary}
                  className="h-full"
                />
              )}
            </div>

            {/* Metadata breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">ASSET ID</span>
                <span className="text-xs font-mono text-white font-bold">{activePreviewRef.id}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">CANONICAL STORAGE PATH</span>
                <span className="text-xs font-mono text-sky-300 font-bold truncate block">
                  {activePreviewRef.storagePath}
                </span>
              </div>
            </div>

            {/* Description & Prompt conditioning preview */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="text-[10px] text-slate-400 block font-mono">GENERATION CONDITIONING INJECTION</span>
              <p className="font-mono text-amber-300/90 text-[11px] leading-relaxed">
                [Reference Asset: {character?.displayName || characterId} ({characterVersionId}) -&gt; "{activePreviewRef.storagePath}" | Type: {activePreviewRef.type} | ID: {activePreviewRef.id}]
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {!activePreviewRef.isPrimary ? (
                <button
                  onClick={() => {
                    handleSetPrimary(activePreviewRef.id);
                    setActivePreviewRef(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Đặt làm Ảnh tham chiếu chính' : 'Set as Primary Reference'}</span>
                </button>
              ) : (
                <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {language === 'vi' ? 'Đang là ảnh tham chiếu chính' : 'Currently active primary reference'}
                </span>
              )}

              <button
                onClick={() => {
                  handleDelete(activePreviewRef.id);
                  setActivePreviewRef(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Xóa ảnh' : 'Delete Asset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
