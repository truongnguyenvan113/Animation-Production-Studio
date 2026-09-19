import React, { useState } from 'react';
import { LanguageMode, ImageGenerationProvider } from '../../types';
import { ProviderAdapterService } from '../../services/providerAdapterService';
import { ImageAdapterRegistry } from '../../services/adapters';
import { IMAGE_PROVIDER_SPECS } from '../../services/imageGenerationService';
import {
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Play,
  Clock,
  Layers,
  Check,
  RefreshCw,
  Sliders,
  ExternalLink,
} from 'lucide-react';

interface ProviderAdaptersViewProps {
  language: LanguageMode;
}

export const ProviderAdaptersView: React.FC<ProviderAdaptersViewProps> = ({
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});
  const [simulateRateLimitMap, setSimulateRateLimitMap] = useState<Record<string, boolean>>({});
  const [forceRerender, setForceRerender] = useState(0);

  const videoAdapters = ProviderAdapterService.getAllAdapters();
  const registry = ImageAdapterRegistry.getInstance();
  const imageAdapters = registry.getAllAdapters();

  const formatLabel = (en: string, vi: string) => {
    if (language === 'vi') return vi;
    if (language === 'en') return en;
    return `${en} / ${vi}`;
  };

  const handleModelChange = (providerId: ImageGenerationProvider, model: string) => {
    registry.setActiveModel(providerId, model);
    setForceRerender((v) => v + 1);
  };

  const handleRunAdapterTest = async (providerId: ImageGenerationProvider) => {
    setIsTesting((prev) => ({ ...prev, [providerId]: true }));
    try {
      const activeModel = registry.getActiveModel(providerId);
      const shouldSimulateRateLimit = !!simulateRateLimitMap[providerId];

      // Build a strictly isolated sample snapshot for testing the adapter
      const sampleSnapshot = {
        jobId: `test_job_${Date.now()}`,
        shotId: 'shot_ep009_s01_01',
        episodeId: 'ep_009',
        storyboardId: 'sb_ep009',
        sceneNumber: 1,
        shotNumber: 1,
        iterationNumber: 1,
        deterministicPayloadHash: 'a8b9c0d1e2f34567890123456789abcd',
        prompt:
          '3D CGI Pixar Style: Pi and Kem sharing a warm smile at the dining table, volumetric morning lighting, tactile textures, cinematic wide 16:9.',
        negativePrompt: 'blurry, low quality, 2d, watermark',
        characterVersionIds: {
          char_pi: 'cver_pi_1_0',
          char_kem: 'cver_kem_1_0',
        },
        referenceAssetIds: ['ref_pi_front_01', 'ref_kem_front_01'],
        referenceAssetUrls: {
          ref_pi_front_01: 'characters/char_pi/cver_pi_1_0/front.png',
          ref_kem_front_01: 'characters/char_kem/cver_kem_1_0/front.png',
        },
        styleSnapshot: {
          id: 'gstyle_ver_1_0',
          versionNumber: '1.0',
          name: 'Pi & Kem 3D Feature Animation Standard',
          positivePrompt: 'Stylized 3D CGI Animation, Pixar & Illumination Quality, Rich Subsurface Scattering',
          negativePrompt: 'realistic human, photographic, 2d flat',
          colorPaletteRule: 'Warm Pastel Palette (#0284c7, #e11d48, #f59e0b)',
          lightingRule: 'Volumetric Soft Studio 3D Light with subtle rim light',
        },
        camera: {
          shotType: 'Medium Shot',
          framing: 'Rule of Thirds',
          cameraAngle: 'Eye-level',
        },
        lighting: 'Warm Morning Studio Key Light',
        composition: {
          location: 'Pi & Kem Dining Room',
          action: 'Sharing breakfast pancakes',
          emotion: 'Affectionate Joy',
          visualPurpose: 'Establish sibling warmth',
          characterIds: ['char_pi', 'char_kem'],
        },
        params: {
          aspectRatio: '16:9',
          resolution: '1920x1080',
          seed: 49281,
          steps: 30,
        },
        provider: providerId,
        modelName: activeModel,
      };

      const result = await registry.executeGeneration(sampleSnapshot, {
        simulateRateLimit: shouldSimulateRateLimit,
        maxRetries: 2,
      });

      setTestResults((prev) => ({ ...prev, [providerId]: result }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          provider: providerId,
          model: registry.getActiveModel(providerId),
          requestId: `err_${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'failed',
          error: err.message || 'Adapter execution error',
        },
      }));
    } finally {
      setIsTesting((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {formatLabel('Provider Adapter Layer', 'Lớp Adapter Kết Nối Nhà Cung Cấp')}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Phase 4.2 Real Image Adapters
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {formatLabel(
                'Decoupled provider adapter layer executing immutable job snapshots with rate-limit protection and model fallback.',
                'Lớp adapter độc lập nhận duy nhất snapshot bất biến của Job, hỗ trợ bắt lỗi giới hạn tần suất (rate-limit) và chuyển đổi model linh hoạt.',
              )}
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('image')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'image'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {formatLabel('Image Provider Adapters (Phase 4.2)', 'Adapter Tạo Ảnh (Phase 4.2)')}
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'video'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {formatLabel('Video AI Specs (Architecture)', 'Quy Cách Video AI')}
          </button>
        </div>
      </div>

      {/* Decoupling Principle Box */}
      <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-300 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>{formatLabel('Strict Immutability & Rate-Limit Contract', 'Bảo đảm Bất Biến & Xử Lý Quota Chặt Chẽ')}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Zero Active State Leak Guarantee
          </span>
        </div>
        <p className="leading-relaxed">
          {formatLabel(
            'Provider adapters receive ONLY the frozen Job snapshot (prompt, Character Version IDs, Reference Asset IDs/URLs, Style Snapshot, camera, lighting, composition). The adapter layer never accesses active or draft Character/Style state repositories. Each adapter handles retries with exponential backoff and provides structured rate-limit diagnostics with recommended fallback models.',
            'Adapter chỉ nhận bản chụp bất biến (prompt, Version IDs, Reference Asset URLs, Style Snapshot, camera, lighting, composition) và tuyệt đối không chạm vào kho dữ liệu nhân vật/style active. Lớp adapter tự động xử lý thử lại theo số mũ (exponential backoff) và báo lỗi rate-limit có cấu trúc cùng gợi ý model thay thế.',
          )}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REAL IMAGE PROVIDER ADAPTERS */}
      {/* ========================================================================= */}
      {activeTab === 'image' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {imageAdapters.map((adapter) => {
              const spec = IMAGE_PROVIDER_SPECS.find((s) => s.id === adapter.providerId);
              const activeModel = registry.getActiveModel(adapter.providerId);
              const testResult = testResults[adapter.providerId];
              const running = isTesting[adapter.providerId];
              const isSimulatingRateLimit = !!simulateRateLimitMap[adapter.providerId];

              return (
                <div
                  key={adapter.providerId}
                  className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all p-5 flex flex-col justify-between shadow-lg space-y-4"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">
                            {spec?.name || adapter.providerId}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {adapter.providerId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {spec?.description}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
                          adapter.providerId === 'mock-studio'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {spec?.badge || 'Adapter Ready'}
                      </span>
                    </div>

                    {/* Model Selector */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-slate-400 font-medium flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-blue-400" />
                          <span>{formatLabel('Active Model Selection', 'Chọn Mô Hình Hoạt Động')}:</span>
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {adapter.supportedModels.length} models available
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={activeModel}
                          onChange={(e) => handleModelChange(adapter.providerId, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {adapter.supportedModels.map((m) => (
                            <option key={m} value={m}>
                              {m} {m === adapter.defaultModel ? '(Default)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {formatLabel(
                          'When primary model hits rate limit or quota bounds, switch to alternate model or fallback to Mock Studio.',
                          'Khi mô hình chính chạm giới hạn quota, chuyển đổi nhanh sang model phụ hoặc Mock Studio.',
                        )}
                      </p>
                    </div>

                    {/* Specifications List */}
                    <div className="space-y-2 pt-1 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">{formatLabel('Retry & Rate-Limit Layer', 'Lớp xử lý Rate-Limit')}:</span>
                        <span className="font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Exponential Backoff Active
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">{formatLabel('Snapshot Isolation', 'Cô lập Snapshot')}:</span>
                        <span className="font-semibold text-blue-300">
                          100% Frozen Inputs Only
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">{formatLabel('Max Resolution', 'Độ phân giải tối đa')}:</span>
                        <span className="font-semibold text-slate-300">
                          {spec?.maxResolution || '2048x2048'}
                        </span>
                      </div>
                    </div>

                    {/* Test Execution Controls */}
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                          <input
                            type="checkbox"
                            checked={isSimulatingRateLimit}
                            onChange={(e) =>
                              setSimulateRateLimitMap((prev) => ({
                                ...prev,
                                [adapter.providerId]: e.target.checked,
                              }))
                            }
                            className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                          />
                          <span>{formatLabel('Simulate Rate Limit (429 / Quota)', 'Mô phỏng Chạm Quota (429)')}</span>
                        </label>

                        <button
                          onClick={() => handleRunAdapterTest(adapter.providerId)}
                          disabled={running}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                        >
                          {running ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              {formatLabel('Testing...', 'Đang kiểm tra...')}
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              {formatLabel('Test Adapter Call', 'Chạy Thử Adapter')}
                            </>
                          )}
                        </button>
                      </div>

                      {/* Test Result Display */}
                      {testResult && (
                        <div
                          className={`p-3 rounded-xl text-xs space-y-2 border transition-all ${
                            testResult.status === 'completed'
                              ? 'bg-slate-950/90 border-emerald-500/40 text-slate-300'
                              : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono text-[11px]">
                            <span className="flex items-center gap-1 font-bold">
                              {testResult.status === 'completed' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              )}
                              {testResult.status.toUpperCase()} ({testResult.executionDurationMs}ms)
                            </span>
                            <span className="text-slate-400">
                              Req: {testResult.requestId}
                            </span>
                          </div>

                          {testResult.error && (
                            <div className="p-2 rounded bg-rose-950/50 border border-rose-800/60 font-mono text-[11px] text-rose-300 space-y-1">
                              <p className="font-bold">Error Message:</p>
                              <p>{testResult.error}</p>
                              {testResult.rateLimitInfo && (
                                <div className="mt-2 pt-2 border-t border-rose-800/40 text-[10px] text-amber-300 flex items-center justify-between">
                                  <span>
                                    Suggested Alternative: <strong>{testResult.rateLimitInfo.suggestedAlternativeModel}</strong>
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleModelChange(
                                        adapter.providerId,
                                        testResult.rateLimitInfo.suggestedAlternativeModel
                                      )
                                    }
                                    className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors"
                                  >
                                    Apply Alternative
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {testResult.outputAsset && (
                            <div className="space-y-1.5">
                              <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                                <img
                                  src={testResult.outputAsset.imageUrl}
                                  alt="Adapter output test"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                <span>Model: {testResult.model}</span>
                                <span className="text-emerald-400 font-bold">Immutable Snapshot Verified</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer status */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Adapter: {adapter.providerId}</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pipeline Ready
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VIDEO GENERATION SPECIFICATIONS (PHASE 3 BLUEPRINT) */}
      {/* ========================================================================= */}
      {activeTab === 'video' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {videoAdapters.map((adapter) => (
              <div
                key={adapter.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all p-5 flex flex-col justify-between shadow-lg space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {adapter.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {adapter.description}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shrink-0">
                      {adapter.category}
                    </span>
                  </div>

                  {/* Supported Specs list */}
                  <div className="space-y-2.5 pt-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">{formatLabel('Max Duration per Clip', 'Thời lượng tối đa / clip')}:</span>
                      <span className="font-semibold text-white">{adapter.maxDurationSeconds}s</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">{formatLabel('Adapter Status', 'Trạng thái adapter')}:</span>
                      <span className="font-semibold text-emerald-400">
                        {adapter.status}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">
                        {formatLabel('Supported Aspect Ratios', 'Tỷ lệ khung hình hỗ trợ')}:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {adapter.supportedRatios.map((ar, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                          >
                            {ar}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">
                        {formatLabel('Prompt Syntax Pattern', 'Cấu trúc khuôn mẫu prompt')}:
                      </span>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-emerald-300 break-words">
                        {adapter.promptSyntaxPattern}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">
                        {formatLabel('DNA Independence Guarantee', 'Bảo đảm độc lập DNA')}:
                      </span>
                      <p className="text-[11px] text-slate-300 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                        "{adapter.dnaIndependenceGuarantee}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Video Engine Blueprint</span>
                  <span className="text-cyan-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Phase 5
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
