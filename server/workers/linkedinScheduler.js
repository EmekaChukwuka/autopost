import ScheduledPost from "../models/ScheduledPost.js";
import User from "../models/User.js";
import axios from "axios";

import { uploadImageToLinkedIn } from "../services/linkedinImageUpload.js";
import { postToLinkedInWithImage, postToLinkedInWithoutImage } from "../services/linkedinPoster.js";
import { getImageForText } from "./imageFetcher.js"; // ✅ your helper
import PostAnalytics from "../models/PostAnalytics.js";

export const processLinkedInPosts = async () => {

  const posts = await ScheduledPost.find({
    platform: "linkedin",
    status: "pending",
    scheduled_for: { $lte: new Date() }
  });

  console.log("Scheduler tick:", new Date());
  console.log("Posts found:", posts.length);

  for (const post of posts) {
    try {
      console.log("Processing post:", post._id);

      const user = await User.findById(post.user_id);

      if (!user.socialAccounts?.linkedin?.accessToken) {
        console.log("No LinkedIn token — skipping");
        continue;
      }

      const token = user.socialAccounts.linkedin.accessToken;
      const profileId = user.socialAccounts.linkedin.profileId;

      let assetUrn = null;

      // ------------------------------------------------
      // ✅ IMAGE FLOW WITH FALLBACK
      // ------------------------------------------------

      if (post.image_required) {

        
            const imageBuffer = await getImageForText(post.content);

            assetUrn = await uploadImageToLinkedIn(
              token,
              profileId,
              imageBuffer
            );

            console.log("LinkedIn asset created:", assetUrn);

post.image_status = "attached";
post.image_url = image buffer;
await post.save();
          
await postToLinkedInWithImage(
          token,
          profileId,
          post.content,
          assetUrn
        );
      
       } else {
        await postToLinkedInWithoutImage(
          token,
          profileId,
          post.content
        );
      }

      post.status = "posted";
      await post.save();

await PostAnalytics.create({
  user_id: post.user_id,
  scheduled_post_id: post._id,
  platform: "linkedin",
  content: post.content,
  posted_at: new Date(),
  has_image: !!assetUrn
});
      console.log("Post success:", post._id);

    } catch (err) {
      console.error("LinkedIn post failed:",
        err.response?.data || err.message
      );

      post.status = "failed";
      await post.save();
    }
  }
};