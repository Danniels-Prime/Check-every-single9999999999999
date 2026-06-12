import { useState, useRef, useCallback } from 'react';
import { DeepgramClient } from '@/lib/deepgram';
import type { TranscriptSegment, TranscriptWord } from '@/types';
import { generateId } from '@/lib/utils';

export interface UseTranscriptionReturn {
  segments: TranscriptSegment[];
  interimWords: TranscriptWord[];
  fullTranscript: string;
  connect: (apiKey: string, language: string) => void;
  disconnect: () => void;
  sendChunk: (data: ArrayBuffer) => void;
  reset: () => void;
}

export function useTranscription(): UseTranscriptionReturn {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interimWords, setInterimWords] = useState<TranscriptWord[]>([]);
  const [fullTranscript, setFullTranscript] = useState('');
  const clientRef = useRef<DeepgramClient | null>(null);
  const fullTranscriptRef = useRef('');

  const connect = useCallback((apiKey: string, language: string) => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    const client = new DeepgramClient(
      apiKey,
      language,
      (result) => {
        if (result.isFinal) {
          if (result.words.length > 0) {
            const segment: TranscriptSegment = {
              id: generateId(),
              words: result.words,
              isFinal: true,
            };
            setSegments(prev => [...prev, segment]);
            const updated = fullTranscriptRef.current + (fullTranscriptRef.current ? ' ' : '') + result.transcript;
            fullTranscriptRef.current = updated;
            setFullTranscript(updated);
            setInterimWords([]);
          }
        } else {
          setInterimWords(result.words);
        }
      },
      (error) => {
        console.warn('Deepgram error:', error.message);
      },
    );

    client.connect();
    clientRef.current = client;
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setInterimWords([]);
  }, []);

  const sendChunk = useCallback((data: ArrayBuffer) => {
    clientRef.current?.sendAudio(data);
  }, []);

  const reset = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setSegments([]);
    setInterimWords([]);
    setFullTranscript('');
    fullTranscriptRef.current = '';
  }, []);

  return {
    segments,
    interimWords,
    fullTranscript,
    connect,
    disconnect,
    sendChunk,
    reset,
  };
}
