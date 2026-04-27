// src/routes/lembretes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const getDb = require('../models/db');

// Monta a mensagem substituindo as variáveis
function montarMensagem(template, dados) {
  return template
    .replace(/{nome}/g, dados.nome_primeiro || dados.cliente_nome || '')
    .replace(/{servico}/g, dados.servico_nome || '')
    .replace(/{horario}/g, dados.horario || '')
    .replace(/{data}/g, dados.data_formatada || dados.data || '')
    .replace(/{profissional}/g, dados.profissional_nome || 'nossa equipe');
}

function formatarData(dataISO) {
  const [y, m, d] = dataISO.split('-');
  return `${d}/${m}/${y}`;
}

// GET /api/lembretes/pendentes?est=ID
// Lista agendamentos que ainda precisam de lembrete hoje
router.get('/pendentes', requireAuth, (req, res) => {
  const { est } = req.query;
  const hoje = new Date().toISOString().split('T')[0];
  const db = getDb();
  const rows = db.prepare(`
    SELECT a.*, c.nome as cliente_nome, c.whatsapp as cliente_whatsapp,
           s.nome as servico_nome, p.nome as profissional_nome
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    JOIN servicos s ON s.id = a.servico_id
    LEFT JOIN profissionais p ON p.id = a.profissional_id
    WHERE a.estabelecimento_id = ? AND a.data = ?
      AND a.status != 'cancelado' AND a.lembrete_enviado = 0
    ORDER BY a.horario
  `).all(est, hoje);
  res.json(rows);
});

// POST /api/lembretes/gerar-link — gera o link wa.me para um agendamento
router.post('/gerar-link', requireAuth, (req, res) => {
  const { agendamento_id, tipo } = req.body; // tipo: confirmacao | 1h_antes | dia_anterior
  const db = getDb();

  const ag = db.prepare(`
    SELECT a.*, c.nome as cliente_nome, c.whatsapp as cliente_whatsapp,
           s.nome as servico_nome, p.nome as profissional_nome,
           conf.msg_template
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    JOIN servicos s ON s.id = a.servico_id
    LEFT JOIN profissionais p ON p.id = a.profissional_id
    LEFT JOIN configuracoes conf ON conf.estabelecimento_id = a.estabelecimento_id
    WHERE a.id = ?
  `).get(agendamento_id);

  if (!ag) return res.status(404).json({ error: 'Agendamento não encontrado.' });
  if (!ag.cliente_whatsapp) return res.status(400).json({ error: 'Cliente sem WhatsApp cadastrado.' });

  const template = ag.msg_template || 'Olá {nome}! Lembrete do seu {servico} em {data} às {horario}. Te esperamos! 😊';
  const nomePrimeiro = ag.cliente_nome.split(' ')[0];
  const mensagem = montarMensagem(template, {
    ...ag,
    nome_primeiro: nomePrimeiro,
    data_formatada: formatarData(ag.data),
  });

  // Formata o número: remove tudo que não é dígito
  const numero = ag.cliente_whatsapp.replace(/\D/g, '');
  const numeroFull = numero.startsWith('55') ? numero : '55' + numero;
  const waLink = `https://wa.me/${numeroFull}?text=${encodeURIComponent(mensagem)}`;

  // Registra no log
  db.prepare('INSERT INTO lembretes_log (agendamento_id, tipo) VALUES (?, ?)').run(agendamento_id, tipo || '1h_antes');
  // Marca como lembrete enviado
  db.prepare('UPDATE agendamentos SET lembrete_enviado = 1 WHERE id = ?').run(agendamento_id);

  res.json({ ok: true, waLink, mensagem, numero: numeroFull });
});

// POST /api/lembretes/enviar-todos — gera links para todos os pendentes de hoje
router.post('/enviar-todos', requireAuth, (req, res) => {
  const { est } = req.body;
  const hoje = new Date().toISOString().split('T')[0];
  const db = getDb();

  const pendentes = db.prepare(`
    SELECT a.id, c.whatsapp as cliente_whatsapp, c.nome as cliente_nome,
           s.nome as servico_nome, a.horario, a.data,
           p.nome as profissional_nome, conf.msg_template
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    JOIN servicos s ON s.id = a.servico_id
    LEFT JOIN profissionais p ON p.id = a.profissional_id
    LEFT JOIN configuracoes conf ON conf.estabelecimento_id = a.estabelecimento_id
    WHERE a.estabelecimento_id = ? AND a.data = ?
      AND a.status != 'cancelado' AND a.lembrete_enviado = 0
      AND c.whatsapp IS NOT NULL AND c.whatsapp != ''
  `).all(est, hoje);

  const links = pendentes.map(ag => {
    const template = ag.msg_template || 'Olá {nome}! Lembrete do seu {servico} hoje às {horario}. 😊';
    const mensagem = montarMensagem(template, {
      ...ag,
      nome_primeiro: ag.cliente_nome.split(' ')[0],
      data_formatada: formatarData(ag.data),
    });
    const numero = ag.cliente_whatsapp.replace(/\D/g, '');
    const numeroFull = numero.startsWith('55') ? numero : '55' + numero;
    const waLink = `https://wa.me/${numeroFull}?text=${encodeURIComponent(mensagem)}`;
    db.prepare('INSERT INTO lembretes_log (agendamento_id, tipo) VALUES (?, ?)').run(ag.id, '1h_antes');
    db.prepare('UPDATE agendamentos SET lembrete_enviado = 1 WHERE id = ?').run(ag.id);
    return { id: ag.id, nome: ag.cliente_nome, waLink };
  });

  res.json({ ok: true, total: links.length, links });
});

// GET /api/lembretes/historico?est=ID
router.get('/historico', requireAuth, (req, res) => {
  const { est } = req.query;
  const db = getDb();
  const rows = db.prepare(`
    SELECT ll.*, c.nome as cliente_nome, s.nome as servico_nome, a.horario, a.data
    FROM lembretes_log ll
    JOIN agendamentos a ON a.id = ll.agendamento_id
    JOIN clientes c ON c.id = a.cliente_id
    JOIN servicos s ON s.id = a.servico_id
    WHERE a.estabelecimento_id = ?
    ORDER BY ll.enviado_em DESC LIMIT 50
  `).all(est);
  res.json(rows);
});

module.exports = router;
