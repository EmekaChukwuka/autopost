import mongoose from "mongoose";

const postAnalyticsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true
  },

  scheduled_post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ScheduledPost"
  },

  platform: {
    type: String,
    enum: ["linkedin"],
    required: true
  },

  content: String,

  posted_at: Date,

  metrics: {
    impressions: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 }
  },

  has_image: Boolean

}, { timestamps: true });

export default mongoose.model("PostAnalytics", postAnalyticsSchema);