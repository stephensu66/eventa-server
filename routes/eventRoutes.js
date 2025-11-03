import { Router } from 'express';
import { createActivity, getActivityList, getActivityDetail, updateActivityDetail, updateImages } from '../controllers/eventController.js';
import authMiddleware from '../middleware/index.js';
import { getCOSstsMiddleware } from '../middleware/cosMiddleware.js';

const eventsRouter = Router();

eventsRouter.post('/create', authMiddleware, createActivity);
eventsRouter.get('/list', getActivityList);
eventsRouter.get('/detail', authMiddleware, getActivityDetail);
eventsRouter.put('/update', authMiddleware, updateActivityDetail);

eventsRouter.post('/cos-signature', getCOSstsMiddleware, (res, req) => {
  res.json(req.cosSts)
});

export default eventsRouter;
