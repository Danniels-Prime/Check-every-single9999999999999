import { generatePhantomInsight } from './claude';
import type { Segment, PhantomEvent } from '../types';

export class PhantomEngine {
  private wordCount = 0;
  private lastWords: string[] = [];
  private firedTriggers = new Set<string>();
  private onEvent: (event: PhantomEvent) => void;

  constructor(onEvent: (event: PhantomEvent) => void) {
    this.onEvent = onEvent;
  }

  async processSegment(segment: Segment, allSegments: Segment[]) {
    if (!segment.is_final) return;

    const words = segment.text.split(' ');
    this.wordCount += words.length;
    this.lastWords.push(...words);

    if (this.lastWords.length > 50) {
      this.lastWords = this.lastWords.slice(-50);
    }

    if (this.wordCount >= 100 && !this.firedTriggers.has('WORD_100')) {
      this.firedTriggers.add('WORD_100');
      await this.fire('First 100 words spoken', allSegments, 'pattern');
    }

    if (this.wordCount >= 500 && !this.firedTriggers.has('WORD_500')) {
      this.firedTriggers.add('WORD_500');
      await this.fire('500 words reached', allSegments, 'insight');
    }

    const phraseKey = this.detectRepeatPhrase();
    if (phraseKey && !this.firedTriggers.has(`REPEAT_${phraseKey}`)) {
      this.firedTriggers.add(`REPEAT_${phraseKey}`);
      await this.fire(`Repeated phrase: "${phraseKey}"`, allSegments, 'connection');
    }
  }

  private detectRepeatPhrase(): string | null {
    if (this.lastWords.length < 6) return null;
    for (let len = 3; len <= 5; len++) {
      for (let i = 0; i <= this.lastWords.length - len * 2; i++) {
        const phrase = this.lastWords.slice(i, i + len).join(' ').toLowerCase();
        const rest = this.lastWords.slice(i + len).join(' ').toLowerCase();
        if (rest.includes(phrase)) return phrase;
      }
    }
    return null;
  }

  private async fire(
    trigger: string,
    segments: Segment[],
    type: PhantomEvent['type']
  ) {
    try {
      const text = await generatePhantomInsight(segments, trigger);
      if (!text) return;

      this.onEvent({
        type,
        text,
        triggered_at: this.wordCount,
        dismissed: false,
      });
    } catch { /* phantom fails silently */ }
  }

  reset() {
    this.wordCount = 0;
    this.lastWords = [];
    this.firedTriggers.clear();
  }
}
