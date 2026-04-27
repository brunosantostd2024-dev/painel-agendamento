// src/routes/publico.js
const router = require('express').Router();
const { getOne, getAll, insert } = require('../models/db');

router.get('/:slug', async (req, res) => {
  try {
    const est = await getOne('SELECT id,nome,nicho,cidade,estado,abertura,fechamento FROM estabelecimentos WHERE slug=$1 AND ativo=TRUE', [req.params.slug]);
    if (!est) return res.status(404).json({ error: 'Estabelecimento não encontrado.' });
    const servicos = await getAll('SELECT id,nome,duracao_min,preco FROM servicos WHERE estabelecimento_id=$1 AND ativo=TRUE ORDER BY nome', [est.id]);
    const profissionais = await getAll('SELECT id,nome,especialidade FROM profissionais WHERE estabelecimento_id=$1 AND ativo=TRUE ORDER BY nome', [est.id]);
    res.json({ estabelecimento: est, servicos, profissionais });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:slug/horarios', async (req, res) => {
  try {
    const { data, servico_id } = req.query;
    const est = await getOne('SELECT id,abertura,fechamento FROM estabelecimentos WHERE slug=$1 AND ativo=TRUE', [req.params.slug]);
    if (!est) return res.status(404).json({ error: 'Não encontrado.' });
    const svc = servico_id ? await getOne('SELECT duracao_min FROM servicos WHERE id=$1', [servico_id]) : null;
    const duracao = svc ? svc.duracao_min : 30;
    const slots = [];
    const [hAb,mAb] = (est.abertura||'08:00').split(':').map(Number);
    const [hFe,mFe] = (est.fechamento||'19:00').split(':').map(Number);
    let cur = hAb*60+mAb;
    const fim = hFe*60+mFe;
    while (cur+duracao<=fim) {
      slots.push(`${String(Math.floor(cur/60)).padStart(2,'0')}:${String(cur%60).padStart(2,'0')}`);
      cur+=30;
    }
    const ocupados = await getAll(`SELECT horario FROM agendamentos WHERE estabelecimento_id=$1 AND data=$2 AND status!='cancelado'`, [est.id, data]);
    const ocup = ocupados.map(r=>r.horario);
    res.json(slots.map(h=>({ horario:h, disponivel:!ocup.includes(h) })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:slug', async (req, res) => {
  try {
    const { nome, whatsapp, servico_id, profissional_id, data, horario } = req.body;
    if (!nome||!servico_id||!data||!horario) return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    const est = await getOne('SELECT id FROM estabelecimentos WHERE slug=$1 AND ativo=TRUE', [req.params.slug]);
    if (!est) return res.status(404).json({ error: 'Não encontrado.' });
    let cliente = whatsapp ? await getOne('SELECT id FROM clientes WHERE estabelecimento_id=$1 AND whatsapp=$2', [est.id, whatsapp]) : null;
    if (!cliente) {
      const id = await insert('INSERT INTO clientes (estabelecimento_id,nome,whatsapp) VALUES ($1,$2,$3)', [est.id, nome, whatsapp||'']);
      cliente = { id };
    }
    const id = await insert(`INSERT INTO agendamentos (estabelecimento_id,cliente_id,profissional_id,servico_id,data,horario,status) VALUES ($1,$2,$3,$4,$5,$6,'pendente')`,
      [est.id, cliente.id, profissional_id||null, servico_id, data, horario]);
    res.status(201).json({ ok: true, agendamento_id: id, mensagem: 'Agendamento realizado! Aguarde confirmação.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
