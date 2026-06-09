import React from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { THEME } from '../constants/theme';
import type { Summary } from '../types';

interface Props {
  visible: boolean;
  loading: boolean;
  summary: Summary | null;
  onClose: () => void;
}

export default function SummarySheet({ visible, loading, summary, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>⚡ Summary</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={THEME.colors.amber} />
              <Text style={styles.loadingText}>Analyzing transcript…</Text>
            </View>
          ) : summary ? (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {summary.one_liner ? (
                <View style={styles.section}>
                  <Text style={styles.oneLiner}>{summary.one_liner}</Text>
                </View>
              ) : null}

              {summary.key_points.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>KEY POINTS</Text>
                  {summary.key_points.map((point, i) => (
                    <View key={i} style={styles.listItem}>
                      <Text style={styles.bullet}>◆</Text>
                      <Text style={styles.listText}>{point}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {summary.action_items.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>ACTION ITEMS</Text>
                  {summary.action_items.map((item, i) => (
                    <View key={i} style={styles.listItem}>
                      <Text style={styles.bulletAmber}>→</Text>
                      <Text style={styles.listText}>{item}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: THEME.radius.xl,
    borderTopRightRadius: THEME.radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: THEME.colors.border,
    maxHeight: '75%',
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.border,
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
    fontFamily: THEME.font.mono,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  closeBtn: {
    color: THEME.colors.ghostDim,
    fontSize: 16,
    padding: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.xxl,
    gap: 12,
  },
  loadingText: {
    color: THEME.colors.ghostDim,
    fontSize: 13,
    fontFamily: THEME.font.mono,
  },
  content: {
    paddingHorizontal: THEME.spacing.lg,
  },
  section: {
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  sectionLabel: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: THEME.spacing.sm,
  },
  oneLiner: {
    color: THEME.colors.amber,
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  listItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  bullet: {
    color: THEME.colors.mint,
    fontSize: 8,
    paddingTop: 6,
  },
  bulletAmber: {
    color: THEME.colors.amber,
    fontSize: 14,
  },
  listText: {
    flex: 1,
    color: THEME.colors.ghost,
    fontSize: 13,
    lineHeight: 20,
  },
});
