import mongoose from "mongoose";
import bcrypt from "bcrypt";

// 1️⃣ User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  avatar: { type: String },
  provider: { type: String, default: "email" },
  verified: { type: Boolean, default: false },
  subscription_plan_id: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },
  subscription_status: { type: String, default: "inactive" },
  subscription_start_date: { type: Date },
  subscription_end_date: { type: Date },
  auto_renew: { type: Boolean, default: false },
  canceled_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

// 2️⃣ Post Schema (for uploadPost and getPosts)
const postSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  post: String,
  platform: String,
  date: String
});

// 3️⃣ SubscriptionPlan Schema
const subscriptionPlanSchema = new mongoose.Schema({
  name: String,
  price: Number,
  duration_days: Number,
  social_accounts_limit: Number,
  monthly_posts_limit: Number,
  ai_content_access: Boolean,
  analytics_access: Boolean,
  team_members_limit: Number,
  priority_support: Boolean
});

// 4️⃣ SubscriptionHistory Schema (for tracking user plan changes)
const subscriptionHistorySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },
  transaction_id: String,
  action: String,
  old_plan_id: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },
  new_plan_id: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },
  amount_paid: Number,
  start_date: Date,
  end_date: Date,
  created_at: { type: Date, default: Date.now }
});

// 5️⃣ Register Models
const UserModel = mongoose.model("User", userSchema);
const PostModel = mongoose.model("Post", postSchema);
const SubscriptionPlanModel = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
const SubscriptionHistoryModel = mongoose.model("SubscriptionHistory", subscriptionHistorySchema);

// 6️⃣ Class wrapper (to maintain same API as your MySQL version)
class User {
  // Create new user
  static async create({ name, email, password, provider }) {
    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
    const user = await UserModel.create({ name, email, password: hashedPassword, provider });
    return { id: user._id, name: user.name, email: user.email, provider: user.provider };
  }

  // Find user by email
  static async findByEmail(email) {
    return await UserModel.findOne({ email }).lean();
  }

  // Find user by ID
  static async findById(id) {
    return await UserModel.findById(id, "id name email avatar provider verified").lean();
  }

  // Compare password
  static async comparePassword(email, candidatePassword) {
    const user = await UserModel.findOne({ email });
    if (!user || !user.password) return false;
    return await bcrypt.compare(candidatePassword, user.password);
  }

  // Upload a new post
  static async uploadPost({ id, postDetailsDate, postDetailsPost, postDetailsPlatform }) {
    const post = await PostModel.create({
      user_id: id,
      post: postDetailsPost,
      platform: postDetailsPlatform,
      date: postDetailsDate
    });
    return post;
  }

  // Get posts for a user
  static async getPosts(id) {
    return await PostModel.find({ user_id: id }).lean();
  }

  // Get user's current subscription
  static async getUserSubscription(userId) {
    const user = await UserModel.findById(userId).populate("subscription_plan_id").lean();
    if (!user) return null;
    const plan = user.subscription_plan_id;
    return {
      ...user,
      plan_name: plan?.name,
      social_accounts_limit: plan?.social_accounts_limit,
      monthly_posts_limit: plan?.monthly_posts_limit,
      ai_content_access: plan?.ai_content_access,
      analytics_access: plan?.analytics_access,
      team_members_limit: plan?.team_members_limit,
      priority_support: plan?.priority_support
    };
  }

  // Activate subscription after payment
  static async activateSubscription(userId, planId, transactionId = null) {
    const plan = await SubscriptionPlanModel.findById(planId);
    if (!plan) throw new Error("Plan not found");

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // monthly plans

    const user = await UserModel.findById(userId);
    const oldPlanId = user.subscription_plan_id || null;

    // Update user subscription
    user.subscription_plan_id = plan._id;
    user.subscription_status = "active";
    user.subscription_start_date = startDate;
    user.subscription_end_date = endDate;
    user.auto_renew = true;
    user.canceled_at = null;
    await user.save();

    // Add to subscription history
    await SubscriptionHistoryModel.create({
      user_id: userId,
      plan_id: plan._id,
      transaction_id: transactionId,
      action: oldPlanId ? "renewed" : "created",
      old_plan_id: oldPlanId,
      new_plan_id: plan._id,
      amount_paid: plan.price,
      start_date: startDate,
      end_date: endDate
    });

    return {
      plan: plan.name,
      start_date: startDate,
      end_date: endDate,
      status: "active"
    };
  }
}

export default User;
