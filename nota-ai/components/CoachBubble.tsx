import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import type { ChatMessage } from '@/types';

interface CoachBubbleProps {
  message: ChatMessage;
}

export default function CoachBubble({ message }: CoachBubbleProps) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {!isUser && <View style={styles.avatarDot} />}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.text, isUser && styles.textUser]}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  rowUser: {
    flexDirection: 'row-reverse',
  },
  avatarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.phantom,
    marginBottom: 6,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: THEME.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAI: {
    backgroundColor: THEME.colors.panel,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderBottomLeftRadius: 3,
  },
  bubbleUser: {
    backgroundColor: THEME.colors.mintDim,
    borderWidth: 1,
    borderColor: `${THEME.colors.mint}40`,
    borderBottomRightRadius: 3,
  },
  text: {
    color: THEME.colors.ghost,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Inter_400Regular',
  },
  textUser: {
    color: THEME.colors.mint,
  },
});
