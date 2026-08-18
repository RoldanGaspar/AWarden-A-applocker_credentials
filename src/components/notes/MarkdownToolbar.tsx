/**
 * Life OS & Vault - Markdown Formatting Toolbar
 * Provides quick formatting buttons to wrap or inject Markdown syntax into the note editor
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  FileCode,
  Quote,
  Link as LinkIcon,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

export interface FormattingAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  syntax: {
    prefix: string;
    suffix: string;
    multiline?: boolean;
  };
}

export interface MarkdownToolbarProps {
  onApplyFormat: (prefix: string, suffix: string, multiline?: boolean) => void;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ onApplyFormat }) => {
  const { colors, accent, spacing, radius } = useTheme();

  const actions: FormattingAction[] = [
    {
      id: 'h1',
      label: 'Heading 1',
      icon: <Heading1 size={18} color={colors.textPrimary} />,
      syntax: { prefix: '# ', suffix: '' },
    },
    {
      id: 'h2',
      label: 'Heading 2',
      icon: <Heading2 size={18} color={colors.textPrimary} />,
      syntax: { prefix: '## ', suffix: '' },
    },
    {
      id: 'h3',
      label: 'Heading 3',
      icon: <Heading3 size={18} color={colors.textPrimary} />,
      syntax: { prefix: '### ', suffix: '' },
    },
    {
      id: 'bold',
      label: 'Bold',
      icon: <Bold size={18} color={colors.textPrimary} />,
      syntax: { prefix: '**', suffix: '**' },
    },
    {
      id: 'italic',
      label: 'Italic',
      icon: <Italic size={18} color={colors.textPrimary} />,
      syntax: { prefix: '*', suffix: '*' },
    },
    {
      id: 'strike',
      label: 'Strikethrough',
      icon: <Strikethrough size={18} color={colors.textPrimary} />,
      syntax: { prefix: '~~', suffix: '~~' },
    },
    {
      id: 'bullet',
      label: 'Bulleted List',
      icon: <List size={18} color={colors.textPrimary} />,
      syntax: { prefix: '- ', suffix: '' },
    },
    {
      id: 'number',
      label: 'Numbered List',
      icon: <ListOrdered size={18} color={colors.textPrimary} />,
      syntax: { prefix: '1. ', suffix: '' },
    },
    {
      id: 'task',
      label: 'Checklist Item',
      icon: <CheckSquare size={18} color={colors.textPrimary} />,
      syntax: { prefix: '- [ ] ', suffix: '' },
    },
    {
      id: 'code-inline',
      label: 'Inline Code',
      icon: <Code size={18} color={colors.textPrimary} />,
      syntax: { prefix: '`', suffix: '`' },
    },
    {
      id: 'code-block',
      label: 'Code Block',
      icon: <FileCode size={18} color={colors.textPrimary} />,
      syntax: { prefix: '```\n', suffix: '\n```', multiline: true },
    },
    {
      id: 'quote',
      label: 'Quote Block',
      icon: <Quote size={18} color={colors.textPrimary} />,
      syntax: { prefix: '> ', suffix: '' },
    },
    {
      id: 'link',
      label: 'Hyperlink',
      icon: <LinkIcon size={18} color={colors.textPrimary} />,
      syntax: { prefix: '[', suffix: '](https://)' },
    },
  ];

  const handleAction = (action: FormattingAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onApplyFormat(action.syntax.prefix, action.syntax.suffix, action.syntax.multiline);
  };

  return (
    <View style={[styles.toolbarContainer, { backgroundColor: colors.bgSecondary, borderTopColor: colors.borderSubtle }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        {actions.map((act) => (
          <TouchableOpacity
            key={act.id}
            onPress={() => handleAction(act)}
            style={[
              styles.actionBtn,
              { backgroundColor: colors.bgTertiary, borderRadius: radius.sm, minWidth: spacing.minTouchTarget, minHeight: spacing.minTouchTarget },
            ]}
            accessibilityRole="button"
            accessibilityLabel={act.label}
          >
            {act.icon}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  toolbarContainer: {
    borderTopWidth: 1,
    paddingVertical: 6,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});
