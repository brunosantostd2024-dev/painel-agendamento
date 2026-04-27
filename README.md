# 📅 Agenda Pro — PostgreSQL

Sistema de agendamento profissional multi-nicho com PostgreSQL.

## 🚀 Deploy no Railway

### Variáveis de ambiente necessárias:
```
DATABASE_URL=postgresql://postgres:...@postgres.railway.internal:5432/railway
SESSION_SECRET=agenda2024segredo
```

### Comando de start:
```
node database/init.js && node database/seed.js && node src/server.js
```

## 💻 Rodar localmente

```bash
npm install
cp .env.example .env
# Edite o .env com sua DATABASE_URL
node database/init.js
node database/seed.js
npm run dev
```

**Login:** admin@agendapro.com / admin123

## ✨ Funcionalidades
- Multi-usuário: cada pessoa cria sua própria conta
- Múltiplos estabelecimentos por conta
- Lembretes WhatsApp com 1 clique
- Link público de agendamento para clientes
- Relatórios financeiros
- Banco PostgreSQL persistente
