import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

interface Props {
  word: string;
  isFinal: boolean;
  isHighlighted?: boolean;
  onPress: (word: string) => void;
}

export function WordToken({ word, isFinal, isHighlighted, onPress }: Props) {
  return (
    <Pressable
      onPress={() => onPress(word)}
      style={({ pressed }) => [
        styles.token,
        isHighlighted && styles.highlighted,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.text,
          !isFinal && styles.interim,
          isHighlighted && styles.highlightedText,
        ]}
      >
        {word}{' '}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  token: {
    borderRadius: 4,
    paddingHorizontal: 1,
    paddingVertical: 2,
  },
  highlighted: {
    backgroundColor: colors.primaryDim,
  },
  pressed: {
    backgroundColor: colors.primaryDim,
  },
  text: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.text,
    fontFamily: 'System',
  },
  interim: {
    color: colors.textDim,
  },
  highlightedText: {
    color: colors.primary,
  },
});
