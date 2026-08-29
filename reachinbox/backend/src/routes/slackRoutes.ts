import { Router } from 'express';
import {
  initiateSlackOAuth,
  handleSlackCallback,
  getSlackStatus,
  disconnectSlack
} from '../controllers/slackController';

const router = Router();

router.get('/connect', initiateSlackOAuth);
router.get('/callback', handleSlackCallback);
router.get('/status', getSlackStatus);
router.delete('/', disconnectSlack);

export default router;
