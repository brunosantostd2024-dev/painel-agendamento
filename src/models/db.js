// src/models/db.js — Conexão PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway.internal')
    ? false
    : { rejectUnauthorized: false }
});

// Helper: query simples
async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res;
  } finally {
    client.release();
  }
}

// Helper: busca um registro
async function getOne(sql, params = []) {
  const res = await query(sql, params);
  return res.rows[0] || null;
}

// Helper: busca vários registros
async function getAll(sql, params = []) {
  const res = await query(sql, params);
  return res.rows;
}

// Helper: insere e retorna o id
async function insert(sql, params = []) {
  const res = await query(sql + ' RETURNING id', params);
  return res.rows[0]?.id;
}

// Helper: atualiza/deleta e retorna linhas afetadas
async function run(sql, params = []) {
  const res = await query(sql, params);
  return res.rowCount;
}

pool.on('error', (err) => {
  console.error('Erro no pool PostgreSQL:', err.message);
});

module.exports = { query, getOne, getAll, insert, run, pool };
