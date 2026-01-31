import axios from "axios";
import ScheduledPost from "../models/ScheduledPost.js";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export const fetchImagesForPosts = async () => {
  const posts = await ScheduledPost.find({
    image_required: true,
    image_status: "pending"
  }).limit(5);

  for (const post of posts) {
    try {
      const query = post.content.split(" ").slice(0, 6).join(" ");

      const { data } = await axios.get(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
        {
          headers: {
            Authorization: PEXELS_API_KEY
          }
        }
      );

      if (!data.photos.length) {
        throw new Error("No image found");
      }

      post.image_url = data.photos[0].src.large;
      post.image_status = "attached";
      await post.save();

    } catch (err) {
      post.image_status = "failed";
      await post.save();
    }
  }
};
