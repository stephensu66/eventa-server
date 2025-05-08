import { Router } from 'express';
import { createActivity, getActivityList } from '../controllers/activityController';

const eventsRouter = Router();

eventsRouter.post('/create', createActivity);
eventsRouter.get('/list', getActivityList);

export default eventsRouter;
