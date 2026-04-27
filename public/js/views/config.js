// public/js/views/config.js
async function renderConfig() {
  const el = document.getElementById('content-area');
  try {
    const [est, cfg] = await Promise.all([
      API.getEst(STATE.estId),
      API.getConfig(STATE.estId),
    ]);

    el.innerHTML = `
      <div class="g2">
        <div class="card">
          <div class="card-header"><span class="card-title">Perfil do estabelecimento</span></div>
          <div class="card-body">
            <div class="form-group"><label class="form-label">Nome do estabelecimento</label>
              <input class="form-input" id="cfg-nome" value="${est.nome}"></div>
            <div class="form-group"><label class="form-label">Nicho principal</label>
              <select class="form-select" id="cfg-nicho">
                <option value="feminino" ${est.nicho==='feminino'?'selected':''}>💄 Salão Feminino</option>
                <option value="masculino" ${est.nicho==='masculino'?'selected':''}>💈 Barbearia</option>
                <option value="unhas" ${est.nicho==='unhas'?'selected':''}>💅 Nail Design</option>
                <option value="estetica" ${est.nicho==='estetica'?'selected':''}>🌿 Estética</option>
                <option value="tatuagem" ${est.nicho==='tatuagem'?'selected':''}>🖊 Tatuagem</option>
                <option value="multi" ${est.nicho==='multi'?'selected':''}>✨ Multi-nicho</option>
              </select>
            </div>
            <div class="g2">
              <div class="form-group"><label class="form-label">Cidade</label>
                <input class="form-input" id="cfg-cidade" value="${est.cidade||''}"></div>
              <div class="form-group"><label class="form-label">Estado</label>
                <input class="form-input" id="cfg-estado" value="${est.estado||''}"></div>
            </div>
            <div class="form-group"><label class="form-label">WhatsApp do negócio</label>
              <input class="form-input" id="cfg-wpp" value="${est.whatsapp||''}"></div>
            <div class="g2">
              <div class="form-group"><label class="form-label">Abertura</label>
                <input class="form-input" type="time" id="cfg-abertura" value="${est.abertura||'08:00'}"></div>
              <div class="form-group"><label class="form-label">Fechamento</label>
                <input class="form-input" type="time" id="cfg-fechamento" value="${est.fechamento||'19:00'}"></div>
            </div>
            <button class="btn btn-primary" onclick="salvarPerfil()">Salvar perfil</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Notificações e alertas</span></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:12px;">
              ${[
                ['lembrete_1h', 'Lembrete 1 hora antes', 'Enviado 60 min antes do horário', cfg.lembrete_1h],
                ['lembrete_dia_anterior', 'Lembrete dia anterior', 'Enviado às 18h do dia anterior', cfg.lembrete_dia_anterior],
                ['confirmacao_imediata', 'Confirmação ao agendar', 'Mensagem quando agendamento é criado', cfg.confirmacao_imediata],
                ['lembrete_retorno', 'Lembrete de retorno', 'Clientes sem visita há 30+ dias', cfg.lembrete_retorno],
              ].map(([id, label, sub, val]) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid var(--border);">
                  <div>
                    <div style="font-size:12.5px;font-weight:500;">${label}</div>
                    <div style="font-size:11px;color:var(--muted);">${sub}</div>
                  </div>
                  <label class="toggle"><input type="checkbox" id="tog-${id}" ${val ? 'checked' : ''}><span class="tslider"></span></label>
                </div>`).join('')}
            </div>

            <div class="form-group" style="margin-top:14px;">
              <label class="form-label">Mensagem padrão de lembrete</label>
              <textarea class="form-textarea" id="cfg-msg-tpl" style="min-height:90px;">${cfg.msg_template||'Olá {nome}! Lembrete do seu {servico} hoje às {horario}. Te esperamos! 😊'}</textarea>
              <div style="font-size:11px;color:var(--muted);margin-top:3px;">Variáveis: {nome} {servico} {horario} {data} {profissional}</div>
            </div>

            <div style="display:flex;gap:8px;">
              <button class="btn btn-primary btn-sm" onclick="salvarNotificacoes()">Salvar configurações</button>
              <button class="btn btn-ghost btn-sm" onclick="previewMensagem()">Visualizar preview</button>
            </div>

            <div id="preview-msg" style="display:none;margin-top:14px;">
              <div style="font-size:12px;font-weight:600;margin-bottom:8px;">Preview da mensagem:</div>
              <div style="background:#dcf8c6;border-radius:12px 12px 12px 0;padding:12px 14px;font-size:13px;line-height:1.6;max-width:300px;border:1px solid #c3e6b0;" id="preview-msg-text"></div>
            </div>
          </div>
        </div>
      </div>`;
  } catch (e) {
    el.innerHTML = `<p class="alert alert-danger">${e.message}</p>`;
  }
}

async function salvarPerfil() {
  try {
    await API.atualizarEst(STATE.estId, {
      nome: document.getElementById('cfg-nome').value,
      nicho: document.getElementById('cfg-nicho').value,
      cidade: document.getElementById('cfg-cidade').value,
      estado: document.getElementById('cfg-estado').value,
      whatsapp: document.getElementById('cfg-wpp').value,
      abertura: document.getElementById('cfg-abertura').value,
      fechamento: document.getElementById('cfg-fechamento').value,
    });
    STATE.ests = await API.listarEsts();
    popularSelectEst();
    showToast('Perfil atualizado com sucesso!');
  } catch (e) { showToast(e.message, 'warn'); }
}

async function salvarNotificacoes() {
  try {
    await API.salvarConfig(STATE.estId, {
      lembrete_1h: document.getElementById('tog-lembrete_1h').checked,
      lembrete_dia_anterior: document.getElementById('tog-lembrete_dia_anterior').checked,
      confirmacao_imediata: document.getElementById('tog-confirmacao_imediata').checked,
      lembrete_retorno: document.getElementById('tog-lembrete_retorno').checked,
      msg_template: document.getElementById('cfg-msg-tpl').value,
    });
    showToast('Configurações de notificação salvas!');
  } catch (e) { showToast(e.message, 'warn'); }
}

function previewMensagem() {
  const tpl = document.getElementById('cfg-msg-tpl').value;
  const msg = tpl
    .replace(/{nome}/g, 'Maria')
    .replace(/{servico}/g, 'Escova')
    .replace(/{horario}/g, '14:00')
    .replace(/{data}/g, formatDate(hoje()))
    .replace(/{profissional}/g, 'Ana Lima');
  const el = document.getElementById('preview-msg');
  document.getElementById('preview-msg-text').textContent = msg;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

window.renderConfig = renderConfig;
window.salvarPerfil = salvarPerfil;
window.salvarNotificacoes = salvarNotificacoes;
window.previewMensagem = previewMensagem;
