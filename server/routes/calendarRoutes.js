// server/routes/calendarRoutes.js
import express from 'express';
import { generateCalendar, getCalendar, deleteCalendar } from '../controllers/calendarController.js';
import { authenticateToken } from '../controllers/regisAuthController.js';

const router = express.Router();

router.post('/generate',authenticateToken, generateCalendar);
router.post('/get', authenticateToken, getCalendar);
router.post('/delete', deleteCalendar);

export default router;
