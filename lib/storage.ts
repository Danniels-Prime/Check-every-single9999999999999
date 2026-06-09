import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StoredRecording, FlashcardSet } from '../types';

const RECORDINGS_KEY = 'nota_recordings';

export async function saveRecording(recording: StoredRecording): Promise<void> {
  const existing = await getRecordings();
  const updated = [recording, ...existing.filter(r => r.id !== recording.id)];
  await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));
}

export async function getRecordings(): Promise<StoredRecording[]> {
  const raw = await AsyncStorage.getItem(RECORDINGS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredRecording[];
  } catch {
    return [];
  }
}

export async function getRecording(id: string): Promise<StoredRecording | null> {
  const recordings = await getRecordings();
  return recordings.find(r => r.id === id) ?? null;
}

export async function deleteRecording(id: string): Promise<void> {
  const recordings = await getRecordings();
  const updated = recordings.filter(r => r.id !== id);
  await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));
}

const FLASHCARD_SETS_KEY = 'nota_flashcard_sets';

export async function saveFlashcardSet(set: FlashcardSet): Promise<void> {
  const existing = await getFlashcardSets();
  const updated = [set, ...existing.filter(s => s.id !== set.id)];
  await AsyncStorage.setItem(FLASHCARD_SETS_KEY, JSON.stringify(updated));
}

export async function getFlashcardSets(): Promise<FlashcardSet[]> {
  const raw = await AsyncStorage.getItem(FLASHCARD_SETS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FlashcardSet[];
  } catch {
    return [];
  }
}

export async function getFlashcardSetsForRecording(recordingId: string): Promise<FlashcardSet[]> {
  const sets = await getFlashcardSets();
  return sets.filter(s => s.recording_id === recordingId);
}
