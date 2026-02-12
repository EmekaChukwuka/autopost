import ScheduledPost from "../models/ScheduledPost.js";
import User from "../models/User.js";
import axios from "axios";
import { uploadImageToLinkedIn } from "../services/linkedinImageUpload.js";
import { postToLinkedInWithImage, postToLinkedInWithoutImage } from "../services/linkedinPoster.js";

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
      console.log("No LinkedIn token");
      continue;
    }

    if (post.image_required && post.image_url) {

      const imageRes = await axios.get(post.image_url, { responseType: "arraybuffer" });

      const assetUrn = await uploadImageToLinkedIn(
        user.socialAccounts.linkedin.accessToken,
        user.socialAccounts.linkedin.profileId,
        imageRes.data
      );

      await postToLinkedInWithImage(
        user.socialAccounts.linkedin.accessToken,
        user.socialAccounts.linkedin.profileId,
        post.content,
        assetUrn
      );

    } else {

      await postToLinkedInWithoutImage(
        user.socialAccounts.linkedin.accessToken,
        user.socialAccounts.linkedin.profileId,
        post.content
      );

    }

    post.status = "posted";
    await post.save();

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




  