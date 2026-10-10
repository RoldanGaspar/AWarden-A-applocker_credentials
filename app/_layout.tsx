import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider, Theme as TamaguiTheme } from 'tamagui';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';
import { AuthGate } from '../src/components/AuthGate';
import tamaguiConfig from '../tamagui.config';

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

function TamaguiThemeBridge({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const themeName = isDark ? 'awarden_dark' : 'awarden_light';

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="awarden_dark">
      <TamaguiTheme name={themeName}>{children}</TamaguiTheme>
    </TamaguiProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <TamaguiThemeBridge>
          <AuthProvider>
            <RootNavigation />
          </AuthProvider>
        </TamaguiThemeBridge>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
