export interface Recording {
  id: string;
  title: string;
  createdAt: string;
  durationMs: number;
  segments: Segment[];
  summary: Summary | null;
  language: string;
}

export interface Segment {
  id: string;
  speaker: number;
  start: number;
  end: number;
  text: string;
  isFinal: boolean;
}

export interface Summary {
  tldr: string;
  bulletPoints: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  generatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PhantomEvent {
  id: string;
  type: 'word_count' | 'repeat_phrase' | 'silence' | 'filler_word';
  insight: string;
  triggeredAt: string;
  wordCount?: number;
  phrase?: string;
}

export interface AppSettings {
  deepgramKey: string;
  anthropicKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  selectedLanguage: string;
  theme: 'dark';
}
