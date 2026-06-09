import React, { useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { THEME } from '@/constants/theme';
import { useCoach } from '@/hooks/useCoach';
import CoachBubble from '@/components/CoachBubble';
import { useState } from 'react';

const QUICK_PROMPTS = [
  'How can I structure my thoughts better?',
  'What speaking habits should I improve?',
  'Help me be more concise',
  'Filler word tips',
];

export default function CoachScreen() {
  const { messages, isTyping, sendMessage, clearHistory } = useCoach();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    sendMessage(input.trim(), '');
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>AI Coach</Text>
            <Text style={styles.subtitle}>General conversation · no transcript required</Text>
          </View>
          <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
            <Text style={styles.clearLabel}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => <CoachBubble key={msg.id} message={msg} />)}
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
          style={styles.quickPromptsScroll}
          contentContainerStyle={{ gap: 8, paddingHorizontal: THEME.spacing.md }}
        >
          {QUICK_PROMPTS.map(qp => (
            <TouchableOpacity
              key={qp}
              style={styles.qpBtn}
              onPress={() => { sendMessage(qp, ''); }}
            >
              <Text style={styles.qpLabel}>{qp}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything…"
            placeholderTextColor={THEME.colors.ghostDim}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.btnSend, (!input.trim() || isTyping) && styles.btnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Text style={styles.btnSendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.colors.void },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  title: { color: THEME.colors.ghost, fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  subtitle: { color: THEME.colors.ghostDim, fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, marginTop: 2 },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  clearLabel: { color: THEME.colors.ghostDim, fontFamily: 'Inter_400Regular', fontSize: 12 },
  messages: { flex: 1 },
  messagesContent: { padding: THEME.spacing.md, gap: 6, paddingBottom: 16 },
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
  quickPromptsScroll: { maxHeight: 44, paddingVertical: 6 },
  qpBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.round,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  qpLabel: { color: THEME.colors.ghostDim, fontFamily: 'Inter_400Regular', fontSize: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    paddingBottom: 20,
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
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    minHeight: 40,
    maxHeight: 120,
  },
  btnSend: {
    width: 40,
    height: 40,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSendIcon: { color: THEME.colors.void, fontSize: 18, fontWeight: '700' },
  btnDisabled: { opacity: 0.3 },
});
