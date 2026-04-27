// public/js/views/link.js
async function renderLink() {
  const el = document.getElementById('content-area');
  try {
    const est = await API.getEst(STATE.estId);
    const baseUrl = window.location.origin;
    const linkPublico = `${baseUrl}/agendar/${est.slug}`;

    el.innerHTML = `
      <div class="g2">
        <div>
          <div class="card">
            <div class="card-header"><span class="card-title">Seu link de agendamento</span><span class="badge badge-green">Ativo</span></div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">URL pública</label>
                <div class="link-box">
                  <span class="link-url" id="link-url">${linkPublico}</span>
                  <button class="copy-btn" onclick="copiarLink()">Copiar</button>
                </div>
              </div>
              <div style="margin-bottom:14px;">
                <div style="font-size:12px;font-weight:600;margin-bottom:8px;">Compartilhar via</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  <button class="btn btn-green btn-sm" onclick="compartilharWA('${est.nome}','${linkPublico}')">📲 WhatsApp</button>
                  <button class="btn btn-ghost btn-sm" onclick="copiarLink()">🔗 Copiar link</button>
                  <button class="btn btn-ghost btn-sm" onclick="showToast('QR Code: use um gerador online com o link copiado.')">📷 QR Code</button>
                </div>
              </div>
              <hr style="border:none;border-top:1px solid var(--border);margin-bottom:14px;">
              <div style="font-size:12px;font-weight:600;margin-bottom:10px;">Como funciona</div>
              <div style="font-size:12.5px;color:var(--muted);display:flex;flex-direction:column;gap:8px;">
                <div>① O cliente acessa o link e escolhe o serviço</div>
                <div>② Escolhe o horário disponível</div>
                <div>③ Informa nome e WhatsApp</div>
                <div>④ Você recebe e confirma no painel</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><span class="card-title">Configurações do link</span></div>
            <div class="card-body" id="link-config-body">
              <p style="color:var(--muted);font-size:13px;">Carregando...</p>
            </div>
          </div>
        </div>

        <div>
          <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:10px;text-align:center;">Preview — como o cliente vê</div>
          <div style="background:#1a1a2e;border-radius:20px;padding:16px;max-width:280px;margin:0 auto;">
            <div style="background:#f8f6f2;border-radius:14px;overflow:hidden;">
              <div style="background:#1a1a2e;padding:14px 16px;text-align:center;">
                <div style="font-size:16px;font-weight:700;color:#c9a96e;">${est.nome}</div>
                <div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px;">${est.cidade||''} ${est.estado||''}</div>
              </div>
              <div style="padding:14px;">
                <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Escolha o serviço</div>
                <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px;" id="preview-pills">
                  <div style="font-size:10.5px;padding:4px 9px;border-radius:20px;background:#c9a96e;color:#1a1a2e;font-weight:600;">Carregando...</div>
                </div>
                <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Escolha o horário</div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:12px;">
                  ${['08:00','08:30','09:00','09:30','10:00','10:30'].map((h,i) =>
                    `<div style="font-size:10px;text-align:center;padding:5px;border:1px solid var(--border);border-radius:6px;background:${i===1?'#1a1a2e':'white'};color:${i===1?'white':'var(--text)'};">${h}</div>`
                  ).join('')}
                </div>
                <div style="margin-bottom:8px;"><label style="font-size:10px;color:var(--muted);display:block;margin-bottom:3px;">Seu nome</label>
                  <input style="width:100%;padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-size:11px;" placeholder="Nome completo" readonly></div>
                <div style="margin-bottom:10px;"><label style="font-size:10px;color:var(--muted);display:block;margin-bottom:3px;">WhatsApp</label>
                  <input style="width:100%;padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-size:11px;" placeholder="(32) 99999-0000" readonly></div>
                <button style="width:100%;padding:9px;background:#c9a96e;border:none;border-radius:8px;font-weight:700;font-size:11px;cursor:default;font-family:var(--font);color:#1a1a2e;">Confirmar agendamento</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    // Carrega serviços no preview
    try {
      const svcs = await API.listarServicos(STATE.estId);
      document.getElementById('preview-pills').innerHTML = svcs.slice(0,5).map((s,i) =>
        `<div style="font-size:10.5px;padding:4px 9px;border-radius:20px;border:1px solid var(--border);background:${i===0?'#c9a96e':'white'};color:${i===0?'#1a1a2e':'var(--text)'};font-weight:500;">${s.nome}</div>`
      ).join('');
    } catch {}

    // Configurações
    try {
      const cfg = await API.getConfig(STATE.estId);
      document.getElementById('link-config-body').innerHTML = `
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div><div style="font-size:12.5px;font-weight:500;">Aceitar novos agendamentos</div></div>
            <label class="toggle"><input type="checkbox" checked><span class="tslider"></span></label>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div><div style="font-size:12.5px;font-weight:500;">Confirmação manual pelo dono</div><div style="font-size:11px;color:var(--muted);">Agendamentos ficam "pendente" até você confirmar</div></div>
            <label class="toggle"><input type="checkbox" checked><span class="tslider"></span></label>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div><div style="font-size:12.5px;font-weight:500;">Exibir preços</div></div>
            <label class="toggle"><input type="checkbox" checked><span class="tslider"></span></label>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div><div style="font-size:12.5px;font-weight:500;">Enviar confirmação automática via WhatsApp</div></div>
            <label class="toggle"><input type="checkbox" ${cfg.confirmacao_imediata ? 'checked' : ''}><span class="tslider"></span></label>
          </div>
        </div>
        <div style="margin-top:14px;">
          <label class="form-label">Mensagem de lembrete (1h antes)</label>
          <textarea class="form-textarea" id="cfg-msg" style="min-height:90px;">${cfg.msg_template || 'Olá {nome}! Lembrete do seu {servico} hoje às {horario}. Te esperamos! 😊'}</textarea>
          <div style="font-size:11px;color:var(--muted);margin-top:4px;">Variáveis: {nome} {servico} {horario} {data} {profissional}</div>
        </div>
        <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="salvarConfigLink(${STATE.estId})">Salvar configurações</button>`;
    } catch {}

    window._linkPublico = linkPublico;
  } catch (e) {
    el.innerHTML = `<p class="alert alert-danger">${e.message}</p>`;
  }
}

function copiarLink() {
  const url = window._linkPublico || document.getElementById('link-url')?.textContent;
  if (url) navigator.clipboard?.writeText(url).catch(() => {});
  showToast('Link copiado!');
}

function compartilharWA(nome, link) {
  const msg = `Olá! Agende seu horário em *${nome}* pelo link: ${link} 😊`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

async function salvarConfigLink(estId) {
  const msg = document.getElementById('cfg-msg')?.value;
  try {
    await API.salvarConfig(estId, { msg_template: msg, confirmacao_imediata: true, lembrete_1h: true, lembrete_dia_anterior: true, lembrete_retorno: false });
    showToast('Configurações salvas!');
  } catch (e) { showToast(e.message, 'warn'); }
}

window.renderLink = renderLink;
window.copiarLink = copiarLink;
window.compartilharWA = compartilharWA;
window.salvarConfigLink = salvarConfigLink;
