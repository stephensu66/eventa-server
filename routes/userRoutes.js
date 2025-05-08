import { Router } from 'express';
import { createUser, login } from '../controllers/userController';

const usersRouter = Router();

usersRouter.post('/register', createUser);
usersRouter.post('/login', login);

export default usersRouter;
