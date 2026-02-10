import express from "express";
import {
    twitterLogin,
    twitterCallback,
    facebookLogin,
    facebookCallback, 
    linkedinLogin, 
    linkedinCallback,
    getConnectedAccounts,
     disconnectAccount 
} from "../controllers/authController.js";

import {
  authenticateToken
} from '../controllers/regisAuthController.js';

const authRouter = express.Router();

authRouter.get('/twitter', twitterLogin);
authRouter.get('/facebook', facebookLogin);
authRouter.get('/linkedin', linkedinLogin);

authRouter.get('/twitter/callback', twitterCallback);
authRouter.get('/facebook/callback', facebookCallback);
authRouter.get('/linkedin/callback', linkedinCallback);

authRouter.post('/social/accounts', getConnectedAccounts);
authRouter.post('/linkedin/disconnect', disconnectAccount);


export default authRouter;