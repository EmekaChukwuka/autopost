// server/routes/calendarRoutes.js
import express from 'express';
import { generateCalendar, getCalendar, deleteCalendar, getConnectedAccounts} from '../controllers/calendarController.js';
import { postContent } from '../controllers/postingController.js';
import { authenticateToken } from '../controllers/regisAuthController.js';
import  protect  from '../middleware/regisAuthMiddleware.js';

const calendarRouter = express.Router();

calendarRouter.post('/generate', generateCalendar);
calendarRouter.post('/get', getCalendar);
calendarRouter.post('/delete', deleteCalendar);
calendarRouter.post('/social/accounts', getConnectedAccounts);
calendarRouter.post('/post-content', postContent);
export default calendarRouter;
