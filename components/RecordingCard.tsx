import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { THEME } from '../constants/theme';
import type { StoredRecording } from '../types';

interface Props {
  recording: StoredRecording;
  onPress: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const STATUS_COLORS: Record<string, string> = {
  done: THEME.colors.mint,
  processing: THEME.colors.amber,
  recording: THEME.colors.red,
};

export default function RecordingCard({ recording, onPress }: Props) {
  const statusColor = STATUS_COLORS[recording.status] ?? THEME.colors.ghostDim;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.top}>
        <Text style={styles.title} numberOfLines={1}>{recording.title}</Text>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {format(new Date(recording.created_at), 'MMM d, yyyy · h:mm a')}
        </Text>
        <Text style={styles.metaText}>·</Text>
        <Text style={styles.metaText}>{formatDuration(recording.duration_seconds)}</Text>
        <Text style={styles.metaText}>·</Text>
        <Text style={styles.metaText}>{recording.segments.length} segments</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  title: {
    flex: 1,
    color: THEME.colors.ghost,
    fontSize: 15,
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  meta: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 11,
  },
});
