import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { THEME } from '../constants/theme';
import type { PhantomEvent } from '../types';

interface Props {
  events: PhantomEvent[];
  onDismiss: (index: number) => void;
}

function PhantomCard({
  event,
  index,
  onDismiss,
}: {
  event: PhantomEvent;
  index: number;
  onDismiss: (i: number) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    const timer = setTimeout(() => onDismiss(index), 8000);
    return () => clearTimeout(timer);
  }, [index, onDismiss, opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.typePill}>
        <Text style={styles.typeText}>{event.type.toUpperCase()}</Text>
      </View>
      <Text style={styles.text}>{event.text}</Text>
      <TouchableOpacity onPress={() => onDismiss(index)} style={styles.dismissBtn}>
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PhantomLayer({ events, onDismiss }: Props) {
  const visible = events.filter(e => !e.dismissed);
  const latest = visible[visible.length - 1];
  const latestIndex = latest ? events.lastIndexOf(latest) : -1;

  if (!latest) return null;

  return (
    <View style={styles.layer} pointerEvents="box-none">
      <PhantomCard key={latestIndex} event={latest} index={latestIndex} onDismiss={onDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    bottom: 120,
    left: THEME.spacing.lg,
    right: THEME.spacing.lg,
  },
  card: {
    backgroundColor: THEME.colors.panel,
    borderWidth: 1,
    borderColor: THEME.colors.phantom,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    gap: 8,
    shadowColor: THEME.colors.phantom,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  typePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.round,
    backgroundColor: THEME.colors.phantom + '30',
    borderWidth: 1,
    borderColor: THEME.colors.phantom + '60',
  },
  typeText: {
    color: THEME.colors.phantom,
    fontFamily: THEME.font.mono,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  text: {
    color: THEME.colors.ghost,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  dismissBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
  },
  dismissText: {
    color: THEME.colors.ghostDim,
    fontSize: 12,
  },
});
