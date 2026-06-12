import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { getSettings, saveSettings } from '@/lib/storage';
import type { AppSettings, SourceLanguage, ExplanationLanguage } from '@/types';

const SOURCE_LANGUAGES: { code: SourceLanguage; label: string; flag: string }[] = [
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'es-419', label: 'Spanish (Latin America)', flag: '🌎' },
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    deepgramKey: '',
    anthropicKey: '',
    sourceLanguage: 'en-US',
    explanationLanguage: 'en',
  });
  const [showDeepgram, setShowDeepgram] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getSettings().then(setSettings);
    }, []),
  );

  async function handleChange<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings({ [key]: value });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* API Keys */}
      <Text style={styles.section}>API Keys</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Deepgram (Speech Recognition)</Text>
        <Text style={styles.hint}>Free tier: 200 hours/month — deepgram.com</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={settings.deepgramKey}
            onChangeText={v => handleChange('deepgramKey', v)}
            placeholder="Paste your Deepgram key..."
            placeholderTextColor={colors.textDim}
            secureTextEntry={!showDeepgram}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable onPress={() => setShowDeepgram(p => !p)} style={styles.eyeBtn}>
            <Text style={styles.eyeIcon}>{showDeepgram ? '🙈' : '👁'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Anthropic (AI Explanations)</Text>
        <Text style={styles.hint}>Pay-as-you-go — console.anthropic.com</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={settings.anthropicKey}
            onChangeText={v => handleChange('anthropicKey', v)}
            placeholder="Paste your Anthropic key..."
            placeholderTextColor={colors.textDim}
            secureTextEntry={!showAnthropic}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable onPress={() => setShowAnthropic(p => !p)} style={styles.eyeBtn}>
            <Text style={styles.eyeIcon}>{showAnthropic ? '🙈' : '👁'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Language */}
      <Text style={styles.section}>Language</Text>

      <View style={styles.card}>
        <Text style={styles.label}>I'm listening to...</Text>
        <View style={styles.langGrid}>
          {SOURCE_LANGUAGES.map(lang => (
            <Pressable
              key={lang.code}
              style={[
                styles.langOption,
                settings.sourceLanguage === lang.code && styles.langOptionActive,
              ]}
              onPress={() => handleChange('sourceLanguage', lang.code)}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.langLabel,
                  settings.sourceLanguage === lang.code && styles.langLabelActive,
                ]}
              >
                {lang.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Explain words in...</Text>
        <View style={styles.toggleRow}>
          <Text style={[styles.langLabel, settings.explanationLanguage === 'en' && { color: colors.primary }]}>
            🇺🇸 English
          </Text>
          <Switch
            value={settings.explanationLanguage === 'es'}
            onValueChange={v => handleChange('explanationLanguage', v ? 'es' : 'en')}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.text}
          />
          <Text style={[styles.langLabel, settings.explanationLanguage === 'es' && { color: colors.accent }]}>
            🇪🇸 Español
          </Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How it works</Text>
        <Text style={styles.infoText}>
          1. Tap the mic on the home screen to start listening{'\n'}
          2. Your speech is transcribed in real time{'\n'}
          3. Tap any word or phrase to see what it means{'\n'}
          4. Switch languages at any time in the explanation overlay
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  label: { ...typography.body, fontWeight: '600' },
  hint: { ...typography.small },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: 'System',
  },
  eyeBtn: {
    padding: spacing.sm,
  },
  eyeIcon: { fontSize: 18 },

  langGrid: { gap: spacing.xs },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDim,
  },
  langFlag: { fontSize: 20 },
  langLabel: { fontSize: 15, color: colors.textMuted },
  langLabelActive: { color: colors.primary, fontWeight: '600' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },

  infoBox: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  infoTitle: { ...typography.body, fontWeight: '700' },
  infoText: { ...typography.bodyMuted, lineHeight: 22 },
});
