import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema({
  name: String,
  price: Number,
  duration: String,
  features: [String],
  active: { type: Boolean, default: true }
});

export default mongoose.model("SubscriptionPlan");
