import { Router } from 'express';
import {
  scheduleEmailsHandler,
  getScheduledEmailsHandler,
  getSentEmailsHandler,
  searchEmailsHandler,
  cancelScheduledEmailHandler
} from '../controllers/emailController';

const router = Router();

router.post('/schedule', scheduleEmailsHandler);
router.get('/scheduled', getScheduledEmailsHandler);
router.get('/sent', getSentEmailsHandler);
router.get('/search', searchEmailsHandler);
router.delete('/scheduled/:id', cancelScheduledEmailHandler);
router.delete('/:id', cancelScheduledEmailHandler);

export default router;
