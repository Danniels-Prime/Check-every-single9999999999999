export interface Recording {
  id: string;
  title: string;
  created_at: string;
  duration_seconds: number;
  audio_url?: string;
  language: string;
  status: 'recording' | 'processing' | 'done';
}

export interface Segment {
  id: string;
  recording_id: string;
  text: string;
  speaker?: string;
  start_ms: number;
  end_ms: number;
  confidence: number;
  is_final: boolean;
}

export interface Summary {
  id: string;
  recording_id: string;
  key_points: string[];
  action_items: string[];
  one_liner: string;
  template?: 'meeting' | 'lecture' | 'interview' | 'custom';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  context_snapshot?: string;
}

export interface PhantomEvent {
  type: 'insight' | 'pattern' | 'anomaly' | 'connection' | 'void';
  text: string;
  triggered_at: number;
  dismissed: boolean;
}

export interface StoredRecording extends Recording {
  segments: Segment[];
}

export interface Flashcard {
  id: string;
  recording_id: string;
  question: string;
  answer: string;
  source_text?: string;
  created_at: string;
}

export interface FlashcardSet {
  id: string;
  recording_id: string;
  recording_title: string;
  cards: Flashcard[];
  created_at: string;
}
