import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

interface Props {
  metering: number[];
  color?: string;
}

export function WaveformBars({ metering, color = colors.primary }: Props) {
  return (
    <View style={styles.container}>
      {metering.map((level, i) => {
        const height = Math.max(3, level * 48);
        const opacity = 0.3 + level * 0.7;
        return (
          <View
            key={i}
            style={[styles.bar, { height, backgroundColor: color, opacity }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 56,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});
