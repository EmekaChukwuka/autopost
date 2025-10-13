import axios from 'axios';
import  pool  from '../config/db.js';
import User from '../models/User.js';


const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export class PaymentController {
  static async initializePayment(req, res) {
    try {
      const { plan, amount, payment_method, email, id, callback_url } = req.body;
      const userIda = id;
      const userEmail = email;
      const existingUser = await User.findByEmail(userEmail);
          if (existingUser) {
            console.log(existingUser);
          let userId = existingUser.id;

      // Generate unique reference
      const reference = `AUTOPOST_${Date.now()}_${userId}`;

      // Prepare Paystack payment data
      const paymentData = {
        email: userEmail,
        amount: amount * 100, // Paystack expects amount in kobo
        currency: 'NGN',
        callback_url: callback_url,
        reference: reference,
        channels: [payment_method],
        metadata: {
          plan: plan,
          user_id: userId,
          custom_fields: [
            {
              display_name: "Plan Name",
              variable_name: "plan_name",
              value: plan
            }
          ]
        }
      };

      // Initialize payment with Paystack
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Store transaction in database
      await pool.execute(
        `INSERT INTO transactions 
         (user_id, amount, currency, plan, reference, status, payment_method) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, amount, 'NGN', plan, reference, 'initiated', payment_method]
      );

      res.json({
        success: true,
        message: 'Payment initialized',
        data: {
          authorization_url: response.data.data.authorization_url,
          access_code: response.data.data.access_code,
          reference: reference,
          public_key: process.env.PAYSTACK_PUBLIC_KEY,
          email: userEmail,
          amount: amount,
          currency: 'NGN',
          metadata: paymentData.metadata
        }
      });
    }
    } catch (error) {
      console.error('Payment initialization error:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        message: 'Payment initialization failed'
      });
    }
  }

  static async verifyPayment(req, res) {
    try {
      const { reference, email } = req.body;
      console.log(reference);
      const existingUser = await User.findByEmail(email);
          if (existingUser) {
            console.log(existingUser);
          let userId = existingUser.id;

      // Verify payment with Paystack
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        }
      );

      const transaction = response.data.data;
      console.log(transaction);

      if (transaction.status === 'success') {
        // Update transaction status
        await pool.execute(
          `UPDATE transactions SET 
           status = 'completed', 
           paystack_id = ?,
           updated_at = NOW()
           WHERE reference = ? AND user_id = ?`,
          [transaction.id, reference, userId]
        );

        // Update user subscription
        await pool.execute(
          `UPDATE users SET 
           subscription_plan = ?,
           subscription_status = 'active',
           subscription_end = DATE_ADD(NOW(), INTERVAL 1 MONTH)
           WHERE id = ?`,
          [transaction.metadata.plan, userId]
        ); 

        // Activate subscription
     /* await User.activateSubscription(userId, 'PLN_vk5xa0fv3n5v1mm', transaction.id);

      const subscription = await User.getUserSubscription(userId);*/

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          transaction: transaction
        }
      });
      } else {
        await pool.execute(
          `UPDATE transactions SET status = 'failed' WHERE reference = ?`,
          [reference]
        );

        res.status(400).json({
          success: false,
          message: 'Payment verification failed'
        });
      }
    }else{
      console.log('error');
    }
    } catch (error) {
      console.error('Payment verification error:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  }

  static async handleWebhook(req, res) {
    try {
      // Verify webhook signature
      const secret = process.env.PAYSTACK_SECRET_KEY;
      const signature = req.headers['x-paystack-signature'];
      
      if (!signature) {
        return res.status(401).json({ error: 'No signature provided' });
      }

      // Verify signature (you'd need to implement crypto verification)
      const crypto = await import('crypto');
      const hash = crypto.createHmac('sha512', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (hash !== signature) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const event = req.body;
      
      if (event.event === 'charge.success') {
        const transaction = event.data;

        await pool.execute(
          `UPDATE transactions SET 
           status = 'completed',
           paystack_id = ?,
           updated_at = NOW()
           WHERE reference = ?`,
          [transaction.id, transaction.reference]
        );

        // Update user subscription
        if (transaction.metadata && transaction.metadata.user_id) {
          await pool.execute(
            `UPDATE users SET 
             subscription_plan = ?,
             subscription_status = 'active',
             subscription_end = DATE_ADD(NOW(), INTERVAL 1 MONTH)
             WHERE id = ?`,
            [transaction.metadata.plan, transaction.metadata.user_id]
          );
        }

        console.log('success');
      }

      if (event.event === 'subscription.create') {
  const sub = event.data; // subscription object
  await pool.execute(
    'INSERT INTO subscriptions (customer_email, plan_code, subscription_code, status, paystack_response) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=?, paystack_response=?',
    [
      sub.customer.email,
      sub.plan.plan_code,
      sub.subscription_code,
      sub.status,
      JSON.stringify(sub),
      sub.status,
      JSON.stringify(sub)
    ]
  );
}

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  static async getSubscriptionPlans(req, res) {
    try {
      const [plans] = await pool.execute(
        `SELECT id, name, price, duration, features 
         FROM subscription_plans 
         WHERE active = true 
         ORDER BY price ASC`
      );

      res.json({
        success: true,
        data: plans
      });
    } catch (error) {
      console.error('Get plans error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch plans'
      });
    }
  }

  /*static async createSubscription(req, res) {
    try {
      const { plan, amount, interval } = req.body;
      const userId = req.session.user.id;
      const userEmail = req.session.user.email;

      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/plan`,
        {
          name: `AutoPost ${plan} Plan`,
          amount: amount * 100,
          interval: interval || 'monthly',
          currency: 'NGN'
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        }
      );

      const planCode = response.data.data.plan_code;

      // Create subscription
      const subscriptionResponse = await axios.post(
        `${PAYSTACK_BASE_URL}/subscription`,
        {
          customer: userEmail,
          plan: planCode,
          authorization: req.body.authorization_code
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        }
      );

      res.json({
        success: true,
        data: subscriptionResponse.data.data
      });
      
console.log(subscriptionResponse.data.data);

    } catch (error) {
      console.error('Create subscription error:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        message: 'Subscription creation failed'
      });
    }
  }*/
}