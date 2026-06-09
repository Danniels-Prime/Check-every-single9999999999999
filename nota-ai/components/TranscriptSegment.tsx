import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import type { Segment } from '@/types';

const SPEAKER_COLORS = [THEME.colors.mint, THEME.colors.amber, '#A78BFA', '#34D399', '#F472B6'];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface TranscriptSegmentProps {
  segment: Segment;
  isInterim?: boolean;
}

export default function TranscriptSegment({ segment, isInterim }: TranscriptSegmentProps) {
  const speakerColor = SPEAKER_COLORS[segment.speaker % SPEAKER_COLORS.length];

  return (
    <View style={[styles.row, isInterim && styles.rowInterim]}>
      <View style={styles.meta}>
        <Text style={[styles.time, { fontFamily: THEME.font.mono }]}>
          {formatTime(segment.start)}
        </Text>
        <View style={[styles.speakerDot, { backgroundColor: speakerColor }]} />
      </View>
      <Text style={[styles.text, isInterim && styles.textInterim]}>
        {segment.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 6,
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
  },
  rowInterim: {
    borderLeftColor: THEME.colors.mintDim,
    opacity: 0.6,
  },
  meta: {
    width: 52,
    alignItems: 'flex-end',
    paddingTop: 3,
    gap: 4,
  },
  time: {
    color: THEME.colors.ghostDim,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  speakerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    flex: 1,
    color: THEME.colors.ghost,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  textInterim: {
    fontStyle: 'italic',
    color: THEME.colors.ghostDim,
  },
});
