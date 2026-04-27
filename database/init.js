require('dotenv').config();
const { initDb } = require('../src/models/db');

initDb().then(db => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      role TEXT DEFAULT 'dono',
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS estabelecimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      nicho TEXT NOT NULL,
      cidade TEXT,
      estado TEXT,
      whatsapp TEXT,
      slug TEXT UNIQUE NOT NULL,
      abertura TEXT DEFAULT '08:00',
      fechamento TEXT DEFAULT '19:00',
      ativo INTEGER DEFAULT 1,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS profissionais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estabelecimento_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      especialidade TEXT,
      whatsapp TEXT,
      ativo INTEGER DEFAULT 1,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS servicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estabelecimento_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      duracao_min INTEGER DEFAULT 30,
      preco REAL DEFAULT 0,
      nicho TEXT,
      ativo INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estabelecimento_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      whatsapp TEXT,
      email TEXT,
      observacoes TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estabelecimento_id INTEGER NOT NULL,
      cliente_id INTEGER NOT NULL,
      profissional_id INTEGER,
      servico_id INTEGER NOT NULL,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      status TEXT DEFAULT 'pendente',
      observacoes TEXT,
      lembrete_enviado INTEGER DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS lembretes_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agendamento_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      enviado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'enviado'
    );
    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estabelecimento_id INTEGER UNIQUE NOT NULL,
      lembrete_1h INTEGER DEFAULT 1,
      lembrete_dia_anterior INTEGER DEFAULT 1,
      confirmacao_imediata INTEGER DEFAULT 1,
      lembrete_retorno INTEGER DEFAULT 0,
      msg_template TEXT DEFAULT 'Olá {nome}! Lembrete do seu {servico} hoje às {horario}. Te esperamos! 😊'
    );
  `);
  console.log('✅ Banco criado com sucesso!');
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
