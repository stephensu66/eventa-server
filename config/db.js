import mysql from 'mysql2';
import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_PORT, DB_USER } from '../constants/index.js';

const db = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  database: DB_DATABASE,
  password: DB_PASSWORD,
  
});

db.connect((err) => {
  if (err) {
    console.error('数据库连接失败', err);
  } else {
    console.log('数据库连接成功');
  }
});

export const query = db.query.bind(db);
export default db;
