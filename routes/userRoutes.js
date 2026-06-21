import { Router } from 'express';
import { createUser, checkUser, uploadUserInfo, getUserStats, joinEvent, cancelJoinEvent, getUserNotifications, markNotificationAsRead, submitUserFeedback } from '../controllers/userController.js';
import authMiddleware from '../middleware/index.js';

const usersRouter = Router();

usersRouter.post('/register', createUser);
usersRouter.post('/join', authMiddleware, joinEvent);
usersRouter.put('/join', authMiddleware, cancelJoinEvent);
usersRouter.post('/check', checkUser);
usersRouter.get('/status', authMiddleware, getUserStats);
usersRouter.post('/userinfo/upload', authMiddleware, uploadUserInfo);
usersRouter.get('/notifications', authMiddleware, getUserNotifications);
usersRouter.post('/notifications/read', authMiddleware, markNotificationAsRead);
usersRouter.post('/feedback', authMiddleware, submitUserFeedback);

export default usersRouter;
