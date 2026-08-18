/**
 * Life OS & Vault - Reusable Task Form Component
 * Used for creating and editing tasks with priority, due date, tags, and encrypted description
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  Plus,
  Check,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Input, Button, Tag, Card } from '../ui';
import { Task, TaskPriority, TaskStatus } from '../../types/models';
import { getPriorityColor } from './TaskCard';

export interface TaskFormProps {
  initialTask?: Task | null;
  defaultStatus?: TaskStatus;
  defaultDueDate?: string;
  onSave: (task: Omit<Task, 'created_at'>) => Promise<void>;
  onCancel: () => void;
  submitButtonTitle?: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  initialTask,
  defaultStatus = 'todo',
  defaultDueDate,
  onSave,
  onCancel,
  submitButtonTitle = 'Save Task',
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();

  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status || defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || 'medium');
  const [dueDate, setDueDate] = useState(
    initialTask?.due_date || defaultDueDate || new Date().toISOString().split('T')[0]
  );
  const [tags, setTags] = useState<string[]>(initialTask?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    if (tags.length >= 5) {
      setError('Maximum 5 tags allowed');
      return;
    }
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTag('');
    setShowTagInput(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        id: initialTask?.id || `task_${Date.now()}`,
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        due_date: dueDate.trim() || null,
        completed_at: status === 'completed' ? (initialTask?.completed_at || Date.now()) : null,
        tags,
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Input
        label="Task Title *"
        placeholder="e.g. Prepare tax report, Backup encrypted vault"
        value={title}
        onChangeText={setTitle}
        autoFocus={!initialTask}
      />

      {/* Priority Selection */}
      <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm, marginBottom: 8 }]}>
        Priority Level
      </Text>
      <View style={styles.priorityRow}>
        {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => {
          const isSelected = priority === p;
          const pColor = getPriorityColor(p);
          return (
            <TouchableOpacity
              key={p}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setPriority(p);
              }}
              style={[
                styles.priorityPill,
                {
                  backgroundColor: isSelected ? pColor : colors.bgSecondary,
                  borderColor: isSelected ? pColor : colors.borderSubtle,
                  borderRadius: radius.md,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <View style={[styles.priorityDot, { backgroundColor: isSelected ? '#FFFFFF' : pColor }]} />
              <Text
                style={[
                  styles.priorityText,
                  { color: isSelected ? '#FFFFFF' : colors.textPrimary, fontSize: typography.xs },
                ]}
              >
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Status Selection */}
      <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm, marginBottom: 8 }]}>
        Task Status
      </Text>
      <View style={styles.statusRow}>
        {(['todo', 'in_progress', 'completed'] as TaskStatus[]).map((s) => {
          const isSelected = status === s;
          const label = s === 'todo' ? 'To Do' : s === 'in_progress' ? 'In Progress' : 'Completed';
          return (
            <TouchableOpacity
              key={s}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setStatus(s);
              }}
              style={[
                styles.statusPill,
                {
                  backgroundColor: isSelected ? accent.primary : colors.bgSecondary,
                  borderColor: isSelected ? accent.primary : colors.borderSubtle,
                  borderRadius: radius.md,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: isSelected ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Due Date Input */}
      <Input
        label="Due Date (YYYY-MM-DD)"
        placeholder="2026-08-20"
        value={dueDate}
        onChangeText={setDueDate}
      />

      {/* Tags */}
      <View style={styles.tagHeaderRow}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
          Tags ({tags.length}/5)
        </Text>
        {!showTagInput && tags.length < 5 && (
          <TouchableOpacity
            onPress={() => setShowTagInput(true)}
            style={styles.addTagBtn}
          >
            <Plus size={14} color={accent.primary} />
            <Text style={[styles.addTagText, { color: accent.primary, fontSize: typography.xs }]}>
              Add Tag
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showTagInput && (
        <View style={styles.tagInputRow}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Tag name (e.g. Work, Urgent)"
              value={newTag}
              onChangeText={setNewTag}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
            />
          </View>
          <Button
            title="Add"
            size="sm"
            onPress={handleAddTag}
            style={{ marginLeft: 8, height: 44, marginTop: -16 }}
          />
        </View>
      )}

      <View style={styles.tagsContainer}>
        {tags.map((t) => (
          <Tag key={t} label={t} onRemove={() => handleRemoveTag(t)} />
        ))}
      </View>

      {/* Encrypted Description */}
      <Input
        label="Encrypted Details / Checklist"
        placeholder="Task requirements, steps, or secrets (AES-256 encrypted)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        inputStyle={{ height: 75, textAlignVertical: 'top' }}
        errorText={error}
      />

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <Button
          title="Cancel"
          variant="secondary"
          onPress={onCancel}
          style={{ flex: 1, marginRight: spacing.sm }}
        />
        <Button
          title={submitButtonTitle}
          variant="primary"
          onPress={handleSubmit}
          loading={isSubmitting}
          style={{ flex: 2 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  fieldLabel: {
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  priorityPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    gap: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
  },
  statusText: {
    fontWeight: '700',
  },
  tagHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTagText: {
    fontWeight: '600',
    marginLeft: 2,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
});
