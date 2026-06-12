import * as Crypto from 'expo-crypto';

export function generateId(): string {
  return Crypto.randomUUID();
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function buildContextSentence(
  segments: { words: { punctuated_word?: string; word: string }[] }[],
  targetWord: string,
): string {
  const allWords = segments.flatMap(s => s.words.map(w => w.punctuated_word ?? w.word));
  return allWords.join(' ') || targetWord;
}
