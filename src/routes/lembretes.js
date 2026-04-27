// src/routes/lembretes.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getAll, getOne, run, insert } = require('../models/db');

function montarMsg(template, dados) {
  const [y,m,d] = (dados.data||'').split('-');
  return (template||'Olá {nome}! Lembrete do seu {servico} hoje às {horario}. 😊')
    .replace(/{nome}/g, (dados.cliente_nome||'').split(' ')[0])
    .replace(/{servico}/g, dados.servico_nome||'')
    .replace(/{horario}/g, dados.horario||'')
    .replace(/{data}/g, d&&m&&y ? `${d}/${m}/${y}` : '')
    .replace(/{profissional}/g, dados.profissional_nome||'nossa equipe');
}

router.get('/pendentes', requireAuth, async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const rows = await getAll(`SELECT a.*, c.nome as cliente_nome, c.whatsapp as cliente_whatsapp,
      s.nome as servico_nome, p.nome as profissional_nome
      FROM agendamentos a JOIN clientes c ON c.id=a.cliente_id
      JOIN servicos s ON s.id=a.servico_id LEFT JOIN profissionais p ON p.id=a.profissional_id
      WHERE a.estabelecimento_id=$1 AND a.data=$2 AND a.status!='cancelado' AND a.lembrete_enviado=FALSE
      ORDER BY a.horario`, [req.query.est, hoje]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/gerar-link', requireAuth, async (req, res) => {
  try {
    const { agendamento_id, tipo } = req.body;
    const ag = await getOne(`SELECT a.*, c.nome as cliente_nome, c.whatsapp as cliente_whatsapp,
      s.nome as servico_nome, p.nome as profissional_nome, conf.msg_template
      FROM agendamentos a JOIN clientes c ON c.id=a.cliente_id
      JOIN servicos s ON s.id=a.servico_id LEFT JOIN profissionais p ON p.id=a.profissional_id
      LEFT JOIN configuracoes conf ON conf.estabelecimento_id=a.estabelecimento_id
      WHERE a.id=$1`, [agendamento_id]);
    if (!ag) return res.status(404).json({ error: 'Agendamento não encontrado.' });
    if (!ag.cliente_whatsapp) return res.status(400).json({ error: 'Cliente sem WhatsApp.' });
    const mensagem = montarMsg(ag.msg_template, ag);
    const numero = ag.cliente_whatsapp.replace(/\D/g,'');
    const numeroFull = numero.startsWith('55') ? numero : '55'+numero;
    const waLink = `https://wa.me/${numeroFull}?text=${encodeURIComponent(mensagem)}`;
    await insert('INSERT INTO lembretes_log (agendamento_id, tipo) VALUES ($1,$2)', [agendamento_id, tipo||'1h_antes']);
    await run('UPDATE agendamentos SET lembrete_enviado=TRUE WHERE id=$1', [agendamento_id]);
    res.json({ ok: true, waLink, mensagem });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/enviar-todos', requireAuth, async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const pendentes = await getAll(`SELECT a.id, c.whatsapp as cliente_whatsapp, c.nome as cliente_nome,
      s.nome as servico_nome, a.horario, a.data::text as data, p.nome as profissional_nome, conf.msg_template
      FROM agendamentos a JOIN clientes c ON c.id=a.cliente_id JOIN servicos s ON s.id=a.servico_id
      LEFT JOIN profissionais p ON p.id=a.profissional_id
      LEFT JOIN configuracoes conf ON conf.estabelecimento_id=a.estabelecimento_id
      WHERE a.estabelecimento_id=$1 AND a.data=$2 AND a.status!='cancelado'
        AND a.lembrete_enviado=FALSE AND c.whatsapp IS NOT NULL AND c.whatsapp!=''`, [req.body.est, hoje]);
    const links = [];
    for (const ag of pendentes) {
      const mensagem = montarMsg(ag.msg_template, ag);
      const numero = ag.cliente_whatsapp.replace(/\D/g,'');
      const numeroFull = numero.startsWith('55') ? numero : '55'+numero;
      links.push({ id: ag.id, nome: ag.cliente_nome, waLink: `https://wa.me/${numeroFull}?text=${encodeURIComponent(mensagem)}` });
      await insert('INSERT INTO lembretes_log (agendamento_id, tipo) VALUES ($1,$2)', [ag.id, '1h_antes']);
      await run('UPDATE agendamentos SET lembrete_enviado=TRUE WHERE id=$1', [ag.id]);
    }
    res.json({ ok: true, total: links.length, links });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/historico', requireAuth, async (req, res) => {
  try {
    const rows = await getAll(`SELECT ll.*, c.nome as cliente_nome, s.nome as servico_nome, a.horario, a.data::text as data
      FROM lembretes_log ll JOIN agendamentos a ON a.id=ll.agendamento_id
      JOIN clientes c ON c.id=a.cliente_id JOIN servicos s ON s.id=a.servico_id
      WHERE a.estabelecimento_id=$1 ORDER BY ll.enviado_em DESC LIMIT 50`, [req.query.est]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
