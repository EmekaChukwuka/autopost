import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number,
  currency: { type: String, default: "NGN" },
  plan: String,
  reference: { type: String, unique: true },
  status: { type: String, default: "initiated" },
  payment_method: String,
  paystack_id: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model("Transaction", transactionSchema);
