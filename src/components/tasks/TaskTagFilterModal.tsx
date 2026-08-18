/**
 * Life OS & Vault - Task Tag Filter Modal
 * Allows filtering tasks by tag
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Modal, Tag, Button } from '../ui';

export interface TaskTagFilterModalProps {
  visible: boolean;
  onClose: () => void;
  availableTags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export const TaskTagFilterModal: React.FC<TaskTagFilterModalProps> = ({
  visible,
  onClose,
  availableTags,
  selectedTag,
  onSelectTag,
}) => {
  const { colors, accent, spacing, typography } = useTheme();

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Filter Tasks by Tag"
      subtitle="Select a tag to narrow down your workflow tasks"
      variant="bottomSheet"
    >
      <View style={styles.container}>
        {selectedTag && (
          <Button
            title="Clear Tag Filter"
            variant="outline"
            size="sm"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onSelectTag(null);
              onClose();
            }}
            style={{ marginBottom: spacing.md }}
          />
        )}

        {availableTags.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textTertiary, fontSize: typography.sm }]}>
            No tags found on any active tasks.
          </Text>
        ) : (
          <ScrollView contentContainerStyle={styles.tagsGrid}>
            {availableTags.map((t) => {
              const isSelected = selectedTag?.toLowerCase() === t.toLowerCase();
              return (
                <Tag
                  key={t}
                  label={t}
                  selected={isSelected}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    onSelectTag(isSelected ? null : t);
                    onClose();
                  }}
                  size="md"
                />
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  emptyText: {
    paddingVertical: 16,
    textAlign: 'center',
  },
});
