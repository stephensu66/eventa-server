import express from 'express';
import cors from 'cors';
import { checkDbConnection } from './config/db.js';

import eventsRouter from './routes/eventRoutes.js';
import usersRouter from './routes/userRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

// 挂载路由
app.use('/api/activity', eventsRouter);
app.use('/api/user', usersRouter);

// 测试接口
app.get('/', (req, res) => {
  res.send('Server starts successfully');
});

// 启动服务器
await checkDbConnection(); // 先确认数据库可用
app.listen(3300, '0.0.0.0', () => {
  console.log('Server runs at http://0.0.0.0:3300');
});
