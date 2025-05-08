import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';

import eventsRouter from './routes/eventRoutes';
import usersRouter from './routes/userRoutes';

const app = express();
app.use(cors());
app.use(json());

// 挂载路由
app.use('/api/activity', eventsRouter);
app.use('/api/users', usersRouter);

// 测试接口
app.get('/', (req, res) => {
  res.send('Server starts successfully');
});

// 启动服务器
app.listen(3000, () => {
  console.log('Server runs at http://localhost:3000');
});