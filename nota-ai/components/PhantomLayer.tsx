import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { THEME } from '@/constants/theme';
import type { PhantomEvent } from '@/types';

interface PhantomCardProps {
  event: PhantomEvent;
  onDismiss: () => void;
}

function PhantomCard({ event, onDismiss }: PhantomCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, damping: 16, stiffness: 160, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(
        ({ finished }) => { if (finished) onDismiss(); }
      );
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateX }] }]}>
      <View style={styles.cardHeader}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>PHANTOM</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.insight}>{event.insight}</Text>
    </Animated.View>
  );
}

interface PhantomLayerProps {
  events: PhantomEvent[];
  onDismiss: (id: string) => void;
}

export default function PhantomLayer({ events, onDismiss }: PhantomLayerProps) {
  const visible = events.slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <View style={styles.layer} pointerEvents="box-none">
      {visible.map(event => (
        <PhantomCard key={event.id} event={event} onDismiss={() => onDismiss(event.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 100,
    right: 16,
    gap: 8,
    maxWidth: 280,
  },
  card: {
    backgroundColor: THEME.colors.panel,
    borderWidth: 1,
    borderColor: `${THEME.colors.phantom}60`,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    shadowColor: THEME.colors.phantom,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: `${THEME.colors.phantom}30`,
    borderRadius: THEME.radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeText: {
    color: THEME.colors.phantom,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    letterSpacing: 1.5,
  },
  dismissBtn: { padding: 2 },
  dismissText: { color: THEME.colors.ghostDim, fontSize: 12 },
  insight: {
    color: THEME.colors.ghost,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
