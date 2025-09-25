import express from "express";
const router = express.Router();
import {
  googleAuth,
  signup,
  login,
  getMe,
  logout,
  requireAuth,
  authenticateToken,
  getTrialStatus,
  startTrial,
  saveContent,
  getContent,
} from '../controllers/regisAuthController.js';
import protect from '../middleware/regisAuthMiddleware.js';
//import { body, validationResult } from 'express-validator';
/*[
    body('plan').isIn(['starter', 'professional', 'business']).withMessage('Valid plan is required')
],*/

router.post('/google', googleAuth);
router.post('/signup', signup);
router.post('/login', login);
router.post('/saveContent', saveContent);
router.post('/getContent', getContent);
//router.get('/me', getMe);
// Protected routes (require session)
// 
router.post('/trials/start', authenticateToken, startTrial);
router.get('/trials/status', authenticateToken, getTrialStatus)
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);

export default router;