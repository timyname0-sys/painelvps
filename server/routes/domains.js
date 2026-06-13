const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');
const { authenticate } = require('../middleware/auth');

// Inicializar banco de dados
const db = new Database(path.join(__dirname, '..', '..', 'data', 'domains.sqlite'));

// Criar tabela se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT UNIQUE NOT NULL,
    target_port INTEGER,
    target_path TEXT,
    ssl_enabled INTEGER DEFAULT 0,
    ssl_cert TEXT,
    ssl_key TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// GET /api/domains
router.get('/', authenticate, (req, res) => {
  try {
    const domains = db.prepare('SELECT * FROM domains ORDER BY created_at DESC').all();
    res.json({ domains });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/domains
router.post('/', authenticate, (req, res) => {
  try {
    const { domain, target_port, target_path } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domínio é obrigatório' });
    }

    // Verificar se já existe
    const existing = db.prepare('SELECT id FROM domains WHERE domain = ?').get(domain);
    if (existing) {
      return res.status(409).json({ error: 'Domínio já cadastrado' });
    }

    const stmt = db.prepare(`
      INSERT INTO domains (domain, target_port, target_path)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(domain, target_port || null, target_path || null);

    res.status(201).json({
      message: 'Domínio adicionado com sucesso',
      id: result.lastInsertRowid
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/domains/:id
router.put('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const { domain, target_port, target_path, ssl_enabled, status } = req.body;

    const existing = db.prepare('SELECT * FROM domains WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Domínio não encontrado' });
    }

    const stmt = db.prepare(`
      UPDATE domains
      SET domain = COALESCE(?, domain),
          target_port = COALESCE(?, target_port),
          target_path = COALESCE(?, target_path),
          ssl_enabled = COALESCE(?, ssl_enabled),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(domain, target_port, target_path, ssl_enabled, status, id);

    res.json({ message: 'Domínio atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/domains/:id
router.delete('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM domains WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Domínio não encontrado' });
    }

    db.prepare('DELETE FROM domains WHERE id = ?').run(id);
    res.json({ message: 'Domínio removido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/domains/:id/ssl
router.post('/:id/ssl', authenticate, (req, res) => {
  try {
    const { id } = req.params;

    const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(id);
    if (!domain) {
      return res.status(404).json({ error: 'Domínio não encontrado' });
    }

    // Simulação de geração de SSL (em produção, usar certbot/acme)
    db.prepare(`
      UPDATE domains SET ssl_enabled = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);

    res.json({
      message: 'SSL habilitado (simulação). Em produção, use certbot ou ACME.',
      domain: domain.domain
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
