// ============================================================
// CHAINSENTINEL AI – AI EXPLAINER
// Generates human-readable explanations via OpenAI (optional)
// or falls back to the rule-based engine in riskEngine.js
// ============================================================

const axios = require('axios');

/**
 * generateAIExplanation
 * If OPENAI_API_KEY is set, calls GPT-4o-mini for a rich explanation.
 * Otherwise falls back to the structured rule-based explanation already
 * computed by riskEngine.js (passed in as `fallback`).
 *
 * @param {object} scanResult  – full result from analyzeContract()
 * @param {string} fallback    – pre-computed rule-based explanation
 * @returns {string}           – final explanation text
 */
async function generateAIExplanation(scanResult, fallback) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
        return fallback; // No key — use rule-based explanation
    }

    const { findings, score, riskLevel, address, chain } = scanResult;

    const findingsSummary = findings
        .slice(0, 6) // Keep prompt concise
        .map(f => `- [${f.severity.toUpperCase()}] ${f.title}: ${f.desc}`)
        .join('\n');

    const prompt = `You are a senior smart contract security auditor. Analyze the following scan results for an Ethereum-compatible smart contract and provide a clear, actionable 3-4 sentence security assessment for a non-technical user.

Contract: ${address}
Chain: ${chain}
Risk Score: ${score}/100 (${riskLevel.toUpperCase()} RISK)

Detected Issues:
${findingsSummary || 'No critical issues detected.'}

Write in plain English. Mention the most critical issues first. End with a clear recommendation (e.g., "Do NOT interact" or "Safe to proceed with standard caution").`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a blockchain security expert. Be concise and direct.' },
                    { role: 'user', content: prompt },
                ],
                max_tokens: 300,
                temperature: 0.4,
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            }
        );

        const text = response.data?.choices?.[0]?.message?.content?.trim();
        return text || fallback;
    } catch (err) {
        console.warn('[AI Explainer] OpenAI call failed, using fallback:', err.message);
        return fallback;
    }
}

module.exports = { generateAIExplanation };
