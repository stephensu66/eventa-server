import { Router } from 'express';
import { createUser, checkUser, uploadUserInfo, getUserStats, joinEvent, getUserNotifications, markNotificationAsRead } from '../controllers/userController.js';
import authMiddleware from '../middleware/index.js';

const usersRouter = Router();

usersRouter.post('/register', createUser);
usersRouter.post('/join', authMiddleware, joinEvent);
usersRouter.post('/check', checkUser);
usersRouter.get('/status', authMiddleware, getUserStats);
usersRouter.post('/userinfo/upload', authMiddleware, uploadUserInfo);
usersRouter.get('/notifications', authMiddleware, getUserNotifications);
usersRouter.post('/notifications/read', authMiddleware, markNotificationAsRead);

export default usersRouter;
