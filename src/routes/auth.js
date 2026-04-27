// src/routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const getDb = require('../models/db');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  const db = getDb();
  const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(senha, user.senha)) {
    return res.status(401).json({ error: 'Email ou senha inválidos.' });
  }
  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.nome = user.nome;
  res.json({ ok: true, nome: user.nome, role: user.role });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado.' });
  res.json({ userId: req.session.userId, nome: req.session.nome, role: req.session.role });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  const db = getDb();
  const hash = bcrypt.hashSync(senha, 10);
  try {
    const r = db.prepare('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)').run(nome, email, hash);
    req.session.userId = r.lastInsertRowid;
    req.session.role = 'dono';
    req.session.nome = nome;
    res.status(201).json({ ok: true, nome });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email já cadastrado.' });
    throw e;
  }
});

module.exports = router;
