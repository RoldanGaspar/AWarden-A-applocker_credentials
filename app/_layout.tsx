import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';
import { AuthGate } from '../src/components/AuthGate';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootNavigation() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGate>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.bgElevated,
            },
            headerTintColor: colors.textPrimary,
            contentStyle: {
              backgroundColor: colors.bgPrimary,
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              headerTitle: 'Quick Action',
            }}
          />
        </Stack>
      </AuthGate>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigation />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
