import { Router } from 'express';
import { createActivity, getActivityList } from '../controllers/activityController';

const usersRouter = Router();

usersRouter.post('/users/create', createUser);

export default usersRouter;
