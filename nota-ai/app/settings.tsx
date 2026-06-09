import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import { THEME } from '@/constants/theme';
import { LANGUAGES } from '@/constants/languages';
import { getSettings, saveSettings } from '@/lib/storage';
import type { AppSettings } from '@/types';

interface KeyFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSave: (v: string) => void;
}

function KeyField({ label, placeholder, value, onChange, onSave }: KeyFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={kf.container}>
      <Text style={kf.label}>{label}</Text>
      <View style={kf.row}>
        <TextInput
          style={kf.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={THEME.colors.ghostDim}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          onEndEditing={() => onSave(value)}
        />
        <TouchableOpacity style={kf.eyeBtn} onPress={() => setVisible(v => !v)}>
          <Text style={kf.eyeIcon}>{visible ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const kf = StyleSheet.create({
  container: { marginBottom: THEME.spacing.md },
  label: {
    color: THEME.colors.ghostDim,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: THEME.colors.panel,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: THEME.colors.ghost,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 12,
  },
  eyeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: { fontSize: 16 },
});

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    deepgramKey: '',
    anthropicKey: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    selectedLanguage: 'en-US',
    theme: 'dark',
  });
  const [langQuery, setLangQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const updateAndSave = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      saveSettings({ [key]: value });
      return next;
    });
  }, []);

  const filteredLanguages = useMemo(
    () => LANGUAGES.filter(l =>
      l.label.toLowerCase().includes(langQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(langQuery.toLowerCase())
    ),
    [langQuery]
  );

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator color={THEME.colors.mint} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.brand}>NOTA AI</Text>
          <Text style={styles.tagline}>Your Keys · Your Data · Always Free</Text>
        </View>

        {/* API KEYS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Keys</Text>
          <Text style={styles.sectionNote}>
            Keys are stored locally on your device. NOTA AI never sends them to any server other than the respective API provider.
          </Text>

          <KeyField
            label="Deepgram API Key"
            placeholder="dg_xxxxxxxxxxxxxxxx"
            value={settings.deepgramKey}
            onChange={v => setSettings(prev => ({ ...prev, deepgramKey: v }))}
            onSave={v => updateAndSave('deepgramKey', v)}
          />
          <KeyField
            label="Anthropic API Key"
            placeholder="sk-ant-xxxxxxxxxxxxxxxx"
            value={settings.anthropicKey}
            onChange={v => setSettings(prev => ({ ...prev, anthropicKey: v }))}
            onSave={v => updateAndSave('anthropicKey', v)}
          />
          <KeyField
            label="Supabase URL (optional)"
            placeholder="https://xxxx.supabase.co"
            value={settings.supabaseUrl}
            onChange={v => setSettings(prev => ({ ...prev, supabaseUrl: v }))}
            onSave={v => updateAndSave('supabaseUrl', v)}
          />
          <KeyField
            label="Supabase Anon Key (optional)"
            placeholder="eyJhbGciOiJIUzI1NiIs..."
            value={settings.supabaseAnonKey}
            onChange={v => setSettings(prev => ({ ...prev, supabaseAnonKey: v }))}
            onSave={v => updateAndSave('supabaseAnonKey', v)}
          />
        </View>

        {/* LANGUAGE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transcription Language</Text>
          <Text style={styles.sectionNote}>
            55+ languages supported via Deepgram Nova-2.{' '}
            Currently: <Text style={styles.highlight}>
              {LANGUAGES.find(l => l.code === settings.selectedLanguage)?.label ?? settings.selectedLanguage}
            </Text>
          </Text>

          <TextInput
            style={styles.searchInput}
            value={langQuery}
            onChangeText={setLangQuery}
            placeholder="Search language…"
            placeholderTextColor={THEME.colors.ghostDim}
            autoCapitalize="none"
          />

          <FlatList
            data={filteredLanguages}
            keyExtractor={item => item.code}
            style={styles.langList}
            scrollEnabled={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const selected = item.code === settings.selectedLanguage;
              return (
                <TouchableOpacity
                  style={[styles.langRow, selected && styles.langRowSelected]}
                  onPress={() => updateAndSave('selectedLanguage', item.code)}
                  activeOpacity={0.7}
                >
                  {item.flag ? <Text style={styles.langFlag}>{item.flag}</Text> : null}
                  <Text style={[styles.langLabel, selected && styles.langLabelSelected]}>
                    {item.label}
                  </Text>
                  <Text style={styles.langCode}>{item.code}</Text>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* ABOUT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            NOTA AI is free, open source, and self-hosted.{'\n'}
            Stack: Expo · Deepgram Nova-2 · Claude claude-sonnet-4-20250514 · Supabase{'\n\n'}
            Get your free API keys:{'\n'}
            • deepgram.com — free tier: 200h/month{'\n'}
            • console.anthropic.com — pay-as-you-go{'\n'}
            • supabase.com — free tier available
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.colors.void },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.colors.void },
  content: { paddingBottom: 60 },
  header: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  brand: { color: THEME.colors.mint, fontFamily: 'JetBrainsMono_500Medium', fontSize: 20, letterSpacing: 3 },
  tagline: { color: THEME.colors.ghostDim, fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, marginTop: 2 },
  section: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  sectionTitle: {
    color: THEME.colors.ghost,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginBottom: THEME.spacing.xs,
  },
  sectionNote: {
    color: THEME.colors.ghostDim,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: THEME.spacing.md,
  },
  highlight: { color: THEME.colors.mint },
  searchInput: {
    backgroundColor: THEME.colors.panel,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: THEME.colors.ghost,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginBottom: THEME.spacing.sm,
  },
  langList: {},
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.md,
    gap: 10,
  },
  langRowSelected: { backgroundColor: THEME.colors.mintDim },
  langFlag: { fontSize: 18, width: 28 },
  langLabel: {
    flex: 1,
    color: THEME.colors.ghost,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  langLabelSelected: { color: THEME.colors.mint, fontFamily: 'Inter_600SemiBold' },
  langCode: {
    color: THEME.colors.ghostDim,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
  },
  checkmark: { color: THEME.colors.mint, fontSize: 14 },
  aboutText: {
    color: THEME.colors.ghostDim,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 20,
  },
});
