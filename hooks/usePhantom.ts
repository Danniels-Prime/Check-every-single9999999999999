import { useState, useRef, useEffect, useCallback } from 'react';
import { PhantomEngine } from '../lib/phantom';
import type { PhantomEvent, Segment } from '../types';

export function usePhantom() {
  const [phantomEvents, setPhantomEvents] = useState<PhantomEvent[]>([]);
  const engineRef = useRef<PhantomEngine | null>(null);

  useEffect(() => {
    engineRef.current = new PhantomEngine((event) => {
      setPhantomEvents(prev => [...prev, event]);
    });
    return () => engineRef.current?.reset();
  }, []);

  const processSegment = useCallback((segment: Segment, allSegments: Segment[]) => {
    engineRef.current?.processSegment(segment, allSegments);
  }, []);

  const dismissEvent = useCallback((index: number) => {
    setPhantomEvents(prev =>
      prev.map((e, i) => i === index ? { ...e, dismissed: true } : e)
    );
  }, []);

  const reset = useCallback(() => {
    engineRef.current?.reset();
    setPhantomEvents([]);
  }, []);

  return { phantomEvents, processSegment, dismissEvent, reset };
}
