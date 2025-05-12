import { Router } from 'express';
import { createActivity, getActivityList } from '../controllers/eventController.js';

const eventsRouter = Router();

eventsRouter.post('/create', createActivity);
eventsRouter.get('/list', getActivityList);

export default eventsRouter;
