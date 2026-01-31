import axios from "axios";

export const postToLinkedInWithImage = async (
  accessToken,
  linkedinUserId,
  text,
  assetUrn
) => {
  await axios.post(
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
};
