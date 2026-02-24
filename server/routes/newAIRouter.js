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



const TEMPLATES = {
    x: {
        professional: "Write a polished tweet (max 240 chars) about '{{prompt}}'. Use industry terms. 1-2 hashtags. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point",
        promotional:"Create a promotional tweet about '{{prompt}}'. Highlight key benefits and include a call to action. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point",
        educational:"Create an educational tweet about '{{prompt}}'. Include a useful fact or tip. 1-2 hashtags. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point",
        trending: "Create a casual tweet about '{{prompt}}'. Use conversational language and 1 emoji. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point",
        funny: "Generate a humorous tweet about '{{prompt}}'. Include a joke or pun. 1-2 hashtags. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point",
        urgent: "Write an urgent-sounding tweet about '{{prompt}}'. Use action verbs and ALL CAPS for emphasis. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point"
    },
    linkedin: {
  professional: "Write a high-quality LinkedIn post about '{{prompt}}'. Make it 5–8 short lines, clear and authoritative. Start with a strong insight or statement, add one practical takeaway, and end with a thoughtful closing line. Use a professional human tone — not robotic, not slangy. Add only relevant emojis, no asterisks, no hashtags, no meta commentary, no introductions or follow-up questions. Output only the final post.",

  promotional: "Write a LinkedIn promotional post about '{{prompt}}'. Make it value-driven, not salesy. Structure: strong hook → benefit explanation → real-world outcome → soft call-to-action. Keep it 5–9 short lines. Sound credible and trust-building. No hype words, add only relevant emojis, no asterisks, no hashtags, no meta commentary, no intro or outro text. Output only the post.",

  educational: "Write an educational LinkedIn post about '{{prompt}}'. Teach one clear concept or method with a short explanation and one practical tip professionals can use immediately. Use a clean, structured format with short lines. Tone should be expert but accessible. Add only relevant emojis, no asterisks, no hashtags, no meta commentary, no framing text. Output only the post.",

  trending: "Write a LinkedIn thought-leadership post about '{{prompt}}' tied to current industry relevance. Include an opinion, a brief reason, and a forward-looking insight. 5–8 short lines. Professional but conversational tone. Add only relevant emojis, no asterisks, no hashtags, no meta commentary, no intro or closing questions. Output only the post.",

  funny: "Write a light, workplace-appropriate LinkedIn post about '{{prompt}}' with subtle professional humor. Keep it clever, not goofy. Include a relatable scenario and a smart closing line. 4–7 short lines. Add only relevant emojis, no asterisks, no hashtags, no meta commentary, no intro or outro framing. Output only the post.",

  urgent: "Write a LinkedIn post about '{{prompt}}' that communicates urgency and importance without sounding alarmist. Use a strong opening line, explain the risk or opportunity, and end with a clear action recommendation. 5–8 short lines. Professional tone.Add only relevant emojis, no asterisks, no hashtags, no meta commentary, no framing text. Output only the post.",

storytelling: "Write a LinkedIn storytelling post about '{{prompt}}'. Use a short real-world style story format: start with a specific moment or challenge, describe what happened, explain the turning point, and end with a clear professional lesson. Use 6–10 short lines with natural flow and human tone. Make it feel like a founder or professional sharing experience. Add only relevant emojis, no asterisks, no hashtags, no meta commentary, no intro or outro framing text. Output only the final post."
},
    facebook: {
      professional: "Create a professional Facebook post about '{{prompt}}'. Use a formal tone and include relevant hashtags. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point",
      promotional: "Write a promotional Facebook post about '{{prompt}}'. Highlight key benefits and include a call to action. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point",
      educational: "Write an educational Facebook post about '{{prompt}}'. Share a useful tip or fact. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point",
      trending: "Create a friendly Facebook post with emojis about:{{prompt}}. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point",
      funny: "Generate a funny Facebook post about '{{prompt}}'. Include a light-hearted joke or pun. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point",
      urgent: "Compose an urgent Facebook post about '{{prompt}}'. Use strong language to prompt immediate action. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point" 
    },
    instagram: {
      professional: "Create a professional Instagram caption about '{{prompt}}'. Use a formal tone and include relevant hashtags. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point",
      promotional: "Write a promotional Instagram caption about '{{prompt}}'. Highlight key benefits and include a call to action. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point",
      educational: "Write an educational Instagram caption about '{{prompt}}'. Share a useful tip or fact.Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point",
      trending: "Create a trendy Instagram caption with emojis about:{{prompt}}. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point",
      funny: "Generate a funny Instagram caption about '{{prompt}}'. Include a light-hearted joke or pun.Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point",
      urgent: "Compose an urgent Instagram caption about '{{prompt}}'. Use strong language to prompt immediate action. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point" 
    },
    tiktok: {
      professional: "Create a professional TikTok video script about '{{prompt}}'. Use a formal tone and include relevant hashtags.Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point.  And don't write the script like a movie or acting script, just make it like a story, like an instagram carousel combined with a YouTube short and a Facebook reel. Also provide song ideas.",
      promotional: "Write a promotional TikTok video script about '{{prompt}}'. Highlight key benefits and include a call to action. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point.  And don't write the script like a movie or acting script, just make it like a story, like an instagram carousel combined with a YouTube short and a Facebook reel.Also provide song ideas.",
      educational: "Write an educational TikTok video script about '{{prompt}}'. Share a useful tip or fact. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point.  And don't write the script like a movie or acting script, just make it like a story, like an instagram carousel combined with a YouTube short and a Facebook reel. Also provide song ideas.",  
      trending: "Create a trendy TikTok video script with emojis about:{{prompt}}. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point.  And don't write the script like a movie or acting script, just make it like a story, like an instagram carousel combined with a YouTube short and a Facebook reel. Also provide song ideas.",
      funny: "Generate a funny TikTok video script about '{{prompt}}'. Include a light-hearted joke or pun. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point. And don't write the script like a movie or acting script, just make it like a story, like an instagram carousel combined with a YouTube short and a Facebook reel. Also provide song ideas.",
      urgent: "Compose an urgent TikTok video script about '{{prompt}}'. Use strong language to prompt immediate action. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point. And don't write the script like a movie or acting script, just make it like a story, like an instagram carousel combined with a YouTube short and a Facebook reel. Also provide song ideas." 
    },
    youtube: {
      professional: "Create a professional YouTube video script about '{{prompt}}'. Make the video about 3 to 5 minutes long, it should be like a YouTue short and video combined together, short to watch but also containing educational insights and facts. Use a formal tone and include relevant hashtags.Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point.  And don't write the script like a movie or acting script, just make it like a story, like an instagram carousel combined with a YouTube short and a Facebook reel. Also provide song ideas.",
      promotional: "Write a promotional YouTube video script about '{{prompt}}'. Make the video about 3 to 5 minutes long, it should be like a YouTue short and video combined together, short to watch but also containing educational insights and facts. Highlight key benefits and include a call to action. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point.  And don't write the script like a movie or acting script, just make it like a story, like an instagram carousel combined with a YouTube short and a Facebook reel.Also provide song ideas.",
      educational: "Write an educational YouTube video script about '{{prompt}}'.  Make the video about 3 to 5 minutes long, it should be like a YouTue short and video combined together, short to watch but also containing educational insights and facts.Share a useful tip or fact. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point.  And don't write the script like a movie or acting script, just make it like a story, like an instagram carousel combined with a YouTube short and a Facebook reel. Also provide song ideas.",  
      trending: "Create a trendy YouTube video script with emojis about:{{prompt}}.  Make the video about 3 to 5 minutes long, it should be like a YouTue short and video combined together, short to watch but also containing educational insights and facts.Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point.  And don't write the script like a movie or acting script, just make it like a story, like an instagram carousel combined with a YouTube short and a Facebook reel. Also provide song ideas.",
      funny: "Generate a funny YouTube video script about '{{prompt}}'. Make the video about 3 to 5 minutes long, it should be like a YouTue short and video combined together, short to watch but also containing educational insights and facts. Include a light-hearted joke or pun. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point. And don't write the script like a movie or acting script, just make it like a story, like an instagram carousel combined with a YouTube short and a Facebook reel. Also provide song ideas.",
      urgent: "Compose an urgent YouTube video script about '{{prompt}}'. Make the video about 3 to 5 minutes long, it should be like a YouTue short and video combined together, short to watch but also containing educational insights and facts. Use strong language to prompt immediate action. Don't highlight text using asterisks. And don't start with something like this: 'Here’s a trendy Instagram caption about Maradona with emojis: ', or end it with something like this: ' Would you like it more playful, motivational, or tribute-style? 😊', just get straight to the point. And don't write the script like a movie or acting script, just make it like a story, like an instagram carousel combined with a YouTube short and a Facebook reel. Also provide song ideas." 
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

const data = chatResponse.choices[0].message.content;

            // Remove markdown formatting, asterisks, etc.
            let cleaned = data
                .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
                .replace(/\*(.*?)\*/g, '$1')     // Remove italics
                .replace(/```[\s\S]*?```/g, '')  // Remove code blocks
                .replace(/`(.*?)`/g, '$1')       // Remove inline code
                .replace(/```json|```/g, '');
        
            
//console.log('Chat:', chatResponse.choices[0].message.content);
res.status(200).json({
      status: 'success',
      data: cleaned
    });

     
    } catch (error) {
    throw new Error("Completion failed: " + error.message);
  }
});


export default newAIRouter;