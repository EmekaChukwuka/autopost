// server/controllers/calendarController.js
import Calendar from '../models/Calendar.js';
import User from '../models/User.js';
import { callMistralForCalendar } from '../services/mistral.js';
import ScheduledPost from "../models/ScheduledPost.js";
import User from "../models/User.js";
import { authenticateToken } from "../controllers/regisAuthController.js";

/**
 * safeParseJsonFromText:
 * - tries JSON.parse directly
 * - if fails, tries to extract JSON substring (first '[' ... last ']')
 */
function safeParseJsonFromText(text) {
  if (!text || typeof text !== 'string') return null;
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (e) {
    // attempt to extract the first JSON array in the text
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      const substr = text.substring(start, end + 1);
      try {
        return JSON.parse(substr);
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

/** Create a deterministic fallback calendar if AI fails
 *  startDate is a Date object; days default 30
 */
function fallbackGenerateCalendar(prompt, startDate = new Date(), days = 30) {
  const items = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    items.push({
      date: d.toISOString().split('T')[0],
      platform: ['Instagram', 'Twitter', 'Facebook', 'LinkedIn', 'TikTok'][i % 5],
      post: `(${i + 1}) ${prompt || 'General content'} — quick idea to post on ${d.toDateString()}`
    });
  }
  return items;
}

/** Normalize parsed items into the expected shape */
function normalizeItems(rawItems, startDateISO, days = 30) {
  // rawItems could be an array of objects or strings. We'll try to coercively map to required structure
  const start = new Date(startDateISO);
  const items = [];

  for (let i = 0; i < days; i++) {
    const targetDate = new Date(start);
    targetDate.setDate(start.getDate() + i);
    const dateISO = targetDate.toISOString().split('T')[0];
    const raw = (Array.isArray(rawItems) && rawItems[i]) || rawItems?.[i] || null;

    let post = '';
    let platform = 'Any';

    if (!raw) {
      post = `Content idea for ${dateISO}`;
    } else if (typeof raw === 'string') {
      post = raw;
    } else if (typeof raw === 'object') {
      post = raw.post || raw.text || raw.content || raw.body || raw.caption || JSON.stringify(raw);
      platform = raw.platform || raw.platforms || raw.channel || platform;
      // If platform is an array, pick first
      if (Array.isArray(platform)) platform = platform[0];
    } else {
      post = String(raw);
    }

    items.push({ date: dateISO, post: post.toString().trim(), platform });
  }

  return items;
}

/** POST /calendar/generate
 * body: { id, prompt, template, startDate (optional YYYY-MM-DD) }
 */
export async function generateCalendar(req, res) {
  try {
    const { id, prompt, template, startDate } = req.body;
    if (!id || !prompt) return res.status(400).json({ success: false, message: 'id and prompt required' });

    // verify user exists
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // decide start date (use provided or tomorrow)
    const start = startDate ? new Date(startDate) : new Date();
    // Normalize start to today (00:00)
    const startISO = start.toISOString().split('T')[0];

    // Call mistral
    const aiResponse = await callMistralForCalendar(prompt, { startDateISO: startISO, template, days: 30 });

    let items = null;
    if (aiResponse.ok) {
      // try to parse aiResponse.raw which might be plain text or json
      const parsed = safeParseJsonFromText(aiResponse.raw);
      if (Array.isArray(parsed) && parsed.length >= 1) {
        items = normalizeItems(parsed, startISO, 30);
      } else {
        // If parsed not array, maybe API returned string with lines: try to parse by newlines
        // attempt to split lines and map
        const lines = (aiResponse.raw || '').split(/\r?\n/).filter(Boolean);
        if (lines.length >= 1) {
          // build lightweight items from lines
          const parsedLines = lines.slice(0, 30).map((ln, idx) => {
            return { date: new Date(new Date(startISO).setDate(new Date(startISO).getDate() + idx)).toISOString().split('T')[0], post: ln.trim(), platform: 'Any' };
          });
          items = normalizeItems(parsedLines, startISO, 30);
        }
      }
    }

    // If AI failed or parsing failed, fallback
    if (!items) {
      console.warn('AI generation failed or parse failed — using fallback generator');
      items = fallbackGenerateCalendar(prompt, new Date(startISO), 30);
    }

    // Save to DB: overwrite previous calendar for user (optionally you can keep history)
    const saved = await Calendar.findOneAndUpdate(
      { user_id: id },
      {
        user_id: id,
        start_date: new Date(startISO),
        days: items,
        generated_at: new Date(),
        meta: { prompt, template, source: aiResponse.ok ? 'mistral' : 'fallback' }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, calendar: saved.days, meta: saved.meta, user_id: saved.user_id });
  } catch (err) {
    console.error('generateCalendar error', err);
    return res.status(500).json({ success: false, message: 'Server error generating calendar' });
  }
}

/** POST /calendar/get
 * body: { id }
 * Returns most recent calendar
 */
export async function getCalendar(req, res) {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'id required' });

    const cal = await Calendar.findOne({ user_id: id }).sort({ generated_at: -1 }).lean();
    if (!cal) return res.status(404).json({ success: false, message: 'No calendar found' });

    return res.json({ success: true, calendar: cal.days, meta: cal.meta, start_date: cal.start_date });
  } catch (err) {
    console.error('getCalendar error', err);
    return res.status(500).json({ success: false, message: 'Server error fetching calendar' });
  }
}

/** POST /calendar/delete (optional) */
export async function deleteCalendar(req, res) {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'id required' });
    await Calendar.deleteOne({ user_id: id });
    return res.json({ success: true, message: 'Calendar deleted' });
  } catch (err) {
    console.error('deleteCalendar error', err);
    return res.status(500).json({ success: false, message: 'Server error deleting calendar' });
  }
}

export async function autoScheduleCalendar(req, res) {
  try {
    const { calendarId, post_time } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (user.subscription_status !== "active") {
      return res.status(403).json({ message: "Paid plan required" });
    }

    const calendar = await Calendar.findById(calendarId);
    if (!calendar) {
      return res.status(404).json({ message: "Calendar not found" });
    }

    const [hours, minutes] = post_time.split(":");

    const scheduledPosts = calendar.days.map(day => {
      const date = new Date(calendar.year, calendar.month - 1, day.day);
      date.setHours(hours, minutes, 0);

      return {
        user_id: userId,
        calendar_id: calendar._id,
        content: day.content,
        scheduled_for: date
      };
    });

    await ScheduledPost.insertMany(scheduledPosts);

    calendar.auto_schedule = true;
    calendar.platform = "linkedin";
    calendar.post_time = post_time;
    await calendar.save();

    res.json({
      success: true,
      message: "Calendar scheduled successfully",
      total_posts: scheduledPosts.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Scheduling failed" });
  }
}

// Helper: image search
async function findStockImage(queryStr) {
  if (!queryStr) return null;
  const q = queryStr.split(' ').slice(0, 6).join(' ').trim() || 'abstract technology';

  // Unsplash first
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query: q, per_page: 3, orientation: 'landscape' },
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }
    });
    if (res.data.results?.length) {
      return res.data.results[0].urls.regular;
    }
  } catch (e) {
    console.log('Unsplash error:', e.message);
  }

  // Pexels fallback
  try {
    const res = await axios.get('https://api.pexels.com/v1/search', {
      params: { query: q, per_page: 3 },
      headers: { Authorization: process.env.PEXELS_API_KEY }
    });
    if (res.data.photos?.length) {
      return res.data.photos[0].src.medium;
    }
  } catch (e) {
    console.log('Pexels error:', e.message);
  }

  return null;
}

function calculateOptimalTime(date) {
  // Example: 9 AM on the given date (adjust to user timezone later)
  date.setHours(9, 0, 0, 0);
  return date;
}