import express from "express";
import { chatWithDeepseek, chatWithStreamDeepseek } from "../controllers/aiController.js";
import { OpenAI } from "openai";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: 'sk-27c505c4ebec4b798905e1c664545509',
});

const aiRouter = express.Router();
 

const TEMPLATES = {
    twitter: {
        professional: "Write a polished tweet (max 240 chars) about '{{prompt}}'. Use industry terms. 1-2 hashtags.",
        casual: "Create a casual tweet about '{{prompt}}'. Use conversational language and 1 emoji.",
        funny: "Generate a humorous tweet about '{{prompt}}'. Include a joke or pun. 1-2 hashtags.",
        urgent: "Write an urgent-sounding tweet about '{{prompt}}'. Use action verbs and ALL CAPS for emphasis."
    },
    linkedin: {
        professional: "Compose a LinkedIn post (3-4 sentences) about '{{prompt}}'. Use corporate jargon.",
        casual: "Write a friendly LinkedIn post about '{{prompt}}'. Avoid formal language.",
        funny: "Create a humorous LinkedIn post about '{{prompt}}' (keep it workplace-appropriate).",
        urgent: "Draft a urgent LinkedIn post about '{{prompt}}'. Highlight immediate action needed."
    },
    facebook: "Create a friendly Facebook post with emojis about:{{prompt}}."
  };
   

aiRouter.post("/generate", async (req, res) => {
    try {
          const { prompt, platform, tone } = req.body;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a content creator tool." },
        { role: "user", content: TEMPLATES[platform][tone].replace('{{prompt}}', prompt) },
      ],
      model: "deepseek-chat",
    });
    return completion.choices[0].message.content;

      
  } catch (error) {
    throw new Error("Completion failed: " + error.message);
  }
});

export default aiRouter;