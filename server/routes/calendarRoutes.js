// server/routes/calendarRoutes.js
import express from 'express';
import { generateCalendar, getCalendar, deleteCalendar, autoScheduleCalendar} from '../controllers/calendarController.js';
import { authenticateToken } from '../controllers/regisAuthController.js';
import  protect  from '../middleware/regisAuthMiddleware.js';

const calendarRouter = express.Router();

calendarRouter.post('/generate', generateCalendar);
calendarRouter.post('/get', getCalendar);
calendarRouter.post('/delete', deleteCalendar);
calendarRouter.post('/auto-schedule', autoScheduleCalendar)

export default calendarRouter;
