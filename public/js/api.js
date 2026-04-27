// public/js/api.js — Funções de comunicação com a API
const API = {
  async req(method, url, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include' };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(url, opts);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Erro na requisição');
    return data;
  },
  get: (url) => API.req('GET', url),
  post: (url, body) => API.req('POST', url, body),
  put: (url, body) => API.req('PUT', url, body),
  patch: (url, body) => API.req('PATCH', url, body),
  del: (url) => API.req('DELETE', url),

  // Auth
  login: (email, senha) => API.post('/api/auth/login', { email, senha }),
  logout: () => API.post('/api/auth/logout'),
  me: () => API.get('/api/auth/me'),

  // Estabelecimentos
  listarEsts: () => API.get('/api/estabelecimentos'),
  getEst: (id) => API.get(`/api/estabelecimentos/${id}`),
  criarEst: (d) => API.post('/api/estabelecimentos', d),
  atualizarEst: (id, d) => API.put(`/api/estabelecimentos/${id}`, d),
  getConfig: (id) => API.get(`/api/estabelecimentos/${id}/config`),
  salvarConfig: (id, d) => API.put(`/api/estabelecimentos/${id}/config`, d),

  // Agendamentos
  listarAgendamentos: (est, data, status) => {
    let url = `/api/agendamentos?est=${est}`;
    if (data) url += `&data=${data}`;
    if (status) url += `&status=${status}`;
    return API.get(url);
  },
  criarAgendamento: (d) => API.post('/api/agendamentos', d),
  atualizarStatus: (id, status) => API.patch(`/api/agendamentos/${id}/status`, { status }),
  cancelarAgendamento: (id) => API.del(`/api/agendamentos/${id}`),

  // Clientes
  listarClientes: (est) => API.get(`/api/clientes?est=${est}`),
  getCliente: (id) => API.get(`/api/clientes/${id}`),
  criarCliente: (d) => API.post('/api/clientes', d),
  atualizarCliente: (id, d) => API.put(`/api/clientes/${id}`, d),

  // Profissionais
  listarProfissionais: (est) => API.get(`/api/profissionais?est=${est}`),
  criarProfissional: (d) => API.post('/api/profissionais', d),
  atualizarProfissional: (id, d) => API.put(`/api/profissionais/${id}`, d),

  // Serviços
  listarServicos: (est) => API.get(`/api/servicos?est=${est}`),
  criarServico: (d) => API.post('/api/servicos', d),
  atualizarServico: (id, d) => API.put(`/api/servicos/${id}`, d),

  // Lembretes
  lembretePendentes: (est) => API.get(`/api/lembretes/pendentes?est=${est}`),
  gerarLinkWA: (agendamento_id, tipo) => API.post('/api/lembretes/gerar-link', { agendamento_id, tipo }),
  enviarTodos: (est) => API.post('/api/lembretes/enviar-todos', { est }),
  historicoLembretes: (est) => API.get(`/api/lembretes/historico?est=${est}`),

  // Relatórios
  resumo: (est, periodo) => API.get(`/api/relatorios/resumo?est=${est}&periodo=${periodo}`),
  porServico: (est) => API.get(`/api/relatorios/por-servico?est=${est}`),
  porProfissional: (est) => API.get(`/api/relatorios/por-profissional?est=${est}`),
};
