require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initDb } = require('../src/models/db');

initDb().then(db => {
  const senha = bcrypt.hashSync('admin123', 10);
  const u = db.prepare('INSERT OR IGNORE INTO usuarios (nome, email, senha, role) VALUES (?, ?, ?, ?)').run('Administrador', 'admin@agendapro.com', senha, 'admin');
  const userId = u.lastInsertRowid || db.prepare('SELECT id FROM usuarios WHERE email = ?').get('admin@agendapro.com').id;

  const e1 = db.prepare('INSERT OR IGNORE INTO estabelecimentos (usuario_id, nome, nicho, cidade, estado, whatsapp, slug) VALUES (?,?,?,?,?,?,?)').run(userId,'Salão Beleza Total','feminino','Cataguases','MG','(32) 98765-4321','belezatotal');
  const estId = e1.lastInsertRowid || db.prepare('SELECT id FROM estabelecimentos WHERE slug = ?').get('belezatotal').id;

  db.prepare('INSERT OR IGNORE INTO profissionais (estabelecimento_id, nome, especialidade, whatsapp) VALUES (?,?,?,?)').run(estId,'Ana Lima','Cabeleireira','(32) 99500-1111');
  db.prepare('INSERT OR IGNORE INTO profissionais (estabelecimento_id, nome, especialidade, whatsapp) VALUES (?,?,?,?)').run(estId,'Carlos Silva','Barbeiro','(32) 99500-2222');

  const s1 = db.prepare('INSERT OR IGNORE INTO servicos (estabelecimento_id, nome, duracao_min, preco, nicho) VALUES (?,?,?,?,?)').run(estId,'Corte Feminino',45,70,'feminino');
  const s2 = db.prepare('INSERT OR IGNORE INTO servicos (estabelecimento_id, nome, duracao_min, preco, nicho) VALUES (?,?,?,?,?)').run(estId,'Escova',60,60,'feminino');
  const s3 = db.prepare('INSERT OR IGNORE INTO servicos (estabelecimento_id, nome, duracao_min, preco, nicho) VALUES (?,?,?,?,?)').run(estId,'Coloração',120,180,'feminino');

  const c1 = db.prepare('INSERT OR IGNORE INTO clientes (estabelecimento_id, nome, whatsapp) VALUES (?,?,?)').run(estId,'Beatriz Alves','(32) 99812-5678');
  const c2 = db.prepare('INSERT OR IGNORE INTO clientes (estabelecimento_id, nome, whatsapp) VALUES (?,?,?)').run(estId,'Sandra Costa','(32) 99754-6789');

  const hoje = new Date().toISOString().split('T')[0];
  const profId = db.prepare('SELECT id FROM profissionais WHERE estabelecimento_id = ? LIMIT 1').get(estId).id;
  db.prepare('INSERT OR IGNORE INTO agendamentos (estabelecimento_id, cliente_id, profissional_id, servico_id, data, horario, status) VALUES (?,?,?,?,?,?,?)').run(estId, c1.lastInsertRowid || 1, profId, s1.lastInsertRowid || 1, hoje,'09:00','confirmado');
  db.prepare('INSERT OR IGNORE INTO agendamentos (estabelecimento_id, cliente_id, profissional_id, servico_id, data, horario, status) VALUES (?,?,?,?,?,?,?)').run(estId, c2.lastInsertRowid || 2, profId, s2.lastInsertRowid || 2, hoje,'11:00','pendente');

  db.prepare('INSERT OR IGNORE INTO configuracoes (estabelecimento_id) VALUES (?)').run(estId);

  console.log('✅ Dados de exemplo criados!');
  console.log('👤 Login: admin@agendapro.com / admin123');
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
