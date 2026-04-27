// src/routes/servicos.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const getDb = require('../models/db');

router.get('/', requireAuth, (req, res) => {
  const { est } = req.query;
  const db = getDb();
  const rows = db.prepare('SELECT * FROM servicos WHERE estabelecimento_id = ? AND ativo = 1 ORDER BY nome').all(est);
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { estabelecimento_id, nome, duracao_min, preco, nicho } = req.body;
  if (!estabelecimento_id || !nome) return res.status(400).json({ error: 'estabelecimento_id e nome são obrigatórios.' });
  const db = getDb();
  const r = db.prepare('INSERT INTO servicos (estabelecimento_id, nome, duracao_min, preco, nicho) VALUES (?,?,?,?,?)').run(estabelecimento_id, nome, duracao_min || 30, preco || 0, nicho || '');
  res.status(201).json({ id: r.lastInsertRowid, ...req.body });
});

router.put('/:id', requireAuth, (req, res) => {
  const { nome, duracao_min, preco, nicho } = req.body;
  const db = getDb();
  db.prepare('UPDATE servicos SET nome=?, duracao_min=?, preco=?, nicho=? WHERE id=?').run(nome, duracao_min, preco, nicho, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE servicos SET ativo=0 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
