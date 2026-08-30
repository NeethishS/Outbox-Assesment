import { Router } from 'express';
import {
  initiateGoogleOAuth,
  handleGoogleCallback,
  handleDemoLogin,
  getCurrentUser,
  logoutUser
} from '../controllers/authController';

const router = Router();

router.get('/google', initiateGoogleOAuth);
router.get('/google/callback', handleGoogleCallback);
router.get('/demo', handleDemoLogin);
router.get('/me', getCurrentUser);
router.post('/logout', logoutUser);

export default router;
