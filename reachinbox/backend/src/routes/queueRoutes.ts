import { Router } from 'express';
import { getQueueStatsHandler } from '../controllers/queueController';

const router = Router();

router.get('/stats', getQueueStatsHandler);

export default router;
