import React, { useState } from 'react';
import {
  Shot,
  Character,
  CharacterVersion,
  GlobalStyleVersion,
} from '../../types';
import { PromptPreviewResult } from '../../services/storyboardService';
import {
  X,
  Copy,
  Check,
  Sparkles,
  Lock,
  Layers,
  Camera,
  Info,
} from 'lucide-react';

interface ShotPromptPreviewModalProps {
  shot: Shot;
  promptData: PromptPreviewResult;
  characters: Character[];
  characterVersions: CharacterVersion[];
  styleVersions: GlobalStyleVersion[];
  onClose: () => void;
}

export const ShotPromptPreviewModal: React.FC<ShotPromptPreviewModalProps> = ({
  shot,
  promptData,
  characters,
  characterVersions,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'full' | 'breakdown'>('full');

  const handleCopy = () => {
    navigator.clipboard.writeText(promptData.fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      id="shot-prompt-preview-modal"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                AI Generation Prompt Preview &bull; Shot #{shot.shotNumber}
              </h3>
              <p className="text-xs text-slate-500">
                {shot.shotType} &bull; Scene #{shot.sceneNumber} &bull; {shot.durationSeconds}s
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Derived Output Warning Note */}
        <div className="bg-amber-50/80 border-b border-amber-200/70 px-6 py-3 text-xs text-amber-900 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Đặc tính Đầu ra Phái sinh (Derived Output):</strong> Prompt AI này được tổng hợp tự động theo thời gian thực từ <strong>Character DNA</strong>, <strong>Style DNA</strong>, và các tham số phân cảnh bất biến của Episode. Prompt chỉ có tính chất tham khảo & xuất lệnh; không dùng để lưu trữ thay thế dữ liệu gốc.
          </div>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('full')}
              className={`text-xs font-semibold pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === 'full'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Toàn bộ Prompt Tổng hợp (Full Prompt)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('breakdown')}
              className={`text-xs font-semibold pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === 'breakdown'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Phân tách Thành phần (DNA Breakdown)
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 mb-2 rounded-lg border transition-colors ${
              copied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Đã sao chép prompt!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Sao chép Prompt
              </>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-sm">
          {activeTab === 'full' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Cấu trúc: Style DNA + Character DNA + Environment + Camera + Action + Continuity + Dialogue</span>
                <span className="font-mono text-[11px]">{promptData.fullPrompt.length} ký tự</span>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800 selection:bg-indigo-500 selection:text-white">
                {promptData.fullPrompt}
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Style DNA */}
              <div className="border border-purple-200 bg-purple-50/50 rounded-xl p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-purple-900 flex items-center">
                  <Lock className="w-3.5 h-3.5 mr-1.5 text-purple-700" />
                  1. Phong cách mỹ thuật (Style DNA Snapshot)
                </div>
                <p className="text-xs font-mono text-purple-800 bg-white/70 p-2 rounded border border-purple-100">
                  {promptData.styleDna}
                </p>
              </div>

              {/* Character DNA */}
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-emerald-900 flex items-center">
                  <Lock className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                  2. Đặc tả nhân vật bất biến (Character DNA Snapshots)
                </div>
                {promptData.charactersDna.map((charDna, idx) => (
                  <p
                    key={idx}
                    className="text-xs font-mono text-emerald-900 bg-white/80 p-2 rounded border border-emerald-100"
                  >
                    {charDna}
                  </p>
                ))}
              </div>

              {/* Resolved Reference Image Assets */}
              {promptData.referenceAssets && promptData.referenceAssets.length > 0 && (
                <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-3.5 space-y-2">
                  <div className="text-xs font-bold text-amber-900 flex items-center justify-between">
                    <span className="flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                      2b. Ảnh tham chiếu phân giải từ Locked Version (Resolved Reference Assets)
                    </span>
                    <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      characters/&#123;charId&#125;/&#123;verId&#125;/
                    </span>
                  </div>
                  {promptData.referenceAssets.map((refAsset, idx) => (
                    <p
                      key={idx}
                      className="text-xs font-mono text-amber-900 bg-white/90 p-2 rounded border border-amber-200 break-all"
                    >
                      {refAsset}
                    </p>
                  ))}
                </div>
              )}

              {/* Environment & Camera */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-slate-200 bg-slate-50 rounded-xl p-3 space-y-1">
                  <div className="text-xs font-bold text-slate-700 flex items-center">
                    <Layers className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                    3. Bối cảnh (Environment)
                  </div>
                  <p className="text-xs text-slate-800 bg-white p-2 rounded border border-slate-100 font-mono">
                    {promptData.environment}
                  </p>
                </div>

                <div className="border border-slate-200 bg-slate-50 rounded-xl p-3 space-y-1">
                  <div className="text-xs font-bold text-slate-700 flex items-center">
                    <Camera className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                    4. Góc máy & Ánh sáng (Camera & Lighting)
                  </div>
                  <p className="text-xs text-slate-800 bg-white p-2 rounded border border-slate-100 font-mono">
                    {promptData.cameraAndLighting}
                  </p>
                </div>
              </div>

              {/* Action & Continuity */}
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-slate-700 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                  5. Hành động & Biểu cảm (Action & Emotion)
                </div>
                <p className="text-xs text-slate-800 bg-white p-2 rounded border border-slate-100 font-mono">
                  {promptData.actionAndEmotion}
                </p>
              </div>

              {/* Continuity */}
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-slate-700 flex items-center">
                  <Layers className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                  6. Tính liên tục (Continuity Constraints)
                </div>
                <p className="text-xs text-slate-800 bg-white p-2 rounded border border-slate-100 font-mono">
                  {promptData.continuity}
                </p>
              </div>

              {/* Dialogue */}
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-slate-700">
                  7. Lời thoại (Dialogue Cue)
                </div>
                <p className="text-xs text-slate-800 bg-white p-2 rounded border border-slate-100 font-mono">
                  {promptData.dialogueCue}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center">
            <Lock className="w-3 h-3 mr-1 text-emerald-600" />
            Character DNA: Độc lập 100% với Video Provider
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
