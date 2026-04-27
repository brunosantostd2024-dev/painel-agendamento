// src/routes/clientes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getAll, getOne, insert, run } = require('../models/db');

router.get('/', requireAuth, async (req, res) => {
  try {
    const { est } = req.query;
    const rows = await getAll(`SELECT c.*, COUNT(a.id) as total_visitas, MAX(a.data) as ultima_visita, COALESCE(SUM(s.preco),0) as total_gasto
      FROM clientes c LEFT JOIN agendamentos a ON a.cliente_id=c.id AND a.status='concluido'
      LEFT JOIN servicos s ON s.id=a.servico_id
      WHERE c.estabelecimento_id=$1 GROUP BY c.id ORDER BY c.nome`, [est]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { estabelecimento_id, nome, whatsapp, email, observacoes } = req.body;
    if (!estabelecimento_id || !nome) return res.status(400).json({ error: 'estabelecimento_id e nome são obrigatórios.' });
    const id = await insert('INSERT INTO clientes (estabelecimento_id,nome,whatsapp,email,observacoes) VALUES ($1,$2,$3,$4,$5)',
      [estabelecimento_id, nome, whatsapp||'', email||'', observacoes||'']);
    res.status(201).json({ id, ...req.body });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { nome, whatsapp, email, observacoes } = req.body;
    await run('UPDATE clientes SET nome=$1,whatsapp=$2,email=$3,observacoes=$4 WHERE id=$5', [nome, whatsapp, email, observacoes, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try { await run('DELETE FROM clientes WHERE id=$1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
