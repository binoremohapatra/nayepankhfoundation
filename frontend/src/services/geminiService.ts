/**
 * geminiService.ts
 * Direct client-side Gemini API integration for NayePankh chatbot.
 * Uses gemini-1.5-flash with a volunteer-onboarding system prompt.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL   = 'gemini-3.5-flash';
const BASE_URL       = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are Priya, a warm and enthusiastic AI volunteer coordinator for NayePankh Foundation — an NGO dedicated to empowering underprivileged youth through education, skill development, and community support.

Your role:
1. Warmly welcome the user and introduce NayePankh Foundation in 2-3 sentences.
2. Explain how volunteers make a real difference — teaching, mentoring, fundraising, outreach.
3. Enthusiastically encourage the user to register as a volunteer using the form below.
4. Keep all responses concise (max 3 sentences), warm, and motivating.
5. CRITICAL RULE: You MUST ONLY answer questions related to the NayePankh Foundation, volunteering, or the registration process. 
6. CRITICAL RULE: If the user asks ANY question that is NOT about NayePankh or volunteering (e.g., general knowledge, coding, math, other organizations, etc.), you MUST politely refuse to answer and redirect them back to NayePankh's mission and volunteering. Do NOT provide the requested off-topic information under any circumstances.

Always respond in a friendly, human tone. Use occasional emojis (🌟, 💚, 🙌) to feel approachable.`;

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export async function sendGeminiMessage(
  userMessage: string,
  history: ChatMessage[]
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Set VITE_GEMINI_API_KEY in your .env file.');
  }

  // Build conversation history in Gemini format
  const contents: GeminiMessage[] = history.slice(-10).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  // Add current user message
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  const payload = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents,
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 512,
    },
  };

  const response = await fetch(`${BASE_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error('Empty response from Gemini API.');
  return text;
}

export function getWelcomeMessage(): ChatMessage {
  return {
    id: 'welcome-0',
    role: 'assistant',
    text: "👋 Hello! I'm Priya, your volunteer coordinator at NayePankh Foundation! We empower underprivileged youth through education and skill development. 💚 Fill out the form and join our amazing family of changemakers — make a real difference in a child's life! 🙌",
    timestamp: new Date(),
  };
}
