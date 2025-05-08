import { Router } from 'express';
import { createActivity, getActivityList } from '../controllers/activityController';

const eventsRouter = Router();

eventsRouter.post('/event/create', createActivity);
eventsRouter.get('/event/list', getActivityList);

export default eventsRouter;
