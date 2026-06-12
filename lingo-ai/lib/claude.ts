import Anthropic from '@anthropic-ai/sdk';
import type { Explanation, ExplanationLanguage } from '@/types';
import { buildExplanationPrompt } from '@/constants/prompts';

export async function explainPhrase(
  apiKey: string,
  phrase: string,
  context: string,
  sourceLanguage: string,
  explanationLanguage: ExplanationLanguage,
): Promise<Explanation> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const prompt = buildExplanationPrompt(phrase, context, sourceLanguage, explanationLanguage);

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    // Strip any accidental markdown code fences
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as Explanation;
    return parsed;
  } catch {
    return {
      phrase,
      type: 'word',
      meaning: text || 'Could not parse explanation.',
      examples: [],
    };
  }
}
