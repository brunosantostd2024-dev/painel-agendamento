// public/js/views/relatorios.js
async function renderRelatorios() {
  const el = document.getElementById('content-area');
  el.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;">
      <select class="form-select" id="rel-periodo" style="width:auto;" onchange="carregarRelatorios()">
        <option value="semana">Esta semana</option>
        <option value="mes" selected>Este mês</option>
        <option value="ano">Este ano</option>
      </select>
    </div>
    <div class="g4" id="rel-stats" style="margin-bottom:16px;"></div>
    <div class="g2">
      <div class="card"><div class="card-header"><span class="card-title">Top serviços</span></div><div class="card-body" id="rel-svcs"></div></div>
      <div class="card"><div class="card-header"><span class="card-title">Por profissional</span></div><div class="card-body" id="rel-profs"></div></div>
    </div>`;
  carregarRelatorios();
}

async function carregarRelatorios() {
  const periodo = document.getElementById('rel-periodo')?.value || 'mes';
  try {
    const [resumo, svcs, profs] = await Promise.all([
      API.resumo(STATE.estId, periodo),
      API.porServico(STATE.estId),
      API.porProfissional(STATE.estId),
    ]);
    const statsEl = document.getElementById('rel-stats');
    if (statsEl) statsEl.innerHTML = `
      <div class="stat"><div class="stat-val">R$ ${(resumo.faturamento||0).toLocaleString('pt-BR',{minimumFractionDigits:0})}</div><div class="stat-lab">Faturamento</div></div>
      <div class="stat"><div class="stat-val">${resumo.atendimentos||0}</div><div class="stat-lab">Atendimentos</div></div>
      <div class="stat"><div class="stat-val">R$ ${(resumo.ticket_medio||0).toLocaleString('pt-BR',{minimumFractionDigits:0})}</div><div class="stat-lab">Ticket médio</div></div>
      <div class="stat"><div class="stat-val">${resumo.taxa_cancelamento||0}%</div><div class="stat-lab">Cancelamentos</div></div>`;

    const maxQtd = svcs.length > 0 ? Math.max(...svcs.map(s => s.qtd)) : 1;
    const svcsEl = document.getElementById('rel-svcs');
    if (svcsEl) svcsEl.innerHTML = svcs.length === 0 ? '<p style="color:var(--muted);font-size:13px;">Sem dados ainda.</p>'
      : svcs.map((s,i) => `<div class="prog-wrap">
          <div class="prog-label"><span>${s.nome}</span><span style="font-weight:700;">${s.qtd}x — R$ ${(s.total||0).toLocaleString('pt-BR',{minimumFractionDigits:0})}</span></div>
          <div class="prog-bar"><div class="prog-fill" style="width:${Math.round(s.qtd/maxQtd*100)}%;background:${avColor(i)};"></div></div>
        </div>`).join('');

    const profsEl = document.getElementById('rel-profs');
    if (profsEl) profsEl.innerHTML = profs.length === 0 ? '<p style="color:var(--muted);font-size:13px;">Sem dados ainda.</p>'
      : `<table class="table"><thead><tr><th>Profissional</th><th>Atend.</th><th>Faturamento</th></tr></thead>
          <tbody>${profs.map(p=>`<tr><td>${p.nome}</td><td>${p.atendimentos}</td><td>R$ ${(p.faturamento||0).toLocaleString('pt-BR',{minimumFractionDigits:0})}</td></tr>`).join('')}</tbody></table>`;
  } catch (e) { showToast(e.message, 'warn'); }
}
window.renderRelatorios = renderRelatorios;
window.carregarRelatorios = carregarRelatorios;
