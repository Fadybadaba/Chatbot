"use strict";
/**
 * Unified conversational AI: picks a provider from env (free tiers first).
 *
 * - Gemini: https://aistudio.google.com/apikey (generous free quota)
 * - Groq: https://console.groq.com/keys (free tier)
 * - xAI Grok: paid — optional via existing grok.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAiChatConfigured = isAiChatConfigured;
exports.activeAiProvider = activeAiProvider;
exports.aiChat = aiChat;
const grok_1 = require("./grok");
function envProvider() {
    const p = (process.env.AI_PROVIDER || '').trim().toLowerCase();
    if (p === 'gemini' || p === 'groq' || p === 'xai')
        return p;
    return null;
}
function pickProvider() {
    const forced = envProvider();
    if (forced === 'gemini' && process.env.GEMINI_API_KEY?.trim())
        return 'gemini';
    if (forced === 'groq' && process.env.GROQ_API_KEY?.trim())
        return 'groq';
    if (forced === 'xai' && process.env.XAI_API_KEY?.trim())
        return 'xai';
    if (forced)
        return null;
    if (process.env.GEMINI_API_KEY?.trim())
        return 'gemini';
    if (process.env.GROQ_API_KEY?.trim())
        return 'groq';
    if (process.env.XAI_API_KEY?.trim())
        return 'xai';
    return null;
}
function isAiChatConfigured() {
    return pickProvider() !== null;
}
function activeAiProvider() {
    return pickProvider();
}
async function geminiChat(messages) {
    const key = process.env.GEMINI_API_KEY.trim();
    const model = (process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const systemParts = messages.filter(m => m.role === 'system');
    const systemText = systemParts.map(m => m.content).join('\n\n');
    const rest = messages.filter(m => m.role !== 'system');
    const contents = rest.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));
    const body = {
        contents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
        },
    };
    if (systemText) {
        body.systemInstruction = { parts: [{ text: systemText }] };
    }
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const raw = await res.text();
    if (!res.ok) {
        throw new Error(`Gemini API error ${res.status}: ${raw}`);
    }
    const data = JSON.parse(raw);
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    if (!text.trim()) {
        throw new Error(data.error?.message || 'Empty Gemini response (blocked or no candidates)');
    }
    return text.trim();
}
async function groqChat(messages) {
    const key = process.env.GROQ_API_KEY.trim();
    const model = (process.env.GROQ_MODEL || 'llama-3.1-8b-instant').trim();
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 2048,
        }),
    });
    const raw = await res.text();
    if (!res.ok) {
        throw new Error(`Groq API error ${res.status}: ${raw}`);
    }
    const data = JSON.parse(raw);
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
        throw new Error('Empty Groq response');
    }
    return content.trim();
}
async function aiChat(messages) {
    const provider = pickProvider();
    if (!provider) {
        throw new Error('No AI provider configured');
    }
    switch (provider) {
        case 'gemini':
            return geminiChat(messages);
        case 'groq':
            return groqChat(messages);
        case 'xai':
            return (0, grok_1.grokChat)(messages);
        default:
            throw new Error('Unknown AI provider');
    }
}
