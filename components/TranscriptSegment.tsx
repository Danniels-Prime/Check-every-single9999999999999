import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import type { Segment } from '../types';

interface Props {
  segment: Segment;
}

export default function TranscriptSegment({ segment }: Props) {
  const time = new Date(segment.start_ms).toISOString().slice(11, 19);
  const lowConfidence = segment.confidence < 0.8;

  return (
    <View style={styles.row}>
      <Text style={styles.time}>{time}</Text>
      <View style={styles.content}>
        {segment.speaker ? (
          <View style={styles.speakerBadge}>
            <Text style={styles.speakerText}>{segment.speaker}</Text>
          </View>
        ) : null}
        <Text style={[styles.text, lowConfidence && styles.textDim]}>
          {segment.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border + '40',
  },
  time: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 10,
    width: 64,
    paddingTop: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  speakerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.mintDim,
    borderWidth: 1,
    borderColor: THEME.colors.mint + '40',
  },
  speakerText: {
    color: THEME.colors.mint,
    fontFamily: THEME.font.mono,
    fontSize: 9,
    letterSpacing: 1,
  },
  text: {
    color: THEME.colors.ghost,
    fontSize: 14,
    lineHeight: 22,
  },
  textDim: {
    color: THEME.colors.ghostDim,
    fontStyle: 'italic',
  },
});
