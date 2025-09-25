import express from "express";
import dotenv from "dotenv";
import http from 'http';
import cors from 'cors';
import axios from 'axios';


const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const OPENROUTER_API_KEY = "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";

async function generateText(prompt) {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct", // Try "anthropic/claude-3-opus" or "mistralai/mistral-7b-instruct"
        messages: [
          { role: "user", content: prompt }
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://your-site.com", // Required for some models
          "X-Title": "Your App Name", // Optional
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenRouter:", error.response?.data || error.message);
    return null;
  }
}

// Usage
generateText("Write a 100-word summary of quantum computing.")
  .then(console.log);
  

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});