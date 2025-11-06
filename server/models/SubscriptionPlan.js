import mongoose from "mongoose";

const SubscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  price: { type: Number, required: true },
  duration_days: { type: Number, default: 30 },
  social_accounts_limit: { type: Number, default: 3 },
  monthly_posts_limit: { type: Number, default: 40 },
  ai_content_access: { type: Boolean, default: true },
  analytics_access: { type: Boolean, default: true },
  team_members_limit: { type: Number, default: 0 },
  priority_support: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
});

export default mongoose.model("SubscriptionPlan");
