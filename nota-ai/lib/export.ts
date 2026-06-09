import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { Recording } from '@/types';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export async function exportAsText(recording: Recording): Promise<void> {
  const lines = recording.segments
    .filter(s => s.isFinal)
    .map(s => `[${formatTime(s.start)} | Speaker ${s.speaker}] ${s.text}`);

  const content = [
    `NOTA AI — ${recording.title}`,
    `Date: ${new Date(recording.createdAt).toLocaleString()}`,
    `Language: ${recording.language}`,
    `Duration: ${formatTime(recording.durationMs / 1000)}`,
    '',
    '=== TRANSCRIPT ===',
    ...lines,
    '',
    '=== SUMMARY ===',
    recording.summary
      ? [
          recording.summary.tldr,
          '',
          'Key Points:',
          ...recording.summary.bulletPoints.map(p => `  • ${p}`),
          '',
          'Action Items:',
          ...recording.summary.actionItems.map(a => `  → ${a}`),
        ].join('\n')
      : 'No summary available.',
  ].join('\n');

  const uri = `${FileSystem.cacheDirectory}nota_${recording.id}.txt`;
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await Sharing.shareAsync(uri, { mimeType: 'text/plain', dialogTitle: `Export: ${recording.title}` });
}
