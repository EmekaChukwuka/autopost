import express from "express";
import {GoogleGenAI} from "@google/genai";
import { Mistral } from '@mistralai/mistralai';
import User from '../models/User.js';
import session from "express-session";
const newAIRouter = express.Router();

newAIRouter.use(session({
secret:'autopost',
resave:false,
saveUninitialized:false,
cookie: {
    secure:false, //set to true if using HTTPS
    maxAge: 24*60*60*1000 //24 hours
}
}));

 const apiKey = process.env.GOOGLE_AI_API_KEY;
const ai = new GoogleGenAI({apiKey: apiKey });


const TEMPLATES = {
    x: {
        professional: "Write a polished tweet (max 240 chars) about '{{prompt}}'. Use industry terms. 1-2 hashtags.",
        promotional:"Create a promotional tweet about '{{prompt}}'. Highlight key benefits and include a call to action.",
        educational:"Create an educational tweet about '{{prompt}}'. Include a useful fact or tip. 1-2 hashtags.",
        trending: "Create a casual tweet about '{{prompt}}'. Use conversational language and 1 emoji.",
        funny: "Generate a humorous tweet about '{{prompt}}'. Include a joke or pun. 1-2 hashtags.",
        urgent: "Write an urgent-sounding tweet about '{{prompt}}'. Use action verbs and ALL CAPS for emphasis."
    },
    linkedin: {
        professional: "Compose a LinkedIn post (3-4 sentences) about '{{prompt}}'. Use corporate jargon.",
        promotional:"Create a promotional LinkedIn post about '{{prompt}}'. Highlight key benefits and include a call to action.",
        educational:"Write an educational LinkedIn post about '{{prompt}}'. Share insights or tips.",
        trending: "Write a friendly LinkedIn post about '{{prompt}}'. Avoid formal language.",
        funny: "Create a humorous LinkedIn post about '{{prompt}}' (keep it workplace-appropriate).",
        urgent: "Draft a urgent LinkedIn post about '{{prompt}}'. Highlight immediate action needed."
    },
    facebook: {
      professional: "Create a professional Facebook post about '{{prompt}}'. Use a formal tone and include relevant hashtags.",
      promotional: "Write a promotional Facebook post about '{{prompt}}'. Highlight key benefits and include a call to action.",
      educational: "Write an educational Facebook post about '{{prompt}}'. Share a useful tip or fact.",
      trending: "Create a friendly Facebook post with emojis about:{{prompt}}.",
      funny: "Generate a funny Facebook post about '{{prompt}}'. Include a light-hearted joke or pun.",
      urgent: "Compose an urgent Facebook post about '{{prompt}}'. Use strong language to prompt immediate action." 
    },
    instagram: {
      professional: "Create a professional Instagram caption about '{{prompt}}'. Use a formal tone and include relevant hashtags.",
      promotional: "Write a promotional Instagram caption about '{{prompt}}'. Highlight key benefits and include a call to action.",
      educational: "Write an educational Instagram caption about '{{prompt}}'. Share a useful tip or fact.",
      trending: "Create a trendy Instagram caption with emojis about:{{prompt}}.",
      funny: "Generate a funny Instagram caption about '{{prompt}}'. Include a light-hearted joke or pun.",
      urgent: "Compose an urgent Instagram caption about '{{prompt}}'. Use strong language to prompt immediate action." 
    },
    tiktok: {
      professional: "Create a professional TikTok video script about '{{prompt}}'. Use a formal tone and include relevant hashtags.",
      promotional: "Write a promotional TikTok video script about '{{prompt}}'. Highlight key benefits and include a call to action.",
      educational: "Write an educational TikTok video script about '{{prompt}}'. Share a useful tip or fact.",  
      trending: "Create a trendy TikTok video script with emojis about:{{prompt}}.",
      funny: "Generate a funny TikTok video script about '{{prompt}}'. Include a light-hearted joke or pun.",
      urgent: "Compose an urgent TikTok video script about '{{prompt}}'. Use strong language to prompt immediate action." 
    }
  };
   
newAIRouter.post("/generate", async (req, res) => {
    try {
          const { prompt, platform, contentType } = req.body;
    console.log({ prompt, platform, contentType });
   const apiKey = process.env.MISTRAL_API_KEY;
const nplatform = platform.toLowerCase();

const client = new Mistral({apiKey: apiKey});
const chatResponse = await client.chat.complete({
  model: 'mistral-small-2506',
  messages: [{role: 'user', content: TEMPLATES[nplatform][contentType].replace('{{prompt}}', prompt)}],
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


export default newAIRouter;