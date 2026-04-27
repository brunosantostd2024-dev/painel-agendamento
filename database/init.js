// database/init.js — Cria tabelas no PostgreSQL
require('dotenv').config();
const { query, pool } = require('../src/models/db');

async function init() {
  console.log('🔧 Criando tabelas no PostgreSQL...');

  await query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      role TEXT DEFAULT 'dono',
      criado_em TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS estabelecimentos (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      nome TEXT NOT NULL,
      nicho TEXT NOT NULL,
      cidade TEXT,
      estado TEXT,
      whatsapp TEXT,
      slug TEXT UNIQUE NOT NULL,
      abertura TEXT DEFAULT '08:00',
      fechamento TEXT DEFAULT '19:00',
      ativo BOOLEAN DEFAULT TRUE,
      criado_em TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS profissionais (
      id SERIAL PRIMARY KEY,
      estabelecimento_id INTEGER NOT NULL REFERENCES estabelecimentos(id),
      nome TEXT NOT NULL,
      especialidade TEXT,
      whatsapp TEXT,
      ativo BOOLEAN DEFAULT TRUE,
      criado_em TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS servicos (
      id SERIAL PRIMARY KEY,
      estabelecimento_id INTEGER NOT NULL REFERENCES estabelecimentos(id),
      nome TEXT NOT NULL,
      duracao_min INTEGER DEFAULT 30,
      preco NUMERIC(10,2) DEFAULT 0,
      nicho TEXT,
      ativo BOOLEAN DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,
      estabelecimento_id INTEGER NOT NULL REFERENCES estabelecimentos(id),
      nome TEXT NOT NULL,
      whatsapp TEXT,
      email TEXT,
      observacoes TEXT,
      criado_em TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id SERIAL PRIMARY KEY,
      estabelecimento_id INTEGER NOT NULL REFERENCES estabelecimentos(id),
      cliente_id INTEGER NOT NULL REFERENCES clientes(id),
      profissional_id INTEGER REFERENCES profissionais(id),
      servico_id INTEGER NOT NULL REFERENCES servicos(id),
      data DATE NOT NULL,
      horario TEXT NOT NULL,
      status TEXT DEFAULT 'pendente',
      observacoes TEXT,
      lembrete_enviado BOOLEAN DEFAULT FALSE,
      criado_em TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS lembretes_log (
      id SERIAL PRIMARY KEY,
      agendamento_id INTEGER NOT NULL REFERENCES agendamentos(id),
      tipo TEXT NOT NULL,
      enviado_em TIMESTAMP DEFAULT NOW(),
      status TEXT DEFAULT 'enviado'
    );

    CREATE TABLE IF NOT EXISTS configuracoes (
      id SERIAL PRIMARY KEY,
      estabelecimento_id INTEGER UNIQUE NOT NULL REFERENCES estabelecimentos(id),
      lembrete_1h BOOLEAN DEFAULT TRUE,
      lembrete_dia_anterior BOOLEAN DEFAULT TRUE,
      confirmacao_imediata BOOLEAN DEFAULT TRUE,
      lembrete_retorno BOOLEAN DEFAULT FALSE,
      msg_template TEXT DEFAULT 'Olá {nome}! Lembrete do seu {servico} hoje às {horario}. Te esperamos! 😊'
    );

    CREATE TABLE IF NOT EXISTS session (
      sid VARCHAR NOT NULL COLLATE "default",
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL,
      CONSTRAINT session_pkey PRIMARY KEY (sid)
    );
    CREATE INDEX IF NOT EXISTS IDX_session_expire ON session(expire);
  `);

  console.log('✅ Tabelas criadas com sucesso!');
  await pool.end();
}

init().catch(e => { console.error('Erro:', e.message); process.exit(1); });
