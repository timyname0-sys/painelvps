const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const archiver = require('archiver');
const { authenticate } = require('../middleware/auth');

const BASE_DIR = path.resolve(process.env.FILES_DIR || './data/files');
fs.ensureDirSync(BASE_DIR);

// Configuração do Multer para upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(BASE_DIR, req.query.path || '');
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// Helper para sanitizar caminho
function safePath(requestedPath) {
  const resolved = path.resolve(BASE_DIR, requestedPath || '');
  if (!resolved.startsWith(BASE_DIR)) {
    throw new Error('Acesso negado: caminho fora do diretório permitido');
  }
  return resolved;
}

// GET /api/files/list?path=
router.get('/list', authenticate, async (req, res) => {
  try {
    const dirPath = safePath(req.query.path || '');

    if (!await fs.pathExists(dirPath)) {
      return res.status(404).json({ error: 'Diretório não encontrado' });
    }

    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'Não é um diretório' });
    }

    const items = await fs.readdir(dirPath);
    const files = await Promise.all(items.map(async (item) => {
      const itemPath = path.join(dirPath, item);
      const itemStat = await fs.stat(itemPath);
      return {
        name: item,
        path: path.relative(BASE_DIR, itemPath),
        isDirectory: itemStat.isDirectory(),
        size: itemStat.size,
        modified: itemStat.mtime,
        permissions: itemStat.mode
      };
    }));

    // Pastas primeiro, depois arquivos
    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({
      currentPath: path.relative(BASE_DIR, dirPath) || '/',
      files
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/files/read?path=
router.get('/read', authenticate, async (req, res) => {
  try {
    const filePath = safePath(req.query.path);

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const stat = await fs.stat(filePath);
    if (stat.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Arquivo muito grande (>10MB)' });
    }

    const content = await fs.readFile(filePath, 'utf-8');
    res.json({
      path: path.relative(BASE_DIR, filePath),
      content,
      size: stat.size,
      modified: stat.mtime
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/write
router.post('/write', authenticate, async (req, res) => {
  try {
    const { filePath, content } = req.body;
    const fullPath = safePath(filePath);

    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf-8');

    res.json({ message: 'Arquivo salvo com sucesso', path: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/mkdir
router.post('/mkdir', authenticate, async (req, res) => {
  try {
    const { dirPath } = req.body;
    const fullPath = safePath(dirPath);

    await fs.ensureDir(fullPath);
    res.json({ message: 'Pasta criada com sucesso', path: dirPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/upload
router.post('/upload', authenticate, upload.array('files', 50), (req, res) => {
  const uploaded = req.files.map(f => ({
    name: f.filename,
    size: f.size,
    path: path.relative(BASE_DIR, f.path)
  }));
  res.json({ message: `${uploaded.length} arquivo(s) enviado(s)`, files: uploaded });
});

// DELETE /api/files/delete
router.delete('/delete', authenticate, async (req, res) => {
  try {
    const { filePath } = req.body;
    const fullPath = safePath(filePath);

    if (!await fs.pathExists(fullPath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    await fs.remove(fullPath);
    res.json({ message: 'Removido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/rename
router.post('/rename', authenticate, async (req, res) => {
  try {
    const { oldPath, newPath } = req.body;
    const fullOld = safePath(oldPath);
    const fullNew = safePath(newPath);

    if (!await fs.pathExists(fullOld)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    await fs.rename(fullOld, fullNew);
    res.json({ message: 'Renomeado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/files/download?path=
router.get('/download', authenticate, async (req, res) => {
  try {
    const filePath = safePath(req.query.path);

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      // Zipar diretório
      res.attachment(path.basename(filePath) + '.zip');
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);
      archive.directory(filePath, false);
      archive.finalize();
    } else {
      res.download(filePath);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
