import '@/global';
import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Text, type ColorValue } from 'react-native';
import { THEME } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function TabIcon({ icon, color }: { icon: string; color: ColorValue }) {
  return <Text style={{ fontSize: 18, color: color as string }}>{icon}</Text>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: THEME.colors.surface,
            borderTopColor: THEME.colors.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: THEME.colors.mint,
          tabBarInactiveTintColor: THEME.colors.ghostDim,
          tabBarLabelStyle: {
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 9,
            letterSpacing: 0.5,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Notes',
            tabBarIcon: ({ color }) => <TabIcon icon="📋" color={color} />,
          }}
        />
        <Tabs.Screen
          name="record"
          options={{
            title: 'Record',
            tabBarIcon: ({ color }) => <TabIcon icon="🎙" color={color} />,
          }}
        />
        <Tabs.Screen
          name="coach"
          options={{
            title: 'Coach',
            tabBarIcon: ({ color }) => <TabIcon icon="🧠" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} />,
          }}
        />
        <Tabs.Screen name="transcript/[id]" options={{ href: null }} />
      </Tabs>
    </GestureHandlerRootView>
  );
}
