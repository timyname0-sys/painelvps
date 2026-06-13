const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');
const { authenticate } = require('../middleware/auth');

// Inicializar banco de dados
const db = new Database(path.join(__dirname, '..', '..', 'data', 'apps.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS installed_apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id TEXT NOT NULL,
    name TEXT NOT NULL,
    port INTEGER,
    status TEXT DEFAULT 'stopped',
    container_id TEXT,
    config TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Catálogo de apps disponíveis
const APP_CATALOG = [
  {
    id: 'typebot',
    name: 'Typebot',
    description: 'Chatbots conversacionais avançados',
    icon: '🤖',
    category: 'Automação',
    defaultPort: 3000,
    dockerImage: 'baptistearno/typebot:latest',
    dockerCompose: `
version: '3'
services:
  typebot-builder:
    image: baptistearno/typebot-builder:latest
    ports:
      - "{{PORT}}:3000"
    environment:
      - DATABASE_URL=postgresql://typebot:typebot@typebot-db:5432/typebot
      - NEXTAUTH_URL=http://localhost:{{PORT}}
      - NEXT_PUBLIC_VIEWER_URL=http://localhost:{{VIEWER_PORT}}
  typebot-viewer:
    image: baptistearno/typebot-viewer:latest
    ports:
      - "{{VIEWER_PORT}}:3000"
  typebot-db:
    image: postgres:14
    environment:
      - POSTGRES_USER=typebot
      - POSTGRES_PASSWORD=typebot
      - POSTGRES_DB=typebot
`
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Automação de workflows',
    icon: '⚡',
    category: 'Automação',
    defaultPort: 5678,
    dockerImage: 'n8nio/n8n:latest',
    dockerCompose: `
version: '3'
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "{{PORT}}:5678"
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
`
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'CMS mais popular do mundo',
    icon: '📝',
    category: 'CMS',
    defaultPort: 8080,
    dockerImage: 'wordpress:latest',
    dockerCompose: `
version: '3'
services:
  wordpress:
    image: wordpress:latest
    ports:
      - "{{PORT}}:80"
    environment:
      - WORDPRESS_DB_HOST=wp-db
      - WORDPRESS_DB_USER=wordpress
      - WORDPRESS_DB_PASSWORD=wordpress
      - WORDPRESS_DB_NAME=wordpress
  wp-db:
    image: mysql:8
    environment:
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_DATABASE=wordpress
      - MYSQL_USER=wordpress
      - MYSQL_PASSWORD=wordpress
`
  },
  {
    id: 'plausible',
    name: 'Plausible Analytics',
    description: 'Analytics de websites, privacy-first',
    icon: '📊',
    category: 'Analytics',
    defaultPort: 8000,
    dockerImage: 'plausible/analytics:latest',
    dockerCompose: `
version: '3'
services:
  plausible:
    image: plausible/analytics:latest
    ports:
      - "{{PORT}}:8000"
    environment:
      - DATABASE_URL=postgresql://plausible:plausible@plausible-db:5432/plausible
  plausible-db:
    image: postgres:14
    environment:
      - POSTGRES_USER=plausible
      - POSTGRES_PASSWORD=plausible
      - POSTGRES_DB=plausible
`
  },
  {
    id: 'uptime-kuma',
    name: 'Uptime Kuma',
    description: 'Monitor de uptime self-hosted',
    icon: '📡',
    category: 'Monitoramento',
    defaultPort: 3001,
    dockerImage: 'louislam/uptime-kuma:latest',
    dockerCompose: `
version: '3'
services:
  uptime-kuma:
    image: louislam/uptime-kuma:latest
    ports:
      - "{{PORT}}:3001"
    volumes:
      - uptime_data:/app/data
volumes:
  uptime_data:
`
  },
  {
    id: 'portainer',
    name: 'Portainer',
    description: 'Gerenciador de containers Docker',
    icon: '🐳',
    category: 'DevOps',
    defaultPort: 9000,
    dockerImage: 'portainer/portainer-ce:latest',
    dockerCompose: `
version: '3'
services:
  portainer:
    image: portainer/portainer-ce:latest
    ports:
      - "{{PORT}}:9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
volumes:
  portainer_data:
`
  },
  {
    id: 'vaultwarden',
    name: 'Vaultwarden',
    description: 'Password manager (Bitwarden self-hosted)',
    icon: '🔐',
    category: 'Segurança',
    defaultPort: 8081,
    dockerImage: 'vaultwarden/server:latest',
    dockerCompose: `
version: '3'
services:
  vaultwarden:
    image: vaultwarden/server:latest
    ports:
      - "{{PORT}}:80"
    volumes:
      - vw_data:/data
volumes:
  vw_data:
`
  },
  {
    id: 'nocodb',
    name: 'NocoDB',
    description: 'Alternativa open-source ao Airtable',
    icon: '📋',
    category: 'Produtividade',
    defaultPort: 8090,
    dockerImage: 'nocodb/nocodb:latest',
    dockerCompose: `
version: '3'
services:
  nocodb:
    image: nocodb/nocodb:latest
    ports:
      - "{{PORT}}:8080"
    volumes:
      - nocodb_data:/usr/app/data
volumes:
  nocodb_data:
`
  }
];

// GET /api/apps/catalog
router.get('/catalog', authenticate, (req, res) => {
  res.json({ apps: APP_CATALOG });
});

// GET /api/apps/installed
router.get('/installed', authenticate, (req, res) => {
  try {
    const apps = db.prepare('SELECT * FROM installed_apps ORDER BY created_at DESC').all();
    res.json({ apps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/apps/install
router.post('/install', authenticate, async (req, res) => {
  try {
    const { appId, port, name } = req.body;

    const appInfo = APP_CATALOG.find(a => a.id === appId);
    if (!appInfo) {
      return res.status(404).json({ error: 'App não encontrado no catálogo' });
    }

    const appPort = port || appInfo.defaultPort;
    const appName = name || appInfo.name;

    // Verificar se já está instalado
    const existing = db.prepare('SELECT id FROM installed_apps WHERE app_id = ?').get(appId);
    if (existing) {
      return res.status(409).json({ error: 'App já está instalado' });
    }

    // Salvar no banco
    const stmt = db.prepare(`
      INSERT INTO installed_apps (app_id, name, port, status, config)
      VALUES (?, ?, ?, 'installed', ?)
    `);

    const config = JSON.stringify({
      port: appPort,
      dockerCompose: appInfo.dockerCompose
        .replace(/\{\{PORT\}\}/g, appPort)
        .replace(/\{\{VIEWER_PORT\}\}/g, appPort + 1)
    });

    const result = stmt.run(appId, appName, appPort, config);

    res.status(201).json({
      message: `${appName} instalado com sucesso!`,
      app: {
        id: result.lastInsertRowid,
        appId,
        name: appName,
        port: appPort,
        status: 'installed'
      },
      note: 'Para iniciar, use Docker: docker-compose up -d'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/apps/:id/start
router.post('/:id/start', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const app = db.prepare('SELECT * FROM installed_apps WHERE id = ?').get(id);

    if (!app) {
      return res.status(404).json({ error: 'App não encontrado' });
    }

    db.prepare("UPDATE installed_apps SET status = 'running', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);

    res.json({ message: `${app.name} iniciado`, status: 'running' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/apps/:id/stop
router.post('/:id/stop', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const app = db.prepare('SELECT * FROM installed_apps WHERE id = ?').get(id);

    if (!app) {
      return res.status(404).json({ error: 'App não encontrado' });
    }

    db.prepare("UPDATE installed_apps SET status = 'stopped', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);

    res.json({ message: `${app.name} parado`, status: 'stopped' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/apps/:id
router.delete('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const app = db.prepare('SELECT * FROM installed_apps WHERE id = ?').get(id);

    if (!app) {
      return res.status(404).json({ error: 'App não encontrado' });
    }

    db.prepare('DELETE FROM installed_apps WHERE id = ?').run(id);

    res.json({ message: `${app.name} removido com sucesso` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
