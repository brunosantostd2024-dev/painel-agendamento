// src/routes/relatorios.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getOne, getAll } = require('../models/db');

router.get('/resumo', requireAuth, async (req, res) => {
  try {
    const { est, periodo } = req.query;
    let dataInicio;
    const hoje = new Date();
    if (periodo==='semana') { const d=new Date(hoje); d.setDate(d.getDate()-7); dataInicio=d.toISOString().split('T')[0]; }
    else if (periodo==='ano') dataInicio=`${hoje.getFullYear()}-01-01`;
    else dataInicio=`${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-01`;

    const fat = await getOne(`SELECT COALESCE(SUM(s.preco),0) as total FROM agendamentos a JOIN servicos s ON s.id=a.servico_id WHERE a.estabelecimento_id=$1 AND a.data>=$2 AND a.status='concluido'`, [est, dataInicio]);
    const atend = await getOne(`SELECT COUNT(*) as total FROM agendamentos WHERE estabelecimento_id=$1 AND data>=$2 AND status='concluido'`, [est, dataInicio]);
    const canc = await getOne(`SELECT COUNT(*) as total FROM agendamentos WHERE estabelecimento_id=$1 AND data>=$2 AND status='cancelado'`, [est, dataInicio]);
    const totalAg = await getOne(`SELECT COUNT(*) as total FROM agendamentos WHERE estabelecimento_id=$1 AND data>=$2`, [est, dataInicio]);
    const atendN = parseInt(atend.total)||0;
    const fatN = parseFloat(fat.total)||0;
    const cancN = parseInt(canc.total)||0;
    const totalN = parseInt(totalAg.total)||1;
    res.json({ faturamento: fatN, atendimentos: atendN, ticket_medio: atendN>0?Math.round(fatN/atendN*100)/100:0, cancelamentos: cancN, taxa_cancelamento: Math.round(cancN/totalN*1000)/10 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/por-servico', requireAuth, async (req, res) => {
  try {
    res.json(await getAll(`SELECT s.nome, COUNT(a.id) as qtd, COALESCE(SUM(s.preco),0) as total FROM agendamentos a JOIN servicos s ON s.id=a.servico_id WHERE a.estabelecimento_id=$1 AND a.status='concluido' GROUP BY s.id ORDER BY qtd DESC LIMIT 10`, [req.query.est]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/por-profissional', requireAuth, async (req, res) => {
  try {
    res.json(await getAll(`SELECT p.nome, COUNT(a.id) as atendimentos, COALESCE(SUM(s.preco),0) as faturamento FROM agendamentos a JOIN profissionais p ON p.id=a.profissional_id JOIN servicos s ON s.id=a.servico_id WHERE a.estabelecimento_id=$1 AND a.status='concluido' GROUP BY p.id ORDER BY faturamento DESC`, [req.query.est]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
