import User from '../models/User.js';
import ScheduledPost from "../models/ScheduledPost.js";
import { authenticateToken } from "../controllers/regisAuthController.js";


export async function postContent(req, res) {
  try {
    const { userId, platform, scheduledTime, includeImages, post} = req.body;
    if (!userId || !post) return res.status(400).json({ success: false, message: 'id and post required' });

    // verify user exists
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

 if(includeImages == true){
    const [hours, minutes] = scheduledTime.split(":");

    const scheduledPost = 
      return {
        user_id: userId,
        content: post,
        scheduled_for: scheduledTime
      };

    await ScheduledPost.insert(scheduledPost);

    calendar.auto_schedule = true;
    calendar.platform = "linkedin";
    calendar.includeImages = includeImages;
    await calendar.save();

 }
    return res.json({ success: true, data: "Post scheduled successfully" });

  } catch (err) {
    console.error('Scheduling post error', err);
    return res.status(500).json({ success: false, message: 'Server error scheduling post' });
  }
}

