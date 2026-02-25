// models/PostAnalytics.js

import mongoose from "mongoose";

const PostAnalyticsSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,

  post_urn: String,
  content: String,
  posted_at: Date,

  metrics: {
    likes: Number,
    comments: Number,
    shares: Number,
    impressions: Number,
    clicks: Number
  },

  last_synced: Date
});

export default mongoose.model(
  "PostAnalytics",
  PostAnalyticsSchema
);