// src/routes/clientes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const getDb = require('../models/db');

router.get('/', requireAuth, (req, res) => {
  const { est } = req.query;
  if (!est) return res.status(400).json({ error: 'Parâmetro est é obrigatório.' });
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.*,
      COUNT(a.id) as total_visitas,
      MAX(a.data) as ultima_visita,
      SUM(s.preco) as total_gasto
    FROM clientes c
    LEFT JOIN agendamentos a ON a.cliente_id = c.id AND a.status = 'concluido'
    LEFT JOIN servicos s ON s.id = a.servico_id
    WHERE c.estabelecimento_id = ?
    GROUP BY c.id ORDER BY c.nome
  `).all(est);
  res.json(rows);
});

router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const c = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Cliente não encontrado.' });
  const historico = db.prepare(`
    SELECT a.*, s.nome as servico_nome, s.preco, p.nome as profissional_nome
    FROM agendamentos a JOIN servicos s ON s.id = a.servico_id
    LEFT JOIN profissionais p ON p.id = a.profissional_id
    WHERE a.cliente_id = ? ORDER BY a.data DESC LIMIT 20
  `).all(req.params.id);
  res.json({ ...c, historico });
});

router.post('/', requireAuth, (req, res) => {
  const { estabelecimento_id, nome, whatsapp, email, observacoes } = req.body;
  if (!estabelecimento_id || !nome) return res.status(400).json({ error: 'estabelecimento_id e nome são obrigatórios.' });
  const db = getDb();
  const r = db.prepare('INSERT INTO clientes (estabelecimento_id, nome, whatsapp, email, observacoes) VALUES (?,?,?,?,?)').run(estabelecimento_id, nome, whatsapp || '', email || '', observacoes || '');
  res.status(201).json({ id: r.lastInsertRowid, ...req.body });
});

router.put('/:id', requireAuth, (req, res) => {
  const { nome, whatsapp, email, observacoes } = req.body;
  const db = getDb();
  db.prepare('UPDATE clientes SET nome=?, whatsapp=?, email=?, observacoes=? WHERE id=?').run(nome, whatsapp, email, observacoes, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM clientes WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
