import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { THEME } from '../constants/theme';
import { getRecordings, deleteRecording } from '../lib/storage';
import RecordingCard from '../components/RecordingCard';
import type { StoredRecording } from '../types';

export default function HomeScreen() {
  const [recordings, setRecordings] = useState<StoredRecording[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getRecordings();
    setRecordings(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    await deleteRecording(id);
    await load();
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.logo}>NOTA AI</Text>
        <Text style={styles.subtitle}>ÆTHERMIND</Text>
      </View>

      <FlatList
        data={recordings}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.colors.mint}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎙</Text>
            <Text style={styles.emptyTitle}>No recordings yet</Text>
            <Text style={styles.emptyText}>
              Tap Record to start your first transcription session.
            </Text>
            <TouchableOpacity
              style={styles.btnStart}
              onPress={() => router.push('/record')}
            >
              <Text style={styles.btnStartText}>Start Recording</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <RecordingCard
            recording={item}
            onPress={() => router.push(`/transcript/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.colors.void },
  header: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: 56,
    paddingBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  logo: {
    color: THEME.colors.mint,
    fontFamily: THEME.font.mono,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 3,
  },
  subtitle: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 9,
    letterSpacing: 4,
    marginTop: 2,
  },
  list: {
    padding: THEME.spacing.lg,
    gap: THEME.spacing.sm,
    flexGrow: 1,
  },
  separator: { height: THEME.spacing.sm },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 12,
  },
  emptyIcon: { fontSize: 48, opacity: 0.3 },
  emptyTitle: {
    color: THEME.colors.ghost,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    color: THEME.colors.ghostDim,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  btnStart: {
    marginTop: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.mintDim,
    borderWidth: 1,
    borderColor: THEME.colors.mint,
  },
  btnStartText: {
    color: THEME.colors.mint,
    fontFamily: THEME.font.mono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
