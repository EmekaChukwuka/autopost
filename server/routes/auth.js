import express from "express";
import {
    twitterLogin,
    twitterCallback,
    facebookLogin,
    facebookCallback, 
    linkedinLogin, 
    linkedinCallback
} from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.get('/twitter', twitterLogin);
authRouter.get('/facebook', facebookLogin);
authRouter.get('/linkedin', linkedinLogin);

authRouter.get('/twitter/callback', twitterCallback);
authRouter.get('/facebook/callback', facebookCallback);
authRouter.get('/linkedin/callback', linkedinCallback);



export default authRouter;