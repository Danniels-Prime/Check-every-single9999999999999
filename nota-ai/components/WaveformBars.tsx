import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { THEME } from '@/constants/theme';

interface WaveformBarsProps {
  levels: number[];
  isActive: boolean;
}

function Bar({ level, isActive }: { level: number; isActive: boolean }) {
  const height = useSharedValue(4);
  height.value = withSpring(isActive ? Math.max(4, level * 48) : 4, {
    damping: 12,
    stiffness: 180,
  });
  const style = useAnimatedStyle(() => ({ height: height.value }));
  return <Animated.View style={[styles.bar, style, isActive && styles.barActive]} />;
}

export default function WaveformBars({ levels, isActive }: WaveformBarsProps) {
  return (
    <View style={styles.container}>
      {levels.map((level, i) => (
        <Bar key={i} level={level} isActive={isActive} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    paddingHorizontal: THEME.spacing.lg,
    gap: 3,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: THEME.colors.border,
  },
  barActive: {
    backgroundColor: THEME.colors.mint,
  },
});
