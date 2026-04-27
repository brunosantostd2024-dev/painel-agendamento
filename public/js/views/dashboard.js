// public/js/views/dashboard.js
async function renderDashboard() {
  const el = document.getElementById('content-area');
  el.innerHTML = '<p style="color:var(--muted);font-size:13px;">Carregando...</p>';
  try {
    const [resumo, ags] = await Promise.all([
      API.resumo(STATE.estId, 'mes'),
      API.listarAgendamentos(STATE.estId, hoje()),
    ]);
    el.innerHTML = `
      <div class="g4" style="margin-bottom:16px;">
        <div class="stat"><div class="stat-val">${ags.length}</div><div class="stat-lab">Agendamentos hoje</div></div>
        <div class="stat"><div class="stat-val">R$ ${(resumo.faturamento||0).toLocaleString('pt-BR',{minimumFractionDigits:0})}</div><div class="stat-lab">Faturamento do mês</div><div class="stat-chg up">mês atual</div></div>
        <div class="stat"><div class="stat-val">${resumo.atendimentos||0}</div><div class="stat-lab">Atendimentos no mês</div></div>
        <div class="stat"><div class="stat-val">${resumo.taxa_cancelamento||0}%</div><div class="stat-lab">Cancelamentos</div></div>
      </div>
      <div class="g2">
        <div class="card">
          <div class="card-header"><span class="card-title">Agenda de hoje — ${formatDate(hoje())}</span>
            <button class="btn btn-primary btn-sm" onclick="showModal('modal-novo-agendamento')">+ Novo</button>
          </div>
          <div class="card-body">
            ${ags.length === 0 ? '<p style="color:var(--muted);font-size:13px;">Nenhum agendamento hoje.</p>' :
              ags.map((a,i) => `
                <div class="appt-item">
                  <div class="appt-av" style="background:${avColor(i)}20;color:${avColor(i)};">${initials(a.cliente_nome)}</div>
                  <div class="appt-info">
                    <div class="appt-name">${a.cliente_nome}</div>
                    <div class="appt-detail">${a.horario} · ${a.servico_nome} · ${a.profissional_nome||'—'}</div>
                  </div>
                  ${statusBadge(a.status)}
                </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Lembretes pendentes hoje</span>
            <button class="btn btn-green btn-sm" onclick="navigateTo('lembretes')">Ver todos</button>
          </div>
          <div class="card-body" id="dash-lembretes"><p style="color:var(--muted);font-size:13px;">Carregando...</p></div>
        </div>
      </div>`;

    // Lembretes
    const pendentes = await API.lembretePendentes(STATE.estId);
    document.getElementById('dash-lembretes').innerHTML = pendentes.length === 0
      ? '<p style="color:var(--muted);font-size:13px;">Todos os lembretes enviados!</p>'
      : pendentes.slice(0,4).map(a => `
          <div class="appt-item">
            <div class="appt-info">
              <div class="appt-name">${a.cliente_nome}</div>
              <div class="appt-detail">${a.horario} · ${a.servico_nome}</div>
            </div>
            ${a.cliente_whatsapp
              ? `<button class="btn btn-green btn-sm" onclick="enviarLembrete(${a.id})">Enviar</button>`
              : `<span class="badge badge-gray">Sem número</span>`}
          </div>`).join('');
  } catch (e) { el.innerHTML = `<p class="alert alert-danger">${e.message}</p>`; }
}
window.renderDashboard = renderDashboard;
