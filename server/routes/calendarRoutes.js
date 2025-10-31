// server/routes/calendarRoutes.js
import express from 'express';
import { generateCalendar, getCalendar, deleteCalendar } from '../controllers/calendarController.js';
import { authenticateToken } from '../controllers/regisAuthController.js';
import  protect  from '../middleware/regisAuthMiddleware.js';

const calendarRouter = express.Router();

calendarRouter.post('/generate', protect, generateCalendar);
calendarRouter.post('/get', protect, getCalendar);
calendarRouter.post('/delete', deleteCalendar);

export default calendarRouter;
