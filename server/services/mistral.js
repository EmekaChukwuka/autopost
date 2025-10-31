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
You are a helpful assistant that outputs ONLY valid JSON.
Produce exactly ${days} objects starting from ${startDateISO} (inclusive),
each object must contain:
  - "date": ISO date string (YYYY-MM-DD),
  - "platform": use these platforms ["Instagram","Twitter","Facebook","LinkedIn","TikTok"] in a round-robin fashion,
  - "post": a short social post (max 280 characters recommended).
Return a JSON array (no explanation). Each item must be a valid JSON object.
`;

  // Combine user prompt with instructions
  const userPrompt = `
User prompt:
${promptText}

Use the user's tone/requirements. Return only JSON array as described above.
`;

  try {
    const res = await client.chat.completions.create({
      model: 'mistral-small-2506',
      messages: [systemPrompt + '\n' + userPrompt,],
      max_tokens: 1500,
      temperature: 0.7,
    });

    
    const raw = res.choices[0].message.content;
    return { ok: true, raw };
  } catch (err) {
    
    throw new Error("Completion failed: " + err.message);
  }
}
