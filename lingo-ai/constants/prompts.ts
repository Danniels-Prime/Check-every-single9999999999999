import type { ExplanationLanguage } from '@/types';

export function buildExplanationPrompt(
  phrase: string,
  context: string,
  sourceLanguage: string,
  explanationLanguage: ExplanationLanguage,
): string {
  const langInstructions =
    explanationLanguage === 'es'
      ? 'Respond entirely in Spanish (Español).'
      : 'Respond entirely in English.';

  return `You are a language learning assistant that explains English and Spanish expressions, idioms, slang, and phrasal verbs to language learners.

The user tapped on the word or phrase: "${phrase}"
Full sentence context: "${context}"
Source language of the audio: ${sourceLanguage}

${langInstructions}

Analyze the tapped phrase in context and respond with valid JSON only (no markdown, no extra text):

{
  "phrase": "the actual expression as it appears in context (expand to full idiom if the user tapped just one word of a multi-word idiom)",
  "type": "one of: idiom | slang | phrasal_verb | cultural_expression | word | phrase",
  "meaning": "clear, simple explanation of what it means in this context (2-3 sentences max)",
  "examples": ["example sentence 1", "example sentence 2", "example sentence 3"],
  "note": "optional cultural or usage note (null if none)"
}

Rules:
- If the tapped word is part of a well-known idiom (e.g. user taps "minute" in "it's been a minute"), set phrase to the full idiom
- For regular non-idiomatic words, type is "word" and give a brief definition
- Examples must be natural, colloquial sentences a native speaker would actually say
- Keep explanations accessible to B1-level learners`;
}
