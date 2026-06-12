import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings, SavedSession, SourceLanguage, ExplanationLanguage } from '@/types';

const KEYS = {
  deepgramKey: 'deepgram_key',
  anthropicKey: 'anthropic_key',
  sourceLanguage: 'source_language',
  explanationLanguage: 'explanation_language',
  sessions: 'sessions',
};

const DEFAULTS: AppSettings = {
  deepgramKey: '',
  anthropicKey: '',
  sourceLanguage: 'en-US',
  explanationLanguage: 'en',
};

export async function getSettings(): Promise<AppSettings> {
  const [dg, an, sl, el] = await Promise.all([
    AsyncStorage.getItem(KEYS.deepgramKey),
    AsyncStorage.getItem(KEYS.anthropicKey),
    AsyncStorage.getItem(KEYS.sourceLanguage),
    AsyncStorage.getItem(KEYS.explanationLanguage),
  ]);
  return {
    deepgramKey: dg ?? DEFAULTS.deepgramKey,
    anthropicKey: an ?? DEFAULTS.anthropicKey,
    sourceLanguage: (sl as SourceLanguage) ?? DEFAULTS.sourceLanguage,
    explanationLanguage: (el as ExplanationLanguage) ?? DEFAULTS.explanationLanguage,
  };
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<void> {
  const ops: Promise<void>[] = [];
  if (partial.deepgramKey !== undefined) ops.push(AsyncStorage.setItem(KEYS.deepgramKey, partial.deepgramKey));
  if (partial.anthropicKey !== undefined) ops.push(AsyncStorage.setItem(KEYS.anthropicKey, partial.anthropicKey));
  if (partial.sourceLanguage !== undefined) ops.push(AsyncStorage.setItem(KEYS.sourceLanguage, partial.sourceLanguage));
  if (partial.explanationLanguage !== undefined) ops.push(AsyncStorage.setItem(KEYS.explanationLanguage, partial.explanationLanguage));
  await Promise.all(ops);
}

export async function getSessions(): Promise<SavedSession[]> {
  const raw = await AsyncStorage.getItem(KEYS.sessions);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedSession[];
  } catch {
    return [];
  }
}

export async function saveSession(session: SavedSession): Promise<void> {
  const existing = await getSessions();
  const updated = [session, ...existing.filter(s => s.id !== session.id)];
  await AsyncStorage.setItem(KEYS.sessions, JSON.stringify(updated));
}

export async function deleteSession(id: string): Promise<void> {
  const existing = await getSessions();
  await AsyncStorage.setItem(KEYS.sessions, JSON.stringify(existing.filter(s => s.id !== id)));
}
