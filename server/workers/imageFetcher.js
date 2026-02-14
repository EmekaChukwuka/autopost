import axios from "axios";
import ScheduledPost from "../models/ScheduledPost.js";

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const UNSPLASH_API_KEY = process.env.UNSPLASH_SECRET_KEY;

const MAX_RETRIES = 2; // retry twice after first failure
const RETRY_DELAY_MS = 2000; // 2 seconds

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchFromPixabay(query) {
  const { data } = await axios.get(
    `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=3`
  );

  if (data.hits?.length) {
    return data.hits[0].largeImageURL;
  }
  throw new Error("Pixabay no results");
}

async function fetchFromUnsplash(query) {
  const { data } = await axios.get(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`,
    {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_API_KEY}`
      }
    }
  );

  if (data.results?.length) {
    return data.results[0].urls.regular;
  }
  throw new Error("Unsplash no results");
}

async function fetchImageWithFallbacks(query) {
  try {
    console.log("Trying Pixabay...");
    return await fetchFromPixabay(query);
  } catch {
    console.log("Pixabay failed → trying Unsplash");
    return await fetchFromUnsplash(query);
  }
}

export const fetchImagesForPosts = async () => {
  const posts = await ScheduledPost.find({
    image_required: true,
    image_status: "pending"
  }).limit(5);

  for (const post of posts) {
    let attempt = 0;
    let success = false;

    const query = post.content.split(" ").slice(0, 6).join(" ");

    while (attempt <= MAX_RETRIES && !success) {
      try {
        console.log(
          `🖼️ Fetching image for post ${post._id} (attempt ${attempt + 1})`
        );

        const imageUrl = await fetchImageWithFallbacks(query);

        post.image_url = imageUrl;
        post.image_status = "attached";
        await post.save();

        console.log("✅ Image attached successfully");
        success = true;

      } catch (err) {
        attempt++;
        console.error(`❌ Image fetch failed (attempt ${attempt}):`, err.message);

        if (attempt <= MAX_RETRIES) {
          console.log("🔁 Retrying...");
          await sleep(RETRY_DELAY_MS);
        }
      }
    }

    if (!success) {
      post.image_status = "failed";
      await post.save();
      console.log("🚫 Image permanently failed for post", post._id);
    }
  }
};