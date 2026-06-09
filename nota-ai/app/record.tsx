import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useRecording } from '@/hooks/useRecording';
import { useTranscription } from '@/hooks/useTranscription';
import { usePhantom } from '@/hooks/usePhantom';
import { useCoach } from '@/hooks/useCoach';
import { generateSummary, generateTitle } from '@/lib/claude';
import { saveRecording } from '@/lib/storage';
import { DeepgramClient } from '@/lib/deepgram';
import WaveformBars from '@/components/WaveformBars';
import TranscriptSegment from '@/components/TranscriptSegment';
import CoachBubble from '@/components/CoachBubble';
import SummarySheet from '@/components/SummarySheet';
import PhantomLayer from '@/components/PhantomLayer';
import type { Summary, Segment } from '@/types';

const QUICK_PROMPTS = ['Main topic?', 'Action items?', 'Quick summary', 'Key decisions?', 'Speaker insights'];

export default function RecordScreen() {
  const [activeTab, setActiveTab] = useState<'transcript' | 'coach'>('transcript');
  const [chatInput, setChatInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const { isRecording, metering, startRecording, stopRecording } = useRecording();
  const { segments, interimText, startTranscription, stopTranscription, clearSegments } = useTranscription();
  const { phantomEvents, processSegment, dismissEvent, resetPhantom } = usePhantom();
  const { messages, isTyping, sendMessage } = useCoach();

  const deepgramClientRef = useRef<DeepgramClient | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef<ScrollView>(null);
  const chatRef = useRef<ScrollView>(null);
  const segmentsRef = useRef<Segment[]>([]);
  const elapsedRef = useRef(0);

  useEffect(() => { segmentsRef.current = segments; }, [segments]);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const handleStart = useCallback(async () => {
    clearSegments();
    resetPhantom();
    setElapsed(0);
    setSummary(null);

    const client = await startTranscription((seg) => {
      processSegment(seg);
    });
    deepgramClientRef.current = client;

    await startRecording((chunk) => {
      deepgramClientRef.current?.sendAudioChunk(chunk);
    });
  }, [startRecording, startTranscription, clearSegments, resetPhantom, processSegment]);

  const handleStop = useCallback(async () => {
    const uri = await stopRecording();
    if (deepgramClientRef.current) {
      stopTranscription(deepgramClientRef.current);
      deepgramClientRef.current = null;
    }

    const segs = segmentsRef.current;
    const ms = elapsedRef.current * 1000;

    let title = 'Untitled Recording';
    try { title = await generateTitle(segs); } catch { /* use default */ }

    await saveRecording({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      createdAt: new Date().toISOString(),
      durationMs: ms,
      segments: segs,
      summary: null,
      language: 'en-US',
    });
  }, [stopRecording, stopTranscription]);

  const handleSummary = useCallback(async () => {
    if (!segmentsRef.current.length) return;
    setSummaryLoading(true);
    setSummaryVisible(true);
    try {
      const result = await generateSummary(segmentsRef.current);
      setSummary(result);
    } catch { /* handle */ }
    setSummaryLoading(false);
  }, []);

  const handleSend = useCallback(() => {
    if (!chatInput.trim()) return;
    const ctx = segmentsRef.current.map(s => s.text).join(' ');
    sendMessage(chatInput.trim(), ctx);
    setChatInput('');
    setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [chatInput, sendMessage]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.statusText, isRecording && styles.statusLive]}>
            {isRecording ? '● LIVE' : 'STANDBY'}
          </Text>
        </View>

        {/* WAVEFORM */}
        <View style={styles.waveZone}>
          <WaveformBars levels={metering} isActive={isRecording} />

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.btnRecord, isRecording && styles.btnRecordActive]}
              onPress={isRecording ? handleStop : handleStart}
            >
              <View style={[styles.recDot, isRecording && styles.recDotActive]} />
              <Text style={[styles.btnRecordLabel, isRecording && styles.btnRecordLabelActive]}>
                {isRecording ? 'STOP' : 'RECORD'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.timer, isRecording && styles.timerActive]}>
              {formatTime(elapsed)}
            </Text>

            <TouchableOpacity
              style={[styles.btnSummary, !segments.length && styles.btnDisabled]}
              onPress={handleSummary}
              disabled={!segments.length}
            >
              <Text style={styles.btnSummaryLabel}>⚡ Summary</Text>
            </TouchableOpacity>
          </View>

          {/* TABS */}
          <View style={styles.tabs}>
            {(['transcript', 'coach'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                  {tab === 'transcript' ? '📝 Transcript' : '🧠 Coach'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* TRANSCRIPT TAB */}
        {activeTab === 'transcript' && (
          <ScrollView
            ref={transcriptRef}
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            onContentSizeChange={() => transcriptRef.current?.scrollToEnd({ animated: true })}
          >
            {segments.length === 0 && !interimText ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🎙</Text>
                <Text style={styles.emptyText}>
                  Hit Record and start speaking.{'\n'}Your words appear here in real time.
                </Text>
              </View>
            ) : (
              <>
                {segments.map(seg => (
                  <TranscriptSegment key={seg.id} segment={seg} />
                ))}
                {interimText ? (
                  <TranscriptSegment
                    segment={{ id: 'interim', speaker: 0, start: 0, end: 0, text: interimText, isFinal: false }}
                    isInterim
                  />
                ) : null}
              </>
            )}
          </ScrollView>
        )}

        {/* COACH TAB */}
        {activeTab === 'coach' && (
          <>
            <ScrollView
              ref={chatRef}
              style={styles.scrollArea}
              contentContainerStyle={[styles.scrollContent, { gap: 8 }]}
              onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}
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

            {/* QUICK PROMPTS */}
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
                  onPress={() => { sendMessage(qp, segments.map(s => s.text).join(' ')); }}
                >
                  <Text style={styles.qpLabel}>{qp}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask about the transcript…"
                placeholderTextColor={THEME.colors.ghostDim}
                multiline
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                style={[styles.btnSend, (!chatInput.trim() || isTyping) && styles.btnDisabled]}
                onPress={handleSend}
                disabled={!chatInput.trim() || isTyping}
              >
                <Text style={styles.btnSendIcon}>↑</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <SummarySheet
          visible={summaryVisible}
          loading={summaryLoading}
          summary={summary}
          onClose={() => setSummaryVisible(false)}
        />
        <PhantomLayer events={phantomEvents} onDismiss={dismissEvent} />
      </SafeAreaView>
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
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backText: { color: THEME.colors.mint, fontFamily: 'JetBrainsMono_400Regular', fontSize: 13 },
  statusText: { color: THEME.colors.ghostDim, fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, letterSpacing: 2 },
  statusLive: { color: THEME.colors.red },
  waveZone: {
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  btnRecord: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.mint,
  },
  btnRecordActive: {
    borderColor: THEME.colors.red,
    backgroundColor: `${THEME.colors.red}20`,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.colors.mint },
  recDotActive: { backgroundColor: THEME.colors.red },
  btnRecordLabel: { color: THEME.colors.mint, fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, letterSpacing: 1 },
  btnRecordLabelActive: { color: THEME.colors.red },
  timer: { color: THEME.colors.ghostDim, fontFamily: 'JetBrainsMono_400Regular', fontSize: 13, letterSpacing: 2 },
  timerActive: { color: THEME.colors.amber },
  btnSummary: {
    marginLeft: 'auto',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.amber,
    backgroundColor: THEME.colors.amberDim,
  },
  btnSummaryLabel: { color: THEME.colors.amber, fontFamily: 'JetBrainsMono_500Medium', fontSize: 11 },
  btnDisabled: { opacity: 0.3 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.sm,
    gap: 4,
  },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: THEME.radius.sm },
  tabActive: { backgroundColor: THEME.colors.mintDim },
  tabLabel: { color: THEME.colors.ghostDim, fontFamily: 'Inter_400Regular', fontSize: 13 },
  tabLabelActive: { color: THEME.colors.mint, fontFamily: 'Inter_600SemiBold' },
  scrollArea: { flex: 1 },
  scrollContent: { padding: THEME.spacing.lg },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 40, opacity: 0.3 },
  emptyText: { color: THEME.colors.ghostDim, fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  typingRow: { alignItems: 'flex-start', paddingLeft: 16 },
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
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    gap: 8,
  },
  chatInput: {
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
});
