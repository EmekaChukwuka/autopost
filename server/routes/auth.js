import express from "express";
import {
    twitterLogin,
    twitterCallback,
    facebookLogin,
    facebookCallback, 
    linkedinLogin, 
    linkedinCallback, 
    instagramLogin, 
    instagramCallback,
} from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.get('/twitter', twitterLogin);
authRouter.get('/facebook', facebookLogin);
authRouter.get('/linkedin', linkedinLogin);
authRouter.get('/instagram', instagramLogin);

authRouter.get('/twitter/callback', twitterCallback);
authRouter.get('/facebook/callback', facebookCallback);
authRouter.get('/linkedin/callback', linkedinCallback);
authRouter.get('/instagram/callback', instagramCallback);



export default authRouter;