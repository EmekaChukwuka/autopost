import {TwitterApi} from "twitter-api-v2";
import axios from 'axios';
//my twitter client id and client secret and callback url
const twitterClientId = "M1hLT1Jyb00ta0dyMXk4aFM4Q1I6MTpjaQ";
const twitterClientSecret = "aDsx5WrcloAeQrBU3rxEHnKbnOWejKecDLXjd2tk7NT86OSWFi";
const twitterCallbackUrl = "http://localhost/3000/auth/twitter/callback";
const facebookClientId = "";
const facebookClientSecret = "";
const facebookCallbackUrl = "http://localhost/3000/auth/twitter/callback";
const linkedinClientId = "";
const linkedinClientSecret = "";
const linkedinCallbackUrl = "http://localhost/3000/auth/twitter/callback";

const instagramClientId = "";
const instagramClientSecret = "";
const instagramCallbackUrl = "http://localhost/3000/auth/twitter/callback";



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
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${linkedinClientId}&redirect_uri=${linkedinCallbackUrl}&scope=r_liteprofile%20w_member_social`;
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

export const linkedinCallback = async (req, res) => {
    const {data} = await axios.post(`http://www.linkedin.com/oauth/v2/accessToken`,
        new URLSearchParams({
            grant_type: 'authorizaton_code',
            code,
            clientId: linkedinClientId,
            clientSecret: linkedinClientSecret,
            redirect_uri: linkedinCallbackUrl,
        }),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    );
    const accessToken = data.access_token;
    console.log("LinkedIn Access Token:", accessToken);
    res.redirect("/dashboard?success=linkedin");
};