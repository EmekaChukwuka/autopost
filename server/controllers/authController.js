import {TwitterApi} from "twitter-api-v2";
import axios from 'axios';
//my twitter client id and client secret and callback url
const twitterClientId = "M1hLT1Jyb00ta0dyMXk4aFM4Q1I6MTpjaQ";
const twitterClientSecret = "aDsx5WrcloAeQrBU3rxEHnKbnOWejKecDLXjd2tk7NT86OSWFi";
const twitterCallbackUrl = "https://autopost-backend-hbck.onrender.com/auth/twitter/callback";
const facebookClientId = "";
const facebookClientSecret = "";
const facebookCallbackUrl = "https://autopost-backend-hbck.onrender.com/auth/facebook/callback";
const linkedinClientId = process.env.linkedinClientId;
const linkedinClientSecret = process.env.linkedinClientSecret;
const linkedinCallbackUrl = "https://autopost-backend-hbck.onrender.com/auth/linkedin/callback";

const instagramClientId = "";
const instagramClientSecret = process.env.instagramClientSecret;
const instagramCallbackUrl = "https://autopost-backend-hbck.onrender.com/auth/instagram/callback";


 export const twitterLogin = async (req, res) => {
    const client = new TwitterApi({
        clientId: twitterClientId,
        clientSecret: twitterClientSecret
    });
    const {url, codeVerifier, state} = client.generateOAuth2AuthLink(
        twitterCallbackUrl,
        {scope : ['tweet.read', 'tweet.write', 'users.read'] }
    );
// store codeVerifier and state in session (for later)
req.session.codeVerifier = codeVerifier;
req.session.state = state;

res.redirect(url);// redirects to twitter login page
};


export const facebookLogin = async (req, res) => {
    const authUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${facebookClientId}&redirect_uri=${facebookCallbackUrl}&scope=pages_manage_posts`;
    res.redirect(authUrl);
};

export const linkedinLogin = async (req, res) => {
const {id} = req.query;

const state = Buffer.from(`user_id=${id}`).toString('base64');

     const scope = encodeURIComponent(
    "openid profile email w_member_social"
  );

  const authUrl =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${linkedinClientId}` +
    `&redirect_uri=https://autopost-backend-hbck.onrender.com/auth/linkedin/callback` +
    `&scope=${scope}+
    &state=${encodeURIComponent(state)}`;

   // const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${linkedinClientId}&redirect_uri=https://autopost-backend-hbck.onrender.com/auth/linkedin/callback&scope=w_member_social`;
    res.redirect(authUrl);
};

export const twitterCallback = async (req, res) => {
    const {code, state} = req.query;
    const {codeVerifier, state : sessionState} = req.session;

    // validate state to prevent CSRF
    if (state !== sessionState) {
        return res.status(400).send("Invalid state");
    }
    const client = new TwitterApi({
        clientId: twitterClientId,
        clientSecret: twitterClientSecret,
    });
    const {accessToken, refreshToken} = await client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: twitterCallbackUrl,
    });
    console.log("Twitter access token:", accessToken);
    req.session.twitteraccesstoken = accessToken;
    res.redirect('/dashboard?success=twitter');
};

export const facebookCallback = async (req, res) => {
    const {code} = req.query;

    const {data} = await axios.get(`https://graph.facebook.com/v12.0/oauth/access_token?client_id=${facebookClientId}&client_secret=${facebookClientSecret}&code=${code}&redirect_uri=${facebookCallbackUrl}`);
    const accessToken = data.access_token;
    console.log("Facebook access token:", accessToken);
    res.redirect("/dashboard?success=facebook");
};

import User from "../models/User.js";

export const linkedinCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).send("Missing authorization code");
    }

    // 1. Exchange code for access token
    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: linkedinClientId,
        client_secret: linkedinClientSecret,
        redirect_uri: linkedinCallbackUrl
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );

    const accessToken = tokenRes.data.access_token;
    const expiresIn = tokenRes.data.expires_in;

    // 2. Fetch LinkedIn profile
    const profileRes = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    console.log(profileRes)
    const profileId = profileRes.data.sub;
    const profileName = profileRes.data.name;

    // 3. Get logged-in user (from session or auth middleware)
    const userId = null;

if (state) {
      try {
        const decodedState = Buffer.from(state, 'base64').toString('ascii');
        const params = new URLSearchParams(decodedState);
        userId = params.get('user_id');
      } catch (error) {
        console.error("Error decoding state:", error);
      }
    }
 

    if (!userId) {
      return res.status(401).send("User not authenticated");
    }

    // 4. Store LinkedIn data in MongoDB
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          "socialAccounts.linkedin": {
            connected: true,
            accessToken,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            profileId,
            profileName
          }
        }
      }
    );

    console.log("LinkedIn connected for user:", userId);

    res.redirect("https://autopost-7uhd.onrender.com/app/settings.html?linkedin=connected");

  } catch (error) {
    console.error("LinkedIn OAuth error:", error.response?.data || error.message);
    res.redirect("https://autopost-7uhd.onrender.com/app/settings.html?linkedin=failed");
  }
};