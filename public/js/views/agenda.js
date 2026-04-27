// public/js/views/agenda.js
async function renderAgenda() {
  const el = document.getElementById('content-area');
  const dataHoje = hoje();
  el.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Agenda</span>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="date" class="form-input" id="agenda-data" value="${dataHoje}" style="width:auto;" onchange="carregarAgenda()">
          <button class="btn btn-primary btn-sm" onclick="showModal('modal-novo-agendamento')">+ Novo</button>
        </div>
      </div>
      <div class="card-body" id="agenda-lista"><p style="color:var(--muted);font-size:13px;">Carregando...</p></div>
    </div>`;
  carregarAgenda();
}

async function carregarAgenda() {
  const data = document.getElementById('agenda-data').value;
  const lista = document.getElementById('agenda-lista');
  if (!lista) return;
  try {
    const ags = await API.listarAgendamentos(STATE.estId, data);
    if (ags.length === 0) { lista.innerHTML = '<p style="color:var(--muted);font-size:13px;">Nenhum agendamento para esta data.</p>'; return; }
    lista.innerHTML = `<table class="table">
      <thead><tr><th>Horário</th><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody>${ags.map(a => `<tr>
        <td><strong>${a.horario}</strong></td>
        <td>${a.cliente_nome}<br><span style="font-size:11px;color:var(--muted);">${a.cliente_whatsapp||'—'}</span></td>
        <td>${a.servico_nome}<br><span style="font-size:11px;color:var(--muted);">R$ ${a.preco||0}</span></td>
        <td>${a.profissional_nome||'—'}</td>
        <td>${statusBadge(a.status)}</td>
        <td>
          <div style="display:flex;gap:4px;">
            ${a.status==='pendente'?`<button class="btn btn-green btn-sm" onclick="mudarStatus(${a.id},'confirmado')">Confirmar</button>`:''}
            ${a.status!=='concluido'&&a.status!=='cancelado'?`<button class="btn btn-ghost btn-sm" onclick="mudarStatus(${a.id},'concluido')">Concluir</button>`:''}
            ${a.cliente_whatsapp&&!a.lembrete_enviado?`<button class="btn btn-ghost btn-sm" onclick="enviarLembrete(${a.id})">📲</button>`:''}
            ${a.status!=='cancelado'?`<button class="btn btn-danger btn-sm" onclick="mudarStatus(${a.id},'cancelado')">✕</button>`:''}
          </div>
        </td>
      </tr>`).join('')}</tbody>
    </table>`;
  } catch (e) { lista.innerHTML = `<p class="alert alert-danger">${e.message}</p>`; }
}

async function mudarStatus(id, status) {
  try { await API.atualizarStatus(id, status); showToast('Status atualizado!'); carregarAgenda(); }
  catch (e) { showToast(e.message, 'warn'); }
}

async function enviarLembrete(id) {
  try {
    const r = await API.gerarLinkWA(id, '1h_antes');
    window.open(r.waLink, '_blank');
    showToast('WhatsApp aberto com lembrete!');
    carregarAgenda();
  } catch (e) { showToast(e.message, 'warn'); }
}

window.renderAgenda = renderAgenda;
window.carregarAgenda = carregarAgenda;
window.mudarStatus = mudarStatus;
window.enviarLembrete = enviarLembrete;
