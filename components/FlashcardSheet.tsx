import React, { useState, useRef, useCallback } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { THEME } from '../constants/theme';
import type { Flashcard } from '../types';

interface Props {
  visible: boolean;
  loading: boolean;
  cards: Flashcard[];
  onClose: () => void;
  onSave?: () => void;
  reviewOnly?: boolean;
}

function FlipCard({ card }: { card: Flashcard }) {
  const [flipped, setFlipped] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const flip = useCallback(() => {
    Animated.spring(anim, {
      toValue: flipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setFlipped(f => !f);
  }, [anim, flipped]);

  const frontRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = anim.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity = anim.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [0, 0, 1, 1] });

  return (
    <TouchableOpacity onPress={flip} activeOpacity={0.95} style={styles.cardTouchable}>
      {/* FRONT — Question */}
      <Animated.View
        style={[
          styles.card,
          styles.cardFront,
          { transform: [{ rotateY: frontRotate }], opacity: frontOpacity },
        ]}
      >
        <Text style={styles.cardSide}>QUESTION</Text>
        <Text style={styles.cardQuestion}>{card.question}</Text>
        <Text style={styles.cardHint}>Tap to reveal answer</Text>
      </Animated.View>

      {/* BACK — Answer */}
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          { transform: [{ rotateY: backRotate }], opacity: backOpacity },
        ]}
      >
        <Text style={styles.cardSide}>ANSWER</Text>
        <Text style={styles.cardAnswer}>{card.answer}</Text>
        {card.source_text ? (
          <View style={styles.sourceRow}>
            <Text style={styles.sourceLabel}>FROM TRANSCRIPT</Text>
            <Text style={styles.sourceText}>"{card.source_text}"</Text>
          </View>
        ) : null}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function FlashcardSheet({ visible, loading, cards, onClose, onSave, reviewOnly }: Props) {
  const [index, setIndex] = useState(0);

  const currentCard = cards[index];
  const total = cards.length;

  const prev = () => setIndex(i => Math.max(0, i - 1));
  const next = () => setIndex(i => Math.min(total - 1, i + 1));

  // Reset index when new cards arrive
  React.useEffect(() => {
    if (cards.length > 0) setIndex(0);
  }, [cards]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>🃏 FLASHCARDS</Text>
            <View style={styles.headerRight}>
              {total > 0 && (
                <Text style={styles.counter}>{index + 1} / {total}</Text>
              )}
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CONTENT */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={THEME.colors.phantom} />
              <Text style={styles.loadingText}>Generating flashcards from your speech…</Text>
            </View>
          ) : total === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.emptyText}>No flashcards generated.{'\n'}Try recording more content.</Text>
            </View>
          ) : currentCard ? (
            <View style={styles.body}>
              <FlipCard key={`${currentCard.id}-${index}`} card={currentCard} />

              {/* NAVIGATION */}
              <View style={styles.nav}>
                <TouchableOpacity
                  style={[styles.navBtn, index === 0 && styles.navBtnDisabled]}
                  onPress={prev}
                  disabled={index === 0}
                >
                  <Text style={styles.navBtnText}>← Prev</Text>
                </TouchableOpacity>

                <View style={styles.dots}>
                  {cards.map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => setIndex(i)}>
                      <View style={[styles.dot, i === index && styles.dotActive]} />
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.navBtn, index === total - 1 && styles.navBtnDisabled]}
                  onPress={next}
                  disabled={index === total - 1}
                >
                  <Text style={styles.navBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>

              {/* SAVE BUTTON */}
              {!reviewOnly && onSave && (
                <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
                  <Text style={styles.saveBtnText}>Save Set</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: THEME.radius.xl,
    borderTopRightRadius: THEME.radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: THEME.colors.border,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: THEME.colors.border,
    alignSelf: 'center',
    marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  title: {
    color: THEME.colors.phantom,
    fontFamily: THEME.font.mono,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counter: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 11,
  },
  closeBtn: { color: THEME.colors.ghostDim, fontSize: 16, padding: 4 },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.xxl,
    gap: 12,
    minHeight: 200,
  },
  loadingText: {
    color: THEME.colors.ghostDim,
    fontSize: 13,
    fontFamily: THEME.font.mono,
    textAlign: 'center',
  },
  emptyText: {
    color: THEME.colors.ghostDim,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  body: {
    padding: THEME.spacing.lg,
    gap: THEME.spacing.md,
  },
  cardTouchable: { height: 240 },
  card: {
    position: 'absolute',
    width: '100%',
    height: 240,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: THEME.colors.panel,
    borderWidth: 1,
    borderColor: THEME.colors.phantom + '80',
  },
  cardBack: {
    backgroundColor: THEME.colors.panel,
    borderWidth: 1,
    borderColor: THEME.colors.amber + '80',
  },
  cardSide: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 9,
    letterSpacing: 2,
  },
  cardQuestion: {
    color: THEME.colors.ghost,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  cardAnswer: {
    color: THEME.colors.amber,
    fontSize: 15,
    lineHeight: 23,
  },
  cardHint: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 10,
    marginTop: THEME.spacing.sm,
    opacity: 0.6,
  },
  sourceRow: {
    marginTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: THEME.spacing.sm,
    gap: 2,
  },
  sourceLabel: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 8,
    letterSpacing: 1.5,
  },
  sourceText: {
    color: THEME.colors.ghostDim,
    fontSize: 11,
    fontStyle: 'italic',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.sm,
  },
  navBtn: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 12,
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: THEME.colors.border,
  },
  dotActive: { backgroundColor: THEME.colors.phantom },
  saveBtn: {
    backgroundColor: THEME.colors.phantom + '20',
    borderWidth: 1,
    borderColor: THEME.colors.phantom,
    borderRadius: THEME.radius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
  },
  saveBtnText: {
    color: THEME.colors.phantom,
    fontFamily: THEME.font.mono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
