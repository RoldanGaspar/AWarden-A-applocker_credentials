/**
 * Life OS & Vault - Kanban Swimlane Component
 * Represents a single workflow column (To Do, In Progress, Completed) with task cards and add action
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import {
  Plus,
  Circle,
  PlayCircle,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { TaskCard } from './TaskCard';
import { Task, TaskStatus } from '../../types/models';
import { AnimatedPressable } from '../ui/AnimatedPressable';

export interface SwimlaneProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onSelectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDuplicateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const Swimlane: React.FC<SwimlaneProps> = ({
  status,
  title,
  tasks,
  onAddTask,
  onSelectTask,
  onEditTask,
  onStatusChange,
  onDuplicateTask,
  onDeleteTask,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'in_progress':
        return '#3B82F6';
      case 'completed':
        return '#10B981';
      case 'todo':
      default:
        return colors.textSecondary;
    }
  };

  const statusColor = getStatusColor();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary, borderRadius: radius.lg, padding: spacing.md }]}>
      {/* Swimlane Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.base }]}>
            {title}
          </Text>
          <View style={[styles.countBadge, { backgroundColor: colors.bgTertiary, borderRadius: radius.full }]}>
            <Text style={[styles.countText, { color: colors.textSecondary, fontSize: typography.xs }]}>
              {tasks.length}
            </Text>
          </View>
        </View>

        <AnimatedPressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            onAddTask(status);
          }}
          style={[styles.addBtn, { backgroundColor: colors.bgElevated, borderRadius: radius.full }]}
          accessibilityRole="button"
          accessibilityLabel={`Add task to ${title}`}
        >
          <Plus size={16} color={accent.primary} />
        </AnimatedPressable>
      </View>

      {/* Task Cards List */}
      <View style={styles.cardsContainer}>
        {tasks.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.borderSubtle, borderRadius: radius.md }]}>
            <Text style={[styles.emptyText, { color: colors.textMuted, fontSize: typography.xs }]}>
              Perch is clear — no tasks in {title.toLowerCase()}
            </Text>
          </View>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() => onSelectTask(task)}
              onEdit={() => onEditTask(task)}
              onStatusChange={(newStatus) => onStatusChange(task.id, newStatus)}
              onDuplicate={() => onDuplicateTask(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontWeight: '800',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontWeight: '700',
  },
  addBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsContainer: {
    gap: 8,
  },
  emptyBox: {
    paddingVertical: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontWeight: '500',
  },
});
