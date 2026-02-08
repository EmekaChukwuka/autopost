import User from '../models/User.js';
import ScheduledPost from "../models/ScheduledPost.js";
import { authenticateToken } from "../controllers/regisAuthController.js";


export async function postContent(req, res) {
  try {
    const { userId, platform, postTime, includeImages, post} = req.body;
    if (!userId || !post) return res.status(400).json({ success: false, message: 'id and post required' });

    // verify user exists
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [hours, minutes] = postTime.split(":");

    const scheduledPost = 
      {
        user_id: userId,
        content: post,
        scheduled_for: postTime,
        image_required: includeImages
      };

    await ScheduledPost.insert(scheduledPost);
 
    return res.json({ success: true, data: "Post scheduled successfully" });

  } catch (err) {
    console.error('Scheduling post error', err);
    return res.status(500).json({ success: false, message: 'Server error scheduling post' });
  }
}

