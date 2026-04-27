// public/js/views/profissionais.js
async function renderProfissionais() {
  const el = document.getElementById('content-area');
  el.innerHTML = '<p style="color:var(--muted);font-size:13px;">Carregando...</p>';
  try {
    const profs = await API.listarProfissionais(STATE.estId);
    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Equipe de profissionais</span>
          <button class="btn btn-primary btn-sm" onclick="showModal('modal-prof','${htmlModalProf()}')">+ Adicionar</button>
        </div>
        <div class="card-body">
          ${profs.length === 0
            ? '<p style="color:var(--muted);font-size:13px;">Nenhum profissional cadastrado. Adicione o primeiro!</p>'
            : `<div class="gauto">${profs.map((p,i) => `
                <div style="border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center;">
                  <div class="av" style="width:48px;height:48px;font-size:16px;background:${avColor(i)}20;color:${avColor(i)};margin:0 auto 10px;">${initials(p.nome)}</div>
                  <div style="font-size:13.5px;font-weight:700;">${p.nome}</div>
                  <div style="font-size:12px;color:var(--muted);margin:3px 0 10px;">${p.especialidade||'—'}</div>
                  ${p.whatsapp ? `<div style="font-size:11.5px;color:var(--muted);margin-bottom:10px;">📲 ${p.whatsapp}</div>` : ''}
                  <div style="display:flex;gap:6px;justify-content:center;">
                    <button class="btn btn-ghost btn-sm" onclick="editarProfissional(${p.id},'${p.nome}','${p.especialidade||''}','${p.whatsapp||''}')">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="removerProfissional(${p.id})">Remover</button>
                  </div>
                </div>`).join('')}</div>`}
        </div>
      </div>`;
  } catch (e) { el.innerHTML = `<p class="alert alert-danger">${e.message}</p>`; }
}

function htmlModalProf(id='', nome='', esp='', wpp='') {
  return `
    <div class="modal-title">${id ? 'Editar' : 'Novo'} Profissional</div>
    <div class="form-group"><label class="form-label">Nome *</label><input class="form-input" id="pf-nome" value="${nome}" placeholder="Ex: Ana Lima"></div>
    <div class="form-group"><label class="form-label">Especialidade</label><input class="form-input" id="pf-esp" value="${esp}" placeholder="Ex: Cabeleireira, Barbeiro..."></div>
    <div class="form-group"><label class="form-label">WhatsApp</label><input class="form-input" id="pf-wpp" value="${wpp}" placeholder="(32) 99999-0000"></div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="${id ? `atualizarProfissional(${id})` : 'criarProfissional()'}">${id ? 'Salvar' : 'Adicionar'}</button>
    </div>`;
}

async function criarProfissional() {
  const nome = document.getElementById('pf-nome').value.trim();
  if (!nome) return showToast('Nome é obrigatório.', 'warn');
  try {
    await API.criarProfissional({ estabelecimento_id: STATE.estId, nome, especialidade: document.getElementById('pf-esp').value, whatsapp: document.getElementById('pf-wpp').value });
    closeModal(); showToast(`${nome} adicionado!`); renderProfissionais();
  } catch (e) { showToast(e.message, 'warn'); }
}

function editarProfissional(id, nome, esp, wpp) {
  showModal('modal-prof', htmlModalProf(id, nome, esp, wpp));
}

async function atualizarProfissional(id) {
  try {
    await API.atualizarProfissional(id, { nome: document.getElementById('pf-nome').value, especialidade: document.getElementById('pf-esp').value, whatsapp: document.getElementById('pf-wpp').value });
    closeModal(); showToast('Profissional atualizado!'); renderProfissionais();
  } catch (e) { showToast(e.message, 'warn'); }
}

async function removerProfissional(id) {
  if (!confirm('Remover este profissional?')) return;
  try { await API.del(`/api/profissionais/${id}`); showToast('Profissional removido.'); renderProfissionais(); }
  catch (e) { showToast(e.message, 'warn'); }
}

window.renderProfissionais = renderProfissionais;
window.criarProfissional = criarProfissional;
window.editarProfissional = editarProfissional;
window.atualizarProfissional = atualizarProfissional;
window.removerProfissional = removerProfissional;
