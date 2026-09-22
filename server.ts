import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const STORAGE_UPLOADS_DIR = path.join(process.cwd(), 'public', 'storage', 'references');

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
