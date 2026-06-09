import type { Segment } from '../types';

function msToSRTTime(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const ms_ = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms_).padStart(3, '0')}`;
}

export function exportSRT(segments: Segment[]): string {
  return segments
    .filter(s => s.is_final && s.text.trim())
    .map((s, i) => {
      return `${i + 1}\n${msToSRTTime(s.start_ms)} --> ${msToSRTTime(s.end_ms)}\n${s.speaker ? `[${s.speaker}] ` : ''}${s.text}\n`;
    })
    .join('\n');
}

export function exportText(segments: Segment[]): string {
  return segments
    .filter(s => s.is_final && s.text.trim())
    .map(s => {
      const time = new Date(s.start_ms).toISOString().slice(11, 19);
      const speaker = s.speaker ? `[${s.speaker}] ` : '';
      return `${time} ${speaker}${s.text}`;
    })
    .join('\n');
}
