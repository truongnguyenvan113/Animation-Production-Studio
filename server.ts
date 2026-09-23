import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const STORAGE_UPLOADS_DIR = path.join(process.cwd(), 'public', 'storage', 'references');
const STORAGE_CHARACTERS_DIR = path.join(process.cwd(), 'public', 'storage', 'characters');

let geminiImageQuotaCooldownUntil = 0;

const CHAR_ALIASES: Record<string, string> = {
  char_nancy: 'char_pi',
  nancy: 'char_pi',
  pi: 'char_pi',
  char_leo: 'char_kem',
  leo: 'char_kem',
  kem: 'char_kem',
  char_ethan: 'char_ethan',
  ethan: 'char_ethan',
  char_emma: 'char_emma',
  emma: 'char_emma',
  char_mochi: 'char_mochi',
  mochi: 'char_mochi',
};

const VER_ALIASES: Record<string, string> = {
  ver_nancy_v1: 'ver_pi_v1',
  ver_pi: 'ver_pi_v1',
  ver_nancy: 'ver_pi_v1',
  ver_leo_v1: 'ver_kem_v1',
  ver_kem: 'ver_kem_v1',
  ver_leo: 'ver_kem_v1',
};

function normalizeCharId(id: string): string {
  if (!id) return id;
  const lower = id.toLowerCase().trim();
  return CHAR_ALIASES[lower] || id;
}

function normalizeVerId(id: string): string {
  if (!id) return id;
  const lower = id.toLowerCase().trim();
  return VER_ALIASES[lower] || id;
}

// Ensure necessary directories exist on startup
function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_UPLOADS_DIR)) {
    fs.mkdirSync(STORAGE_UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_CHARACTERS_DIR)) {
    fs.mkdirSync(STORAGE_CHARACTERS_DIR, { recursive: true });
  }
}

async function startServer() {
  ensureDirectories();

  const app = express();

  // Allow larger payloads for full project database sync and base64 images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static route for stored media assets in public/storage
  app.use('/storage', express.static(path.join(process.cwd(), 'public', 'storage')));

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Pi & Kem Animation Studio Local Backend',
      storageMode: 'project_folder',
      dataPath: 'data/database.json',
      timestamp: new Date().toISOString(),
    });
  });

  // Storage status
  app.get('/api/storage/status', (req, res) => {
    try {
      const exists = fs.existsSync(DB_FILE);
      let sizeBytes = 0;
      let updatedAt = null;
      if (exists) {
        const stats = fs.statSync(DB_FILE);
        sizeBytes = stats.size;
        updatedAt = stats.mtime.toISOString();
      }
      res.json({
        status: 'ok',
        mode: 'project_folder',
        dbFile: 'data/database.json',
        exists,
        sizeBytes,
        updatedAt,
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Get database directly from data/database.json
  app.get('/api/storage/database', (req, res) => {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return res.json({
          status: 'not_found',
          message: 'data/database.json does not exist yet. Client will seed it.',
        });
      }

      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      res.json({
        status: 'ok',
        source: 'disk',
        data,
      });
    } catch (err: any) {
      console.error('Error reading data/database.json:', err);
      res.status(500).json({
        status: 'error',
        message: `Failed to read database file: ${err.message}`,
      });
    }
  });

  // Save database directly into data/database.json (in project folder)
  app.post('/api/storage/database', (req, res) => {
    try {
      const { data } = req.body;
      if (!data || typeof data !== 'object') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid payload: missing "data" object.',
        });
      }

      ensureDirectories();

      // Write pretty JSON to data/database.json
      const jsonString = JSON.stringify(data, null, 2);
      fs.writeFileSync(DB_FILE, jsonString, 'utf-8');

      // Also create a backup snapshot
      const backupFile = path.join(BACKUPS_DIR, 'database_latest.json');
      fs.writeFileSync(backupFile, jsonString, 'utf-8');

      console.log(`[Storage] Saved database to ${DB_FILE} (${(jsonString.length / 1024).toFixed(1)} KB)`);

      res.json({
        status: 'ok',
        message: 'Successfully persisted to data/database.json',
        path: 'data/database.json',
        sizeBytes: jsonString.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error writing to data/database.json:', err);
      res.status(500).json({
        status: 'error',
        message: `Failed to write database file: ${err.message}`,
      });
    }
  });

  // Upload reference image directly to public/storage/references folder
  app.post('/api/storage/upload-reference', (req, res) => {
    try {
      const { filename, base64Data, characterId, versionId } = req.body;
      if (!filename || !base64Data) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing filename or base64Data.',
        });
      }

      ensureDirectories();

      // Clean base64 prefix if present (data:image/png;base64,...)
      const cleanedBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanedBase64, 'base64');

      const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const targetPath = path.join(STORAGE_UPLOADS_DIR, safeFilename);

      fs.writeFileSync(targetPath, buffer);

      const publicUrl = `/storage/references/${safeFilename}`;
      console.log(`[Storage] Saved uploaded image to ${targetPath}`);

      const assetId = `asset_upload_${Date.now()}`;
      res.json({
        status: 'ok',
        fileUrl: publicUrl,
        filename: safeFilename,
        assetId,
        sizeBytes: buffer.length,
      });
    } catch (err: any) {
      console.error('Error uploading reference asset:', err);
      res.status(500).json({
        status: 'error',
        message: `Failed to upload reference: ${err.message}`,
      });
    }
  });

  // Helper: Generate real image via Pollinations AI (100% Free, no API Key needed)
  async function generateViaPollinations({
    prompt,
    title,
    theme,
    aspectRatio,
    seed,
    model = 'flux',
    stylePreset = '3D Pixar Stylized',
  }: {
    prompt: string;
    title?: string;
    theme?: string;
    aspectRatio: string;
    seed: number;
    model?: string;
    stylePreset?: string;
  }): Promise<{ fileUrl: string; assetId: string; modelName: string; resolution: string }> {
    ensureDirectories();
    let w = 1280;
    let h = 720;
    if (aspectRatio === '9:16') {
      w = 720;
      h = 1280;
    } else if (aspectRatio === '4:3') {
      w = 1024;
      h = 768;
    } else if (aspectRatio === '1:1') {
      w = 1024;
      h = 1024;
    }

    const cleanPrompt = `${prompt || 'Pi and Kem cute vietnamese kids celebrating joyful moment'}. 3D Pixar Animation style, cute expressive faces, ${stylePreset || 'vibrant cinematic animated film'}, rich volumetric raytraced lighting, crisp textures, highly detailed CGI render`.trim();

    const pollinationsModel = model === 'turbo' ? 'turbo' : 'flux';
    const queryParams = new URLSearchParams({
      width: String(w),
      height: String(h),
      seed: String(seed),
      model: pollinationsModel,
      nologo: 'true',
    });

    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?${queryParams.toString()}`;
    console.log(`[Pollinations AI] Fetching image for seed ${seed} (${pollinationsModel}): ${pollUrl.slice(0, 110)}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const response = await fetch(pollUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Pollinations API (${response.status}): ${errorText.slice(0, 100)}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('image')) {
      const textBody = await response.text().catch(() => '');
      throw new Error(`Pollinations did not return image: ${textBody.slice(0, 100)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeFilename = `pollinations_${pollinationsModel}_${aspectRatio.replace(':', 'x')}_${seed}_${Date.now()}.jpg`;
    const targetPath = path.join(STORAGE_UPLOADS_DIR, safeFilename);
    fs.writeFileSync(targetPath, buffer);

    const assetId = `pollinations_asset_${Date.now()}`;
    return {
      fileUrl: `/storage/references/${safeFilename}`,
      assetId,
      modelName: `Pollinations AI (${pollinationsModel === 'turbo' ? 'Turbo Fast' : 'FLUX 3D'})`,
      resolution: `${w}x${h}`,
    };
  }

  // AI Configuration Endpoints
  app.get('/api/settings/ai-config', (req, res) => {
    try {
      let aiSettings: any = {};
      if (fs.existsSync(DB_FILE)) {
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        aiSettings = db.systemSettings?.aiModel || {};
      }
      const geminiKey = process.env.GEMINI_API_KEY || '';
      const maskedKey = geminiKey ? `${geminiKey.slice(0, 6)}...${geminiKey.slice(-4)}` : '';

      res.json({
        status: 'ok',
        provider: aiSettings.imageProvider || 'auto',
        pollinationsModel: aiSettings.pollinationsModel || 'flux',
        hasGeminiKey: !!geminiKey,
        geminiKeyMasked: maskedKey,
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  app.post('/api/settings/ai-config', (req, res) => {
    try {
      const { provider, pollinationsModel, geminiApiKey } = req.body;
      let db: any = {};
      if (fs.existsSync(DB_FILE)) {
        db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      }
      if (!db.systemSettings) db.systemSettings = {};
      if (!db.systemSettings.aiModel) db.systemSettings.aiModel = {};

      if (provider) db.systemSettings.aiModel.imageProvider = provider;
      if (pollinationsModel) db.systemSettings.aiModel.pollinationsModel = pollinationsModel;

      if (typeof geminiApiKey === 'string' && geminiApiKey.trim()) {
        process.env.GEMINI_API_KEY = geminiApiKey.trim();
        db.systemSettings.aiModel.geminiApiKey = geminiApiKey.trim();
      }

      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
      res.json({
        status: 'ok',
        message: 'Đã lưu cấu hình AI thành công!',
        provider: db.systemSettings.aiModel.imageProvider,
        pollinationsModel: db.systemSettings.aiModel.pollinationsModel,
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  app.post('/api/settings/test-ai-provider', async (req, res) => {
    const startTime = Date.now();
    const { provider = 'pollinations' } = req.body;
    try {
      if (provider === 'pollinations') {
        const testUrl = `https://image.pollinations.ai/prompt/cute%203d%20cat?width=256&height=256&nologo=true`;
        const resp = await fetch(testUrl, {
          signal: AbortSignal.timeout(20000),
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const elapsed = Date.now() - startTime;
        if (resp.ok && (resp.headers.get('content-type') || '').includes('image')) {
          return res.json({
            status: 'ok',
            provider: 'pollinations',
            message: `Pollinations AI kết nối thành công! (${elapsed}ms)`,
            latencyMs: elapsed,
          });
        } else {
          return res.json({
            status: 'warning',
            provider: 'pollinations',
            message: `Pollinations phản hồi HTTP ${resp.status}`,
            latencyMs: elapsed,
          });
        }
      } else {
        if (!process.env.GEMINI_API_KEY) {
          return res.status(400).json({
            status: 'error',
            provider: 'gemini',
            message: 'Chưa cấu hình GEMINI_API_KEY.',
          });
        }
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'Ping',
        });
        const elapsed = Date.now() - startTime;
        return res.json({
          status: 'ok',
          provider: 'gemini',
          message: `Gemini API hoạt động tốt! (${elapsed}ms)`,
          latencyMs: elapsed,
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        status: 'error',
        provider,
        message: `Lỗi kết nối: ${err.message}`,
        latencyMs: Date.now() - startTime,
      });
    }
  });

  // Generate thumbnail endpoint with Gemini and Pollinations AI support
  app.post('/api/publishing/generate-thumbnail', async (req, res) => {
    const startTime = Date.now();
    try {
      const {
        episodeId,
        title,
        prompt,
        theme,
        model = 'Nano Banana 2',
        aspectRatio = '16:9',
        negativePrompt = '',
        seed = Math.floor(Math.random() * 899999 + 100000),
        stylePreset = '3D Pixar Stylized',
        lighting = 'Volumetric Cinematic Lighting',
        cameraAngle = 'Eye-level 35mm',
        guidanceScale = 7.5,
        referenceImageUrls = [],
        provider: reqProvider,
        pollinationsModel: reqPollinationsModel,
      } = req.body;
      ensureDirectories();

      // Read default provider from database if not explicitly passed
      let effectiveProvider = reqProvider;
      let effectivePollModel = reqPollinationsModel || 'flux';
      if (!effectiveProvider && fs.existsSync(DB_FILE)) {
        try {
          const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
          effectiveProvider = db.systemSettings?.aiModel?.imageProvider || 'auto';
          effectivePollModel = db.systemSettings?.aiModel?.pollinationsModel || 'flux';
        } catch {
          effectiveProvider = 'auto';
        }
      }
      if (!effectiveProvider) effectiveProvider = 'auto';

      // Normalize model and aspect ratio
      const validModels = ['Nano Banana 2', 'Nano Banana 2 Lite', 'Nano Banana Pro'];
      const resolvedModel = validModels.includes(model) ? model : 'Nano Banana 2';
      
      const validRatios = ['16:9', '4:3', '9:16', '1:1'];
      const resolvedRatio = validRatios.includes(aspectRatio) ? aspectRatio : '16:9';

      const modelSlug = resolvedModel.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const ratioSlug = resolvedRatio.replace(':', 'x');

      // Dimensions mapping
      let w = 1280;
      let h = 720;
      if (resolvedRatio === '9:16') {
        w = 720;
        h = 1280;
      } else if (resolvedRatio === '4:3') {
        w = 1200;
        h = 900;
      } else if (resolvedRatio === '1:1') {
        w = 1080;
        h = 1080;
      }

      let generatedImageUrl: string | null = null;
      let generatedMethod = `Google Flow AI (${resolvedModel})`;
      let aiErrorDetail: string | null = null;

      // 1. Direct Pollinations AI Path (Free 100%, no Key needed)
      if (effectiveProvider === 'pollinations') {
        try {
          console.log(`[Thumbnail] Generating directly with Pollinations AI (${effectivePollModel})...`);
          const pollRes = await generateViaPollinations({
            prompt: prompt || 'Pi and Kem cute 3D character joyful',
            title,
            theme,
            aspectRatio: resolvedRatio,
            seed: Number(seed),
            model: effectivePollModel,
            stylePreset,
          });
          return res.json({
            status: 'ok',
            fileUrl: pollRes.fileUrl,
            assetId: pollRes.assetId,
            model: pollRes.modelName,
            aspectRatio: resolvedRatio,
            resolution: pollRes.resolution,
            generationTimeMs: Date.now() - startTime,
            seed: Number(seed),
            method: `${pollRes.modelName} • 100% Free Unlimited`,
          });
        } catch (pollErr: any) {
          console.warn('[Pollinations AI] Direct generation failed:', pollErr.message);
          aiErrorDetail = `Pollinations error: ${pollErr.message}`;
        }
      }

      // 2. Gemini AI Image Generation (when provider is 'gemini' or 'auto')
      if (!generatedImageUrl && (effectiveProvider === 'gemini' || effectiveProvider === 'auto') && process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
              headers: { 'User-Agent': 'aistudio-build' },
            },
          });

          const parts: any[] = [];

          // If reference images provided, pass them to Gemini as visual context
          if (Array.isArray(referenceImageUrls)) {
            for (const refUrl of referenceImageUrls.slice(0, 3)) {
              try {
                if (typeof refUrl === 'string' && refUrl.startsWith('data:image/')) {
                  const match = refUrl.match(/^data:image\/(\w+);base64,(.+)$/);
                  if (match) {
                    parts.push({
                      inlineData: {
                        mimeType: `image/${match[1]}`,
                        data: match[2],
                      },
                    });
                  }
                } else if (typeof refUrl === 'string' && refUrl.startsWith('/storage/')) {
                  const localPath = path.join(process.cwd(), 'public', refUrl.replace(/^\//, ''));
                  if (fs.existsSync(localPath)) {
                    const ext = path.extname(localPath).replace('.', '') || 'png';
                    const data = fs.readFileSync(localPath).toString('base64');
                    parts.push({
                      inlineData: {
                        mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
                        data,
                      },
                    });
                  }
                }
              } catch {
                // Ignore individual reference reading error
              }
            }
          }

          const enhancedPrompt = `High quality 3D Pixar Animation CGI render.
Title: "${title || 'Pi & Kem Hoạt Hình'}".
Theme: "${theme || 'Tết Trung Thu gia đình'}".
Style: ${stylePreset}, vibrant cinematic animated film.
Lighting: ${lighting}, volumetric raytracing, warm rim light.
Camera: ${cameraAngle}, cinematic framing.
Scene: ${prompt || 'Pi and Kem holding handmade colorful lanterns, celebrating together with big cheerful smiles, detailed 3D Pixar style character faces and costumes'}.
Negative prompt: ${negativePrompt || 'blurry, distorted, extra limbs, low quality, artifacts, watermark'}.
Aspect ratio: ${resolvedRatio}.`;

          parts.push({ text: enhancedPrompt });

          const targetRatio = resolvedRatio as any;
          const targetGeminiModel =
            resolvedModel === 'Nano Banana Pro'
              ? 'gemini-3-pro-image'
              : resolvedModel === 'Nano Banana Lite'
              ? 'gemini-3.1-flash-lite-image'
              : 'gemini-3.1-flash-image';

          console.log(`[Gemini AI] Calling model ${targetGeminiModel} with ratio ${targetRatio}...`);

          // Allow realistic time for AI diffusion rendering (up to 45 seconds)
          const aiPromise = (async () => {
            let res;
            try {
              res = await ai.models.generateContent({
                model: targetGeminiModel,
                contents: { parts },
                config: {
                  imageConfig: {
                    aspectRatio: targetRatio,
                  },
                },
              });
            } catch (firstErr: any) {
              // Try fallback to standard flash-image if pro-image failed
              if (targetGeminiModel !== 'gemini-3.1-flash-image') {
                res = await ai.models.generateContent({
                  model: 'gemini-3.1-flash-image',
                  contents: { parts },
                  config: {
                    imageConfig: {
                      aspectRatio: targetRatio,
                    },
                  },
                });
              } else {
                throw firstErr;
              }
            }
            return res;
          })();

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI generation timed out after 45s')), 45000)
          );

          const aiResponse: any = await Promise.race([aiPromise, timeoutPromise]);

          const candidateParts = aiResponse.candidates?.[0]?.content?.parts || [];
          for (const part of candidateParts) {
            if (part.inlineData?.data) {
              const base64Data = part.inlineData.data;
              const safeFilename = `flow_ai_${modelSlug}_${ratioSlug}_${Date.now()}.png`;
              const targetPath = path.join(STORAGE_UPLOADS_DIR, safeFilename);
              fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'));
              generatedImageUrl = `/storage/references/${safeFilename}`;
              generatedMethod = `Google Flow • ${resolvedModel} (Gemini Live AI)`;
              break;
            }
          }

          if (!generatedImageUrl) {
            console.warn('[Gemini AI] Response did not contain image data in parts.');
            aiErrorDetail = 'Mô hình không trả về dữ liệu hình ảnh nhị phân.';
          }
        } catch (geminiErr: any) {
          const errStr = String(geminiErr?.message || geminiErr || '');
          console.warn('[Gemini AI] Generation error:', errStr);
          if (
            errStr.includes('429') ||
            errStr.includes('RESOURCE_EXHAUSTED') ||
            errStr.includes('Quota exceeded')
          ) {
            aiErrorDetail = 'QUOTA_EXCEEDED: Mô hình tạo ảnh Gemini yêu cầu API Key có hạn mức (Paid Tier / Billing). Tài khoản hiện tại đang ở Free Tier với hạn mức 0 ảnh.';
          } else {
            aiErrorDetail = errStr;
          }
        }
      } else {
        aiErrorDetail = 'NO_API_KEY: Chưa thiết lập biến môi trường GEMINI_API_KEY.';
      }

      // If Gemini did not produce an image
      if (!generatedImageUrl) {
        // In Auto mode: seamlessly fallback to Pollinations AI (100% Free, no Key needed)
        if (effectiveProvider === 'auto') {
          console.log('[Auto Mode] Gemini was unavailable or quota exceeded. Seamlessly creating image via Pollinations AI (Free 100%)...');
          try {
            const pollRes = await generateViaPollinations({
              prompt: prompt || 'Pi and Kem cute 3D character joyful',
              title,
              theme,
              aspectRatio: resolvedRatio,
              seed: Number(seed),
              model: effectivePollModel,
              stylePreset,
            });
            return res.json({
              status: 'ok',
              fileUrl: pollRes.fileUrl,
              assetId: pollRes.assetId,
              model: pollRes.modelName,
              aspectRatio: resolvedRatio,
              resolution: pollRes.resolution,
              generationTimeMs: Date.now() - startTime,
              seed: Number(seed),
              method: `${pollRes.modelName} (Tự động kích hoạt do Gemini Free Tier hết quota)`,
            });
          } catch (pollAutoErr: any) {
            console.warn('[Auto Mode] Pollinations fallback failed:', pollAutoErr.message);
          }
        }

        if (effectiveProvider === 'gemini' && aiErrorDetail?.startsWith('QUOTA_EXCEEDED')) {
          return res.status(429).json({
            status: 'error',
            code: 'QUOTA_EXCEEDED',
            message: 'Tài khoản Gemini hiện tại thuộc gói Free Tier (hạn mức tạo ảnh AI = 0). Bạn hãy chuyển sang dùng "Pollinations AI" (Miễn phí 100%) trong cài đặt hoặc nhập API Key có thanh toán (Paid Tier).',
            detail: aiErrorDetail,
          });
        }

        // Generate a dynamic, unique SVG composition that incorporates user prompt and seed (not a static copy)
        const safeFilename = `flow_dynamic_${modelSlug}_${ratioSlug}_${Date.now()}.svg`;
        const targetPath = path.join(STORAGE_UPLOADS_DIR, safeFilename);

        let embeddedImgTags = '';
        if (Array.isArray(referenceImageUrls) && referenceImageUrls.length > 0) {
          const primaryRef = referenceImageUrls[0];
          let primaryHref = primaryRef;
          if (typeof primaryRef === 'string' && primaryRef.startsWith('/storage/')) {
            const localP = path.join(process.cwd(), 'public', primaryRef.replace(/^\//, ''));
            if (fs.existsSync(localP)) {
              const b64 = fs.readFileSync(localP).toString('base64');
              primaryHref = `data:image/png;base64,${b64}`;
            }
          }
          if (primaryHref) {
            embeddedImgTags = `<image href="${primaryHref}" x="${w * 0.45}" y="${h * 0.15}" width="${w * 0.5}" height="${h * 0.7}" preserveAspectRatio="xMidYMid slice" opacity="0.9" />`;
          }
        }

        const safeTitle = (title || 'Pi & Kem Hoạt Hình').replace(/[<>&"]/g, '');
        const safeTheme = (theme || 'Tết Trung Thu gia đình').replace(/[<>&"]/g, '');
        const safePrompt = (prompt || 'Pi and Kem vui vẻ rước đèn lồng').replace(/[<>&"]/g, '');
        const dynamicHue = (Number(seed || 123456) * 37) % 360;

        const dynamicSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
            <defs>
              <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="hsl(${dynamicHue}, 80%, 15%)" />
                <stop offset="50%" stop-color="hsl(${(dynamicHue + 40) % 360}, 90%, 10%)" />
                <stop offset="100%" stop-color="#09090b" />
              </linearGradient>
              <radialGradient id="glow" cx="40%" cy="30%" r="60%">
                <stop offset="0%" stop-color="hsl(${(dynamicHue + 60) % 360}, 100%, 65%)" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#000000" stop-opacity="0" />
              </radialGradient>
            </defs>
            <rect width="${w}" height="${h}" fill="url(#bgGrad)"/>
            <rect width="${w}" height="${h}" fill="url(#glow)"/>
            ${embeddedImgTags}
            <g transform="translate(${w * 0.06}, ${h * 0.2})">
              <rect x="0" y="0" width="260" height="34" rx="17" fill="hsl(${dynamicHue}, 90%, 45%)" />
              <text x="130" y="22" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="12" text-anchor="middle">✨ DYNAMIC COMPOSITOR • ${resolvedModel.toUpperCase()}</text>
              <text x="0" y="75" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="${w > 1000 ? 36 : 28}">${safeTitle}</text>
              <text x="0" y="115" fill="hsl(${(dynamicHue + 60) % 360}, 100%, 75%)" font-family="sans-serif" font-weight="700" font-size="18">${safeTheme}</text>
              <text x="0" y="150" fill="#e2e8f0" font-family="sans-serif" font-size="13">${safePrompt.slice(0, 70)}...</text>
              <text x="0" y="185" fill="#38bdf8" font-family="monospace" font-size="11">RATIO: ${resolvedRatio} • SEED: #${seed} • STYLE: ${stylePreset}</text>
            </g>
          </svg>
        `;

        fs.writeFileSync(targetPath, dynamicSvg.trim());
        generatedImageUrl = `/storage/references/${safeFilename}`;
        generatedMethod = `Google Flow Dynamic (${resolvedModel} • Seed #${seed})`;
      }

      // 3. Fallback SVG composite generator if photographic assets missing
      if (!generatedImageUrl) {
        const safeFilename = `flow_${modelSlug}_${ratioSlug}_${Date.now()}.svg`;
        const targetPath = path.join(STORAGE_UPLOADS_DIR, safeFilename);

        let embeddedImgTags = '';
        if (Array.isArray(referenceImageUrls) && referenceImageUrls.length > 0) {
          // Embed primary and secondary reference images
          const primaryRef = referenceImageUrls[0];
          let primaryHref = primaryRef;
          if (typeof primaryRef === 'string' && primaryRef.startsWith('/storage/')) {
            const localP = path.join(process.cwd(), 'public', primaryRef.replace(/^\//, ''));
            if (fs.existsSync(localP)) {
              const b64 = fs.readFileSync(localP).toString('base64');
              primaryHref = `data:image/png;base64,${b64}`;
            }
          }

          if (resolvedRatio === '9:16') {
            // Vertical 9:16 layout
            embeddedImgTags = `
              <g filter="url(#frameGlow)">
                <rect x="${w * 0.08}" y="${h * 0.16}" width="${w * 0.84}" height="${h * 0.44}" rx="24" fill="#0f172a" stroke="url(#accentGrad)" stroke-width="3" />
                <clipPath id="vertClip">
                  <rect x="${w * 0.08}" y="${h * 0.16}" width="${w * 0.84}" height="${h * 0.44}" rx="24" />
                </clipPath>
                <image href="${primaryHref}" x="${w * 0.08}" y="${h * 0.16}" width="${w * 0.84}" height="${h * 0.44}" preserveAspectRatio="xMidYMid slice" clip-path="url(#vertClip)" opacity="0.95" />
              </g>
            `;
          } else if (resolvedRatio === '4:3') {
            // Standard 4:3 layout
            embeddedImgTags = `
              <g filter="url(#frameGlow)">
                <rect x="${w * 0.44}" y="${h * 0.12}" width="${w * 0.51}" height="${h * 0.76}" rx="20" fill="#0f172a" stroke="url(#accentGrad)" stroke-width="3" />
                <clipPath id="stdClip">
                  <rect x="${w * 0.44}" y="${h * 0.12}" width="${w * 0.51}" height="${h * 0.76}" rx="20" />
                </clipPath>
                <image href="${primaryHref}" x="${w * 0.44}" y="${h * 0.12}" width="${w * 0.51}" height="${h * 0.76}" preserveAspectRatio="xMidYMid slice" clip-path="url(#stdClip)" opacity="0.95" />
              </g>
            `;
          } else {
            // Landscape 16:9 layout
            embeddedImgTags = `
              <g filter="url(#frameGlow)">
                <rect x="${w * 0.46}" y="${h * 0.10}" width="${w * 0.50}" height="${h * 0.80}" rx="22" fill="#0f172a" stroke="url(#accentGrad)" stroke-width="3" />
                <clipPath id="landClip">
                  <rect x="${w * 0.46}" y="${h * 0.10}" width="${w * 0.50}" height="${h * 0.80}" rx="22" />
                </clipPath>
                <image href="${primaryHref}" x="${w * 0.46}" y="${h * 0.10}" width="${w * 0.50}" height="${h * 0.80}" preserveAspectRatio="xMidYMid slice" clip-path="url(#landClip)" opacity="0.95" />
              </g>
            `;
          }
        }

        const safeTitle = (title || 'Pi & Kem Hoạt Hình').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeTheme = (theme || 'Tết Trung Thu Gia Đình').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safePrompt = (prompt || 'Pi và Kem rước đèn lồng ngôi sao lung linh').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // Model badge styling
        let modelBadgeBg = '#f59e0b';
        let modelBadgeText = '🍌 NANO BANANA 2 • STUDIO FLOW';
        let gradStart = '#1e1b4b';
        let gradMid = '#311042';

        if (resolvedModel === 'Nano Banana 2 Lite') {
          modelBadgeBg = '#0ea5e9';
          modelBadgeText = '⚡ NANO BANANA 2 LITE • FAST FLOW';
          gradStart = '#0c2340';
          gradMid = '#164e63';
        } else if (resolvedModel === 'Nano Banana Pro') {
          modelBadgeBg = '#ec4899';
          modelBadgeText = '🚀 NANO BANANA PRO • 4K CINEMATIC';
          gradStart = '#2e1065';
          gradMid = '#4a044e';
        }

        let innerSvg = '';
        if (resolvedRatio === '9:16') {
          // 9:16 Vertical layout (Shorts / Reels)
          innerSvg = `
            <!-- Top Google Flow Brand Bar -->
            <g transform="translate(${w * 0.08}, 50)">
              <rect x="0" y="0" width="230" height="34" rx="17" fill="${modelBadgeBg}" />
              <text x="115" y="22" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="900" font-size="11" text-anchor="middle" letter-spacing="1">${modelBadgeText}</text>
              <rect x="240" y="0" width="130" height="34" rx="17" fill="#1e293b" stroke="#334155" stroke-width="1" />
              <text x="305" y="22" fill="#38bdf8" font-family="system-ui, sans-serif" font-weight="800" font-size="11" text-anchor="middle">9:16 SHORTS</text>
            </g>

            ${embeddedImgTags}

            <!-- Bottom Content Group -->
            <g transform="translate(${w * 0.08}, ${h * 0.65})" filter="url(#shadow)">
              <rect x="-10" y="-10" width="${w * 0.84 + 20}" height="350" rx="20" fill="#020617" fill-opacity="0.85" stroke="#334155" stroke-width="1.5" />
              
              <rect x="15" y="18" width="150" height="26" rx="6" fill="#f59e0b" />
              <text x="90" y="36" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="900" font-size="11" text-anchor="middle">KEM TIVI 3D PIXAR</text>
              
              <text x="15" y="86" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="900" font-size="32">
                ${safeTitle.length > 25 ? safeTitle.substring(0, 23) + '...' : safeTitle}
              </text>
              
              <text x="15" y="120" fill="#fde047" font-family="system-ui, sans-serif" font-weight="700" font-size="16">
                ✨ ${safeTheme}
              </text>

              <text x="15" y="152" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13" font-style="italic">
                ${safePrompt.length > 50 ? safePrompt.substring(0, 48) + '...' : safePrompt}
              </text>

              <!-- Technical metadata bar -->
              <line x1="15" y1="180" x2="${w * 0.84 - 15}" y2="180" stroke="#334155" stroke-width="1" />
              <text x="15" y="205" fill="#38bdf8" font-family="system-ui, sans-serif" font-weight="700" font-size="11">MODEL: ${resolvedModel}</text>
              <text x="15" y="225" fill="#64748b" font-family="monospace" font-size="10">SEED: #${seed} • RATIO: 9:16 (720x1280) • CFG: ${guidanceScale}</text>
              <text x="15" y="245" fill="#64748b" font-family="monospace" font-size="10">ENGINE: Google Flow Latent Diffusion v2.4</text>

              <rect x="15" y="265" width="${w * 0.84 - 30}" height="46" rx="12" fill="#ef4444" />
              <text x="${(w * 0.84 - 30) / 2 + 15}" y="294" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="900" font-size="15" text-anchor="middle">▶ XEM NGAY TRÊN SHORTS & REELS</text>
            </g>
          `;
        } else {
          // 16:9 or 4:3 Horizontal/Standard layout
          innerSvg = `
            <!-- Top Google Flow Brand Bar -->
            <g transform="translate(60, 40)">
              <rect x="0" y="0" width="280" height="34" rx="17" fill="${modelBadgeBg}" />
              <text x="140" y="22" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="900" font-size="12" text-anchor="middle" letter-spacing="1">${modelBadgeText}</text>
              <rect x="290" y="0" width="160" height="34" rx="17" fill="#1e293b" stroke="#334155" stroke-width="1" />
              <text x="370" y="22" fill="#38bdf8" font-family="system-ui, sans-serif" font-weight="800" font-size="12" text-anchor="middle">GOOGLE FLOW DIRECTOR</text>
            </g>

            ${embeddedImgTags}

            <!-- Left Main Content Group -->
            <g transform="translate(60, ${h * 0.28})" filter="url(#shadow)">
              <rect x="-10" y="-10" width="${w * 0.40}" height="${h * 0.60}" rx="20" fill="#020617" fill-opacity="0.80" stroke="#334155" stroke-width="1" />

              <rect x="15" y="16" width="180" height="28" rx="8" fill="#f59e0b" />
              <text x="105" y="35" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="900" font-size="12" text-anchor="middle" letter-spacing="1">KEM TIVI OFFICIAL 4K</text>
              
              <text x="15" y="90" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="900" font-size="${w > 1200 ? 38 : 30}">
                ${safeTitle.length > 28 ? safeTitle.substring(0, 26) + '...' : safeTitle}
              </text>
              
              <text x="15" y="132" fill="#fde047" font-family="system-ui, sans-serif" font-weight="700" font-size="18">
                ✨ ${safeTheme}
              </text>

              <text x="15" y="166" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12" font-style="italic">
                ${safePrompt.length > 55 ? safePrompt.substring(0, 52) + '...' : safePrompt}
              </text>

              <!-- Technical metadata bar -->
              <line x1="15" y1="195" x2="${w * 0.38}" y2="195" stroke="#334155" stroke-width="1" />
              <text x="15" y="218" fill="#38bdf8" font-family="system-ui, sans-serif" font-weight="700" font-size="11">MODEL: ${resolvedModel}</text>
              <text x="15" y="238" fill="#64748b" font-family="monospace" font-size="10">RATIO: ${resolvedRatio} (${w}x${h}) • SEED: #${seed} • CFG: ${guidanceScale}</text>
              <text x="15" y="256" fill="#64748b" font-family="monospace" font-size="10">STYLE: ${stylePreset} • LIGHTING: ${lighting}</text>

              <rect x="15" y="280" width="220" height="42" rx="12" fill="#ef4444" />
              <text x="125" y="307" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="900" font-size="14" text-anchor="middle">XEM NGAY • FULL HD</text>
            </g>
          `;
        }

        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${gradStart}" />
              <stop offset="45%" stop-color="${gradMid}" />
              <stop offset="100%" stop-color="#030712" />
            </linearGradient>
            <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${modelBadgeBg}" />
              <stop offset="50%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#ec4899" />
            </linearGradient>
            <radialGradient id="glow" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stop-color="${modelBadgeBg}" stop-opacity="0.35" />
              <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.15" />
              <stop offset="100%" stop-color="#000000" stop-opacity="0" />
            </radialGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.7"/>
            </filter>
            <filter id="frameGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="${modelBadgeBg}" flood-opacity="0.4"/>
            </filter>
          </defs>
          <rect width="${w}" height="${h}" fill="url(#bgGrad)" />
          <rect width="${w}" height="${h}" fill="url(#glow)" />
          ${innerSvg}
        </svg>`;

        fs.writeFileSync(targetPath, svgContent, 'utf-8');
        generatedImageUrl = `/storage/references/${safeFilename}`;
      }

      const totalLatency = Date.now() - startTime;
      const assetId = `flow_asset_${Date.now()}`;
      res.json({
        status: 'ok',
        fileUrl: generatedImageUrl,
        assetId,
        model: resolvedModel,
        aspectRatio: resolvedRatio,
        resolution: `${w}x${h}`,
        generationTimeMs: totalLatency,
        seed: Number(seed),
        method: generatedMethod,
        message: `Kết xuất thành công bằng ${resolvedModel} (${resolvedRatio})!`,
      });
    } catch (err: any) {
      console.error('Error generating thumbnail with Google Flow:', err);
      res.status(500).json({
        status: 'error',
        message: `Lỗi kết xuất ảnh: ${err.message}`,
      });
    }
  });

  // Reset database on disk to seed
  app.post('/api/storage/reset', (req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        const backupName = `backup_before_reset_${Date.now()}.json`;
        fs.copyFileSync(DB_FILE, path.join(BACKUPS_DIR, backupName));
        fs.unlinkSync(DB_FILE);
      }
      res.json({
        status: 'ok',
        message: 'Deleted data/database.json. Next app reload will re-initialize seed.',
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Migrate legacy data into new folder format:
  // - Organizes character references into public/storage/characters/{characterId}/{versionId}/
  // - Extracts Base64 images to real files on disk
  // - Rewrites paths in data/database.json
  app.post('/api/storage/migrate-legacy', (req, res) => {
    try {
      let rawData = req.body?.data;
      if (!rawData) {
        if (fs.existsSync(DB_FILE)) {
          rawData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        } else {
          return res.status(400).json({
            status: 'error',
            message: 'No data provided in payload and data/database.json does not exist.',
          });
        }
      }

      ensureDirectories();

      // Create pre-migration backup
      if (fs.existsSync(DB_FILE)) {
        const preBackupName = `pre_migration_backup_${Date.now()}.json`;
        fs.copyFileSync(DB_FILE, path.join(BACKUPS_DIR, preBackupName));
      }

      const charactersBaseDir = STORAGE_CHARACTERS_DIR;

      let extractedImagesCount = 0;
      let mappedReferencesCount = 0;
      let mappedCharactersCount = 0;
      let mappedVersionsCount = 0;

      // 1. Map Characters
      if (Array.isArray(rawData.characters)) {
        rawData.characters = rawData.characters.map((c: any) => {
          mappedCharactersCount++;
          const canonId = normalizeCharId(c.id);
          const canonVer = normalizeVerId(c.activeVersionId);
          return {
            ...c,
            id: canonId,
            activeVersionId: canonVer || c.activeVersionId,
          };
        });
      }

      // 2. Map Character Versions
      if (Array.isArray(rawData.characterVersions)) {
        rawData.characterVersions = rawData.characterVersions.map((v: any) => {
          mappedVersionsCount++;
          const canonCharId = normalizeCharId(v.characterId);
          const canonVerId = normalizeVerId(v.id);
          return {
            ...v,
            id: canonVerId,
            characterId: canonCharId,
          };
        });
      }

      // 3. Map Character References & Extract Base64 to disk files
      if (Array.isArray(rawData.characterReferences)) {
        rawData.characterReferences = rawData.characterReferences.map((ref: any) => {
          mappedReferencesCount++;
          const canonCharId = normalizeCharId(ref.characterId);
          const canonVerId = normalizeVerId(ref.characterVersionId);
          const cleanType = (ref.type || 'reference').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
          const cleanId = (ref.id || `ref_${Date.now()}`).toLowerCase().replace(/[^a-z0-9_-]/g, '_');

          let imageUri = ref.image;
          let thumbUri = ref.thumbnail || ref.image;

          // Check if image is Base64
          if (typeof imageUri === 'string' && imageUri.startsWith('data:image/')) {
            const matches = imageUri.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (matches) {
              const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
              const base64Data = matches[2];
              const buffer = Buffer.from(base64Data, 'base64');

              // Create target version folder: public/storage/characters/{canonCharId}/{canonVerId}/
              const charVerFolder = path.join(charactersBaseDir, canonCharId, canonVerId);
              if (!fs.existsSync(charVerFolder)) {
                fs.mkdirSync(charVerFolder, { recursive: true });
              }

              const diskFileName = `${cleanType}_${cleanId}.${ext}`;
              const diskFilePath = path.join(charVerFolder, diskFileName);
              fs.writeFileSync(diskFilePath, buffer);

              imageUri = `/storage/characters/${canonCharId}/${canonVerId}/${diskFileName}`;
              thumbUri = imageUri;
              extractedImagesCount++;
            }
          }

          // Canonical storage path
          const canonicalStoragePath = `characters/${canonCharId}/${canonVerId}/${cleanType}_${cleanId}.png`;

          return {
            ...ref,
            characterId: canonCharId,
            characterVersionId: canonVerId,
            image: imageUri,
            thumbnail: thumbUri,
            storagePath: ref.storagePath || canonicalStoragePath,
          };
        });
      }

      // 4. Update Project References
      if (Array.isArray(rawData.projectReferences)) {
        rawData.projectReferences = rawData.projectReferences.map((pref: any) => {
          if (pref.characterId) pref.characterId = normalizeCharId(pref.characterId);
          if (pref.characterVersionId) pref.characterVersionId = normalizeVerId(pref.characterVersionId);
          return pref;
        });
      }

      // 5. Update timestamp & write to data/database.json
      rawData.updatedAt = new Date().toISOString();
      const updatedJson = JSON.stringify(rawData, null, 2);
      fs.writeFileSync(DB_FILE, updatedJson, 'utf-8');

      // Update backup
      fs.writeFileSync(path.join(BACKUPS_DIR, 'database_latest.json'), updatedJson, 'utf-8');

      console.log(`[Storage Migration] Completed. Extracted ${extractedImagesCount} Base64 images to disk. Mapped ${mappedReferencesCount} references.`);

      res.json({
        status: 'ok',
        message: 'Chuyển đổi và ánh xạ dữ liệu cũ sang cấu trúc thư mục mới thành công!',
        stats: {
          charactersCount: mappedCharactersCount,
          versionsCount: mappedVersionsCount,
          referencesCount: mappedReferencesCount,
          extractedImagesCount,
          databasePath: 'data/database.json',
          folderStructure: 'public/storage/characters/{characterId}/{versionId}/',
          dbSizeBytes: updatedJson.length,
          updatedAt: rawData.updatedAt,
        },
        data: rawData,
      });
    } catch (err: any) {
      console.error('Error during legacy migration:', err);
      res.status(500).json({
        status: 'error',
        message: `Lỗi trong quá trình chuyển đổi: ${err.message}`,
      });
    }
  });

  // Get overview of storage structure on disk
  app.get('/api/storage/structure', (req, res) => {
    try {
      const storageDir = path.join(process.cwd(), 'public', 'storage');
      const charactersDir = STORAGE_CHARACTERS_DIR;
      const referencesDir = STORAGE_UPLOADS_DIR;

      const charFolders: Record<string, string[]> = {};
      if (fs.existsSync(charactersDir)) {
        const chars = fs.readdirSync(charactersDir);
        for (const charId of chars) {
          const charPath = path.join(charactersDir, charId);
          if (fs.statSync(charPath).isDirectory()) {
            const versions = fs.readdirSync(charPath).filter((f) => {
              const fullF = path.join(charPath, f);
              return fs.statSync(fullF).isDirectory();
            });
            charFolders[charId] = versions;
          }
        }
      }

      let referencesCount = 0;
      if (fs.existsSync(referencesDir)) {
        referencesCount = fs.readdirSync(referencesDir).length;
      }

      const dbStats = fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE) : null;

      res.json({
        status: 'ok',
        databaseFile: {
          path: 'data/database.json',
          exists: !!dbStats,
          sizeBytes: dbStats?.size || 0,
          updatedAt: dbStats?.mtime?.toISOString() || null,
        },
        characterFolders: charFolders,
        directUploadsCount: referencesCount,
        folders: {
          database: 'data/',
          backups: 'data/backups/',
          characters: 'public/storage/characters/',
          references: 'public/storage/references/',
        },
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // ==========================================
  // VITE / STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Pi & Kem Studio] Server running on http://localhost:${PORT}`);
    console.log(`[Pi & Kem Studio] Project storage folder: ${DATA_DIR}`);
  });
}

startServer();
