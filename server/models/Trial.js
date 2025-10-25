import mongoose from "mongoose";

const trialSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  plan: String,
  start_date: { type: Date, default: Date.now },
  end_date: Date,
  status: { type: String, default: "active" }
});

export default mongoose.model("Trial", trialSchema);
