import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { THEME } from '../constants/theme';
import { getFlashcardSets } from '../lib/storage';
import FlashcardSheet from '../components/FlashcardSheet';
import type { FlashcardSet, Flashcard } from '../types';

export default function FlashcardsScreen() {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([]);
  const [reviewTitle, setReviewTitle] = useState('');

  const load = useCallback(async () => {
    const data = await getFlashcardSets();
    setSets(data);
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

  const openSet = (set: FlashcardSet) => {
    setReviewCards(set.cards);
    setReviewTitle(set.recording_title);
    setReviewVisible(true);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>🃏 FLASHCARDS</Text>
        <Text style={styles.subtitle}>Saved from your recordings</Text>
      </View>

      <FlatList
        data={sets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.colors.phantom}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🃏</Text>
            <Text style={styles.emptyTitle}>No flashcard sets yet</Text>
            <Text style={styles.emptyText}>
              Start a recording, speak your notes,{'\n'}
              then tap <Text style={styles.emptyHighlight}>🃏 Cards</Text> to generate flashcards.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.setCard}
            onPress={() => openSet(item)}
            activeOpacity={0.7}
          >
            <View style={styles.setTop}>
              <Text style={styles.setTitle} numberOfLines={1}>{item.recording_title}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{item.cards.length}</Text>
              </View>
            </View>
            <View style={styles.setMeta}>
              <Text style={styles.setMetaText}>
                {new Date(item.created_at).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </Text>
              <Text style={styles.setMetaText}>·</Text>
              <Text style={styles.setMetaText}>{item.cards.length} cards</Text>
            </View>
            <View style={styles.previewRow}>
              {item.cards.slice(0, 2).map((card, i) => (
                <View key={i} style={styles.previewChip}>
                  <Text style={styles.previewText} numberOfLines={1}>
                    {card.question}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* REVIEW SHEET */}
      <FlashcardSheet
        visible={reviewVisible}
        loading={false}
        cards={reviewCards}
        onClose={() => setReviewVisible(false)}
        reviewOnly
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
    gap: 3,
  },
  title: {
    color: THEME.colors.phantom,
    fontFamily: THEME.font.mono,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  subtitle: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  list: {
    padding: THEME.spacing.lg,
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
  emptyIcon: { fontSize: 52, opacity: 0.3 },
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
  emptyHighlight: { color: THEME.colors.phantom },
  setCard: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  setTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  setTitle: {
    flex: 1,
    color: THEME.colors.ghost,
    fontSize: 15,
    fontWeight: '600',
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.phantom + '30',
    borderWidth: 1,
    borderColor: THEME.colors.phantom + '60',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    color: THEME.colors.phantom,
    fontFamily: THEME.font.mono,
    fontSize: 11,
    fontWeight: '700',
  },
  setMeta: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  setMetaText: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 11,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  previewChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.round,
    backgroundColor: THEME.colors.panel,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    maxWidth: '48%',
  },
  previewText: {
    color: THEME.colors.ghostDim,
    fontSize: 11,
  },
});
