// src/routes/profissionais.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getAll, insert, run } = require('../models/db');

router.get('/', requireAuth, async (req, res) => {
  try {
    res.json(await getAll('SELECT * FROM profissionais WHERE estabelecimento_id=$1 AND ativo=TRUE ORDER BY nome', [req.query.est]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { estabelecimento_id, nome, especialidade, whatsapp } = req.body;
    const id = await insert('INSERT INTO profissionais (estabelecimento_id,nome,especialidade,whatsapp) VALUES ($1,$2,$3,$4)',
      [estabelecimento_id, nome, especialidade||'', whatsapp||'']);
    res.status(201).json({ id, ...req.body });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { nome, especialidade, whatsapp } = req.body;
    await run('UPDATE profissionais SET nome=$1,especialidade=$2,whatsapp=$3 WHERE id=$4', [nome, especialidade, whatsapp, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try { await run('UPDATE profissionais SET ativo=FALSE WHERE id=$1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
