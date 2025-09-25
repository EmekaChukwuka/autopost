import express from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import  protect  from '../middleware/regisAuthMiddleware.js';

const paymentRouter = express.Router();

paymentRouter.post('/initialize', protect, PaymentController.initializePayment);
paymentRouter.post('/verify', protect, PaymentController.verifyPayment);
paymentRouter.post('/webhook', PaymentController.handleWebhook);
paymentRouter.get('/plans', PaymentController.getSubscriptionPlans);

export default paymentRouter;