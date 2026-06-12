import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius } from '@/constants/theme';
import { useRecording } from '@/hooks/useRecording';
import { useTranscription } from '@/hooks/useTranscription';
import { useExplanation } from '@/hooks/useExplanation';
import { getSettings, saveSession } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { WaveformBars } from '@/components/WaveformBars';
import { TranscriptView } from '@/components/TranscriptView';
import { ExplanationSheet } from '@/components/ExplanationSheet';
import type { ExplanationLanguage } from '@/types';

export default function RecordScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const [explanationVisible, setExplanationVisible] = useState(false);
  const [explanationLang, setExplanationLang] = useState<ExplanationLanguage>('en');
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);

  const { isRecording, metering, startRecording, stopRecording } = useRecording();
  const { segments, interimWords, connect, disconnect, sendChunk, reset, fullTranscript } = useTranscription();
  const { explanation, isLoading, error, explain, clear } = useExplanation();

  const handleToggleRecord = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
      disconnect();
      // Save session
      if (fullTranscript.trim()) {
        const settings = await getSettings();
        const title = fullTranscript.split(/\s+/).slice(0, 6).join(' ') + '…';
        await saveSession({
          id: generateId(),
          title,
          transcript: fullTranscript,
          sourceLanguage: settings.sourceLanguage,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      const settings = await getSettings();
      if (!settings.deepgramKey) {
        Alert.alert('API Key Required', 'Add your Deepgram API key in Settings first.', [
          { text: 'Go to Settings', onPress: () => router.push('/settings') },
          { text: 'Cancel', style: 'cancel' },
        ]);
        return;
      }
      reset();
      connect(settings.deepgramKey, settings.sourceLanguage);
      setExplanationLang(settings.explanationLanguage);
      await startRecording(sendChunk);
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [isRecording, stopRecording, disconnect, startRecording, sendChunk, connect, reset, router, fullTranscript]);

  const handleWordPress = useCallback(async (word: string, context: string) => {
    const settings = await getSettings();
    if (!settings.anthropicKey) {
      Alert.alert('API Key Required', 'Add your Anthropic API key in Settings to get explanations.', [
        { text: 'Go to Settings', onPress: () => router.push('/settings') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    setHighlightedWord(word);
    setExplanationVisible(true);
    clear();
    await Haptics.selectionAsync();
    await explain(settings.anthropicKey, word, context, settings.sourceLanguage, explanationLang);
  }, [explain, clear, explanationLang, router]);

  function handleCloseSheet() {
    setExplanationVisible(false);
    setHighlightedWord(null);
    clear();
  }

  function handleToggleLanguage() {
    const next: ExplanationLanguage = explanationLang === 'en' ? 'es' : 'en';
    setExplanationLang(next);
    // Re-fetch explanation in new language if we have a highlighted word
    if (highlightedWord && explanation) {
      getSettings().then(settings => {
        explain(settings.anthropicKey, explanation.phrase, fullTranscript, settings.sourceLanguage, next);
      });
    }
  }

  return (
    <View style={styles.container}>
      {/* Waveform */}
      <View style={styles.waveformArea}>
        {isRecording ? (
          <>
            <WaveformBars metering={metering} />
            <Text style={styles.listeningLabel}>Listening...</Text>
          </>
        ) : (
          <Text style={styles.tapHint}>
            {segments.length > 0 ? 'Tap any word to explain it' : 'Tap the mic to start'}
          </Text>
        )}
      </View>

      {/* Transcript */}
      <TranscriptView
        segments={segments}
        interimWords={interimWords}
        highlightedWord={highlightedWord}
        onWordPress={handleWordPress}
        scrollRef={scrollRef}
      />

      {/* Record button */}
      <View style={styles.controls}>
        <Pressable
          onPress={handleToggleRecord}
          style={({ pressed }) => [
            styles.micBtn,
            isRecording && styles.micBtnActive,
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
        >
          <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎙'}</Text>
        </Pressable>
      </View>

      {/* Explanation overlay */}
      <ExplanationSheet
        visible={explanationVisible}
        explanation={explanation}
        isLoading={isLoading}
        error={error}
        explanationLanguage={explanationLang}
        onToggleLanguage={handleToggleLanguage}
        onClose={handleCloseSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  waveformArea: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  listeningLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tapHint: {
    fontSize: 14,
    color: colors.textMuted,
  },

  controls: {
    paddingBottom: spacing.xl,
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: colors.primary + '33',
    borderColor: colors.accent,
  },
  micIcon: { fontSize: 32 },
});
