import { useState, useRef, useCallback } from 'react';
import { DeepgramClient } from '@/lib/deepgram';
import { getSettings } from '@/lib/storage';
import type { Segment } from '@/types';

export interface UseTranscriptionReturn {
  segments: Segment[];
  interimText: string;
  startTranscription: (onNewSegment?: (seg: Segment) => void) => Promise<DeepgramClient>;
  stopTranscription: (client: DeepgramClient) => void;
  clearSegments: () => void;
}

export function useTranscription(): UseTranscriptionReturn {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [interimText, setInterimText] = useState('');
  const onNewSegmentRef = useRef<((seg: Segment) => void) | null>(null);

  const startTranscription = useCallback(async (onNewSegment?: (seg: Segment) => void): Promise<DeepgramClient> => {
    onNewSegmentRef.current = onNewSegment ?? null;
    const { selectedLanguage } = await getSettings();

    const client = new DeepgramClient({
      onTranscript: (text, isFinal, speaker, start, end) => {
        if (!isFinal) {
          setInterimText(text);
          return;
        }
        setInterimText('');
        const seg: Segment = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          speaker,
          start,
          end,
          text,
          isFinal: true,
        };
        setSegments(prev => [...prev, seg]);
        onNewSegmentRef.current?.(seg);
      },
      onError: (msg) => console.error('[Deepgram]', msg),
      onClose: () => setInterimText(''),
    });

    await client.connect({ language: selectedLanguage });
    return client;
  }, []);

  const stopTranscription = useCallback((client: DeepgramClient) => {
    client.disconnect();
    setInterimText('');
  }, []);

  const clearSegments = useCallback(() => {
    setSegments([]);
    setInterimText('');
  }, []);

  return { segments, interimText, startTranscription, stopTranscription, clearSegments };
}
