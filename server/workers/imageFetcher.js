import axios from "axios";
import ScheduledPost from "../models/ScheduledPost.js";

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const UNSPLASH_API_KEY = process.env.UNSPLASH_SECRET_KEY;
//const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

async function fetchFromPixabay(query) {
  const { data } = await axios.get(
    `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=3`
  );

  if (data.hits && data.hits.length > 0) {
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

  if (data.results && data.results.length > 0) {
    return data.results[0].urls.regular;
  }

  throw new Error("Unsplash no results");
}
/*
async function fetchFromPexels(query) {
  const { data } = await axios.get(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
    {
      headers: {
        Authorization: PEXELS_API_KEY
      }
    }
  );

  if (data.photos && data.photos.length > 0) {
    return data.photos[0].src.large;
  }

  throw new Error("Pexels no results");
}*/

export const fetchImagesForPosts = async () => {
  const posts = await ScheduledPost.find({
    image_required: true,
    image_status: "pending"
  }).limit(5);

  for (const post of posts) {
    try {
      const query = post.content.split(" ").slice(0, 6).join(" ");

      let imageUrl = null;

      // ✅ Try Pixabay first
      try {
        imageUrl = await fetchFromPixabay(query);
        console.log("Image found via Pixabay");
      } catch (e1) {
        console.log("Pixabay failed → trying Unsplash");

        // ✅ Fallback: Unsplash
        try {
          imageUrl = await fetchFromUnsplash(query);
          console.log("Image found via Unsplash");
        } catch (e2) {
          console.log("Unsplash failed → trying Pexels");
          /*
          // ✅ Final fallback: Pexels
          imageUrl = await fetchFromPexels(query);
          console.log("Image found via Pexels");*/
          }
      }

      if (!imageUrl) throw new Error("All providers failed");

      post.image_url = imageUrl;
      post.image_status = "attached";
      await post.save();

    } catch (err) {
      console.error("Image fetch failed:", err.message);
      post.image_status = "failed";
      await post.save();
    }
  }
};
