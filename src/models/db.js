// src/models/db.js — SQLite via sql.js (puro JS, sem Python, sem compilar)
const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(process.env.DB_PATH || './database/agenda.db');
let _db = null;

function saveDb(sqljs) {
  const data = sqljs.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function wrap(sqljs) {
  return {
    pragma: () => {},
    exec(sql) { sqljs.run(sql); saveDb(sqljs); },
    prepare(sql) {
      return {
        run(...args) {
          const p = args.flat();
          sqljs.run(sql, p);
          const r = sqljs.exec('SELECT last_insert_rowid() as id');
          const id = r[0]?.values[0]?.[0] || 0;
          saveDb(sqljs);
          return { lastInsertRowid: id, changes: sqljs.getRowsModified() };
        },
        get(...args) {
          const p = args.flat();
          const r = sqljs.exec(sql, p);
          if (!r[0]) return undefined;
          const row = r[0].values[0];
          if (!row) return undefined;
          return Object.fromEntries(r[0].columns.map((c, i) => [c, row[i]]));
        },
        all(...args) {
          const p = args.flat();
          const r = sqljs.exec(sql, p);
          if (!r[0]) return [];
          return r[0].values.map(row =>
            Object.fromEntries(r[0].columns.map((c, i) => [c, row[i]]))
          );
        },
      };
    },
  };
}

let _instance = null;

async function initDb() {
  const SQL = await require('sql.js')();
  let db;
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }
  _instance = wrap(db);
  return _instance;
}

function getDb() {
  if (!_instance) throw new Error('DB não iniciado. Chame initDb() no server.js primeiro.');
  return _instance;
}

module.exports = getDb;
module.exports.initDb = initDb;
