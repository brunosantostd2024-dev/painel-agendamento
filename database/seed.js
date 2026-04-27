// database/seed.js — Dados de exemplo no PostgreSQL
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getOne, insert, run, pool } = require('../src/models/db');

async function seed() {
  console.log('🌱 Populando banco de dados...');

  // Admin
  const senha = bcrypt.hashSync('admin123', 10);
  let user = await getOne('SELECT id FROM usuarios WHERE email = $1', ['admin@agendapro.com']);
  let userId;
  if (!user) {
    userId = await insert('INSERT INTO usuarios (nome, email, senha, role) VALUES ($1,$2,$3,$4)', ['Administrador', 'admin@agendapro.com', senha, 'admin']);
  } else {
    userId = user.id;
  }

  // Estabelecimento
  let est = await getOne('SELECT id FROM estabelecimentos WHERE slug = $1', ['belezatotal']);
  let estId;
  if (!est) {
    estId = await insert('INSERT INTO estabelecimentos (usuario_id, nome, nicho, cidade, estado, whatsapp, slug) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [userId, 'Salão Beleza Total', 'feminino', 'Cataguases', 'MG', '(32) 98765-4321', 'belezatotal']);
  } else {
    estId = est.id;
  }

  // Profissionais
  let p1 = await getOne('SELECT id FROM profissionais WHERE estabelecimento_id=$1 AND nome=$2', [estId, 'Ana Lima']);
  const profId = p1 ? p1.id : await insert('INSERT INTO profissionais (estabelecimento_id, nome, especialidade, whatsapp) VALUES ($1,$2,$3,$4)', [estId, 'Ana Lima', 'Cabeleireira', '(32) 99500-1111']);

  await getOne('SELECT id FROM profissionais WHERE estabelecimento_id=$1 AND nome=$2', [estId, 'Carlos Silva']) ||
    await insert('INSERT INTO profissionais (estabelecimento_id, nome, especialidade, whatsapp) VALUES ($1,$2,$3,$4)', [estId, 'Carlos Silva', 'Barbeiro', '(32) 99500-2222']);

  // Serviços
  let s1 = await getOne('SELECT id FROM servicos WHERE estabelecimento_id=$1 AND nome=$2', [estId, 'Corte Feminino']);
  const svc1 = s1 ? s1.id : await insert('INSERT INTO servicos (estabelecimento_id, nome, duracao_min, preco, nicho) VALUES ($1,$2,$3,$4,$5)', [estId, 'Corte Feminino', 45, 70, 'feminino']);
  let s2 = await getOne('SELECT id FROM servicos WHERE estabelecimento_id=$1 AND nome=$2', [estId, 'Escova']);
  const svc2 = s2 ? s2.id : await insert('INSERT INTO servicos (estabelecimento_id, nome, duracao_min, preco, nicho) VALUES ($1,$2,$3,$4,$5)', [estId, 'Escova', 60, 60, 'feminino']);
  await getOne('SELECT id FROM servicos WHERE estabelecimento_id=$1 AND nome=$2', [estId, 'Coloração']) ||
    await insert('INSERT INTO servicos (estabelecimento_id, nome, duracao_min, preco, nicho) VALUES ($1,$2,$3,$4,$5)', [estId, 'Coloração', 120, 180, 'feminino']);
  await getOne('SELECT id FROM servicos WHERE estabelecimento_id=$1 AND nome=$2', [estId, 'Corte Masculino']) ||
    await insert('INSERT INTO servicos (estabelecimento_id, nome, duracao_min, preco, nicho) VALUES ($1,$2,$3,$4,$5)', [estId, 'Corte Masculino', 30, 45, 'masculino']);
  await getOne('SELECT id FROM servicos WHERE estabelecimento_id=$1 AND nome=$2', [estId, 'Corte + Barba']) ||
    await insert('INSERT INTO servicos (estabelecimento_id, nome, duracao_min, preco, nicho) VALUES ($1,$2,$3,$4,$5)', [estId, 'Corte + Barba', 60, 70, 'masculino']);

  // Clientes
  let c1 = await getOne('SELECT id FROM clientes WHERE estabelecimento_id=$1 AND nome=$2', [estId, 'Beatriz Alves']);
  const cli1 = c1 ? c1.id : await insert('INSERT INTO clientes (estabelecimento_id, nome, whatsapp) VALUES ($1,$2,$3)', [estId, 'Beatriz Alves', '(32) 99812-5678']);
  let c2 = await getOne('SELECT id FROM clientes WHERE estabelecimento_id=$1 AND nome=$2', [estId, 'Sandra Costa']);
  const cli2 = c2 ? c2.id : await insert('INSERT INTO clientes (estabelecimento_id, nome, whatsapp) VALUES ($1,$2,$3)', [estId, 'Sandra Costa', '(32) 99754-6789']);
  let c3 = await getOne('SELECT id FROM clientes WHERE estabelecimento_id=$1 AND nome=$2', [estId, 'Roberto Lima']);
  const cli3 = c3 ? c3.id : await insert('INSERT INTO clientes (estabelecimento_id, nome, whatsapp) VALUES ($1,$2,$3)', [estId, 'Roberto Lima', '(32) 99445-3456']);

  // Agendamentos de hoje
  const hoje = new Date().toISOString().split('T')[0];
  const agExiste = await getOne('SELECT id FROM agendamentos WHERE estabelecimento_id=$1 AND data=$2 AND horario=$3', [estId, hoje, '09:00']);
  if (!agExiste) {
    await insert('INSERT INTO agendamentos (estabelecimento_id, cliente_id, profissional_id, servico_id, data, horario, status) VALUES ($1,$2,$3,$4,$5,$6,$7)', [estId, cli1, profId, svc1, hoje, '09:00', 'confirmado']);
    await insert('INSERT INTO agendamentos (estabelecimento_id, cliente_id, profissional_id, servico_id, data, horario, status) VALUES ($1,$2,$3,$4,$5,$6,$7)', [estId, cli2, profId, svc2, hoje, '11:00', 'pendente']);
    await insert('INSERT INTO agendamentos (estabelecimento_id, cliente_id, profissional_id, servico_id, data, horario, status) VALUES ($1,$2,$3,$4,$5,$6,$7)', [estId, cli3, profId, svc1, hoje, '14:00', 'pendente']);
  }

  // Configurações
  await run('INSERT INTO configuracoes (estabelecimento_id) VALUES ($1) ON CONFLICT (estabelecimento_id) DO NOTHING', [estId]);

  console.log('✅ Dados de exemplo criados!');
  console.log('👤 Login: admin@agendapro.com / admin123');
  await pool.end();
}

seed().catch(e => { console.error('Erro no seed:', e.message); process.exit(1); });
