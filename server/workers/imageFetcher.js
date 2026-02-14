import axios from "axios";
import ScheduledPost from "../models/ScheduledPost.js";

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const UNSPLASH_API_KEY = process.env.UNSPLASH_SECRET_KEY;

const MAX_RETRIES = 2; // retry twice after first failure
const RETRY_DELAY_MS = 2000; // 2 seconds

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const STOP_WORDS = new Set([
  "the","and","for","with","this","that","from","your","about",
  "into","using","how","why","what","when","where","have","has",
  "will","can","are","was","were","been","being"
]);

function extractKeywords(text, max = 6) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w))
    .slice(0, max)
    .join(" ");
}

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

export async function getImageForText(text, retries = 2) {
  const query = extractKeywords(text);

  console.log("Image query:", query);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {

      /* --- Try Pixabay first --- */
      try {
        const url = await fetchFromPixabay(query);
        console.log("Image found via Pixabay");
        return url;
      } catch {
        console.log("Pixabay failed → fallback Unsplash");
      }

      /* --- Fallback Unsplash --- */
      const url = await fetchFromUnsplash(query);
      console.log("Image found via Unsplash");
      return url;

    } catch (err) {
      console.log(`Image attempt ${attempt + 1} failed`);

      if (attempt < retries) {
        await sleep(800 * (attempt + 1)); // small backoff
      }
    }
  }

  console.log("All image providers failed");
  return null;
}