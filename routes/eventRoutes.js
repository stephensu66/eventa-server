import { Router } from 'express';
import { createActivity, getActivityList } from '../controllers/activityController';

const router = Router();

router.post('/create', createActivity);
router.get('/list', getActivityList);

export default router;
