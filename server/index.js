require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3001;

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use('/api/', limiter);

// ==========================================
// CRIAR DIRETÓRIOS NECESSÁRIOS
// ==========================================
const dirs = [
  process.env.SITES_DIR || './data/sites',
  process.env.FILES_DIR || './data/files',
  './data'
];
dirs.forEach(dir => fs.ensureDirSync(dir));

// ==========================================
// ROTAS DA API
// ==========================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/files', require('./routes/files'));
app.use('/api/domains', require('./routes/domains'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/apps', require('./routes/apps'));

// ==========================================
// SERVIR FRONTEND (PRODUÇÃO)
// ==========================================
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// ==========================================
// TRATAMENTO DE ERROS
// ==========================================
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor'
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║     🚀 PAINEL UDIAAS - Online!          ║
  ║                                          ║
  ║     http://localhost:${PORT}               ║
  ║                                          ║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
