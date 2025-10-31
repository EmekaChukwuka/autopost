// server/routes/calendarRoutes.js
import express from 'express';
import { generateCalendar, getCalendar, deleteCalendar } from '../controllers/calendarController.js';
import { authenticateToken } from '../controllers/regisAuthController.js';
import  protect  from '../middleware/regisAuthMiddleware.js';

const router = express.Router();

router.post('/generate', generateCalendar);
router.post('/get', getCalendar);
router.post('/delete', deleteCalendar);

export default router;
