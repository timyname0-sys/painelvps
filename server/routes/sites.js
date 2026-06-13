const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const fs = require('fs-extra');
const path = require('path');
const { authenticate } = require('../middleware/auth');

const SITES_DIR = path.resolve(process.env.SITES_DIR || './data/sites');
fs.ensureDirSync(SITES_DIR);

// Inicializar banco de dados
const db = new Database(path.join(__dirname, '..', '..', 'data', 'sites.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    domain TEXT,
    template TEXT DEFAULT 'blank',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Templates disponíveis
const TEMPLATES = {
  blank: {
    name: 'Em Branco',
    description: 'Página em branco para começar do zero',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{SITE_NAME}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; color: #fff; }
    .container { text-align: center; }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { color: #94a3b8; font-size: 1.2rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>{{SITE_NAME}}</h1>
    <p>Seu site está no ar! 🚀</p>
  </div>
</body>
</html>`
    }
  },
  landing: {
    name: 'Landing Page',
    description: 'Landing page moderna e responsiva',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{SITE_NAME}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #fff; }
    nav { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 5%; }
    .logo { font-size: 1.5rem; font-weight: bold; }
    .nav-links a { color: #94a3b8; text-decoration: none; margin-left: 2rem; }
    .hero { text-align: center; padding: 8rem 5% 4rem; }
    .hero h1 { font-size: 4rem; margin-bottom: 1.5rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero p { color: #94a3b8; font-size: 1.3rem; max-width: 600px; margin: 0 auto 2rem; }
    .btn { display: inline-block; padding: 1rem 2.5rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; text-decoration: none; border-radius: 0.5rem; font-weight: bold; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; padding: 4rem 5%; }
    .feature { background: #1e293b; padding: 2rem; border-radius: 1rem; }
    .feature h3 { margin-bottom: 1rem; }
    .feature p { color: #94a3b8; }
    footer { text-align: center; padding: 2rem; color: #64748b; }
  </style>
</head>
<body>
  <nav>
    <div class="logo">{{SITE_NAME}}</div>
    <div class="nav-links">
      <a href="#features">Recursos</a>
      <a href="#sobre">Sobre</a>
      <a href="#contato">Contato</a>
    </div>
  </nav>
  <section class="hero">
    <h1>Bem-vindo ao {{SITE_NAME}}</h1>
    <p>Uma solução moderna e poderosa para suas necessidades.</p>
    <a href="#" class="btn">Começar Agora</a>
  </section>
  <section class="features" id="features">
    <div class="feature">
      <h3>⚡ Rápido</h3>
      <p>Performance otimizada para a melhor experiência.</p>
    </div>
    <div class="feature">
      <h3>🎨 Moderno</h3>
      <p>Design clean e profissional.</p>
    </div>
    <div class="feature">
      <h3>📱 Responsivo</h3>
      <p>Perfeito em qualquer dispositivo.</p>
    </div>
  </section>
  <footer>
    <p>&copy; 2024 {{SITE_NAME}}. Todos os direitos reservados.</p>
  </footer>
</body>
</html>`
    }
  },
  blog: {
    name: 'Blog Minimalista',
    description: 'Template de blog simples e elegante',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{SITE_NAME}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, serif; background: #fafafa; color: #333; }
    header { background: #fff; border-bottom: 1px solid #e5e5e5; padding: 1.5rem 5%; }
    header h1 { font-size: 1.5rem; }
    .posts { max-width: 700px; margin: 3rem auto; padding: 0 1rem; }
    .post { background: #fff; padding: 2rem; margin-bottom: 2rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .post h2 { margin-bottom: 0.5rem; }
    .post .meta { color: #999; font-size: 0.9rem; margin-bottom: 1rem; }
    .post p { line-height: 1.8; }
    footer { text-align: center; padding: 2rem; color: #999; }
  </style>
</head>
<body>
  <header>
    <h1>{{SITE_NAME}}</h1>
  </header>
  <main class="posts">
    <article class="post">
      <h2>Primeiro Post</h2>
      <div class="meta">Janeiro 2024</div>
      <p>Bem-vindo ao seu novo blog! Edite este post ou crie novos.</p>
    </article>
  </main>
  <footer>
    <p>&copy; 2024 {{SITE_NAME}}</p>
  </footer>
</body>
</html>`
    }
  }
};

// GET /api/sites
router.get('/', authenticate, (req, res) => {
  try {
    const sites = db.prepare('SELECT * FROM sites ORDER BY created_at DESC').all();
    res.json({ sites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sites/templates
router.get('/templates', authenticate, (req, res) => {
  const templates = Object.entries(TEMPLATES).map(([key, t]) => ({
    id: key,
    name: t.name,
    description: t.description
  }));
  res.json({ templates });
});

// POST /api/sites
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, template, domain } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome do site é obrigatório' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Verificar se já existe
    const existing = db.prepare('SELECT id FROM sites WHERE slug = ?').get(slug);
    if (existing) {
      return res.status(409).json({ error: 'Site com esse nome já existe' });
    }

    // Criar diretório do site
    const sitePath = path.join(SITES_DIR, slug);
    await fs.ensureDir(sitePath);

    // Criar arquivos do template
    const selectedTemplate = TEMPLATES[template] || TEMPLATES.blank;
    for (const [fileName, content] of Object.entries(selectedTemplate.files)) {
      const fileContent = content.replace(/\{\{SITE_NAME\}\}/g, name);
      await fs.writeFile(path.join(sitePath, fileName), fileContent);
    }

    // Salvar no banco
    const stmt = db.prepare(`
      INSERT INTO sites (name, slug, domain, template)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(name, slug, domain || null, template || 'blank');

    res.status(201).json({
      message: 'Site criado com sucesso',
      site: {
        id: result.lastInsertRowid,
        name,
        slug,
        url: `/sites/${slug}/`
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sites/:slug/files
router.get('/:slug/files', authenticate, async (req, res) => {
  try {
    const { slug } = req.params;
    const sitePath = path.join(SITES_DIR, slug);

    if (!await fs.pathExists(sitePath)) {
      return res.status(404).json({ error: 'Site não encontrado' });
    }

    const items = await fs.readdir(sitePath);
    const files = await Promise.all(items.map(async (item) => {
      const itemPath = path.join(sitePath, item);
      const stat = await fs.stat(itemPath);
      return {
        name: item,
        size: stat.size,
        modified: stat.mtime
      };
    }));

    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sites/:slug/file?name=
router.get('/:slug/file', authenticate, async (req, res) => {
  try {
    const { slug } = req.params;
    const { name } = req.query;
    const filePath = path.join(SITES_DIR, slug, name);

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ name, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sites/:slug/file
router.put('/:slug/file', authenticate, async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, content } = req.body;
    const filePath = path.join(SITES_DIR, slug, name);

    await fs.writeFile(filePath, content, 'utf-8');
    res.json({ message: 'Arquivo salvo com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sites/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(id);
    if (!site) {
      return res.status(404).json({ error: 'Site não encontrado' });
    }

    // Remover diretório
    const sitePath = path.join(SITES_DIR, site.slug);
    await fs.remove(sitePath);

    // Remover do banco
    db.prepare('DELETE FROM sites WHERE id = ?').run(id);

    res.json({ message: 'Site removido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
