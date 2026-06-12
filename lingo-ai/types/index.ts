export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
}

export interface TranscriptSegment {
  id: string;
  words: TranscriptWord[];
  isFinal: boolean;
}

export type ExplanationType = 'idiom' | 'slang' | 'phrasal_verb' | 'cultural_expression' | 'word' | 'phrase';

export interface Explanation {
  phrase: string;
  type: ExplanationType;
  meaning: string;
  examples: string[];
  note?: string;
}

export type ExplanationLanguage = 'en' | 'es';
export type SourceLanguage = 'en-US' | 'en-GB' | 'es' | 'es-419';

export interface AppSettings {
  deepgramKey: string;
  anthropicKey: string;
  sourceLanguage: SourceLanguage;
  explanationLanguage: ExplanationLanguage;
}

export interface SavedSession {
  id: string;
  title: string;
  transcript: string;
  sourceLanguage: string;
  createdAt: string;
}
