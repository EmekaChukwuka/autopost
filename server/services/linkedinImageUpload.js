import axios from "axios";

export const uploadImageToLinkedIn = async (accessToken, linkedinUserId, imageBuffer) => {
  // STEP 1: Register upload
  const registerRes = await axios.post(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      registerUploadRequest: {
        owner: `urn:li:person:${linkedinUserId}`,
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        serviceRelationships: [{
          relationshipType: "OWNER",
          identifier: "urn:li:userGeneratedContent"
        }]
      }
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    }
  );

  const uploadUrl =
    registerRes.data.value.uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ].uploadUrl;

  const assetUrn = registerRes.data.value.asset;

  // STEP 2: Upload binary image
  await axios.put(uploadUrl, imageBuffer, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream"
    }
  });

  return assetUrn;
};
