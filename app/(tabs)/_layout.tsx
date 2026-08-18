import React from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import {
  LayoutDashboard,
  KeyRound,
  Wallet,
  FileText,
  CheckSquare,
  Settings,
  Lock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';

export default function TabLayout() {
  const { colors, accent, spacing, typography } = useTheme();
  const { lockNow } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLockPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    lockNow();
  };

  const renderHeaderLock = () => (
    <TouchableOpacity
      onPress={handleLockPress}
      style={[
        styles.lockButton,
        {
          backgroundColor: colors.bgSecondary,
          borderColor: colors.borderSubtle,
          marginRight: spacing.md,
          minHeight: spacing.minTouchTarget,
          minWidth: spacing.minTouchTarget,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Lock Vault Now"
    >
      <Lock size={18} color={accent.primary} />
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: accent.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.bgElevated,
          borderBottomColor: colors.borderSubtle,
          borderBottomWidth: 1,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTitleStyle: {
          color: colors.textPrimary,
          fontSize: typography.lg,
          fontWeight: '700',
        },
        headerRight: renderHeaderLock,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerTitle: 'Life OS Overview',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          headerTitle: 'Password Vault',
          tabBarIcon: ({ color, size }) => <KeyRound size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: 'Ledger',
          headerTitle: 'Budget Ledger',
          tabBarIcon: ({ color, size }) => <Wallet size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          headerTitle: 'Safe Notes',
          tabBarIcon: ({ color, size }) => <FileText size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          headerTitle: 'Workflow & Tasks',
          tabBarIcon: ({ color, size }) => <CheckSquare size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'System Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size || 22} color={color} />,
        }}
      />
      {/* Hide deprecated two.tsx if it was in the original template */}
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  lockButton: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
