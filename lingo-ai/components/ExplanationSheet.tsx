import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { colors, spacing, radius, typography } from '@/constants/theme';
import type { Explanation, ExplanationLanguage, ExplanationType } from '@/types';

interface Props {
  visible: boolean;
  explanation: Explanation | null;
  isLoading: boolean;
  error: string | null;
  explanationLanguage: ExplanationLanguage;
  onToggleLanguage: () => void;
  onClose: () => void;
}

const TYPE_LABELS: Record<ExplanationType, string> = {
  idiom: 'Idiom',
  slang: 'Slang',
  phrasal_verb: 'Phrasal Verb',
  cultural_expression: 'Cultural Expression',
  word: 'Word',
  phrase: 'Phrase',
};

export function ExplanationSheet({
  visible,
  explanation,
  isLoading,
  error,
  explanationLanguage,
  onToggleLanguage,
  onClose,
}: Props) {
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const typeColor = explanation ? colors[explanation.type as keyof typeof colors] as string ?? colors.primary : colors.primary;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <Pressable>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              {explanation && (
                <View style={[styles.typeBadge, { backgroundColor: typeColor + '22' }]}>
                  <Text style={[styles.typeText, { color: typeColor }]}>
                    {TYPE_LABELS[explanation.type] ?? explanation.type}
                  </Text>
                </View>
              )}
              <View style={styles.headerRight}>
                <Pressable style={styles.langToggle} onPress={onToggleLanguage}>
                  <Text style={styles.langToggleText}>
                    {explanationLanguage === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}
                  </Text>
                </Pressable>
                <Pressable style={styles.closeBtn} onPress={onClose}>
                  <Text style={styles.closeBtnText}>×</Text>
                </Pressable>
              </View>
            </View>

            {/* Phrase */}
            {explanation && (
              <Text style={styles.phrase}>"{explanation.phrase}"</Text>
            )}

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {isLoading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              )}

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {explanation && !isLoading && (
                <>
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>
                      {explanationLanguage === 'es' ? 'Significado' : 'What it means'}
                    </Text>
                    <Text style={styles.meaning}>{explanation.meaning}</Text>
                  </View>

                  {explanation.examples.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionLabel}>
                        {explanationLanguage === 'es' ? 'Ejemplos' : 'Examples'}
                      </Text>
                      {explanation.examples.map((ex, i) => (
                        <View key={i} style={styles.exampleRow}>
                          <Text style={styles.exampleBullet}>{i + 1}.</Text>
                          <Text style={styles.exampleText}>{ex}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {explanation.note ? (
                    <View style={[styles.section, styles.noteBox]}>
                      <Text style={styles.noteText}>{explanation.note}</Text>
                    </View>
                  ) : null}
                </>
              )}

              <View style={{ height: spacing.xl }} />
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    minHeight: 300,
    maxHeight: '80%',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  langToggle: {
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  langToggleText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 20,
    color: colors.textMuted,
    lineHeight: 24,
  },
  phrase: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  body: {
    flex: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  errorBox: {
    backgroundColor: colors.error + '22',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  meaning: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  exampleRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  exampleBullet: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
    minWidth: 20,
  },
  exampleText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  noteBox: {
    backgroundColor: colors.accentDim,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteText: {
    fontSize: 14,
    color: colors.accent,
    lineHeight: 20,
  },
});
