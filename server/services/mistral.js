// server/services/mistral.js
import axios from 'axios';
import { Mistral } from '@mistralai/mistralai';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
if ( !MISTRAL_API_KEY) {
  console.warn('Mistral API not configured: set MISTRAL_API_URL and MISTRAL_API_KEY');
}

const client = new Mistral({apiKey: MISTRAL_API_KEY});
export async function callMistralForCalendar(promptText, options = {}) {
  // options: { startDateISO, template, days }
  const days = options.days || 30;
  const startDateISO = options.startDateISO || new Date().toISOString().split('T')[0];

  // Strong system prompt requesting JSON array ONLY — this maximizes parse success.
  const systemPrompt = `
You are a social media content generator that outputs ONLY valid JSON — no explanations, no markdown, no extra text.

Generate exactly ${days} objects starting from ${startDateISO} (inclusive).

Each object MUST contain:
- "date": ISO date string (YYYY-MM-DD)
- "platform": choose from ["WhatsApp","Instagram","Twitter","Facebook","LinkedIn","TikTok","All"] using round-robin rotation
- "post": the final ready-to-publish post text

Platform writing rules:

LinkedIn:
- Professional, insight-driven, and value-focused
- Use short paragraphs or line breaks for readability
- Can use storytelling or lesson-based structure
- No emojis unless absolutely necessary (max 1)
- No hashtags unless highly relevant (max 3)
- No clickbait or hype language
- Max 1,000 characters

Twitter/X:
- Concise and punchy
- Max 280 characters

Instagram/Facebook:
- Conversational and engaging
- Can include light CTA
- Max 1,000 characters

TikTok:
- Write like a short script or hook-style caption
- Clear idea + payoff
- Max 1,000 characters

WhatsApp:
- Direct and simple
- Helpful or announcement style
- Max 600 characters

General rules:
- Do NOT include meta commentary
- Do NOT include explanations
- Do NOT include formatting symbols like asterisks
- Do NOT prefix with labels like “Post:” or “Caption:”
- Output ONLY a JSON array
- Each element must be valid JSON
`;
  // Combine user prompt with instructions
  const userPrompt = `
User prompt:
${promptText}

Use the user's tone/requirements. Return only JSON array as described above.
`;

const completePrompt = systemPrompt + '\n' + userPrompt;

  try {
    const res = await client.chat.complete({
      model: 'mistral-small-2506',
      messages: [{role: 'user', content: completePrompt}],
    });

    
    const raw = res.choices[0].message.content;
    return { ok: true, raw };
  } catch (err) {
    
    throw new Error("Completion failed: " + err.message);
  }
}
