import mongoose from "mongoose";

const scheduledPostSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  platform: { type: String, enum: ["linkedin"], required: true },
  content: { type: String, required: true },

  scheduled_for: { type: Date, required: true },
  status: { type: String, enum: ["pending", "posted", "failed"], default: "pending" },

  image_required: { type: Boolean, default: false },
  image_url: { type: String, default: null },
  image_status: {
    type: String,
    enum: ["pending", "attached", "failed"],
    default: "pending"
  },

  linkedin_asset_urn: { type: String, default: null }
}, { timestamps: true });

export default mongoose.model("ScheduledPost", scheduledPostSchema);
