// src/routes/publico.js — Rota pública de agendamento sem login
const router = require('express').Router();
const getDb = require('../models/db');

// GET /agendar/:slug — dados do estabelecimento e slots disponíveis
router.get('/:slug', (req, res) => {
  const db = getDb();
  const est = db.prepare('SELECT id, nome, nicho, cidade, estado, abertura, fechamento FROM estabelecimentos WHERE slug = ? AND ativo = 1').get(req.params.slug);
  if (!est) return res.status(404).json({ error: 'Estabelecimento não encontrado.' });

  const servicos = db.prepare('SELECT id, nome, duracao_min, preco FROM servicos WHERE estabelecimento_id = ? AND ativo = 1 ORDER BY nome').all(est.id);
  const profissionais = db.prepare('SELECT id, nome, especialidade FROM profissionais WHERE estabelecimento_id = ? AND ativo = 1 ORDER BY nome').all(est.id);

  res.json({ estabelecimento: est, servicos, profissionais });
});

// GET /agendar/:slug/horarios?data=YYYY-MM-DD&servico_id=X&profissional_id=Y
router.get('/:slug/horarios', (req, res) => {
  const { data, servico_id, profissional_id } = req.query;
  const db = getDb();
  const est = db.prepare('SELECT id, abertura, fechamento FROM estabelecimentos WHERE slug = ? AND ativo = 1').get(req.params.slug);
  if (!est) return res.status(404).json({ error: 'Estabelecimento não encontrado.' });

  const svc = servico_id ? db.prepare('SELECT duracao_min FROM servicos WHERE id = ?').get(servico_id) : null;
  const duracao = svc ? svc.duracao_min : 30;

  // Gera todos os slots do dia
  const slots = [];
  const [hAb, mAb] = (est.abertura || '08:00').split(':').map(Number);
  const [hFe, mFe] = (est.fechamento || '19:00').split(':').map(Number);
  let cur = hAb * 60 + mAb;
  const fim = hFe * 60 + mFe;
  while (cur + duracao <= fim) {
    const hh = String(Math.floor(cur / 60)).padStart(2, '0');
    const mm = String(cur % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
    cur += 30; // intervalo de 30 min
  }

  // Remove slots já ocupados
  let sqlOcup = 'SELECT horario FROM agendamentos WHERE estabelecimento_id = ? AND data = ? AND status != ?';
  const params = [est.id, data, 'cancelado'];
  if (profissional_id) { sqlOcup += ' AND profissional_id = ?'; params.push(profissional_id); }
  const ocupados = db.prepare(sqlOcup).all(...params).map(r => r.horario);

  const disponiveis = slots.map(h => ({ horario: h, disponivel: !ocupados.includes(h) }));
  res.json(disponiveis);
});

// POST /agendar/:slug — cria agendamento público (cliente faz o próprio agendamento)
router.post('/:slug', (req, res) => {
  const { nome, whatsapp, servico_id, profissional_id, data, horario } = req.body;
  if (!nome || !servico_id || !data || !horario) {
    return res.status(400).json({ error: 'nome, servico_id, data e horario são obrigatórios.' });
  }
  const db = getDb();
  const est = db.prepare('SELECT id FROM estabelecimentos WHERE slug = ? AND ativo = 1').get(req.params.slug);
  if (!est) return res.status(404).json({ error: 'Estabelecimento não encontrado.' });

  // Verifica conflito
  const conflito = db.prepare(`
    SELECT id FROM agendamentos WHERE estabelecimento_id = ? AND data = ? AND horario = ? AND status != 'cancelado'
    ${profissional_id ? 'AND profissional_id = ?' : ''}
  `).get(est.id, data, horario, ...(profissional_id ? [profissional_id] : []));
  if (conflito) return res.status(409).json({ error: 'Horário indisponível. Escolha outro.' });

  // Cria ou recupera cliente
  let cliente = whatsapp ? db.prepare('SELECT id FROM clientes WHERE estabelecimento_id = ? AND whatsapp = ?').get(est.id, whatsapp) : null;
  if (!cliente) {
    const r = db.prepare('INSERT INTO clientes (estabelecimento_id, nome, whatsapp) VALUES (?,?,?)').run(est.id, nome, whatsapp || '');
    cliente = { id: r.lastInsertRowid };
  }

  // Cria agendamento
  const r = db.prepare(`
    INSERT INTO agendamentos (estabelecimento_id, cliente_id, profissional_id, servico_id, data, horario, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pendente')
  `).run(est.id, cliente.id, profissional_id || null, servico_id, data, horario);

  res.status(201).json({ ok: true, agendamento_id: r.lastInsertRowid, mensagem: 'Agendamento realizado! Aguarde a confirmação.' });
});

module.exports = router;
