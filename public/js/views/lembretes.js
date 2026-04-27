// public/js/views/lembretes.js
async function renderLembretes() {
  const el = document.getElementById('content-area');
  el.innerHTML = '<p style="color:var(--muted);font-size:13px;">Carregando...</p>';
  try {
    const [pendentes, historico] = await Promise.all([
      API.lembretePendentes(STATE.estId),
      API.historicoLembretes(STATE.estId),
    ]);
    const comNum = pendentes.filter(a => a.cliente_whatsapp);
    const semNum = pendentes.filter(a => !a.cliente_whatsapp);

    el.innerHTML = `
      <div class="g3" style="margin-bottom:16px;">
        <div class="stat"><div class="stat-val">${pendentes.length}</div><div class="stat-lab">Pendentes hoje</div></div>
        <div class="stat"><div class="stat-val" style="color:var(--g);">${comNum.length}</div><div class="stat-lab">Prontos para enviar</div></div>
        <div class="stat"><div class="stat-val" style="color:var(--warning);">${semNum.length}</div><div class="stat-lab">Sem número cadastrado</div></div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Lembretes pendentes — hoje ${formatDate(hoje())}</span>
          ${comNum.length > 0 ? `<button class="btn btn-green btn-sm" onclick="enviarTodosLembretes()">Enviar todos (${comNum.length})</button>` : ''}
        </div>
        <div class="card-body">
          ${pendentes.length === 0
            ? '<p style="color:var(--muted);font-size:13px;">Todos os lembretes do dia já foram enviados! ✅</p>'
            : `<table class="table">
                <thead><tr><th>Horário</th><th>Cliente</th><th>Serviço</th><th>WhatsApp</th><th>Ação</th></tr></thead>
                <tbody>${pendentes.map(a => `<tr>
                  <td><strong>${a.horario}</strong></td>
                  <td>${a.cliente_nome}</td>
                  <td>${a.servico_nome}</td>
                  <td>${a.cliente_whatsapp || '<span style="color:var(--warning);">Sem número</span>'}</td>
                  <td>${a.cliente_whatsapp
                    ? `<button class="btn btn-green btn-sm" onclick="enviarLembrete(${a.id})">📲 Enviar</button>`
                    : `<button class="btn btn-ghost btn-sm" onclick="adicionarNumero(${a.id})">+ Número</button>`
                  }</td>
                </tr>`).join('')}</tbody>
               </table>`}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Histórico de lembretes</span></div>
        <div class="card-body">
          ${historico.length === 0
            ? '<p style="color:var(--muted);font-size:13px;">Nenhum lembrete enviado ainda.</p>'
            : `<table class="table">
                <thead><tr><th>Enviado em</th><th>Cliente</th><th>Serviço</th><th>Horário</th><th>Tipo</th></tr></thead>
                <tbody>${historico.map(h => `<tr>
                  <td>${new Date(h.enviado_em).toLocaleString('pt-BR')}</td>
                  <td>${h.cliente_nome}</td>
                  <td>${h.servico_nome}</td>
                  <td>${h.horario}</td>
                  <td><span class="badge badge-green">${h.tipo}</span></td>
                </tr>`).join('')}</tbody>
               </table>`}
        </div>
      </div>`;
  } catch (e) { el.innerHTML = `<p class="alert alert-danger">${e.message}</p>`; }
}

async function enviarTodosLembretes() {
  try {
    const r = await API.enviarTodos(STATE.estId);
    r.links.forEach((l, i) => setTimeout(() => window.open(l.waLink, '_blank'), i * 400));
    showToast(`${r.total} lembretes enviados!`);
    renderLembretes();
  } catch (e) { showToast(e.message, 'warn'); }
}

function adicionarNumero(id) {
  const num = prompt('Digite o WhatsApp do cliente (ex: (32) 99999-0000):');
  if (num) showToast('Para salvar o número, edite o cliente na aba Clientes.', 'warn');
}

window.renderLembretes = renderLembretes;
window.enviarTodosLembretes = enviarTodosLembretes;
window.adicionarNumero = adicionarNumero;
