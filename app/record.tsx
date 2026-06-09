import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Animated, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Audio } from 'expo-av';
import { router } from 'expo-router';
import { THEME } from '../constants/theme';
import { DeepgramClient } from '../lib/deepgram';
import { coachChat, generateSummary, generateTitle } from '../lib/claude';
import { PhantomEngine } from '../lib/phantom';
import { saveRecording } from '../lib/storage';
import WaveformBars from '../components/WaveformBars';
import TranscriptSegment from '../components/TranscriptSegment';
import CoachBubble from '../components/CoachBubble';
import SummarySheet from '../components/SummarySheet';
import PhantomLayer from '../components/PhantomLayer';
import type { Segment, ChatMessage, PhantomEvent, Summary } from '../types';

export default function RecordScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [interimText, setInterimText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'ai',
      text: "Ready to listen. Start recording — I'll follow along and you can ask me anything.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isCoachTyping, setIsCoachTyping] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [phantomEvents, setPhantomEvents] = useState<PhantomEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'transcript' | 'coach'>('transcript');

  const recordingRef = useRef<Audio.Recording | null>(null);
  const deepgramRef = useRef<DeepgramClient | null>(null);
  const phantomRef = useRef<PhantomEngine | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const segmentsRef = useRef<Segment[]>([]);
  const transcriptScrollRef = useRef<ScrollView>(null);
  const chatScrollRef = useRef<ScrollView>(null);

  useEffect(() => { segmentsRef.current = segments; }, [segments]);

  useEffect(() => {
    phantomRef.current = new PhantomEngine((event) => {
      setPhantomEvents(prev => [...prev, event]);
    });
    return () => phantomRef.current?.reset();
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync({
      android: {
        extension: '.wav',
        outputFormat: Audio.AndroidOutputFormat.DEFAULT,
        audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.wav',
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {},
    });

    deepgramRef.current = new DeepgramClient(
      (seg) => {
        const segment: Segment = {
          id: Math.random().toString(36).slice(2),
          recording_id: '',
          text: seg.text || '',
          speaker: seg.speaker,
          start_ms: seg.start_ms || 0,
          end_ms: seg.end_ms || 0,
          confidence: seg.confidence || 1,
          is_final: seg.is_final || false,
        };

        if (segment.is_final && segment.text) {
          setSegments(prev => [...prev, segment]);
          setInterimText('');
          phantomRef.current?.processSegment(segment, segmentsRef.current);
          setTimeout(() => transcriptScrollRef.current?.scrollToEnd({ animated: true }), 100);
        } else {
          setInterimText(seg.text || '');
        }
      },
      (err) => console.error('Deepgram error:', err)
    );

    deepgramRef.current.connect({
      language: 'en-US',
      model: 'nova-2',
      diarize: true,
      punctuate: true,
      smart_format: true,
      interim_results: true,
    });

    // Audio chunk streaming — platform-specific implementation required for production
    recording.setOnRecordingStatusUpdate(async (status) => {
      if (status.isRecording) {
        // TODO: read chunk from URI and stream to Deepgram via deepgramRef.current?.send(chunk)
      }
    });

    await recording.startAsync();
    recordingRef.current = recording;
    setIsRecording(true);
    setElapsed(0);
    phantomRef.current?.reset();
  }, []);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);
    setInterimText('');

    try {
      await recordingRef.current?.stopAndUnloadAsync();
      deepgramRef.current?.disconnect();

      const title = await generateTitle(segmentsRef.current);
      await saveRecording({
        id: Math.random().toString(36).slice(2),
        title,
        segments: segmentsRef.current,
        duration_seconds: elapsed,
        created_at: new Date().toISOString(),
        language: 'en-US',
        status: 'done',
      });
    } catch (e) {
      console.error('Stop recording error:', e);
    }
  }, [elapsed]);

  const handleSummary = async () => {
    if (!segments.length) return;
    setSummaryLoading(true);
    setSummaryVisible(true);
    try {
      const result = await generateSummary(segments, 'meeting');
      setSummary(result);
    } catch { /* handle */ }
    setSummaryLoading(false);
  };

  const sendCoachMessage = async (text: string) => {
    if (!text.trim() || isCoachTyping) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsCoachTyping(true);

    try {
      const reply = await coachChat(text.trim(), messages, segmentsRef.current);
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
        text: 'Coaching unavailable. Check your connection.',
        timestamp: new Date().toISOString(),
      }]);
    }
    setIsCoachTyping(false);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerBack}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerStatus, isRecording && styles.headerStatusLive]}>
          {isRecording ? '● LIVE' : 'STANDBY'}
        </Text>
      </View>

      {/* WAVEFORM + CONTROLS */}
      <View style={styles.waveZone}>
        <WaveformBars isActive={isRecording} />
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.btnRecord, isRecording && styles.btnRecordActive]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <View style={[styles.recDot, isRecording && styles.recDotActive]} />
            <Text style={[styles.btnRecordText, isRecording && styles.btnRecordTextActive]}>
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
            <Text style={styles.btnSummaryText}>⚡ Summary</Text>
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
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'transcript' ? '📝 Transcript' : '🧠 Coach'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* TRANSCRIPT TAB */}
      {activeTab === 'transcript' && (
        <ScrollView
          ref={transcriptScrollRef}
          style={styles.transcriptArea}
          contentContainerStyle={styles.transcriptContent}
        >
          {segments.length === 0 && !interimText ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎙</Text>
              <Text style={styles.emptyText}>
                Hit Record and start speaking.{'\n'}Your words appear here instantly.
              </Text>
            </View>
          ) : (
            <>
              {segments.map(seg => (
                <TranscriptSegment key={seg.id} segment={seg} />
              ))}
              {interimText ? (
                <View style={styles.interimRow}>
                  <Text style={styles.interimTime}>···</Text>
                  <Text style={styles.interimTextStyle}>{interimText}</Text>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      )}

      {/* COACH TAB */}
      {activeTab === 'coach' && (
        <>
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
          >
            {messages.map(msg => (
              <CoachBubble key={msg.id} message={msg} />
            ))}
            {isCoachTyping && (
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
            style={styles.quickPrompts}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          >
            {['Main topic?', 'Action items?', 'One-line summary', 'Key decisions?', 'Speaker insights'].map(qp => (
              <TouchableOpacity
                key={qp}
                style={styles.qpBtn}
                onPress={() => sendCoachMessage(qp)}
              >
                <Text style={styles.qpText}>{qp}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.chatInputArea}>
            <TextInput
              style={styles.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Ask about the transcript…"
              placeholderTextColor={THEME.colors.ghostDim}
              multiline
              onSubmitEditing={() => sendCoachMessage(chatInput)}
            />
            <TouchableOpacity
              style={[styles.btnSend, (!chatInput.trim() || isCoachTyping) && styles.btnDisabled]}
              onPress={() => sendCoachMessage(chatInput)}
              disabled={!chatInput.trim() || isCoachTyping}
            >
              <Text style={styles.btnSendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* SUMMARY BOTTOM SHEET */}
      <SummarySheet
        visible={summaryVisible}
        loading={summaryLoading}
        summary={summary}
        onClose={() => setSummaryVisible(false)}
      />

      {/* PHANTOM LAYER */}
      <PhantomLayer
        events={phantomEvents}
        onDismiss={(idx) => {
          setPhantomEvents(prev =>
            prev.map((e, i) => i === idx ? { ...e, dismissed: true } : e)
          );
        }}
      />
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
  headerBack: { color: THEME.colors.mint, fontSize: 14, fontFamily: THEME.font.mono },
  headerStatus: { color: THEME.colors.ghostDim, fontSize: 11, fontFamily: THEME.font.mono, letterSpacing: 2 },
  headerStatusLive: { color: THEME.colors.mint },
  waveZone: { backgroundColor: THEME.colors.surface, borderBottomWidth: 1, borderBottomColor: THEME.colors.border },
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
  btnRecordActive: { borderColor: THEME.colors.red, backgroundColor: `${THEME.colors.red}20` },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.colors.mint },
  recDotActive: { backgroundColor: THEME.colors.red },
  btnRecordText: { color: THEME.colors.mint, fontFamily: THEME.font.mono, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  btnRecordTextActive: { color: THEME.colors.red },
  timer: { color: THEME.colors.ghostDim, fontFamily: THEME.font.mono, fontSize: 13, letterSpacing: 2 },
  timerActive: { color: THEME.colors.amber },
  btnSummary: {
    marginLeft: 'auto',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.amber,
    backgroundColor: `${THEME.colors.amber}20`,
  },
  btnSummaryText: { color: THEME.colors.amber, fontFamily: THEME.font.mono, fontSize: 11, fontWeight: '700' },
  btnDisabled: { opacity: 0.3 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.sm,
    gap: 4,
  },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: THEME.radius.sm },
  tabActive: { backgroundColor: THEME.colors.mintDim },
  tabText: { color: THEME.colors.ghostDim, fontSize: 13 },
  tabTextActive: { color: THEME.colors.mint, fontWeight: '600' },
  transcriptArea: { flex: 1 },
  transcriptContent: { padding: THEME.spacing.lg, gap: 0 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 40, opacity: 0.3 },
  emptyText: { color: THEME.colors.ghostDim, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  interimRow: { flexDirection: 'row', gap: 16, paddingVertical: 8 },
  interimTime: { color: THEME.colors.ghostDim, fontFamily: THEME.font.mono, fontSize: 10, width: 48 },
  interimTextStyle: { color: THEME.colors.ghostDim, fontSize: 14, flex: 1, fontStyle: 'italic' },
  chatArea: { flex: 1 },
  chatContent: { padding: THEME.spacing.md, gap: 12 },
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
  chatInputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: THEME.spacing.md,
    paddingBottom: 28,
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
});
