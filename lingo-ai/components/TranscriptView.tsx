import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { WordToken } from './WordToken';
import { colors, spacing } from '@/constants/theme';
import type { TranscriptSegment, TranscriptWord } from '@/types';

interface Props {
  segments: TranscriptSegment[];
  interimWords: TranscriptWord[];
  highlightedWord: string | null;
  onWordPress: (word: string, context: string) => void;
  scrollRef?: React.RefObject<ScrollView | null>;
}

export function TranscriptView({ segments, interimWords, highlightedWord, onWordPress, scrollRef }: Props) {
  if (segments.length === 0 && interimWords.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Tap the mic to start listening...</Text>
        <Text style={styles.emptyHint}>Tap any word to see its explanation</Text>
      </View>
    );
  }

  const allFinalWords = segments.flatMap(s => s.words);
  const contextSentence = [...allFinalWords, ...interimWords]
    .map(w => w.punctuated_word ?? w.word)
    .join(' ');

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      onContentSizeChange={() => scrollRef?.current?.scrollToEnd({ animated: true })}
    >
      <View style={styles.wordFlow}>
        {segments.map((segment) =>
          segment.words.map((w, wi) => (
            <WordToken
              key={`${segment.id}-${wi}`}
              word={w.punctuated_word ?? w.word}
              isFinal
              isHighlighted={highlightedWord === (w.punctuated_word ?? w.word)}
              onPress={(word) => onWordPress(word, contextSentence)}
            />
          ))
        )}
        {interimWords.map((w, i) => (
          <WordToken
            key={`interim-${i}`}
            word={w.punctuated_word ?? w.word}
            isFinal={false}
            onPress={(word) => onWordPress(word, contextSentence)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  wordFlow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: colors.textDim,
    textAlign: 'center',
  },
});
