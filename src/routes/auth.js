// src/routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { getOne, insert } = require('../models/db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    const user = await getOne('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (!user || !bcrypt.compareSync(senha, user.senha)) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.nome = user.nome;
    res.json({ ok: true, nome: user.nome, role: user.role });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/register — qualquer pessoa pode criar conta
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    if (senha.length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres.' });
    const existe = await getOne('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe) return res.status(409).json({ error: 'Email já cadastrado.' });
    const hash = bcrypt.hashSync(senha, 10);
    const id = await insert('INSERT INTO usuarios (nome, email, senha, role) VALUES ($1,$2,$3,$4)', [nome, email, hash, 'dono']);
    req.session.userId = id;
    req.session.role = 'dono';
    req.session.nome = nome;
    res.status(201).json({ ok: true, nome });
  } catch (e) { res.status(500).json({ error: e.message }); }
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

module.exports = router;
