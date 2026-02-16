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

        let imageUrl = post.image_url;

        // 🔁 If no image URL — try helper service
        if (!imageUrl) {
          console.log("No image_url — calling helper");

          try {
            imageUrl = await getImageForText(post.content);

            if (imageUrl) {
              post.image_url = imageUrl;
              post.image_status = "attached";
              await post.save();
              console.log("Helper image found");
            }

          } catch (helperErr) {
            console.log("Image helper failed:", helperErr.message);
          }
        }

        // 🖼 If we now have image — upload to LinkedIn
        if (imageUrl) {
          try {
            const imageRes = await axios.get(imageUrl, {
              responseType: "arraybuffer"
            });

            assetUrn = await uploadImageToLinkedIn(
              token,
              profileId,
              imageRes.data
            );

            console.log("LinkedIn asset created:", assetUrn);

          } catch (uploadErr) {
            console.log("Image upload failed — will post text only");
            assetUrn = null;
          }
        }
      }

      // ------------------------------------------------
      // ✅ POST — WITH OR WITHOUT IMAGE
      // ------------------------------------------------

      if (assetUrn) {
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