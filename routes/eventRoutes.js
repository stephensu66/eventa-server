import { Router } from 'express';
import { createActivity, getActivityList, getActivityDetail, updateActivityDetail, updateImages, getActivityListByUserStatus, addFavorite, removeFavorite } from '../controllers/eventController.js';
import authMiddleware from '../middleware/index.js';
import { getCOSstsMiddleware } from '../middleware/cosMiddleware.js';

const eventsRouter = Router();

eventsRouter.post('/create', authMiddleware, createActivity);
eventsRouter.get('/list', getActivityList);
eventsRouter.get('/detail', authMiddleware, getActivityDetail);
eventsRouter.put('/update', authMiddleware, updateActivityDetail);
eventsRouter.get('/user', authMiddleware, getActivityListByUserStatus);
eventsRouter.post('/favorite', authMiddleware, addFavorite);
eventsRouter.put('/favorite', authMiddleware, removeFavorite);

eventsRouter.post('/cos-signature', getCOSstsMiddleware, (req, res) => {
  res.json(req.cosSts)
});

export default eventsRouter;
