import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" backgroundColor={THEME.colors.void} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: THEME.colors.surface,
            borderTopColor: THEME.colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: THEME.colors.mint,
          tabBarInactiveTintColor: THEME.colors.ghostDim,
          tabBarLabelStyle: {
            fontFamily: THEME.font.mono,
            fontSize: 10,
            letterSpacing: 0.5,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Library', tabBarIcon: () => null }}
        />
        <Tabs.Screen
          name="record"
          options={{ title: 'Record', tabBarIcon: () => null }}
        />
        <Tabs.Screen
          name="coach"
          options={{ title: 'Coach', tabBarIcon: () => null }}
        />
        <Tabs.Screen
          name="flashcards"
          options={{ title: 'Cards', tabBarIcon: () => null }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: 'Settings', tabBarIcon: () => null }}
        />
        <Tabs.Screen
          name="transcript/[id]"
          options={{ href: null }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
