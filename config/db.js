import { createConnection } from 'mysql2';

const db = createConnection({
  host: 'db4free.net',
  port: 3306,
  user: 'taroevent',
  database: 'taroevent',
  password: '12345678',
  
});

db.connect((err) => {
  if (err) {
    console.error('数据库连接失败', err);
  } else {
    console.log('数据库连接成功');
  }
});

export default db;