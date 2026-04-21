/**
 * xAI Grok chat (OpenAI-compatible Chat Completions).
 * Docs: https://docs.x.ai/docs/api-reference
 */

export type GrokMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export function isGrokConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

export async function grokChat(messages: GrokMessage[]): Promise<string> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('XAI_API_KEY is not set');
  }

  const base =
    (process.env.XAI_API_BASE_URL || 'https://api.x.ai/v1').replace(/\/$/, '');
  const model = (process.env.XAI_MODEL || 'grok-4-0709').trim();

  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_completion_tokens: 2048,
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`xAI API error ${res.status}: ${raw}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(raw) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
  } catch {
    throw new Error('xAI API returned non-JSON body');
  }

  const content = (data as { choices?: Array<{ message?: { content?: unknown } }> })
    .choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Empty Grok completion');
  }
  return content.trim();
}
