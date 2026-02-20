import { createPool } from 'mysql2/promise';
import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_PORT, DB_USER } from '../constants/index.js';

const db = createPool({
  host: DB_HOST,
  port: Number(DB_PORT) || 3306,
  user: DB_USER,
  database: DB_DATABASE,
  password: DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const checkDbConnection = async () => {
  try {
    await db.query('SELECT 1');
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败', error);
    throw error;
  }
};

export const query = db.query.bind(db);
export const execute = db.execute.bind(db);
export default db;
