import axios from "axios";
import crypto from "crypto";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export class PaymentController {
  // ✅ Initialize payment
  static async initializePayment(req, res) {
    try {
      const { plan, amount, payment_method, email, id, callback_url } = req.body;

      // Check user
      const existingUser = await User.findByEmail(email);
      if (!existingUser)
        return res.status(404).json({ message: "User not found" });

      const userId = existingUser.id;
      const reference = `AUTOPOST_${Date.now()}_${userId}`;

      // Prepare Paystack payment data
      const paymentData = {
        email,
        amount: amount * 100, // in kobo
        currency: "NGN",
        callback_url,
        reference,
        channels: [payment_method],
        metadata: {
          plan,
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

      // Initialize payment
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      // Save transaction to MongoDB
      await Transaction.create({
        user_id: userId,
        amount,
        currency: "NGN",
        plan,
        reference,
        status: "initiated",
        payment_method
      });

      res.json({
        success: true,
        message: "Payment initialized",
        data: {
          authorization_url: response.data.data.authorization_url,
          access_code: response.data.data.access_code,
          reference,
          public_key: process.env.PAYSTACK_PUBLIC_KEY,
          email,
          amount,
          currency: "NGN",
          metadata: paymentData.metadata
        }
      });
    } catch (error) {
      console.error(
        "Payment initialization error:",
        error.response?.data || error.message
      );
      res.status(500).json({
        success: false,
        message: "Payment initialization failed"
      });
    }
  }

  // ✅ Verify payment
  static async verifyPayment(req, res) {
    try {
      const { reference, email } = req.body;
      const existingUser = await User.findByEmail(email);
      if (!existingUser)
        return res.status(404).json({ message: "User not found" });

      const userId = existingUser.id;

      // Verify with Paystack
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        {
          headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
        }
      );

      const transaction = response.data.data;

      if (transaction.status === "success") {
        // Update MongoDB transaction
        await Transaction.findOneAndUpdate(
          { reference, user_id: userId },
          { status: "completed", paystack_id: transaction.id, updated_at: new Date() }
        );

        // Update user subscription
        const plan = transaction.metadata.plan;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        await User.updateOne(
          { _id: userId },
          {
            $set: {
              subscription_plan_id: plan,
              subscription_status: "active",
              subscription_start_date: startDate,
              subscription_end_date: endDate
            }
          }
        );

        res.json({
          success: true,
          message: "Payment verified successfully",
          data: { transaction }
        });
      } else {
        await Transaction.findOneAndUpdate(
          { reference },
          { status: "failed", updated_at: new Date() }
        );

        res.status(400).json({
          success: false,
          message: "Payment verification failed"
        });
      }
    } catch (error) {
      console.error(
        "Payment verification error:",
        error.response?.data || error.message
      );
      res.status(500).json({
        success: false,
        message: "Payment verification failed"
      });
    }
  }

  // ✅ Handle webhook
  static async handleWebhook(req, res) {
    try {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      const signature = req.headers["x-paystack-signature"];

      if (!signature)
        return res.status(401).json({ error: "No signature provided" });

      const hash = crypto
        .createHmac("sha512", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (hash !== signature)
        return res.status(401).json({ error: "Invalid signature" });

      const event = req.body;

      if (event.event === "charge.success") {
        const transaction = event.data;

        await Transaction.findOneAndUpdate(
          { reference: transaction.reference },
          {
            status: "completed",
            paystack_id: transaction.id,
            updated_at: new Date()
          }
        );

        if (transaction.metadata && transaction.metadata.user_id) {
          await User.updateOne(
            { _id: transaction.metadata.user_id },
            {
              subscription_plan_id: transaction.metadata.plan,
              subscription_status: "active",
              subscription_start_date: new Date(),
              subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          );
        }

        console.log("Webhook success processed ✅");
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }

  // ✅ Get subscription plans
  static async getSubscriptionPlans(req, res) {
    try {
      const plans = await SubscriptionPlan.find({ active: true }).sort({ price: 1 });
      res.json({ success: true, data: plans });
    } catch (error) {
      console.error("Get plans error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch plans" });
    }
  }
}
