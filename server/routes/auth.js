import express from "express";
import {
    twitterLogin,
    twitterCallback,
    facebookLogin,
    facebookCallback, 
    linkedinLogin, 
    linkedinCallback
} from "../controllers/authController.js";

import {
  authenticateToken
} from '../controllers/regisAuthController.js';

const authRouter = express.Router();

authRouter.get('/twitter', authenticateToken, twitterLogin);
authRouter.get('/facebook', authenticateToken, facebookLogin);
authRouter.get('/linkedin', authenticateToken, linkedinLogin);

authRouter.get('/twitter/callback', twitterCallback);
authRouter.get('/facebook/callback', facebookCallback);
authRouter.get('/linkedin/callback', linkedinCallback);



export default authRouter;