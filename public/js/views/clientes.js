// public/js/views/clientes.js
async function renderClientes() {
  const el = document.getElementById('content-area');
  el.innerHTML = '<p style="color:var(--muted);font-size:13px;">Carregando...</p>';
  try {
    const clientes = await API.listarClientes(STATE.estId);
    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Clientes — ${clientes.length} cadastrados</span>
          <div style="display:flex;gap:8px;">
            <input class="form-input" id="cli-busca" placeholder="Buscar..." style="width:180px;" oninput="filtrarClientes()" />
            <button class="btn btn-primary btn-sm" onclick="showModal('modal-cli', htmlModalCliente())">+ Novo cliente</button>
          </div>
        </div>
        <div class="card-body" id="clientes-tabela"></div>
      </div>`;

    window._clientesCache = clientes;
    filtrarClientes();
  } catch (e) { el.innerHTML = `<p class="alert alert-danger">${e.message}</p>`; }
}

function filtrarClientes() {
  const busca = (document.getElementById('cli-busca')?.value || '').toLowerCase();
  const clientes = (window._clientesCache || []).filter(c =>
    c.nome.toLowerCase().includes(busca) || (c.whatsapp||'').includes(busca)
  );
  const tabela = document.getElementById('clientes-tabela');
  if (!tabela) return;

  if (clientes.length === 0) {
    tabela.innerHTML = '<p style="color:var(--muted);font-size:13px;">Nenhum cliente encontrado.</p>';
    return;
  }

  tabela.innerHTML = `<table class="table">
    <thead><tr><th>Cliente</th><th>WhatsApp</th><th>Visitas</th><th>Total gasto</th><th>Última visita</th><th>Ações</th></tr></thead>
    <tbody>${clientes.map((c, i) => `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="av" style="width:30px;height:30px;font-size:10px;background:${avColor(i)}20;color:${avColor(i)};">${initials(c.nome)}</div>
          <div>
            <div style="font-weight:600;">${c.nome}</div>
            <div style="font-size:11px;color:var(--muted);">${c.email||''}</div>
          </div>
        </div>
      </td>
      <td>${c.whatsapp
        ? `<a href="https://wa.me/55${c.whatsapp.replace(/\D/g,'')}" target="_blank" style="color:#25D366;font-weight:500;">${c.whatsapp}</a>`
        : '<span style="color:var(--muted);">—</span>'}</td>
      <td style="font-weight:700;text-align:center;">${c.total_visitas||0}</td>
      <td style="font-weight:700;color:var(--accent);">R$ ${Number(c.total_gasto||0).toLocaleString('pt-BR',{minimumFractionDigits:0})}</td>
      <td>${c.ultima_visita ? formatDate(c.ultima_visita) : '—'}</td>
      <td>
        <div style="display:flex;gap:4px;">
          ${c.whatsapp ? `<button class="btn btn-green btn-sm" onclick="abrirWA('${c.whatsapp}','${c.nome.split(' ')[0]}')">📲</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="editarCliente(${c.id},'${c.nome.replace(/'/g,"\\'")}','${c.whatsapp||''}','${c.email||''}')">Editar</button>
        </div>
      </td>
    </tr>`).join('')}</tbody>
  </table>`;
}

window.htmlModalCliente = function(id='', nome='', wpp='', email='') {
  return `
    <div class="modal-title">${id ? 'Editar' : 'Novo'} Cliente</div>
    <div class="form-group"><label class="form-label">Nome *</label><input class="form-input" id="cl-nome" value="${nome}" placeholder="Nome completo"></div>
    <div class="form-group"><label class="form-label">WhatsApp</label><input class="form-input" id="cl-wpp" value="${wpp}" placeholder="(32) 99999-0000"></div>
    <div class="form-group"><label class="form-label">E-mail</label><input class="form-input" type="email" id="cl-email" value="${email}" placeholder="email@exemplo.com"></div>
    <div class="form-group"><label class="form-label">Observações</label><textarea class="form-textarea" id="cl-obs" placeholder="Preferências, alergias, etc..."></textarea></div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="${id ? `atualizarCliente(${id})` : 'criarCliente()'}">${id ? 'Salvar' : 'Cadastrar'}</button>
    </div>`;
}

async function criarCliente() {
  const nome = document.getElementById('cl-nome').value.trim();
  if (!nome) return showToast('Nome é obrigatório.', 'warn');
  try {
    await API.criarCliente({ estabelecimento_id: STATE.estId, nome, whatsapp: document.getElementById('cl-wpp').value, email: document.getElementById('cl-email').value, observacoes: document.getElementById('cl-obs').value });
    closeModal(); showToast(`${nome} cadastrado!`); renderClientes();
  } catch (e) { showToast(e.message, 'warn'); }
}

function editarCliente(id, nome, wpp, email) {
  showModal('modal-cli', window.htmlModalCliente(id, nome, wpp, email));
}

async function atualizarCliente(id) {
  try {
    await API.atualizarCliente(id, { nome: document.getElementById('cl-nome').value, whatsapp: document.getElementById('cl-wpp').value, email: document.getElementById('cl-email').value, observacoes: document.getElementById('cl-obs')?.value });
    closeModal(); showToast('Cliente atualizado!'); renderClientes();
  } catch (e) { showToast(e.message, 'warn'); }
}

function abrirWA(wpp, nome) {
  const num = wpp.replace(/\D/g, '');
  const msg = `Olá ${nome}! 😊 Tudo bem?`;
  window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, '_blank');
}

window.renderClientes = renderClientes;
window.filtrarClientes = filtrarClientes;
window.criarCliente = criarCliente;
window.editarCliente = editarCliente;
window.atualizarCliente = atualizarCliente;
window.abrirWA = abrirWA;
