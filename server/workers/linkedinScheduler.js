import ScheduledPost from "../models/ScheduledPost.js";
import User from "../models/User.js";
import axios from "axios";
import { uploadImageToLinkedIn } from "../services/linkedinImageUpload.js";
import { postToLinkedInWithImage } from "../services/linkedinPoster.js";

export const processLinkedInPosts = async () => {
  const posts = await ScheduledPost.find({
    platform: "linkedin",
    status: "pending",
    scheduled_for: { $lte: new Date() }
  });

  for (const post of posts) {
    try {
      const user = await User.findById(post.user_id);
      if (!user.socialAccounts?.linkedin?.accessToken) throw new Error("No LinkedIn token");

      let assetUrn = null;

      if (post.image_required && post.image_url) {
        const imageRes = await axios.get(post.image_url, { responseType: "arraybuffer" });
        assetUrn = await uploadImageToLinkedIn(
          user.socialAccounts.linkedin.accessToken,
          user.socialAccounts.linkedin.userid,
          imageRes.data
        );

        post.linkedin_asset_urn = assetUrn;
      }

      await postToLinkedInWithImage(
        user.socialAccounts.linkedin.accessToken,
        user.socialAccounts.linkedin.user_id,
        post.content,
        assetUrn
      );

      post.status = "posted";
      await post.save();

    } catch (err) {
      console.error("LinkedIn post failed:", err.message);
      post.status = "failed";
      await post.save();
    }
  }
};




  