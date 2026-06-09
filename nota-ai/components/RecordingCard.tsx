import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { LANGUAGES } from '@/constants/languages';
import type { Recording } from '@/types';

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface RecordingCardProps {
  recording: Recording;
  onPress: () => void;
  onDelete: () => void;
}

export default function RecordingCard({ recording, onPress, onDelete }: RecordingCardProps) {
  const lang = LANGUAGES.find(l => l.code === recording.language);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.top}>
        <Text style={styles.title} numberOfLines={1}>{recording.title}</Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.deleteIcon}>⊗</Text>
        </TouchableOpacity>
      </View>

      {recording.summary?.tldr ? (
        <Text style={styles.preview} numberOfLines={2}>{recording.summary.tldr}</Text>
      ) : (
        <Text style={styles.previewDim}>No summary — tap to view transcript</Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.meta}>{formatDate(recording.createdAt)}</Text>
        <Text style={styles.meta}>·</Text>
        <Text style={styles.meta}>{formatDuration(recording.durationMs)}</Text>
        {lang && <Text style={styles.meta}>· {lang.flag} {lang.code}</Text>}
        <Text style={styles.segCount}>{recording.segments.length} segments</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    gap: 8,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    color: THEME.colors.ghost,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  deleteIcon: {
    color: THEME.colors.ghostDim,
    fontSize: 16,
  },
  preview: {
    color: THEME.colors.ghostDim,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
  },
  previewDim: {
    color: `${THEME.colors.ghostDim}80`,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    color: THEME.colors.ghostDim,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 0.3,
  },
  segCount: {
    marginLeft: 'auto',
    color: `${THEME.colors.mint}80`,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
  },
});
