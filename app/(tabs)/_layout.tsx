import React, { useState } from 'react';
import { Tabs, router } from 'expo-router';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import {
  Radar,
  ShieldKeyhole,
  ReceiptText,
  NotebookPen,
  ListChecks,
  SlidersHorizontal,
  LockKeyhole,
  Search,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { GlobalSearchModal } from '../../src/components/search/GlobalSearchModal';
import { AnimatedPressable } from '../../src/components/ui/AnimatedPressable';

interface AWardenTabIconProps {
  Icon: LucideIcon;
  color: string;
  size: number;
  focused: boolean;
  activeBackground: string;
  activeBorder: string;
}

const AWardenTabIcon: React.FC<AWardenTabIconProps> = ({
  Icon,
  color,
  size,
  focused,
  activeBackground,
  activeBorder,
}) => (
  <View
    style={[
      styles.tabIcon,
      focused && {
        backgroundColor: activeBackground,
        borderColor: activeBorder,
        borderWidth: 1,
      },
    ]}
  >
    <Icon size={size || 22} color={color} strokeWidth={focused ? 2.35 : 1.9} />
  </View>
);

interface FloatingTabBarBackgroundProps {
  backgroundColor: string;
  borderColor: string;
  highlightColor: string;
  shadowColor: string;
}

type WebTabBarStyle = ViewStyle & {
  boxShadow?: string;
};

const FloatingTabBarBackground: React.FC<FloatingTabBarBackgroundProps> = ({
  backgroundColor,
  borderColor,
  highlightColor,
  shadowColor,
}) => {
  const shadowStyle: WebTabBarStyle =
    Platform.OS === 'web'
      ? {
          boxShadow: `8px 10px 24px ${shadowColor}, -6px -6px 16px ${highlightColor}`,
        }
      : {
          shadowColor,
          shadowOffset: { width: 5, height: 7 },
          shadowOpacity: 0.28,
          shadowRadius: 12,
          elevation: 8,
        };

  return (
    <View
      style={[
        styles.floatingTabBarBackground,
        { backgroundColor, borderColor },
        shadowStyle,
      ]}
    />
  );
};

export default function TabLayout() {
  const { colors, accent, spacing, typography, isDark } = useTheme();
  const { lockNow } = useAuth();
  const insets = useSafeAreaInsets();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const activeIconBackground = isDark ? accent.primaryBgDark : accent.primaryBgLight;
  const activeIconBorder = isDark ? colors.borderMedium : colors.borderSubtle;

  const handleLockPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    lockNow();
  };

  const handleSettingsPress = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/settings' as any);
  };

  const handleSearchPress = () => {
    Haptics.selectionAsync().catch(() => {});
    setIsSearchVisible(true);
  };

  const renderHeaderActions = () => (
    <View
      style={[
        styles.headerActionsRail,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.borderSubtle,
        },
        Platform.OS === 'web'
          ? {
              boxShadow: `4px 5px 12px ${colors.surfaceShadow}, -3px -3px 8px ${colors.surfaceHighlight}`,
            }
          : {
              shadowColor: colors.surfaceShadow,
              shadowOffset: { width: 3, height: 4 },
              shadowOpacity: 0.24,
              shadowRadius: 8,
              elevation: 4,
            },
      ]}
    >
      <AnimatedPressable
        onPress={handleSearchPress}
        style={[
          styles.headerBtn,
          {
            backgroundColor: colors.bgSecondary,
            borderColor: colors.borderSubtle,
            minHeight: spacing.minTouchTarget,
            minWidth: spacing.minTouchTarget,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Search AWarden"
        accessibilityHint="Search your unlocked private workspace"
      >
        <Search size={18} color={colors.textSecondary} />
      </AnimatedPressable>

      <AnimatedPressable
        onPress={handleSettingsPress}
        style={[
          styles.headerBtn,
          {
            backgroundColor: colors.bgSecondary,
            borderColor: colors.borderSubtle,
            minHeight: spacing.minTouchTarget,
            minWidth: spacing.minTouchTarget,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Open System Settings"
      >
        <SlidersHorizontal size={18} color={colors.textSecondary} />
      </AnimatedPressable>

      <AnimatedPressable
        onPress={handleLockPress}
        style={[
          styles.headerBtn,
          {
            backgroundColor: isDark ? accent.primaryBgDark : accent.primaryBgLight,
            borderColor: isDark ? colors.borderMedium : colors.borderSubtle,
            minHeight: spacing.minTouchTarget,
            minWidth: spacing.minTouchTarget,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Lock Vault Now"
      >
        <LockKeyhole size={18} color={accent.primary} />
      </AnimatedPressable>
    </View>
  );

  return (
    <>
      <Tabs
        screenOptions={{
        tabBarActiveTintColor: accent.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          position: 'absolute',
          left: spacing.md,
          right: spacing.md,
          bottom: Math.max(insets.bottom, spacing.sm),
          height: 70,
          paddingBottom: 6,
          paddingTop: 6,
          paddingHorizontal: 4,
          borderRadius: 28,
          overflow: 'visible',
          elevation: 0,
          zIndex: 10,
        },
        tabBarBackground: () => (
          <FloatingTabBarBackground
            backgroundColor={colors.bgElevated}
            borderColor={colors.borderSubtle}
            highlightColor={colors.surfaceHighlight}
            shadowColor={colors.surfaceShadow}
          />
        ),
        tabBarItemStyle: {
          paddingTop: 2,
          paddingBottom: 2,
          borderRadius: 22,
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
          fontSize: typography.xl,
          fontWeight: '800',
          letterSpacing: -0.35,
        },
        headerRight: renderHeaderActions,
      }}
        >
        <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerTitle: 'AWarden Overview',
          tabBarIcon: ({ color, size, focused }) => (
            <AWardenTabIcon
              Icon={Radar}
              color={color}
              size={size || 22}
              focused={focused}
              activeBackground={activeIconBackground}
              activeBorder={activeIconBorder}
            />
          ),
        }}
      />
        <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          headerTitle: 'Password Vault',
          tabBarIcon: ({ color, size, focused }) => (
            <AWardenTabIcon
              Icon={ShieldKeyhole}
              color={color}
              size={size || 22}
              focused={focused}
              activeBackground={activeIconBackground}
              activeBorder={activeIconBorder}
            />
          ),
        }}
      />
        <Tabs.Screen
        name="ledger"
        options={{
          title: 'Ledger',
          headerTitle: 'Budget Ledger',
          tabBarIcon: ({ color, size, focused }) => (
            <AWardenTabIcon
              Icon={ReceiptText}
              color={color}
              size={size || 22}
              focused={focused}
              activeBackground={activeIconBackground}
              activeBorder={activeIconBorder}
            />
          ),
        }}
      />
        <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          headerTitle: 'Safe Notes',
          tabBarIcon: ({ color, size, focused }) => (
            <AWardenTabIcon
              Icon={NotebookPen}
              color={color}
              size={size || 22}
              focused={focused}
              activeBackground={activeIconBackground}
              activeBorder={activeIconBorder}
            />
          ),
        }}
      />
        <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          headerTitle: 'Workflow & Tasks',
          tabBarIcon: ({ color, size, focused }) => (
            <AWardenTabIcon
              Icon={ListChecks}
              color={color}
              size={size || 22}
              focused={focused}
              activeBackground={activeIconBackground}
              activeBorder={activeIconBorder}
            />
          ),
        }}
      />
      {/* Settings hidden from bottom bar, navigated from top header */}
        <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: 'Settings',
          headerTitle: 'Settings & Security',
        }}
      />
      {/* Hide deprecated template route */}
        <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
      </Tabs>
      <GlobalSearchModal
        visible={isSearchVisible}
        onClose={() => setIsSearchVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerActionsRail: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    marginRight: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  headerBtn: {
    padding: 0,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: 38,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 28,
  },
});
