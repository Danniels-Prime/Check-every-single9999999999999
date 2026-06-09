import { generatePhantomInsight } from './claude';
import type { PhantomEvent, Segment } from '@/types';

const WORD_COUNT_TRIGGERS = [100, 250, 500, 1000];
const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually', 'right'];

export class PhantomEngine {
  private wordCount = 0;
  private triggeredCounts = new Set<number>();
  private fillerCooldownUntil = 0;
  private onInsight: (event: PhantomEvent) => void;

  constructor(onInsight: (event: PhantomEvent) => void) {
    this.onInsight = onInsight;
  }

  async processSegment(segment: Segment): Promise<void> {
    if (!segment.isFinal) return;
    const words = segment.text.trim().split(/\s+/);
    this.wordCount += words.length;

    for (const trigger of WORD_COUNT_TRIGGERS) {
      if (!this.triggeredCounts.has(trigger) && this.wordCount >= trigger) {
        this.triggeredCounts.add(trigger);
        const event: PhantomEvent = {
          id: `${Date.now()}-wc`,
          type: 'word_count',
          insight: '',
          triggeredAt: new Date().toISOString(),
          wordCount: trigger,
        };
        try {
          event.insight = await generatePhantomInsight(event, segment.text);
          if (event.insight) this.onInsight(event);
        } catch { /* phantom fails silently */ }
      }
    }

    const now = Date.now();
    if (now > this.fillerCooldownUntil) {
      const lower = segment.text.toLowerCase();
      for (const filler of FILLER_WORDS) {
        if (lower.includes(filler)) {
          this.fillerCooldownUntil = now + 30_000;
          const event: PhantomEvent = {
            id: `${Date.now()}-fw`,
            type: 'filler_word',
            insight: '',
            phrase: filler,
            triggeredAt: new Date().toISOString(),
          };
          try {
            event.insight = await generatePhantomInsight(event, segment.text);
            if (event.insight) this.onInsight(event);
          } catch { /* phantom fails silently */ }
          break;
        }
      }
    }
  }

  reset(): void {
    this.wordCount = 0;
    this.triggeredCounts.clear();
    this.fillerCooldownUntil = 0;
  }
}
