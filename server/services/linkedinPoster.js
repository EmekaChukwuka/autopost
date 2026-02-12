import axios from "axios";

export const postToLinkedInWithImage = async (
  accessToken,
  linkedinUserId,
  text,
  assetUrn
) => {
try {
  

  const res = await axios.post(
    "https://api.linkedin.com/v2/ugcPosts",
    {
      author: `urn:li:person:${linkedinUserId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "IMAGE",
          media: [{
            status: "READY",
            media: assetUrn
          }]
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    }
  );
console.log("LinkedIn post success:", res.data);

} catch (err) {
  console.error("LinkedIn API error:",
    err.response?.data || err.message
  );
  throw err;
}
};


export const postToLinkedInWithoutImage = async (
  accessToken,
  linkedinUserId,
  text
) => {
  try {
  

  const res = await axios.post(
    "https://api.linkedin.com/v2/ugcPosts",
    {
      author: `urn:li:person:${linkedinUserId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE" 
          
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    }
  );
console.log("LinkedIn post success:", res.data);

} catch (err) {
  console.error("LinkedIn API error:",
    err.response?.data || err.message
  );
  throw err;
}
};
