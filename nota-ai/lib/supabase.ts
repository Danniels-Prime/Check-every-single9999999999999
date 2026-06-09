import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSettings } from './storage';

let _client: SupabaseClient | null = null;
let _clientUrl = '';
let _clientKey = '';

export async function getSupabase(): Promise<SupabaseClient | null> {
  const { supabaseUrl, supabaseAnonKey } = await getSettings();
  if (!supabaseUrl || !supabaseAnonKey) return null;

  if (_client && _clientUrl === supabaseUrl && _clientKey === supabaseAnonKey) {
    return _client;
  }

  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  _clientUrl = supabaseUrl;
  _clientKey = supabaseAnonKey;
  return _client;
}
