import { createPool } from 'mysql2/promise';
import {
  DB_CONNECT_DELAY_MS,
  DB_CONNECT_RETRIES,
  DB_DATABASE,
  DB_HOST,
  DB_PASSWORD,
  DB_PORT,
  DB_USER
} from '../constants/index.js';

const db = createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  database: DB_DATABASE,
  password: DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 100,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const checkDbConnection = async () => {
  await db.query('SELECT 1');
};

export const waitForDbConnection = async () => {
  for (let attempt = 1; attempt <= DB_CONNECT_RETRIES; attempt += 1) {
    try {
      await checkDbConnection();
      console.log(`数据库连接成功: ${DB_HOST}:${DB_PORT}/${DB_DATABASE}`);
      return;
    } catch (error) {
      const isLastAttempt = attempt === DB_CONNECT_RETRIES;
      console.error(`数据库连接失败，第 ${attempt}/${DB_CONNECT_RETRIES} 次尝试`, error.message);
      if (isLastAttempt) {
        throw error;
      }
      await sleep(DB_CONNECT_DELAY_MS);
    }
  }
};

export const query = db.query.bind(db);
export const execute = db.execute.bind(db);
export default db;
