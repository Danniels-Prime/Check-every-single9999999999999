import { useState, useRef, useCallback } from 'react';
import { PhantomEngine } from '@/lib/phantom';
import type { PhantomEvent, Segment } from '@/types';

export interface UsePhantomReturn {
  phantomEvents: PhantomEvent[];
  processSegment: (seg: Segment) => void;
  dismissEvent: (id: string) => void;
  resetPhantom: () => void;
}

export function usePhantom(): UsePhantomReturn {
  const [phantomEvents, setPhantomEvents] = useState<PhantomEvent[]>([]);
  const engineRef = useRef<PhantomEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new PhantomEngine((event) => {
      setPhantomEvents(prev => [event, ...prev].slice(0, 10));
    });
  }

  const processSegment = useCallback((seg: Segment) => {
    engineRef.current?.processSegment(seg);
  }, []);

  const dismissEvent = useCallback((id: string) => {
    setPhantomEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const resetPhantom = useCallback(() => {
    engineRef.current?.reset();
    setPhantomEvents([]);
  }, []);

  return { phantomEvents, processSegment, dismissEvent, resetPhantom };
}
