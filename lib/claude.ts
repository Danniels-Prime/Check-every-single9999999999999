import Anthropic from '@anthropic-ai/sdk';
import { PROMPTS } from '../constants/prompts';
import type { Segment, Summary, ChatMessage } from '../types';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
});

const MODEL = 'claude-sonnet-4-6';

function buildTranscriptContext(segments: Segment[]): string {
  return segments
    .filter(s => s.is_final)
    .map(s => {
      const time = new Date(s.start_ms).toISOString().slice(11, 19);
      const speaker = s.speaker ? `[${s.speaker}] ` : '';
      return `${time} ${speaker}${s.text}`;
    })
    .join('\n');
}

export async function generateSummary(
  segments: Segment[],
  template: Summary['template'] = 'meeting'
): Promise<Summary> {
  const transcript = buildTranscriptContext(segments);
  const systemPrompt = PROMPTS.summary[template ?? 'meeting'] || PROMPTS.summary.meeting;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Transcript:\n\n${transcript}` }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return {
      id: Math.random().toString(36).slice(2),
      recording_id: '',
      key_points: parsed.key_points || [],
      action_items: parsed.action_items || [],
      one_liner: parsed.one_liner || '',
      template,
      created_at: new Date().toISOString(),
    };
  } catch {
    return {
      id: Math.random().toString(36).slice(2),
      recording_id: '',
      key_points: [raw],
      action_items: [],
      one_liner: 'Summary generated.',
      template,
      created_at: new Date().toISOString(),
    };
  }
}

export async function coachChat(
  userMessage: string,
  history: ChatMessage[],
  segments: Segment[]
): Promise<string> {
  const transcript = buildTranscriptContext(segments);

  const messages = [
    ...history.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.text,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: PROMPTS.coach(transcript),
    messages,
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : 'No response generated.';
}

export async function generatePhantomInsight(
  segments: Segment[],
  trigger: string
): Promise<string> {
  const transcript = buildTranscriptContext(segments.slice(-20));

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 120,
    system: PROMPTS.phantom,
    messages: [{
      role: 'user',
      content: `Trigger: "${trigger}"\n\nRecent transcript:\n${transcript}`,
    }],
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : '';
}

export async function generateTitle(segments: Segment[]): Promise<string> {
  if (segments.length < 3) return 'Untitled Recording';
  const transcript = buildTranscriptContext(segments.slice(0, 10));

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 60,
    system: 'Generate a short, specific title (max 6 words) for this recording. Return ONLY the title, nothing else.',
    messages: [{ role: 'user', content: transcript }],
  });

  return response.content[0].type === 'text'
    ? response.content[0].text.trim().replace(/['"]/g, '')
    : 'Untitled Recording';
}
