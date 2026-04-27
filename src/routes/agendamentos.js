// src/routes/agendamentos.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const getDb = require('../models/db');

// GET /api/agendamentos?est=ID&data=YYYY-MM-DD
router.get('/', requireAuth, (req, res) => {
  const { est, data, status } = req.query;
  const db = getDb();
  let sql = `
    SELECT a.*, c.nome as cliente_nome, c.whatsapp as cliente_whatsapp,
           s.nome as servico_nome, s.preco, s.duracao_min,
           p.nome as profissional_nome
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    JOIN servicos s ON s.id = a.servico_id
    LEFT JOIN profissionais p ON p.id = a.profissional_id
    WHERE a.estabelecimento_id = ?
  `;
  const params = [est];
  if (data) { sql += ' AND a.data = ?'; params.push(data); }
  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  sql += ' ORDER BY a.data, a.horario';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/agendamentos/:id
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const row = db.prepare(`
    SELECT a.*, c.nome as cliente_nome, c.whatsapp as cliente_whatsapp,
           s.nome as servico_nome, s.preco, p.nome as profissional_nome
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    JOIN servicos s ON s.id = a.servico_id
    LEFT JOIN profissionais p ON p.id = a.profissional_id
    WHERE a.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Agendamento não encontrado.' });
  res.json(row);
});

// POST /api/agendamentos
router.post('/', requireAuth, (req, res) => {
  const { estabelecimento_id, cliente_id, profissional_id, servico_id, data, horario, observacoes } = req.body;
  if (!estabelecimento_id || !cliente_id || !servico_id || !data || !horario) {
    return res.status(400).json({ error: 'Campos obrigatórios: estabelecimento_id, cliente_id, servico_id, data, horario.' });
  }
  // Verifica conflito de horário
  const db = getDb();
  const conflito = db.prepare(`
    SELECT id FROM agendamentos
    WHERE estabelecimento_id = ? AND profissional_id = ? AND data = ? AND horario = ? AND status != 'cancelado'
  `).get(estabelecimento_id, profissional_id || null, data, horario);
  if (conflito) return res.status(409).json({ error: 'Horário já reservado para este profissional.' });

  const r = db.prepare(`
    INSERT INTO agendamentos (estabelecimento_id, cliente_id, profissional_id, servico_id, data, horario, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(estabelecimento_id, cliente_id, profissional_id || null, servico_id, data, horario, observacoes || '');
  res.status(201).json({ id: r.lastInsertRowid, ...req.body, status: 'pendente' });
});

// PATCH /api/agendamentos/:id/status
router.patch('/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  const validos = ['pendente', 'confirmado', 'cancelado', 'concluido'];
  if (!validos.includes(status)) return res.status(400).json({ error: 'Status inválido.' });
  const db = getDb();
  db.prepare('UPDATE agendamentos SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true, status });
});

// DELETE /api/agendamentos/:id
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare("UPDATE agendamentos SET status = 'cancelado' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
