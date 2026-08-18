/**
 * Life OS & Vault - Task Card Component
 * Kanban item card with priority color border, status advance toggle, due date badge, tags, and actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  ChevronRight,
  RotateCcw,
  Check,
  Play,
  Edit2,
  Trash2,
  Copy,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Card, Tag } from '../ui';
import { Task, TaskPriority, TaskStatus } from '../../types/models';

export interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onEdit: () => void;
  onStatusChange: (newStatus: TaskStatus) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case 'high':
      return '#EF4444'; // Red
    case 'medium':
      return '#F59E0B'; // Amber
    case 'low':
    default:
      return '#10B981'; // Green
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onEdit,
  onStatusChange,
  onDuplicate,
  onDelete,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      task.title,
      `Priority: ${task.priority.toUpperCase()} • Status: ${task.status}`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...(task.status !== 'todo'
          ? [{ text: 'Move to To Do', onPress: () => onStatusChange('todo') }]
          : []),
        ...(task.status !== 'in_progress'
          ? [{ text: 'Move to In Progress', onPress: () => onStatusChange('in_progress') }]
          : []),
        ...(task.status !== 'completed'
          ? [{ text: 'Mark as Completed', onPress: () => onStatusChange('completed') }]
          : []),
        { text: 'Duplicate Task', onPress: onDuplicate },
        { text: 'Edit Task', onPress: onEdit },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const priorityColor = getPriorityColor(task.priority);

  const isOverdue =
    task.due_date &&
    task.status !== 'completed' &&
    task.due_date < new Date().toISOString().split('T')[0];

  const renderStatusButton = () => {
    if (task.status === 'todo') {
      return (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            onStatusChange('in_progress');
          }}
          style={[styles.statusBtn, { backgroundColor: colors.bgSecondary, borderRadius: radius.full }]}
          accessibilityRole="button"
          accessibilityLabel="Start task"
        >
          <Play size={12} color={colors.textSecondary} style={{ marginLeft: 1 }} />
        </TouchableOpacity>
      );
    }

    if (task.status === 'in_progress') {
      return (
        <TouchableOpacity
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            onStatusChange('completed');
          }}
          style={[styles.statusBtn, { backgroundColor: colors.successBg, borderRadius: radius.full }]}
          accessibilityRole="button"
          accessibilityLabel="Complete task"
        >
          <Check size={14} color={colors.success} />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onStatusChange('todo');
        }}
        style={[styles.statusBtn, { backgroundColor: colors.bgSecondary, borderRadius: radius.full }]}
        accessibilityRole="button"
        accessibilityLabel="Reopen task"
      >
        <RotateCcw size={12} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  return (
    <Card
      variant="outlined"
      style={[
        styles.card,
        {
          borderLeftColor: priorityColor,
          borderLeftWidth: 4,
          opacity: task.status === 'completed' ? 0.75 : 1,
        },
      ]}
      onPress={onPress}
      accessibilityLabel={`Task: ${task.title}, priority: ${task.priority}, status: ${task.status}`}
    >
      <TouchableOpacity
        onLongPress={handleLongPress}
        activeOpacity={0.8}
        style={styles.innerTouchable}
        onPress={onPress}
      >
        <View style={styles.headerRow}>
          {/* Priority pill */}
          <View style={[styles.priorityPill, { backgroundColor: `${priorityColor}15`, borderRadius: radius.xs }]}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <Text style={[styles.priorityText, { color: priorityColor, fontSize: 10 }]}>
              {task.priority.toUpperCase()}
            </Text>
          </View>

          {/* Quick status advance button */}
          {renderStatusButton()}
        </View>

        {/* Title */}
        <Text
          style={[
            styles.title,
            {
              color: colors.textPrimary,
              fontSize: typography.base,
              textDecorationLine: task.status === 'completed' ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {/* Description snippet */}
        {task.description ? (
          <Text
            style={[styles.descSnippet, { color: colors.textSecondary, fontSize: typography.xs }]}
            numberOfLines={1}
          >
            {task.description}
          </Text>
        ) : null}

        {/* Footer: Due date & Tags */}
        <View style={styles.footerRow}>
          {task.due_date ? (
            <View
              style={[
                styles.dueBadge,
                {
                  backgroundColor: isOverdue ? colors.dangerBg : colors.bgSecondary,
                  borderRadius: radius.xs,
                },
              ]}
            >
              <Calendar size={11} color={isOverdue ? colors.danger : colors.textTertiary} style={{ marginRight: 4 }} />
              <Text
                style={[
                  styles.dueText,
                  { color: isOverdue ? colors.danger : colors.textTertiary, fontSize: 10, fontWeight: isOverdue ? '700' : '500' },
                ]}
              >
                {isOverdue ? `Overdue: ${task.due_date}` : task.due_date}
              </Text>
            </View>
          ) : (
            <View />
          )}

          {task.tags && task.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {task.tags.slice(0, 2).map((t) => (
                <Tag key={t} label={t} size="sm" />
              ))}
              {task.tags.length > 2 && (
                <Text style={[styles.moreTags, { color: colors.textMuted, fontSize: 10 }]}>
                  +{task.tags.length - 2}
                </Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    marginBottom: 8,
    overflow: 'hidden',
  },
  innerTouchable: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontWeight: '800',
  },
  statusBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    marginBottom: 2,
  },
  descSnippet: {
    marginBottom: 6,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  dueText: {},
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moreTags: {
    fontWeight: '600',
  },
});
