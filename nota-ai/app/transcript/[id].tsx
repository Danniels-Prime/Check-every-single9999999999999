import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { getRecording } from '@/lib/storage';
import { exportAsText } from '@/lib/export';
import { LANGUAGES } from '@/constants/languages';
import TranscriptSegment from '@/components/TranscriptSegment';
import type { Recording } from '@/types';

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function TranscriptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('transcript');

  useEffect(() => {
    if (!id) return;
    getRecording(id).then(r => {
      setRecording(r);
      setLoading(false);
    });
  }, [id]);

  const handleExport = async () => {
    if (!recording) return;
    setExporting(true);
    try { await exportAsText(recording); } catch { /* ignore */ }
    setExporting(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={THEME.colors.mint} />
      </View>
    );
  }

  if (!recording) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Recording not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const lang = LANGUAGES.find(l => l.code === recording.language);

  return (
    <SafeAreaView style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backText}>← Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.exportBtn, exporting && { opacity: 0.5 }]}
          onPress={handleExport}
          disabled={exporting}
        >
          <Text style={styles.exportLabel}>Export ↗</Text>
        </TouchableOpacity>
      </View>

      {/* META */}
      <View style={styles.meta}>
        <Text style={styles.title}>{recording.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {new Date(recording.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{formatDuration(recording.durationMs)}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{lang?.flag ?? ''} {recording.language}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{recording.segments.length} segments</Text>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabs}>
        {(['transcript', 'summary'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === 'transcript' ? '📝 Transcript' : '⚡ Summary'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'transcript' ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {recording.segments.length === 0 ? (
            <Text style={styles.empty}>No transcript segments.</Text>
          ) : (
            recording.segments.map(seg => (
              <TranscriptSegment key={seg.id} segment={seg} />
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {recording.summary ? (
            <>
              <View style={styles.tldrBox}>
                <Text style={styles.tldrLabel}>TL;DR</Text>
                <Text style={styles.tldrText}>{recording.summary.tldr}</Text>
              </View>

              {recording.summary.bulletPoints.length > 0 && (
                <View style={styles.summarySection}>
                  <Text style={styles.summarySectionLabel}>Key Points</Text>
                  {recording.summary.bulletPoints.map((pt, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bulletText}>{pt}</Text>
                    </View>
                  ))}
                </View>
              )}

              {recording.summary.actionItems.length > 0 && (
                <View style={styles.summarySection}>
                  <Text style={styles.summarySectionLabel}>Action Items</Text>
                  {recording.summary.actionItems.map((ai, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Text style={[styles.bullet, { color: THEME.colors.amber }]}>→</Text>
                      <Text style={styles.bulletText}>{ai}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <Text style={styles.empty}>
              No summary yet. Open the recording screen and tap ⚡ Summary.
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.colors.void },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.colors.void, gap: 12 },
  errorText: { color: THEME.colors.ghostDim, fontFamily: 'Inter_400Regular', fontSize: 14 },
  backLink: { color: THEME.colors.mint, fontFamily: 'Inter_400Regular', fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backText: { color: THEME.colors.mint, fontFamily: 'JetBrainsMono_400Regular', fontSize: 13 },
  exportBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  exportLabel: { color: THEME.colors.ghostDim, fontFamily: 'Inter_400Regular', fontSize: 12 },
  meta: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    gap: 6,
  },
  title: { color: THEME.colors.ghost, fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  metaText: { color: THEME.colors.ghostDim, fontFamily: 'JetBrainsMono_400Regular', fontSize: 10 },
  metaDot: { color: THEME.colors.ghostDim, fontSize: 10 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    gap: 4,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: THEME.radius.sm },
  tabActive: { backgroundColor: THEME.colors.mintDim },
  tabLabel: { color: THEME.colors.ghostDim, fontFamily: 'Inter_400Regular', fontSize: 13 },
  tabLabelActive: { color: THEME.colors.mint, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  scrollContent: { padding: THEME.spacing.lg, paddingBottom: 40 },
  empty: { color: THEME.colors.ghostDim, fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', paddingTop: 40 },
  tldrBox: {
    backgroundColor: THEME.colors.amberDim,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.amber,
    gap: 6,
  },
  tldrLabel: { color: THEME.colors.amber, fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, letterSpacing: 2 },
  tldrText: { color: THEME.colors.ghost, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 },
  summarySection: { marginBottom: THEME.spacing.lg },
  summarySectionLabel: {
    color: THEME.colors.ghostDim,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  bullet: { color: THEME.colors.mint, fontSize: 14, width: 14 },
  bulletText: { flex: 1, color: THEME.colors.ghost, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
});
