import { useState, useCallback } from 'react';
import { explainPhrase } from '@/lib/claude';
import type { Explanation, ExplanationLanguage } from '@/types';

export interface UseExplanationReturn {
  explanation: Explanation | null;
  isLoading: boolean;
  error: string | null;
  explain: (
    apiKey: string,
    phrase: string,
    context: string,
    sourceLanguage: string,
    explanationLanguage: ExplanationLanguage,
  ) => Promise<void>;
  clear: () => void;
}

export function useExplanation(): UseExplanationReturn {
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const explain = useCallback(async (
    apiKey: string,
    phrase: string,
    context: string,
    sourceLanguage: string,
    explanationLanguage: ExplanationLanguage,
  ) => {
    if (!apiKey) {
      setError('Add your Anthropic API key in Settings');
      return;
    }
    setIsLoading(true);
    setError(null);
    setExplanation(null);
    try {
      const result = await explainPhrase(apiKey, phrase, context, sourceLanguage, explanationLanguage);
      setExplanation(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get explanation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setExplanation(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { explanation, isLoading, error, explain, clear };
}
