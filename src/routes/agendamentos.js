// src/routes/agendamentos.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getAll, getOne, insert, run } = require('../models/db');

router.get('/', requireAuth, async (req, res) => {
  try {
    const { est, data, status } = req.query;
    let sql = `SELECT a.*, c.nome as cliente_nome, c.whatsapp as cliente_whatsapp,
      s.nome as servico_nome, s.preco, s.duracao_min, p.nome as profissional_nome
      FROM agendamentos a
      JOIN clientes c ON c.id=a.cliente_id
      JOIN servicos s ON s.id=a.servico_id
      LEFT JOIN profissionais p ON p.id=a.profissional_id
      WHERE a.estabelecimento_id=$1`;
    const params = [est];
    if (data) { params.push(data); sql += ` AND a.data=$${params.length}`; }
    if (status) { params.push(status); sql += ` AND a.status=$${params.length}`; }
    sql += ' ORDER BY a.data, a.horario';
    res.json(await getAll(sql, params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { estabelecimento_id, cliente_id, profissional_id, servico_id, data, horario, observacoes } = req.body;
    if (!estabelecimento_id || !cliente_id || !servico_id || !data || !horario)
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    const id = await insert(`INSERT INTO agendamentos (estabelecimento_id,cliente_id,profissional_id,servico_id,data,horario,observacoes)
      VALUES ($1,$2,$3,$4,$5,$6,$7)`, [estabelecimento_id, cliente_id, profissional_id||null, servico_id, data, horario, observacoes||'']);
    res.status(201).json({ id, status: 'pendente' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await run('UPDATE agendamentos SET status=$1 WHERE id=$2', [status, req.params.id]);
    res.json({ ok: true, status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await run("UPDATE agendamentos SET status='cancelado' WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
