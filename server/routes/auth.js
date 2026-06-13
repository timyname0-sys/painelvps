const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { generateToken, authenticate } = require('../middleware/auth');

// Usuário admin padrão (em produção, usar banco de dados)
const ADMIN_USER = {
  id: 1,
  username: process.env.ADMIN_USERNAME || 'admin',
  passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10),
  role: 'admin'
};

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }

  if (username !== ADMIN_USER.username) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const validPassword = bcrypt.compareSync(password, ADMIN_USER.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = generateToken({
    id: ADMIN_USER.id,
    username: ADMIN_USER.username,
    role: ADMIN_USER.role
  });

  res.json({
    token,
    user: {
      id: ADMIN_USER.id,
      username: ADMIN_USER.username,
      role: ADMIN_USER.role
    }
  });
});

// GET /api/auth/verify
router.get('/verify', authenticate, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
  }

  const validPassword = bcrypt.compareSync(currentPassword, ADMIN_USER.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Senha atual incorreta' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
  }

  ADMIN_USER.passwordHash = bcrypt.hashSync(newPassword, 10);
  res.json({ message: 'Senha alterada com sucesso' });
});

module.exports = router;
