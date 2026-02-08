import User from '../models/User.js';
import ScheduledPost from "../models/ScheduledPost.js";
import { authenticateToken } from "../controllers/regisAuthController.js";


export async function postContent(req, res) {
  try {
    const { userId, platform, postTime, includeImages, content} = req.body;
    if (!userId || !post) return res.status(400).json({ success: false, message: 'id and post required' });

    // verify user exists
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [hours, minutes] = postTime.split(":");
     const date = new Date();
          date.setHours(hours, minutes, 0);

    const scheduledPost = 
      {
        user_id: userId,
        content: content,
        scheduled_for: date,
        image_required: includeImages,
        platform: platform
      };

    await ScheduledPost.create(scheduledPost);
 
    return res.json({ success: true, data: "Post scheduled successfully" });

  } catch (err) {
    console.error('Scheduling post error', err);
    return res.status(500).json({ success: false, message: 'Server error scheduling post' });
  }
}

