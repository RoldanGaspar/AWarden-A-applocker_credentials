/**
 * Life OS & Vault - Themed Markdown Viewer
 * Wraps react-native-markdown-display with cohesive theme styling and accessibility
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../theme/ThemeContext';

export interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  const { colors, accent, typography, spacing, radius } = useTheme();

  const markdownStyles = {
    body: {
      color: colors.textPrimary,
      fontSize: typography.base,
      lineHeight: 24,
    },
    heading1: {
      color: colors.textPrimary,
      fontSize: typography.xl,
      fontWeight: '800' as const,
      marginVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      paddingBottom: 4,
    },
    heading2: {
      color: colors.textPrimary,
      fontSize: typography.lg,
      fontWeight: '700' as const,
      marginVertical: spacing.xs,
    },
    heading3: {
      color: colors.textPrimary,
      fontSize: typography.base,
      fontWeight: '700' as const,
      marginVertical: spacing.xs,
    },
    paragraph: {
      marginVertical: spacing.xs,
    },
    link: {
      color: accent.primary,
      textDecorationLine: 'underline' as const,
    },
    blockquote: {
      backgroundColor: colors.bgSecondary,
      borderLeftColor: accent.primary,
      borderLeftWidth: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      marginVertical: spacing.xs,
    },
    code_inline: {
      backgroundColor: colors.bgTertiary,
      color: accent.primary,
      fontFamily: 'monospace',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.xs,
    },
    code_block: {
      backgroundColor: colors.bgSecondary,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      fontFamily: 'monospace',
      color: colors.textPrimary,
      marginVertical: spacing.sm,
    },
    fence: {
      backgroundColor: colors.bgSecondary,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      fontFamily: 'monospace',
      color: colors.textPrimary,
      marginVertical: spacing.sm,
    },
    list_item: {
      marginVertical: 2,
    },
    bullet_list: {
      marginVertical: spacing.xs,
    },
    ordered_list: {
      marginVertical: spacing.xs,
    },
    hr: {
      backgroundColor: colors.borderSubtle,
      height: 1,
      marginVertical: spacing.md,
    },
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Markdown style={markdownStyles}>
        {content || '*No content to preview*'}
      </Markdown>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
});
