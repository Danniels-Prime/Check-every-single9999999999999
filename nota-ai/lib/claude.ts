import Anthropic from '@anthropic-ai/sdk';
import { getSettings } from './storage';
import { SUMMARY_PROMPT, COACH_SYSTEM_PROMPT, PHANTOM_PROMPT, TITLE_PROMPT } from '@/constants/prompts';
import type { Segment, Summary, ChatMessage, PhantomEvent } from '@/types';

const MODEL = 'claude-sonnet-4-20250514';

async function getClient(): Promise<Anthropic> {
  const { anthropicKey } = await getSettings();
  if (!anthropicKey) throw new Error('Anthropic API key not set. Go to Settings to add your key.');
  return new Anthropic({ apiKey: anthropicKey, dangerouslyAllowBrowser: true });
}

function buildTranscript(segments: Segment[]): string {
  return segments
    .filter(s => s.isFinal)
    .map(s => `[Speaker ${s.speaker}] ${s.text}`)
    .join('\n');
}

export async function generateSummary(segments: Segment[]): Promise<Summary> {
  const client = await getClient();
  const transcript = buildTranscript(segments);
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: SUMMARY_PROMPT(transcript) }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as {
      tldr: string;
      bulletPoints: string[];
      actionItems: string[];
      sentiment: 'positive' | 'neutral' | 'negative';
    };
    return {
      tldr: parsed.tldr ?? '',
      bulletPoints: parsed.bulletPoints ?? [],
      actionItems: parsed.actionItems ?? [],
      sentiment: parsed.sentiment ?? 'neutral',
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return {
      tldr: text.slice(0, 200),
      bulletPoints: [],
      actionItems: [],
      sentiment: 'neutral',
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function coachChat(
  history: ChatMessage[],
  newMessage: string,
  transcriptContext: string
): Promise<string> {
  const client = await getClient();
  const messages: Anthropic.MessageParam[] = history.slice(-12).map(m => ({
    role: m.role,
    content: m.content,
  }));
  messages.push({ role: 'user', content: newMessage });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: COACH_SYSTEM_PROMPT + `\n\nCurrent transcript:\n${transcriptContext || '(No transcript yet)'}`,
    messages,
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function generatePhantomInsight(event: PhantomEvent, context: string): Promise<string> {
  const client = await getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 120,
    messages: [{
      role: 'user',
      content: PHANTOM_PROMPT(event.type, event.phrase, event.wordCount, context),
    }],
  });
  return response.content[0].type === 'text' ? response.content[0].text.trim() : '';
}

export async function generateTitle(segments: Segment[]): Promise<string> {
  if (segments.length < 2) return 'Untitled Recording';
  const client = await getClient();
  const transcript = buildTranscript(segments.slice(0, 8));
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 60,
    messages: [{ role: 'user', content: TITLE_PROMPT(transcript) }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  return text.replace(/['"]/g, '') || 'Untitled Recording';
}
