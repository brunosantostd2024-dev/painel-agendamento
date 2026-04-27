// src/routes/relatorios.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const getDb = require('../models/db');

// GET /api/relatorios/resumo?est=ID&periodo=mes|semana|ano
router.get('/resumo', requireAuth, (req, res) => {
  const { est, periodo } = req.query;
  const db = getDb();

  let dataInicio;
  const hoje = new Date();
  if (periodo === 'semana') {
    const d = new Date(hoje); d.setDate(d.getDate() - 7);
    dataInicio = d.toISOString().split('T')[0];
  } else if (periodo === 'ano') {
    dataInicio = `${hoje.getFullYear()}-01-01`;
  } else {
    dataInicio = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;
  }

  const faturamento = db.prepare(`
    SELECT COALESCE(SUM(s.preco), 0) as total
    FROM agendamentos a JOIN servicos s ON s.id = a.servico_id
    WHERE a.estabelecimento_id = ? AND a.data >= ? AND a.status = 'concluido'
  `).get(est, dataInicio);

  const atendimentos = db.prepare(`
    SELECT COUNT(*) as total FROM agendamentos
    WHERE estabelecimento_id = ? AND data >= ? AND status = 'concluido'
  `).get(est, dataInicio);

  const cancelamentos = db.prepare(`
    SELECT COUNT(*) as total FROM agendamentos
    WHERE estabelecimento_id = ? AND data >= ? AND status = 'cancelado'
  `).get(est, dataInicio);

  const totalAgendados = db.prepare(`
    SELECT COUNT(*) as total FROM agendamentos
    WHERE estabelecimento_id = ? AND data >= ?
  `).get(est, dataInicio);

  const ticket = atendimentos.total > 0 ? faturamento.total / atendimentos.total : 0;
  const taxaCancelamento = totalAgendados.total > 0 ? (cancelamentos.total / totalAgendados.total * 100) : 0;

  res.json({
    faturamento: faturamento.total,
    atendimentos: atendimentos.total,
    ticket_medio: Math.round(ticket * 100) / 100,
    cancelamentos: cancelamentos.total,
    taxa_cancelamento: Math.round(taxaCancelamento * 10) / 10,
  });
});

// GET /api/relatorios/por-servico?est=ID
router.get('/por-servico', requireAuth, (req, res) => {
  const { est } = req.query;
  const db = getDb();
  const rows = db.prepare(`
    SELECT s.nome, COUNT(a.id) as qtd, SUM(s.preco) as total
    FROM agendamentos a JOIN servicos s ON s.id = a.servico_id
    WHERE a.estabelecimento_id = ? AND a.status = 'concluido'
    GROUP BY s.id ORDER BY qtd DESC LIMIT 10
  `).all(est);
  res.json(rows);
});

// GET /api/relatorios/por-profissional?est=ID
router.get('/por-profissional', requireAuth, (req, res) => {
  const { est } = req.query;
  const db = getDb();
  const rows = db.prepare(`
    SELECT p.nome, COUNT(a.id) as atendimentos, SUM(s.preco) as faturamento
    FROM agendamentos a
    JOIN profissionais p ON p.id = a.profissional_id
    JOIN servicos s ON s.id = a.servico_id
    WHERE a.estabelecimento_id = ? AND a.status = 'concluido'
    GROUP BY p.id ORDER BY faturamento DESC
  `).all(est);
  res.json(rows);
});

// GET /api/relatorios/por-dia?est=ID&mes=YYYY-MM
router.get('/por-dia', requireAuth, (req, res) => {
  const { est, mes } = req.query;
  const db = getDb();
  const mesStr = mes || new Date().toISOString().slice(0, 7);
  const rows = db.prepare(`
    SELECT a.data, COUNT(a.id) as agendamentos, SUM(s.preco) as faturamento
    FROM agendamentos a JOIN servicos s ON s.id = a.servico_id
    WHERE a.estabelecimento_id = ? AND a.data LIKE ? AND a.status = 'concluido'
    GROUP BY a.data ORDER BY a.data
  `).all(est, `${mesStr}%`);
  res.json(rows);
});

module.exports = router;
