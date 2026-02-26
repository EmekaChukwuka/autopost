import User from "../models/User.js";
import PostAnalytics from "../models/PostAnalytics.js";
import {
  getLinkedInPosts,
  getPostMetrics
} from "../services/linkedinMetricsService.js";

export async function syncLinkedInAnalytics() {

  console.log("Analytics sync started");

  const users = await User.findLinkedInUsers();

  for (const user of users) {

    try {

      const token = user.socialAccounts.linkedin.accessToken;
      const profileId = user.socialAccounts.linkedin.profileId;

      const posts = await getLinkedInPosts(token, profileId);

      for (const p of posts) {

        const urn = p.id;

        const metrics = await getPostMetrics(token, urn);

        const content =
          p.specificContent
           ?.["com.linkedin.ugc.ShareContent"]
           ?.shareCommentary?.text || "";

        const postedAt =
          new Date(p.created.time);

        await PostAnalytics.findOneAndUpdate(

          { user_id: user._id, post_urn: urn },

          {
            content,
            posted_at: postedAt,
            metrics,
            last_synced: new Date()
          },

          { upsert: true, new: true }

        );

        console.log("Synced:", urn);
      }

    } catch (err) {
      console.error(
        "User sync failed:",
        user._id,
        err.response?.data || err.message
      );
    }
  }

  console.log("Analytics sync done");
}