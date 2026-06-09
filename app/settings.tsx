import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME } from '../constants/theme';

const KEYS = {
  DEEPGRAM: 'settings_deepgram_key',
  ANTHROPIC: 'settings_anthropic_key',
  SUPABASE_URL: 'settings_supabase_url',
  SUPABASE_ANON: 'settings_supabase_anon_key',
  LANGUAGE: 'settings_language',
};

const LANGUAGES = [
  { label: 'English (US)', value: 'en-US' },
  { label: 'English (UK)', value: 'en-GB' },
  { label: 'Russian', value: 'ru' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
];

export default function SettingsScreen() {
  const [deepgramKey, setDeepgramKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnon, setSupabaseAnon] = useState('');
  const [language, setLanguage] = useState('en-US');

  useEffect(() => {
    AsyncStorage.multiGet([
      KEYS.DEEPGRAM, KEYS.ANTHROPIC, KEYS.SUPABASE_URL, KEYS.SUPABASE_ANON, KEYS.LANGUAGE,
    ]).then(pairs => {
      const map = Object.fromEntries(pairs.map(([k, v]) => [k, v ?? '']));
      setDeepgramKey(map[KEYS.DEEPGRAM]);
      setAnthropicKey(map[KEYS.ANTHROPIC]);
      setSupabaseUrl(map[KEYS.SUPABASE_URL]);
      setSupabaseAnon(map[KEYS.SUPABASE_ANON]);
      setLanguage(map[KEYS.LANGUAGE] || 'en-US');
    });
  }, []);

  const save = async () => {
    await AsyncStorage.multiSet([
      [KEYS.DEEPGRAM, deepgramKey],
      [KEYS.ANTHROPIC, anthropicKey],
      [KEYS.SUPABASE_URL, supabaseUrl],
      [KEYS.SUPABASE_ANON, supabaseAnon],
      [KEYS.LANGUAGE, language],
    ]);
    Alert.alert('Saved', 'Settings saved successfully.');
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>SETTINGS</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>API KEYS</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Deepgram API Key</Text>
            <TextInput
              style={styles.input}
              value={deepgramKey}
              onChangeText={setDeepgramKey}
              placeholder="dg_..."
              placeholderTextColor={THEME.colors.ghostDim}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Anthropic API Key</Text>
            <TextInput
              style={styles.input}
              value={anthropicKey}
              onChangeText={setAnthropicKey}
              placeholder="sk-ant-..."
              placeholderTextColor={THEME.colors.ghostDim}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Supabase URL</Text>
            <TextInput
              style={styles.input}
              value={supabaseUrl}
              onChangeText={setSupabaseUrl}
              placeholder="https://xxx.supabase.co"
              placeholderTextColor={THEME.colors.ghostDim}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Supabase Anon Key</Text>
            <TextInput
              style={styles.input}
              value={supabaseAnon}
              onChangeText={setSupabaseAnon}
              placeholder="eyJ..."
              placeholderTextColor={THEME.colors.ghostDim}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TRANSCRIPTION LANGUAGE</Text>
          <View style={styles.langGrid}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.value}
                style={[styles.langBtn, language === lang.value && styles.langBtnActive]}
                onPress={() => setLanguage(lang.value)}
              >
                <Text style={[styles.langText, language === lang.value && styles.langTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>NOTA AI · ÆTHERMIND</Text>
          <Text style={styles.footerText}>Stack: Expo 51 · Deepgram Nova-2 · Claude</Text>
        </View>
      </ScrollView>
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
  title: {
    color: THEME.colors.ghost,
    fontFamily: THEME.font.mono,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  scroll: { flex: 1 },
  content: { padding: THEME.spacing.lg, gap: THEME.spacing.lg, paddingBottom: 60 },
  section: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  sectionLabel: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 9,
    letterSpacing: 2,
  },
  field: { gap: 6 },
  label: {
    color: THEME.colors.ghostDim,
    fontSize: 12,
    fontFamily: THEME.font.mono,
  },
  input: {
    backgroundColor: THEME.colors.panel,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: THEME.colors.ghost,
    fontSize: 13,
    fontFamily: THEME.font.mono,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  langBtnActive: {
    borderColor: THEME.colors.mint,
    backgroundColor: THEME.colors.mintDim,
  },
  langText: {
    color: THEME.colors.ghostDim,
    fontSize: 12,
  },
  langTextActive: {
    color: THEME.colors.mint,
  },
  saveBtn: {
    backgroundColor: THEME.colors.mintDim,
    borderWidth: 1,
    borderColor: THEME.colors.mint,
    borderRadius: THEME.radius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
  },
  saveBtnText: {
    color: THEME.colors.mint,
    fontFamily: THEME.font.mono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: THEME.spacing.md,
  },
  footerText: {
    color: THEME.colors.ghostDim,
    fontFamily: THEME.font.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
});
