import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { THEME } from '../constants/theme';
import { coachChat } from '../lib/claude';
import { getRecordings } from '../lib/storage';
import CoachBubble from '../components/CoachBubble';
import type { ChatMessage, Segment, StoredRecording } from '../types';

const INITIAL_MESSAGE: ChatMessage = {
  id: '0',
  role: 'ai',
  text: "I'm Nota Coach. Ask me anything about your recordings, or just start a conversation.",
  timestamp: new Date().toISOString(),
};

export default function CoachScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contextSegments, setContextSegments] = useState<Segment[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const loadContext = useCallback(async () => {
    const recordings = await getRecordings();
    if (recordings.length > 0) {
      const latest: StoredRecording = recordings[0];
      setContextSegments(latest.segments);
    }
  }, []);

  const send = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await coachChat(text.trim(), messages, contextSegments);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        text: reply,
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        text: 'Unavailable right now. Check your API key in Settings.',
        timestamp: new Date().toISOString(),
      }]);
    }

    setIsTyping(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>🧠 COACH</Text>
        <TouchableOpacity style={styles.contextBtn} onPress={loadContext}>
          <Text style={styles.contextBtnText}>
            {contextSegments.length > 0 ? `${contextSegments.length} segs loaded` : 'Load context'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {messages.map(msg => (
          <CoachBubble key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <View style={styles.typingRow}>
            <View style={styles.typingBubble}>
              <Text style={styles.typingDots}>• • •</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickPrompts}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        {['Summarize latest', 'Action items?', 'Key themes', 'What did I miss?', 'Decisions made?'].map(qp => (
          <TouchableOpacity key={qp} style={styles.qpBtn} onPress={() => send(qp)}>
            <Text style={styles.qpText}>{qp}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything…"
          placeholderTextColor={THEME.colors.ghostDim}
          multiline
          onSubmitEditing={() => send(input)}
        />
        <TouchableOpacity
          style={[styles.btnSend, (!input.trim() || isTyping) && styles.btnDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || isTyping}
        >
          <Text style={styles.btnSendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.colors.void },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: 56,
    paddingBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  title: {
    color: THEME.colors.ghost,
    fontFamily: THEME.font.mono,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  contextBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.amber + '60',
  },
  contextBtnText: {
    color: THEME.colors.amber,
    fontFamily: THEME.font.mono,
    fontSize: 11,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: THEME.spacing.md, gap: 12 },
  typingRow: { alignItems: 'flex-start' },
  typingBubble: {
    backgroundColor: THEME.colors.panel,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    borderBottomLeftRadius: 3,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingDots: { color: THEME.colors.ghostDim, fontSize: 16, letterSpacing: 4 },
  quickPrompts: { maxHeight: 44, paddingVertical: 6 },
  qpBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  qpText: { color: THEME.colors.ghostDim, fontSize: 12 },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: THEME.spacing.md,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: THEME.colors.panel,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: THEME.colors.ghost,
    fontSize: 13,
    minHeight: 40,
    maxHeight: 120,
  },
  btnSend: {
    width: 40, height: 40,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSendIcon: { color: THEME.colors.void, fontSize: 18, fontWeight: '700' },
  btnDisabled: { opacity: 0.3 },
});
