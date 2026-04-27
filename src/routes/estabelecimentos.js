// src/routes/estabelecimentos.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const getDb = require('../models/db');

// GET /api/estabelecimentos — lista os do usuário logado
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM estabelecimentos WHERE usuario_id = ? AND ativo = 1 ORDER BY nome').all(req.session.userId);
  res.json(rows);
});

// GET /api/estabelecimentos/:id
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM estabelecimentos WHERE id = ? AND usuario_id = ?').get(req.params.id, req.session.userId);
  if (!row) return res.status(404).json({ error: 'Estabelecimento não encontrado.' });
  res.json(row);
});

// POST /api/estabelecimentos
router.post('/', requireAuth, (req, res) => {
  const { nome, nicho, cidade, estado, whatsapp, slug, abertura, fechamento } = req.body;
  if (!nome || !nicho || !slug) return res.status(400).json({ error: 'nome, nicho e slug são obrigatórios.' });
  const db = getDb();
  try {
    const r = db.prepare(`
      INSERT INTO estabelecimentos (usuario_id, nome, nicho, cidade, estado, whatsapp, slug, abertura, fechamento)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.session.userId, nome, nicho, cidade || '', estado || '', whatsapp || '', slug, abertura || '08:00', fechamento || '19:00');
    // Cria configuração padrão
    db.prepare('INSERT OR IGNORE INTO configuracoes (estabelecimento_id) VALUES (?)').run(r.lastInsertRowid);
    res.status(201).json({ id: r.lastInsertRowid, ...req.body });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Slug já em uso. Escolha outro.' });
    throw e;
  }
});

// PUT /api/estabelecimentos/:id
router.put('/:id', requireAuth, (req, res) => {
  const { nome, nicho, cidade, estado, whatsapp, abertura, fechamento } = req.body;
  const db = getDb();
  db.prepare(`
    UPDATE estabelecimentos SET nome=?, nicho=?, cidade=?, estado=?, whatsapp=?, abertura=?, fechamento=?
    WHERE id=? AND usuario_id=?
  `).run(nome, nicho, cidade, estado, whatsapp, abertura, fechamento, req.params.id, req.session.userId);
  res.json({ ok: true });
});

// DELETE /api/estabelecimentos/:id
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE estabelecimentos SET ativo=0 WHERE id=? AND usuario_id=?').run(req.params.id, req.session.userId);
  res.json({ ok: true });
});

// GET /api/estabelecimentos/:id/config — configurações de notificação
router.get('/:id/config', requireAuth, (req, res) => {
  const db = getDb();
  const cfg = db.prepare('SELECT * FROM configuracoes WHERE estabelecimento_id = ?').get(req.params.id);
  res.json(cfg || {});
});

// PUT /api/estabelecimentos/:id/config
router.put('/:id/config', requireAuth, (req, res) => {
  const { lembrete_1h, lembrete_dia_anterior, confirmacao_imediata, lembrete_retorno, msg_template } = req.body;
  const db = getDb();
  db.prepare(`
    INSERT INTO configuracoes (estabelecimento_id, lembrete_1h, lembrete_dia_anterior, confirmacao_imediata, lembrete_retorno, msg_template)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(estabelecimento_id) DO UPDATE SET
      lembrete_1h=excluded.lembrete_1h,
      lembrete_dia_anterior=excluded.lembrete_dia_anterior,
      confirmacao_imediata=excluded.confirmacao_imediata,
      lembrete_retorno=excluded.lembrete_retorno,
      msg_template=excluded.msg_template
  `).run(req.params.id, lembrete_1h ? 1 : 0, lembrete_dia_anterior ? 1 : 0, confirmacao_imediata ? 1 : 0, lembrete_retorno ? 1 : 0, msg_template);
  res.json({ ok: true });
});

module.exports = router;
