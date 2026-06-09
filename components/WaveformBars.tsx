import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { THEME } from '../constants/theme';

const BAR_COUNT = 20;
const BAR_MIN_HEIGHT = 4;
const BAR_MAX_HEIGHT = 36;

interface Props {
  isActive: boolean;
}

function Bar({ index, isActive }: { index: number; isActive: boolean }) {
  const height = useSharedValue(BAR_MIN_HEIGHT);

  useEffect(() => {
    if (isActive) {
      const delay = index * 60;
      height.value = withRepeat(
        withSequence(
          withTiming(BAR_MIN_HEIGHT, { duration: delay }),
          withTiming(
            BAR_MIN_HEIGHT + Math.random() * (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT),
            { duration: 300 + Math.random() * 200 }
          ),
          withTiming(BAR_MIN_HEIGHT, { duration: 300 + Math.random() * 200 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(height);
      height.value = withTiming(BAR_MIN_HEIGHT, { duration: 300 });
    }
  }, [isActive, height, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        animatedStyle,
        isActive && styles.barActive,
      ]}
    />
  );
}

export default function WaveformBars({ isActive }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <Bar key={i} index={i} isActive={isActive} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
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
