// src/routes/servicos.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getAll, insert, run } = require('../models/db');

router.get('/', requireAuth, async (req, res) => {
  try {
    res.json(await getAll('SELECT * FROM servicos WHERE estabelecimento_id=$1 AND ativo=TRUE ORDER BY nome', [req.query.est]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', requireAuth, async (req, res) => {
  try {
    const { estabelecimento_id, nome, duracao_min, preco, nicho } = req.body;
    const id = await insert('INSERT INTO servicos (estabelecimento_id,nome,duracao_min,preco,nicho) VALUES ($1,$2,$3,$4,$5)',
      [estabelecimento_id, nome, duracao_min||30, preco||0, nicho||'']);
    res.status(201).json({ id, ...req.body });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { nome, duracao_min, preco, nicho } = req.body;
    await run('UPDATE servicos SET nome=$1,duracao_min=$2,preco=$3,nicho=$4 WHERE id=$5', [nome, duracao_min, preco, nicho, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/:id', requireAuth, async (req, res) => {
  try { await run('UPDATE servicos SET ativo=FALSE WHERE id=$1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
