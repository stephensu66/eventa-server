import express from 'express';
import cors from 'cors';
import { APP_HOST, APP_PORT } from './constants/index.js';
import { waitForDbConnection } from './config/db.js';

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

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 启动服务器
await waitForDbConnection();
app.listen(APP_PORT, APP_HOST, () => {
  console.log(`Server runs at http://${APP_HOST}:${APP_PORT}`);
});
