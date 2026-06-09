import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import type { ChatMessage } from '../types';

interface Props {
  message: ChatMessage;
}

export default function CoachBubble({ message }: Props) {
  const isAI = message.role === 'ai';

  return (
    <View style={[styles.row, isAI ? styles.rowLeft : styles.rowRight]}>
      <View style={[styles.bubble, isAI ? styles.bubbleAI : styles.bubbleUser]}>
        <Text style={[styles.text, isAI ? styles.textAI : styles.textUser]}>
          {message.text}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    gap: 4,
  },
  bubbleAI: {
    backgroundColor: THEME.colors.panel,
    borderWidth: 1,
    borderColor: THEME.colors.amber + '60',
    borderBottomLeftRadius: 3,
  },
  bubbleUser: {
    backgroundColor: THEME.colors.mintDim,
    borderWidth: 1,
    borderColor: THEME.colors.mint + '60',
    borderBottomRightRadius: 3,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  textAI: {
    color: THEME.colors.ghost,
  },
  textUser: {
    color: THEME.colors.ghost,
  },
  timestamp: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 9,
    alignSelf: 'flex-end',
  },
});
