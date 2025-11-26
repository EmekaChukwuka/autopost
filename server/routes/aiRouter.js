import express from "express";
import {GoogleGenAI} from "@google/genai";
import { Mistral } from '@mistralai/mistralai';
import User from '../models/User.js';
import session from "express-session";
const clearwordsAIRouter = express.Router();

clearwordsAIRouter.use(session({
secret:'autopost',
resave:false,
saveUninitialized:false,
cookie: {
    secure:false, //set to true if using HTTPS
    maxAge: 24*60*60*1000 //24 hours
}
}));

clearwordsAIRouter.post("/generate", async (req, res) => {
    try {
          const { prompt } = req.body;
    console.log({ prompt });
   const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({apiKey: apiKey});
const chatResponse = await client.chat.complete({
  model: 'mistral-small-2506',
  messages: [{role: 'user', content: prompt}],
});

//console.log('Chat:', chatResponse.choices[0].message.content);
res.status(200).json({
      status: 'success',
      data: chatResponse.choices[0].message.content
    });

     
    } catch (error) {
    throw new Error("Completion failed: " + error.message);
  }
});


export default clearwordsAIRouter;