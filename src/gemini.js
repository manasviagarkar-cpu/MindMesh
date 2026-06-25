// Gemini AI client with ARIA system prompt, rate limiting, and input sanitization
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// ── Rate Limiting (20 calls per session) ─────────────────────────────────
const RATE_LIMIT = 20;
const STORAGE_KEY = 'mindmesh_call_count';

export function getCallCount() {
  return parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);
}

function incrementCallCount() {
  const count = getCallCount() + 1;
  sessionStorage.setItem(STORAGE_KEY, String(count));
  return count;
}

export function isRateLimited() {
  return getCallCount() >= RATE_LIMIT;
}

export function getRemainingCalls() {
  return Math.max(0, RATE_LIMIT - getCallCount());
}

// ── Input Sanitization ───────────────────────────────────────────────────
export function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/[<>"'`]/g, (c) =>        // escape dangerous chars
      ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c]))
    .trim()
    .slice(0, 2000);                   // max length guard
}

// ── ARIA System Prompt ───────────────────────────────────────────────────
const ARIA_SYSTEM_PROMPT = `You are ARIA, the AI core of MindMesh. You are warm, proactive, and emotionally intelligent. Your job is to:
1. Extract tasks and deadlines from natural speech
2. Detect scheduling conflicts and suggest fixes
3. Notice when users haven't connected with important people
4. Give personalized productivity tips
5. Always respond in simple, friendly, encouraging language

When the user describes a task or deadline, extract it and respond with BOTH:
- A friendly conversational message
- A JSON block (wrapped in \`\`\`json ... \`\`\`) with this exact structure:
{
  "action": "add_task",
  "task": "string",
  "deadline": "ISO date string (YYYY-MM-DD)",
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "category": "work" | "personal" | "relationship" | "health",
  "estimatedHours": number
}

When NOT extracting a task, just respond conversationally. Be warm and concise.
Today's date for reference: ${new Date().toISOString().split('T')[0]}`;

// ── Main Chat Function ───────────────────────────────────────────────────
export async function chatWithAria(messages) {
  if (isRateLimited()) {
    throw new Error('Daily AI call limit reached (20 calls). Please refresh or try again tomorrow.');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: ARIA_SYSTEM_PROMPT,
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: sanitizeInput(m.content) }],
  }));

  const chat = model.startChat({ history });
  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(sanitizeInput(lastMessage.content));
  const text = result.response.text();

  incrementCallCount();
  return text;
}

// ── Parse task JSON from ARIA response ──────────────────────────────────
export function parseTaskFromResponse(text) {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[1]);
    if (parsed.action === 'add_task' && parsed.task && parsed.deadline) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Quick one-shot Gemini call (for tips, nudges, etc.) ──────────────────
export async function quickPrompt(prompt) {
  if (isRateLimited()) return null;
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(sanitizeInput(prompt));
  incrementCallCount();
  return result.response.text();
}
