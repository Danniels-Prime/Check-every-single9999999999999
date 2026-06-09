import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { THEME } from '@/constants/theme';
import type { Summary } from '@/types';

interface SummarySheetProps {
  visible: boolean;
  loading: boolean;
  summary: Summary | null;
  onClose: () => void;
}

export default function SummarySheet({ visible, loading, summary, onClose }: SummarySheetProps) {
  const translateY = useSharedValue(400);

  useEffect(() => {
    translateY.value = withSpring(visible ? 0 : 400, { damping: 20, stiffness: 200 });
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible && translateY.value >= 400) return null;

  return (
    <Animated.View style={[styles.sheet, animStyle]}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Text style={styles.title}>AI Summary</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator color={THEME.colors.amber} />
          <Text style={styles.loadingText}>Generating summary…</Text>
        </View>
      ) : summary ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.tldrBox}>
            <Text style={styles.sectionLabel}>TL;DR</Text>
            <Text style={styles.tldr}>{summary.tldr}</Text>
          </View>

          {summary.bulletPoints.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Key Points</Text>
              {summary.bulletPoints.map((pt, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{pt}</Text>
                </View>
              ))}
            </View>
          )}

          {summary.actionItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Action Items</Text>
              {summary.actionItems.map((ai, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: THEME.colors.amber }]}>→</Text>
                  <Text style={styles.bulletText}>{ai}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.loadingArea}>
          <Text style={styles.loadingText}>No summary available.</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: THEME.radius.xl,
    borderTopRightRadius: THEME.radius.xl,
    borderTopWidth: 1,
    borderColor: THEME.colors.border,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: THEME.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  title: {
    color: THEME.colors.amber,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  closeBtn: { padding: 4 },
  closeText: { color: THEME.colors.ghostDim, fontSize: 16 },
  loadingArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.xxl,
    gap: 12,
  },
  loadingText: { color: THEME.colors.ghostDim, fontFamily: 'Inter_400Regular', fontSize: 14 },
  content: { paddingHorizontal: THEME.spacing.lg },
  tldrBox: {
    backgroundColor: THEME.colors.amberDim,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.amber,
  },
  tldr: {
    color: THEME.colors.ghost,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  section: { marginBottom: THEME.spacing.lg },
  sectionLabel: {
    color: THEME.colors.ghostDim,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  bulletDot: { color: THEME.colors.mint, fontSize: 14, width: 14 },
  bulletText: {
    flex: 1,
    color: THEME.colors.ghost,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Inter_400Regular',
  },
});
