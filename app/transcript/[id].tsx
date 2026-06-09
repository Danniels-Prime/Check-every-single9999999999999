import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Share, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { THEME } from '../../constants/theme';
import { getRecording } from '../../lib/storage';
import { exportSRT, exportText } from '../../lib/export';
import TranscriptSegment from '../../components/TranscriptSegment';
import type { StoredRecording } from '../../types';

export default function TranscriptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recording, setRecording] = useState<StoredRecording | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecording(id).then(data => {
      setRecording(data);
      setLoading(false);
    });
  }, [id]);

  const handleExport = async (format: 'srt' | 'text') => {
    if (!recording) return;
    const content = format === 'srt'
      ? exportSRT(recording.segments)
      : exportText(recording.segments);

    await Share.share({
      message: content,
      title: recording.title,
    });
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={THEME.colors.mint} />
      </View>
    );
  }

  if (!recording) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Recording not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.exportRow}>
          <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('text')}>
            <Text style={styles.exportBtnText}>TXT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('srt')}>
            <Text style={styles.exportBtnText}>SRT</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.titleBar}>
        <Text style={styles.title}>{recording.title}</Text>
        <Text style={styles.meta}>
          {new Date(recording.created_at).toLocaleString()} · {recording.segments.length} segments
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {recording.segments.length === 0 ? (
          <Text style={styles.emptyText}>No transcript segments available.</Text>
        ) : (
          recording.segments.map(seg => (
            <TranscriptSegment key={seg.id} segment={seg} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.colors.void },
  loading: {
    flex: 1,
    backgroundColor: THEME.colors.void,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: THEME.colors.ghostDim, fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: 56,
    paddingBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backBtn: { color: THEME.colors.mint, fontFamily: THEME.font.mono, fontSize: 14 },
  exportRow: { flexDirection: 'row', gap: THEME.spacing.sm },
  exportBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  exportBtnText: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 11,
    letterSpacing: 1,
  },
  titleBar: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    gap: 4,
  },
  title: {
    color: THEME.colors.ghost,
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 11,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: THEME.spacing.lg },
  emptyText: {
    color: THEME.colors.ghostDim,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 60,
  },
});
