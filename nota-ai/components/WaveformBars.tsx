import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

interface WaveformBarsProps {
  levels: number[];
  isActive: boolean;
}

function Bar({ level, isActive }: { level: number; isActive: boolean }) {
  const height = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    Animated.spring(height, {
      toValue: isActive ? Math.max(4, level * 48) : 4,
      damping: 12,
      stiffness: 180,
      useNativeDriver: false,
    }).start();
  }, [level, isActive]);

  return (
    <Animated.View style={[styles.bar, { height }, isActive && styles.barActive]} />
  );
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
