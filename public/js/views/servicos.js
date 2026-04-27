// public/js/views/servicos.js
async function renderServicos() {
  const el = document.getElementById('content-area');
  el.innerHTML = '<p style="color:var(--muted);font-size:13px;">Carregando...</p>';
  try {
    const svcs = await API.listarServicos(STATE.estId);
    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Catálogo de serviços</span>
          <button class="btn btn-primary btn-sm" onclick="showModal('modal-svc', htmlModalSvc())">+ Novo serviço</button>
        </div>
        <div class="card-body">
          ${svcs.length === 0
            ? '<p style="color:var(--muted);font-size:13px;">Nenhum serviço cadastrado ainda. Adicione o primeiro!</p>'
            : `<table class="table">
                <thead><tr><th>Serviço</th><th>Duração</th><th>Preço</th><th>Nicho</th><th>Ações</th></tr></thead>
                <tbody>${svcs.map(s => `<tr>
                  <td><strong>${s.nome}</strong></td>
                  <td>${s.duracao_min} min</td>
                  <td style="font-weight:700;color:var(--accent);">R$ ${Number(s.preco).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                  <td>${s.nicho ? `<span class="badge badge-blue">${s.nicho}</span>` : '—'}</td>
                  <td>
                    <div style="display:flex;gap:4px;">
                      <button class="btn btn-ghost btn-sm" onclick="editarServico(${s.id},'${s.nome.replace(/'/g,"\\'")}',${s.duracao_min},${s.preco},'${s.nicho||''}')">Editar</button>
                      <button class="btn btn-danger btn-sm" onclick="removerServico(${s.id})">Remover</button>
                    </div>
                  </td>
                </tr>`).join('')}</tbody>
               </table>`}
        </div>
      </div>`;
  } catch (e) { el.innerHTML = `<p class="alert alert-danger">${e.message}</p>`; }
}

window.htmlModalSvc = function(id='', nome='', dur=30, preco=0, nicho='') {
  return `
    <div class="modal-title">${id ? 'Editar' : 'Novo'} Serviço</div>
    <div class="form-group"><label class="form-label">Nome do serviço *</label><input class="form-input" id="sv-nome" value="${nome}" placeholder="Ex: Corte Feminino"></div>
    <div class="g2">
      <div class="form-group"><label class="form-label">Duração (minutos)</label><input class="form-input" type="number" id="sv-dur" value="${dur}" min="10" step="5"></div>
      <div class="form-group"><label class="form-label">Preço (R$)</label><input class="form-input" type="number" id="sv-preco" value="${preco}" min="0" step="0.50"></div>
    </div>
    <div class="form-group"><label class="form-label">Nicho</label>
      <select class="form-select" id="sv-nicho">
        <option value="">— Todos —</option>
        <option value="feminino" ${nicho==='feminino'?'selected':''}>💄 Salão Feminino</option>
        <option value="masculino" ${nicho==='masculino'?'selected':''}>💈 Barbearia</option>
        <option value="unhas" ${nicho==='unhas'?'selected':''}>💅 Nail Design</option>
        <option value="estetica" ${nicho==='estetica'?'selected':''}>🌿 Estética</option>
        <option value="tatuagem" ${nicho==='tatuagem'?'selected':''}>🖊 Tatuagem</option>
      </select>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="${id ? `atualizarServico(${id})` : 'criarServico()'}">${id ? 'Salvar' : 'Adicionar'}</button>
    </div>`;
}

async function criarServico() {
  const nome = document.getElementById('sv-nome').value.trim();
  if (!nome) return showToast('Nome é obrigatório.', 'warn');
  try {
    await API.criarServico({ estabelecimento_id: STATE.estId, nome, duracao_min: +document.getElementById('sv-dur').value, preco: +document.getElementById('sv-preco').value, nicho: document.getElementById('sv-nicho').value });
    closeModal(); showToast(`${nome} adicionado!`); renderServicos();
  } catch (e) { showToast(e.message, 'warn'); }
}

function editarServico(id, nome, dur, preco, nicho) {
  showModal('modal-svc', window.htmlModalSvc(id, nome, dur, preco, nicho));
}

async function atualizarServico(id) {
  try {
    await API.atualizarServico(id, { nome: document.getElementById('sv-nome').value, duracao_min: +document.getElementById('sv-dur').value, preco: +document.getElementById('sv-preco').value, nicho: document.getElementById('sv-nicho').value });
    closeModal(); showToast('Serviço atualizado!'); renderServicos();
  } catch (e) { showToast(e.message, 'warn'); }
}

async function removerServico(id) {
  if (!confirm('Remover este serviço?')) return;
  try { await API.del(`/api/servicos/${id}`); showToast('Serviço removido.'); renderServicos(); }
  catch (e) { showToast(e.message, 'warn'); }
}

window.renderServicos = renderServicos;
window.criarServico = criarServico;
window.editarServico = editarServico;
window.atualizarServico = atualizarServico;
window.removerServico = removerServico;
