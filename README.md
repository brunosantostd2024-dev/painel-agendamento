# 📅 Agenda Pro

Sistema de agendamento profissional multi-nicho com painel administrativo, lembretes via WhatsApp e link público de agendamento para clientes.

---

## ✨ Funcionalidades

- **Dashboard** com métricas do dia (agendamentos, faturamento, lembretes)
- **Agenda do dia** com confirmação, conclusão e cancelamento de horários
- **Múltiplos estabelecimentos** — barbearia, salão feminino, unhas, estética, tatuagem
- **Lembretes via WhatsApp** — gera link `wa.me` com a mensagem pronta (1 clique)
- **Link público de agendamento** — o cliente acessa e marca o próprio horário
- **Gestão de clientes** com histórico de visitas e total gasto
- **Profissionais e serviços** com CRUD completo
- **Relatórios financeiros** por período (semana, mês, ano)
- **Configurações** de mensagem, horário de funcionamento e notificações
- **Autenticação** com sessão segura (bcrypt + express-session)
- **Banco de dados SQLite** — sem necessidade de servidor externo

---

## 🚀 Como rodar localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org) >= 18
- npm

### 2. Clone o repositório
```bash
git clone https://github.com/seu-usuario/agenda-pro.git
cd agenda-pro
```

### 3. Instale as dependências
```bash
npm install
```

### 4. Configure o ambiente
```bash
cp .env.example .env
# Edite o .env se quiser mudar a porta ou senha admin
```

### 5. Inicialize o banco de dados
```bash
npm run db:init
npm run db:seed
```

### 6. Inicie o servidor
```bash
# Produção
npm start

# Desenvolvimento (com auto-reload)
npm run dev
```

### 7. Acesse no navegador
```
http://localhost:3000
```

**Login padrão:**
- E-mail: `admin@agendapro.com`
- Senha: `admin123`

---

## 📁 Estrutura do projeto

```
agenda-pro/
├── src/
│   ├── server.js              # Servidor Express principal
│   ├── middleware/
│   │   └── auth.js            # Middleware de autenticação
│   ├── models/
│   │   └── db.js              # Conexão SQLite singleton
│   └── routes/
│       ├── auth.js            # Login, logout, registro
│       ├── estabelecimentos.js # CRUD de estabelecimentos
│       ├── agendamentos.js    # CRUD de agendamentos
│       ├── clientes.js        # CRUD de clientes
│       ├── profissionais.js   # CRUD de profissionais
│       ├── servicos.js        # CRUD de serviços
│       ├── lembretes.js       # Geração de links WhatsApp
│       ├── relatorios.js      # Relatórios financeiros
│       └── publico.js         # Rota pública de agendamento
├── public/
│   ├── index.html             # SPA principal
│   ├── css/
│   │   └── style.css          # Estilos completos
│   └── js/
│       ├── api.js             # Cliente HTTP
│       ├── app.js             # Controlador do SPA
│       └── views/
│           ├── dashboard.js
│           ├── agenda.js
│           ├── clientes.js
│           ├── profissionais.js
│           ├── servicos.js
│           ├── lembretes.js
│           ├── relatorios.js
│           ├── link.js
│           └── config.js
├── database/
│   ├── init.js                # Criação das tabelas
│   └── seed.js                # Dados de exemplo
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔌 API REST

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/estabelecimentos` | Listar estabelecimentos |
| POST | `/api/estabelecimentos` | Criar estabelecimento |
| GET | `/api/agendamentos?est=ID&data=YYYY-MM-DD` | Listar agendamentos |
| POST | `/api/agendamentos` | Criar agendamento |
| PATCH | `/api/agendamentos/:id/status` | Atualizar status |
| GET | `/api/clientes?est=ID` | Listar clientes |
| POST | `/api/clientes` | Criar cliente |
| GET | `/api/lembretes/pendentes?est=ID` | Lembretes pendentes hoje |
| POST | `/api/lembretes/gerar-link` | Gerar link WhatsApp |
| POST | `/api/lembretes/enviar-todos` | Gerar todos os links do dia |
| GET | `/api/relatorios/resumo?est=ID&periodo=mes` | Resumo financeiro |
| GET | `/agendar/:slug` | Página pública do cliente |
| POST | `/agendar/:slug` | Cliente faz agendamento |

---

## 📲 Como funciona o lembrete WhatsApp

1. O dono vai em **Lembretes WhatsApp** → vê os agendamentos do dia
2. Clica em **"Enviar"** em um cliente ou **"Enviar todos"**
3. O sistema abre o WhatsApp com a mensagem já preenchida
4. O dono só precisa clicar em **Enviar** no WhatsApp

> Para envio 100% automático (sem clique), contrate a **API Oficial do WhatsApp Business** (Meta) e substitua a função `gerarLinkWA` pela chamada à API.

---

## 🌐 Deploy no Railway / Render / VPS

1. Faça push para o GitHub
2. Conecte o repositório no [Railway](https://railway.app) ou [Render](https://render.com)
3. Defina as variáveis de ambiente (`PORT`, `SESSION_SECRET`)
4. Configure o comando de build: `npm run db:init && npm run db:seed`
5. Comando de start: `npm start`

---

## 🔐 Segurança

- Senhas com **bcrypt** (salt 10)
- Sessão com **express-session** (cookie httpOnly)
- Proteção de rotas via middleware `requireAuth`
- Foreign keys ativas no SQLite

---

## 📄 Licença

MIT — use à vontade!
