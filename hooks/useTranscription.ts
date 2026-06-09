import { useState, useRef, useCallback } from 'react';
import { DeepgramClient, type DeepgramConfig } from '../lib/deepgram';
import type { Segment } from '../types';

export function useTranscription() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [interimText, setInterimText] = useState('');
  const clientRef = useRef<DeepgramClient | null>(null);

  const connect = useCallback((config: DeepgramConfig) => {
    clientRef.current = new DeepgramClient(
      (seg) => {
        const segment: Segment = {
          id: Math.random().toString(36).slice(2),
          recording_id: '',
          text: seg.text || '',
          speaker: seg.speaker,
          start_ms: seg.start_ms || 0,
          end_ms: seg.end_ms || 0,
          confidence: seg.confidence || 1,
          is_final: seg.is_final || false,
        };

        if (segment.is_final && segment.text) {
          setSegments(prev => [...prev, segment]);
          setInterimText('');
        } else {
          setInterimText(seg.text || '');
        }
      },
      (err) => console.error('Deepgram error:', err)
    );
    clientRef.current.connect(config);
  }, []);

  const sendAudio = useCallback((chunk: ArrayBuffer) => {
    clientRef.current?.send(chunk);
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setInterimText('');
  }, []);

  const reset = useCallback(() => {
    setSegments([]);
    setInterimText('');
  }, []);

  return { segments, interimText, connect, sendAudio, disconnect, reset };
}
