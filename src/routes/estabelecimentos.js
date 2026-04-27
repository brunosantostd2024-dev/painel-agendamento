// src/routes/estabelecimentos.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getAll, getOne, insert, run } = require('../models/db');

router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await getAll('SELECT * FROM estabelecimentos WHERE usuario_id=$1 AND ativo=TRUE ORDER BY nome', [req.session.userId]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const row = await getOne('SELECT * FROM estabelecimentos WHERE id=$1 AND usuario_id=$2', [req.params.id, req.session.userId]);
    if (!row) return res.status(404).json({ error: 'Não encontrado.' });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { nome, nicho, cidade, estado, whatsapp, slug, abertura, fechamento } = req.body;
    if (!nome || !nicho || !slug) return res.status(400).json({ error: 'nome, nicho e slug são obrigatórios.' });
    const existe = await getOne('SELECT id FROM estabelecimentos WHERE slug=$1', [slug]);
    if (existe) return res.status(409).json({ error: 'Slug já em uso.' });
    const id = await insert('INSERT INTO estabelecimentos (usuario_id,nome,nicho,cidade,estado,whatsapp,slug,abertura,fechamento) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [req.session.userId, nome, nicho, cidade||'', estado||'', whatsapp||'', slug, abertura||'08:00', fechamento||'19:00']);
    await run('INSERT INTO configuracoes (estabelecimento_id) VALUES ($1) ON CONFLICT DO NOTHING', [id]);
    res.status(201).json({ id, ...req.body });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { nome, nicho, cidade, estado, whatsapp, abertura, fechamento } = req.body;
    await run('UPDATE estabelecimentos SET nome=$1,nicho=$2,cidade=$3,estado=$4,whatsapp=$5,abertura=$6,fechamento=$7 WHERE id=$8 AND usuario_id=$9',
      [nome, nicho, cidade, estado, whatsapp, abertura, fechamento, req.params.id, req.session.userId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await run('UPDATE estabelecimentos SET ativo=FALSE WHERE id=$1 AND usuario_id=$2', [req.params.id, req.session.userId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/config', requireAuth, async (req, res) => {
  try {
    const cfg = await getOne('SELECT * FROM configuracoes WHERE estabelecimento_id=$1', [req.params.id]);
    res.json(cfg || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/config', requireAuth, async (req, res) => {
  try {
    const { lembrete_1h, lembrete_dia_anterior, confirmacao_imediata, lembrete_retorno, msg_template } = req.body;
    await run(`INSERT INTO configuracoes (estabelecimento_id,lembrete_1h,lembrete_dia_anterior,confirmacao_imediata,lembrete_retorno,msg_template)
      VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (estabelecimento_id) DO UPDATE SET
      lembrete_1h=$2,lembrete_dia_anterior=$3,confirmacao_imediata=$4,lembrete_retorno=$5,msg_template=$6`,
      [req.params.id, lembrete_1h, lembrete_dia_anterior, confirmacao_imediata, lembrete_retorno, msg_template]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
