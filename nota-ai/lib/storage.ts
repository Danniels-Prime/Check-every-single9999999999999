import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings, Recording } from '@/types';

const KEYS = {
  DEEPGRAM_KEY: 'deepgram_key',
  ANTHROPIC_KEY: 'anthropic_key',
  SUPABASE_URL: 'supabase_url',
  SUPABASE_ANON_KEY: 'supabase_anon_key',
  SELECTED_LANGUAGE: 'selected_language',
  RECORDINGS_INDEX: 'recordings_index',
} as const;

const REC_KEY = (id: string) => `recording_${id}`;

export async function getSettings(): Promise<AppSettings> {
  const result = await AsyncStorage.getMany([
    KEYS.DEEPGRAM_KEY,
    KEYS.ANTHROPIC_KEY,
    KEYS.SUPABASE_URL,
    KEYS.SUPABASE_ANON_KEY,
    KEYS.SELECTED_LANGUAGE,
  ]);
  return {
    deepgramKey: result[KEYS.DEEPGRAM_KEY] ?? '',
    anthropicKey: result[KEYS.ANTHROPIC_KEY] ?? '',
    supabaseUrl: result[KEYS.SUPABASE_URL] ?? '',
    supabaseAnonKey: result[KEYS.SUPABASE_ANON_KEY] ?? '',
    selectedLanguage: result[KEYS.SELECTED_LANGUAGE] ?? 'en-US',
    theme: 'dark',
  };
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<void> {
  const entries: Record<string, string> = {};
  if (partial.deepgramKey !== undefined)     entries[KEYS.DEEPGRAM_KEY] = partial.deepgramKey;
  if (partial.anthropicKey !== undefined)    entries[KEYS.ANTHROPIC_KEY] = partial.anthropicKey;
  if (partial.supabaseUrl !== undefined)     entries[KEYS.SUPABASE_URL] = partial.supabaseUrl;
  if (partial.supabaseAnonKey !== undefined) entries[KEYS.SUPABASE_ANON_KEY] = partial.supabaseAnonKey;
  if (partial.selectedLanguage !== undefined) entries[KEYS.SELECTED_LANGUAGE] = partial.selectedLanguage;
  if (Object.keys(entries).length > 0) await AsyncStorage.setMany(entries);
}

export async function saveRecording(rec: Recording): Promise<void> {
  await AsyncStorage.setItem(REC_KEY(rec.id), JSON.stringify(rec));
  const raw = await AsyncStorage.getItem(KEYS.RECORDINGS_INDEX);
  const index: string[] = raw ? (JSON.parse(raw) as string[]) : [];
  if (!index.includes(rec.id)) {
    index.unshift(rec.id);
    await AsyncStorage.setItem(KEYS.RECORDINGS_INDEX, JSON.stringify(index));
  }
}

export async function getRecording(id: string): Promise<Recording | null> {
  const raw = await AsyncStorage.getItem(REC_KEY(id));
  return raw ? (JSON.parse(raw) as Recording) : null;
}

export async function getAllRecordings(): Promise<Recording[]> {
  const raw = await AsyncStorage.getItem(KEYS.RECORDINGS_INDEX);
  if (!raw) return [];
  const index: string[] = JSON.parse(raw) as string[];
  const results = await AsyncStorage.getMany(index.map(REC_KEY));
  return index
    .map(id => {
      const v = results[REC_KEY(id)];
      return v ? (JSON.parse(v) as Recording) : null;
    })
    .filter((r): r is Recording => r !== null);
}

export async function deleteRecording(id: string): Promise<void> {
  await AsyncStorage.removeItem(REC_KEY(id));
  const raw = await AsyncStorage.getItem(KEYS.RECORDINGS_INDEX);
  if (!raw) return;
  const index: string[] = JSON.parse(raw) as string[];
  await AsyncStorage.setItem(
    KEYS.RECORDINGS_INDEX,
    JSON.stringify(index.filter(i => i !== id))
  );
}
