// src/server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { initDb } = require('./models/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'agenda-pro-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Inicia banco ANTES de subir rotas
initDb().then(() => {
  app.use('/api/auth',             require('./routes/auth'));
  app.use('/api/estabelecimentos', require('./routes/estabelecimentos'));
  app.use('/api/profissionais',    require('./routes/profissionais'));
  app.use('/api/servicos',         require('./routes/servicos'));
  app.use('/api/clientes',         require('./routes/clientes'));
  app.use('/api/agendamentos',     require('./routes/agendamentos'));
  app.use('/api/lembretes',        require('./routes/lembretes'));
  app.use('/api/relatorios',       require('./routes/relatorios'));
  app.use('/agendar',              require('./routes/publico'));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erro interno', details: err.message });
  });

  app.listen(PORT, () => {
    console.log(`\n🚀 Agenda Pro em http://localhost:${PORT}`);
    console.log(`📅 API: http://localhost:${PORT}/api\n`);
  });
}).catch(err => {
  console.error('Erro ao iniciar banco:', err);
  process.exit(1);
});

module.exports = app;
