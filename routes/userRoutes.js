import { Router } from 'express';
import { createUser, checkUser, uploadUserInfo, getUserStats, joinEvent } from '../controllers/userController.js';
import authMiddleware from '../middleware/index.js';

const usersRouter = Router();

usersRouter.post('/register', createUser);
usersRouter.post('/join', authMiddleware, joinEvent);
usersRouter.post('/check', checkUser);
usersRouter.get('/status', authMiddleware, getUserStats);
usersRouter.post('/userinfo/upload', authMiddleware, uploadUserInfo);

export default usersRouter;
