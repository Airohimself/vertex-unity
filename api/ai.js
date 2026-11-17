// Vercel serverless function: POST /api/ai
// Powers "Vertex AI" (coach chat + essay feedback) using the Claude API.
//
// Environment variables (Vercel -> Project -> Settings -> Environment Variables):
//   ANTHROPIC_API_KEY   required   your key from console.anthropic.com
//   ANTHROPIC_MODEL     optional   defaults to claude-sonnet-5-5
//   SUPABASE_URL        optional   if set, only signed-in students may call this endpoint
//   SUPABASE_ANON_KEY   optional   needed together with SUPABASE_URL

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

const SYSTEM = `You are Vertex AI, a friendly and honest university-application coach inside the Vertex Unity app.
Your students are mostly from Uzbekistan and nearby countries applying to universities abroad.
Rules:
- Be concrete and practical. Use short paragraphs and, when helpful, short lists.
- University and scholarship facts in this app are approximate. Always tell the student to confirm deadlines, costs and requirements on the official website before acting.
- Never invent specific facts (deadlines, costs, acceptance rates). If you are not sure, say so.
- For essays: coach, do not write. Give feedback on structure, specificity, voice and clarity, point to exact sentences, and suggest questions the student can answer to improve it. Do not produce a full rewritten essay or paragraphs the student could submit as their own work.
- Never help fabricate grades, documents, recommendations or achievements.
- Reply in the language the student writes in (English, Uzbek or Russian).`;

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

async function verifyUser(req) {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return true; // auth check disabled
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  try {
    const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
    return r.ok;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Use POST' });
  if (!process.env.ANTHROPIC_API_KEY) return json(res, 500, { error: 'ANTHROPIC_API_KEY is not set on the server.' });
  if (!(await verifyUser(req))) return json(res, 401, { error: 'Please sign in to use Vertex AI.' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { messages, context, mode } = body || {};
  if (!Array.isArray(messages) || !messages.length) return json(res, 400, { error: 'messages required' });

  // keep requests small and well-formed
  const clean = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content.slice(0, 12000) }));
  if (!clean.length || clean[0].role !== 'user') return json(res, 400, { error: 'conversation must start with a user message' });

  let system = SYSTEM;
  if (mode === 'essay') system += '\nThe student shared an essay draft. Give feedback only, as described above.';
  if (context && typeof context === 'string') system += `\n\nStudent context (from their profile, may be incomplete):\n${context.slice(0, 3000)}`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 1200, system, messages: clean }),
    });
    const data = await r.json();
    if (!r.ok) return json(res, 502, { error: data?.error?.message || 'AI provider error' });
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    return json(res, 200, { reply: text || 'Sorry, I could not produce an answer. Please try again.' });
  } catch (e) {
    return json(res, 502, { error: 'Could not reach the AI provider.' });
  }
}
