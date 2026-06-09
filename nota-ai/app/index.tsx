import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { THEME } from '@/constants/theme';
import { getAllRecordings, deleteRecording } from '@/lib/storage';
import RecordingCard from '@/components/RecordingCard';
import type { Recording } from '@/types';

export default function HomeScreen() {
  const [recordings, setRecordings] = useState<Recording[]>([]);

  const load = useCallback(async () => {
    const all = await getAllRecordings();
    setRecordings(all);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (id: string) => {
    Alert.alert('Delete Recording', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRecording(id);
          load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.brand}>NOTA AI</Text>
        <Text style={styles.tagline}>Every language. Always free.</Text>
      </View>

      <FlatList
        data={recordings}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RecordingCard
            recording={item}
            onPress={() => router.push(`/transcript/${item.id}`)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎙</Text>
            <Text style={styles.emptyTitle}>No recordings yet</Text>
            <Text style={styles.emptyBody}>
              Tap Record to start your first transcription.{'\n'}
              Supports 55+ languages via Deepgram Nova-2.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/record')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.colors.void },
  header: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  brand: {
    color: THEME.colors.mint,
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 20,
    letterSpacing: 3,
  },
  tagline: {
    color: THEME.colors.ghostDim,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 2,
  },
  list: { padding: THEME.spacing.md, paddingBottom: 100 },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: { fontSize: 48, opacity: 0.3 },
  emptyTitle: {
    color: THEME.colors.ghost,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
  },
  emptyBody: {
    color: THEME.colors.ghostDim,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.colors.mint,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  fabIcon: {
    color: THEME.colors.void,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
});
