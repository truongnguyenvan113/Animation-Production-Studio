import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const STORAGE_UPLOADS_DIR = path.join(process.cwd(), 'public', 'storage', 'references');
const STORAGE_CHARACTERS_DIR = path.join(process.cwd(), 'public', 'storage', 'characters');

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

      res.json({
        status: 'ok',
        fileUrl: publicUrl,
        filename: safeFilename,
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
