import axios from "axios";

export async function getLinkedInPosts(accessToken, profileId) {

  const res = await axios.get(
    `https://api.linkedin.com/v2/ugcPosts`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      params: {
        q: "authors",
        authors: `List(urn:li:person:${profileId})`,
        count: 50
      }
    }
  );

  return res.data.elements || [];
}

export async function getPostMetrics(accessToken, postUrn) {

  const encoded = encodeURIComponent(postUrn);

  const res = await axios.get(
    `https://api.linkedin.com/v2/socialActions/${encoded}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  return {
    likes: res.data.likesSummary?.totalLikes || 0,
    comments: res.data.commentsSummary?.totalComments || 0,
    shares: res.data.shareSummary?.shareCount || 0
  };
}