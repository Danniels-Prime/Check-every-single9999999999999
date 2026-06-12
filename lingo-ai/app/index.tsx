import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { getSessions, deleteSession } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import type { SavedSession } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      getSessions().then(setSessions);
    }, []),
  );

  function handleDelete(id: string) {
    Alert.alert('Delete session?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSession(id);
          setSessions(prev => prev.filter(s => s.id !== id));
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={s => s.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Pressable onPress={() => router.push('/record')} style={styles.newBtn}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.newBtnGradient}
            >
              <Text style={styles.newBtnIcon}>🎙</Text>
              <Text style={styles.newBtnText}>Start Listening</Text>
            </LinearGradient>
          </Pressable>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a session and tap any word to learn its meaning
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
            onLongPress={() => handleDelete(item.id)}
          >
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.cardMeta}>
              <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
              <Text style={styles.cardLang}>{item.sourceLanguage.toUpperCase()}</Text>
            </View>
            {item.transcript ? (
              <Text style={styles.cardPreview} numberOfLines={2}>{item.transcript}</Text>
            ) : null}
          </Pressable>
        )}
      />

      <Pressable onPress={() => router.push('/settings')} style={styles.settingsBtn}>
        <Text style={styles.settingsIcon}>⚙️</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: spacing.md, gap: spacing.md, paddingBottom: 80 },

  newBtn: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.sm },
  newBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  newBtnIcon: { fontSize: 24 },
  newBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },

  emptyState: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...typography.h3, textAlign: 'center' },
  emptySubtitle: { ...typography.bodyMuted, textAlign: 'center', maxWidth: 280 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTitle: { ...typography.h3 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardDate: { ...typography.small },
  cardLang: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  cardPreview: { ...typography.small, lineHeight: 18 },

  settingsBtn: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: { fontSize: 22 },
});
