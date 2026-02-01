// server/models/Calendar.js
import mongoose from 'mongoose';

const CalendarItemSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  post: { type: String, required: true },
  platform: { type: String, default: 'Any' }
}, { _id: false });

const CalendarSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  start_date: { type: Date, required: true }, // start of the calendar
autoSchedule: Boolean,
  includeImages: Boolean,
  platforms: [String],
  days: { type: [CalendarItemSchema], default: [] }, // should contain 30 items typically
  generated_at: { type: Date, default: Date.now },
  meta: {
    prompt: String,
    template: String,
    source: { type: String, default: 'mistral' }
  }
});

CalendarSchema.index({ user_id: 1, generated_at: -1 });

export default mongoose.model('Calendar', CalendarSchema);
