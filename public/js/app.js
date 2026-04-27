// public/js/app.js — Controlador principal do SPA
let STATE = { userId: null, nome: '', estId: null, ests: [] };

// ─── INIT ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const me = await API.me();
    STATE.userId = me.userId;
    STATE.nome = me.nome;
    await iniciarApp();
  } catch {
    document.getElementById('login-screen').classList.remove('hidden');
  }
});

async function iniciarApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('sb-nome').textContent = STATE.nome;
  document.getElementById('sb-av').textContent = STATE.nome.slice(0,2).toUpperCase();

  STATE.ests = await API.listarEsts();
  popularSelectEst();
  if (STATE.ests.length > 0) {
    STATE.estId = STATE.ests[0].id;
    navigateTo('dashboard');
  }
}

function popularSelectEst() {
  const sel = document.getElementById('est-select');
  sel.innerHTML = STATE.ests.map(e => `<option value="${e.id}">${e.nome}</option>`).join('');
  if (STATE.estId) sel.value = STATE.estId;
}

function trocarEstabelecimento() {
  STATE.estId = parseInt(document.getElementById('est-select').value);
  const view = document.querySelector('.sb-item.active')?.dataset.view || 'dashboard';
  navigateTo(view);
}

// ─── LOGIN / LOGOUT ────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('login-email').value;
  const senha = document.getElementById('login-senha').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');
  try {
    await API.login(email, senha);
    const me = await API.me();
    STATE.userId = me.userId;
    STATE.nome = me.nome;
    await iniciarApp();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
  }
}

async function doLogout() {
  await API.logout();
  location.reload();
}

// ─── NAVEGAÇÃO ────────────────────────────────────────
const VIEWS = {
  dashboard:     () => renderDashboard(),
  agenda:        () => renderAgenda(),
  clientes:      () => renderClientes(),
  profissionais: () => renderProfissionais(),
  servicos:      () => renderServicos(),
  lembretes:     () => renderLembretes(),
  link:          () => renderLink(),
  relatorios:    () => renderRelatorios(),
  config:        () => renderConfig(),
};

const TITLES = {
  dashboard: 'Dashboard', agenda: 'Agenda do Dia', clientes: 'Clientes',
  profissionais: 'Profissionais', servicos: 'Serviços',
  lembretes: 'Lembretes WhatsApp', link: 'Link de Agendamento',
  relatorios: 'Relatórios', config: 'Configurações',
};

function navigateTo(view, el) {
  if (!STATE.estId) return;
  document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
  (el || document.querySelector(`[data-view="${view}"]`))?.classList.add('active');
  document.getElementById('page-title').textContent = TITLES[view] || view;
  document.getElementById('page-sub').textContent = '';
  if (VIEWS[view]) VIEWS[view]();
}

// ─── MODAIS ──────────────────────────────────────────
function showModal(id, html) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-content');
  overlay.classList.remove('hidden');

  if (id === 'modal-novo-agendamento') box.innerHTML = htmlModalAgendamento();
  else if (id === 'modal-novo-est') box.innerHTML = htmlModalNovoEst();
  else if (html) box.innerHTML = html;
}

function closeModal(e) {
  if (!e || e.target.id === 'modal-overlay') {
    document.getElementById('modal-overlay').classList.add('hidden');
  }
}

// ─── TOAST ───────────────────────────────────────────
let _toastTimer;
function showToast(msg, tipo = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = (tipo === 'ok' ? '✅ ' : '⚠️ ') + msg;
  t.className = 'toast show';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ─── HELPERS ─────────────────────────────────────────
function hoje() { return new Date().toISOString().split('T')[0]; }
function formatDate(d) { const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; }
function initials(n) { return n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(); }
const AV_COLORS = ['#8e44ad','#2980b9','#27ae60','#e67e22','#c0392b','#16a085','#d35400'];
function avColor(i) { return AV_COLORS[i % AV_COLORS.length]; }
function statusBadge(s) {
  const m = { confirmado:'badge-green',pendente:'badge-amber',cancelado:'badge-red',concluido:'badge-blue' };
  const l = { confirmado:'Confirmado',pendente:'Pendente',cancelado:'Cancelado',concluido:'Concluído' };
  return `<span class="badge ${m[s]||'badge-gray'}">${l[s]||s}</span>`;
}

// ─── MODAL NOVO AGENDAMENTO ────────────────────────────
function htmlModalAgendamento() {
  return `
  <div class="modal-title">Novo Agendamento</div>
  <div id="modal-alert"></div>
  <div class="g2">
    <div class="form-group">
      <label class="form-label">Nome do Cliente *</label>
      <input class="form-input" id="ma-nome" placeholder="Nome completo">
    </div>
    <div class="form-group">
      <label class="form-label">WhatsApp</label>
      <input class="form-input" id="ma-wpp" placeholder="(32) 99999-0000">
    </div>
  </div>
  <div class="g2">
    <div class="form-group">
      <label class="form-label">Serviço *</label>
      <select class="form-select" id="ma-svc"></select>
    </div>
    <div class="form-group">
      <label class="form-label">Profissional</label>
      <select class="form-select" id="ma-prof"><option value="">Qualquer disponível</option></select>
    </div>
  </div>
  <div class="g2">
    <div class="form-group">
      <label class="form-label">Data *</label>
      <input class="form-input" type="date" id="ma-data" value="${hoje()}">
    </div>
    <div class="form-group">
      <label class="form-label">Horário *</label>
      <select class="form-select" id="ma-horario">
        ${['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','13:00','14:00','14:30','15:00','15:30','16:00','17:00','18:00'].map(h=>`<option>${h}</option>`).join('')}
      </select>
    </div>
  </div>
  <div class="form-group">
    <label class="form-label">Observações</label>
    <textarea class="form-textarea" id="ma-obs" placeholder="Observações opcionais..."></textarea>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="salvarAgendamento()">Salvar Agendamento</button>
  </div>`;
}

async function salvarAgendamento() {
  const nome = document.getElementById('ma-nome').value.trim();
  const wpp = document.getElementById('ma-wpp').value.trim();
  const svcId = document.getElementById('ma-svc').value;
  const profId = document.getElementById('ma-prof').value;
  const data = document.getElementById('ma-data').value;
  const horario = document.getElementById('ma-horario').value;
  const obs = document.getElementById('ma-obs').value;
  const alertEl = document.getElementById('modal-alert');

  if (!nome || !svcId || !data || !horario) {
    alertEl.innerHTML = '<div class="alert alert-danger">Preencha os campos obrigatórios.</div>';
    return;
  }
  try {
    // Cria cliente e agendamento
    const cli = await API.criarCliente({ estabelecimento_id: STATE.estId, nome, whatsapp: wpp });
    await API.criarAgendamento({ estabelecimento_id: STATE.estId, cliente_id: cli.id, profissional_id: profId || null, servico_id: svcId, data, horario, observacoes: obs });
    closeModal();
    showToast('Agendamento criado com sucesso!');
    navigateTo('agenda');
  } catch (e) {
    alertEl.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
  }
}

// ─── MODAL NOVO ESTABELECIMENTO ────────────────────────
function htmlModalNovoEst() {
  return `
  <div class="modal-title">Novo Estabelecimento</div>
  <div class="form-group"><label class="form-label">Nome *</label><input class="form-input" id="ne-nome" placeholder="Ex: Salão Beleza Total"></div>
  <div class="g2">
    <div class="form-group"><label class="form-label">Nicho *</label>
      <select class="form-select" id="ne-nicho">
        <option value="feminino">💄 Salão Feminino</option>
        <option value="masculino">💈 Barbearia</option>
        <option value="unhas">💅 Nail Design</option>
        <option value="estetica">🌿 Estética</option>
        <option value="tatuagem">🖊 Tatuagem</option>
        <option value="multi">✨ Multi-nicho</option>
      </select>
    </div>
    <div class="form-group"><label class="form-label">WhatsApp</label><input class="form-input" id="ne-wpp" placeholder="(00) 99999-0000"></div>
  </div>
  <div class="g2">
    <div class="form-group"><label class="form-label">Cidade</label><input class="form-input" id="ne-cidade" placeholder="Cataguases"></div>
    <div class="form-group"><label class="form-label">Estado</label><input class="form-input" id="ne-estado" placeholder="MG"></div>
  </div>
  <div class="form-group"><label class="form-label">Slug (URL pública) *</label>
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="font-size:12px;color:var(--muted);white-space:nowrap;">agendapro.app/</span>
      <input class="form-input" id="ne-slug" placeholder="meu-salao">
    </div>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="salvarNovoEst()">Criar Estabelecimento</button>
  </div>`;
}

async function salvarNovoEst() {
  const nome = document.getElementById('ne-nome').value.trim();
  const nicho = document.getElementById('ne-nicho').value;
  const slug = document.getElementById('ne-slug').value.trim().toLowerCase().replace(/\s+/g, '-');
  if (!nome || !slug) return showToast('Nome e slug são obrigatórios.', 'warn');
  try {
    const e = await API.criarEst({ nome, nicho, slug, cidade: document.getElementById('ne-cidade').value, estado: document.getElementById('ne-estado').value, whatsapp: document.getElementById('ne-wpp').value });
    STATE.ests = await API.listarEsts();
    popularSelectEst();
    STATE.estId = e.id;
    document.getElementById('est-select').value = e.id;
    closeModal();
    showToast(`${nome} criado com sucesso!`);
    navigateTo('dashboard');
  } catch (e) { showToast(e.message, 'warn'); }
}

// Carrega selects do modal ao abrir
document.addEventListener('click', async (e) => {
  if (e.target.id === 'modal-overlay') return;
  if (document.getElementById('ma-svc') && !document.getElementById('ma-svc').options.length) {
    try {
      const svcs = await API.listarServicos(STATE.estId);
      const profs = await API.listarProfissionais(STATE.estId);
      document.getElementById('ma-svc').innerHTML = svcs.map(s => `<option value="${s.id}">${s.nome} — R$ ${s.preco}</option>`).join('');
      document.getElementById('ma-prof').innerHTML = '<option value="">Qualquer disponível</option>' + profs.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
    } catch {}
  }
});

window.doLogin = doLogin;
window.doLogout = doLogout;
window.navigateTo = navigateTo;
window.trocarEstabelecimento = trocarEstabelecimento;
window.showModal = showModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.salvarAgendamento = salvarAgendamento;
window.salvarNovoEst = salvarNovoEst;
window.STATE = STATE;
window.hoje = hoje;
window.formatDate = formatDate;
window.initials = initials;
window.avColor = avColor;
window.statusBadge = statusBadge;
