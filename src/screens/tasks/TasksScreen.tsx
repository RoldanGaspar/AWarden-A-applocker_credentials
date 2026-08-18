/**
 * Life OS & Vault - Tasks & Unified Schedule Screen
 * Supports Kanban Board swimlanes, interactive Month Calendar grid, Day Agenda, and Task CRUD
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  CheckSquare,
  LayoutGrid,
  Calendar as CalendarIcon,
  Plus,
  Search,
  Tag as TagIcon,
  X,
  Clock,
  AlertTriangle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Input, Tag, FAB, Modal, EmptyState } from '../../components/ui';
import {
  TaskCard,
  TaskForm,
  BoardView,
  CalendarView,
  DayAgendaModal,
  TaskTagFilterModal,
} from '../../components/tasks';
import { dbService } from '../../services/db';
import { Task, TaskStatus, TaskPriority } from '../../types/models';

export const TasksScreen: React.FC = () => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { masterKey } = useAuth();

  const [activeTab, setActiveTab] = useState<'board' | 'calendar'>('board');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [dueRangeFilter, setDueRangeFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [defaultAddStatus, setDefaultAddStatus] = useState<TaskStatus>('todo');
  const [defaultAddDueDate, setDefaultAddDueDate] = useState<string | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Calendar Day Agenda state
  const [selectedAgendaDate, setSelectedAgendaDate] = useState<string | null>(null);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);

  const loadTasksData = useCallback(async () => {
    if (!masterKey) return;

    try {
      const data = await dbService.getTasks(masterKey, {
        search: searchQuery,
        priority: priorityFilter,
        dueRange: dueRangeFilter,
        tag: selectedTag,
      });

      setTasks(data);
      setCalendarRefreshTrigger((prev) => prev + 1);
    } catch (e) {
      console.warn('Failed to load tasks:', e);
    }
  }, [masterKey, searchQuery, priorityFilter, dueRangeFilter, selectedTag]);

  useFocusEffect(
    useCallback(() => {
      loadTasksData();
    }, [loadTasksData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasksData();
    setRefreshing(false);
  };

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => (t.tags || []).forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [tasks]);

  const handleSaveTask = async (taskData: Omit<Task, 'created_at'>) => {
    if (!masterKey) return;

    if (editingTask) {
      const fullTask: Task = {
        ...taskData,
        created_at: editingTask.created_at,
      };
      await dbService.updateTask(fullTask, masterKey);
    } else {
      await dbService.createTask(taskData, masterKey);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setIsAddModalOpen(false);
    setEditingTask(null);
    await loadTasksData();
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await dbService.updateTaskStatus(taskId, newStatus);
    await loadTasksData();
  };

  const handleDuplicate = async (task: Task) => {
    if (!masterKey) return;
    await dbService.duplicateTask(task.id, masterKey);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await loadTasksData();
  };

  const handleDelete = async (taskId: string) => {
    await dbService.deleteTask(taskId);
    setIsAddModalOpen(false);
    setEditingTask(null);
    await loadTasksData();
  };

  const hasActiveFilters =
    !!searchQuery || priorityFilter !== 'all' || dueRangeFilter !== 'all' || selectedTag !== null;

  const clearAllFilters = () => {
    setSearchQuery('');
    setPriorityFilter('all');
    setDueRangeFilter('all');
    setSelectedTag(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header Controls & View Mode Toggle */}
      <View style={[styles.topBar, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <View style={styles.headerControlsRow}>
          {/* Segmented View Toggle (Board vs Calendar) */}
          <View style={[styles.viewToggle, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveTab('board');
              }}
              style={[
                styles.viewToggleBtn,
                {
                  backgroundColor: activeTab === 'board' ? accent.primary : 'transparent',
                  borderRadius: radius.sm,
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'board' }}
            >
              <LayoutGrid size={16} color={activeTab === 'board' ? '#FFFFFF' : colors.textSecondary} />
              <Text
                style={[
                  styles.viewToggleText,
                  { color: activeTab === 'board' ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
                ]}
              >
                Board View
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveTab('calendar');
              }}
              style={[
                styles.viewToggleBtn,
                {
                  backgroundColor: activeTab === 'calendar' ? accent.primary : 'transparent',
                  borderRadius: radius.sm,
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'calendar' }}
            >
              <CalendarIcon size={16} color={activeTab === 'calendar' ? '#FFFFFF' : colors.textSecondary} />
              <Text
                style={[
                  styles.viewToggleText,
                  { color: activeTab === 'calendar' ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
                ]}
              >
                Calendar View
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tags filter button */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsTagModalVisible(true);
            }}
            style={[
              styles.tagBtn,
              {
                backgroundColor: selectedTag ? accent.primaryBgLight : colors.bgSecondary,
                borderRadius: radius.md,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Filter by Tag"
          >
            <TagIcon size={16} color={selectedTag ? accent.primary : colors.textSecondary} />
            <Text
              style={[
                styles.tagBtnText,
                { color: selectedTag ? accent.primary : colors.textSecondary, fontSize: typography.xs },
              ]}
            >
              {selectedTag || 'Tags'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <Input
          placeholder="Search task titles, details, tags..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={colors.textMuted} />}
          clearable
          containerStyle={{ marginTop: 8, marginBottom: 8 }}
        />

        {/* Filter Chips Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {/* Priority filter */}
          {(['all', 'high', 'medium', 'low'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setPriorityFilter(p);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: priorityFilter === p ? accent.primary : colors.bgSecondary,
                  borderColor: priorityFilter === p ? accent.primary : colors.borderSubtle,
                  borderRadius: radius.full,
                },
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: priorityFilter === p ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
                ]}
              >
                {p === 'all' ? 'All Priorities' : `${p.toUpperCase()} Priority`}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Due range filter */}
          {(['all', 'overdue', 'today', 'upcoming'] as const).map((dr) => (
            <TouchableOpacity
              key={dr}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setDueRangeFilter(dr);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    dueRangeFilter === dr
                      ? dr === 'overdue'
                        ? colors.dangerBg
                        : colors.textPrimary
                      : colors.bgSecondary,
                  borderColor:
                    dueRangeFilter === dr
                      ? dr === 'overdue'
                        ? colors.danger
                        : colors.textPrimary
                      : colors.borderSubtle,
                  borderRadius: radius.full,
                },
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color:
                      dueRangeFilter === dr
                        ? dr === 'overdue'
                          ? colors.danger
                          : colors.bgPrimary
                        : colors.textSecondary,
                    fontSize: typography.xs,
                    fontWeight: dueRangeFilter === dr ? '700' : '600',
                  },
                ]}
              >
                {dr === 'all'
                  ? 'All Deadlines'
                  : dr === 'overdue'
                  ? '⚠️ Overdue'
                  : dr === 'today'
                  ? 'Due Today'
                  : 'Upcoming'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Active Filter Clear Bar */}
        {hasActiveFilters && (
          <View style={styles.activeFilterRow}>
            <Text style={{ color: colors.textTertiary, fontSize: typography.xs }}>
              Filtered ({tasks.length} found)
            </Text>
            <TouchableOpacity
              onPress={clearAllFilters}
              style={styles.clearBtn}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
            >
              <X size={14} color={accent.primary} />
              <Text style={[styles.clearBtnText, { color: accent.primary, fontSize: typography.xs }]}>
                Clear filters
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[styles.mainScroll, { paddingHorizontal: spacing.lg, paddingBottom: 110 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accent.primary}
          />
        }
      >
        {activeTab === 'board' ? (
          <BoardView
            tasks={tasks}
            onAddTask={(status) => {
              setDefaultAddStatus(status);
              setDefaultAddDueDate(new Date().toISOString().split('T')[0]);
              setEditingTask(null);
              setIsAddModalOpen(true);
            }}
            onSelectTask={(task) => {
              setEditingTask(task);
              setIsAddModalOpen(true);
            }}
            onEditTask={(task) => {
              setEditingTask(task);
              setIsAddModalOpen(true);
            }}
            onStatusChange={handleStatusChange}
            onDuplicateTask={handleDuplicate}
            onDeleteTask={handleDelete}
          />
        ) : (
          <CalendarView
            onSelectDate={(dateIso) => setSelectedAgendaDate(dateIso)}
            refreshTrigger={calendarRefreshTrigger}
          />
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <FAB
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setDefaultAddStatus('todo');
          setDefaultAddDueDate(new Date().toISOString().split('T')[0]);
          setEditingTask(null);
          setIsAddModalOpen(true);
        }}
        accessibilityLabel="Create new task"
      />

      {/* 1. Add / Edit Task Modal */}
      <Modal
        visible={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'Create Task'}
        subtitle="Manage workflow deadlines and priorities"
        variant="bottomSheet"
      >
        <TaskForm
          initialTask={editingTask}
          defaultStatus={defaultAddStatus}
          defaultDueDate={defaultAddDueDate}
          onSave={handleSaveTask}
          onCancel={() => {
            setIsAddModalOpen(false);
            setEditingTask(null);
          }}
          submitButtonTitle={editingTask ? 'Save Changes' : 'Create Task'}
        />
      </Modal>

      {/* 2. Day Agenda Modal */}
      <DayAgendaModal
        visible={!!selectedAgendaDate}
        date={selectedAgendaDate}
        onClose={() => setSelectedAgendaDate(null)}
        onAddTaskForDate={(dateIso) => {
          setSelectedAgendaDate(null);
          setDefaultAddStatus('todo');
          setDefaultAddDueDate(dateIso);
          setEditingTask(null);
          setIsAddModalOpen(true);
        }}
        onSelectTask={(task) => {
          setSelectedAgendaDate(null);
          setEditingTask(task);
          setIsAddModalOpen(true);
        }}
        onEditTask={(task) => {
          setSelectedAgendaDate(null);
          setEditingTask(task);
          setIsAddModalOpen(true);
        }}
        onStatusChange={handleStatusChange}
        onDuplicateTask={handleDuplicate}
        onDeleteTask={handleDelete}
      />

      {/* 3. Task Tag Filter Modal */}
      <TaskTagFilterModal
        visible={isTagModalVisible}
        onClose={() => setIsTagModalVisible(false)}
        availableTags={availableTags}
        selectedTag={selectedTag}
        onSelectTag={(tag) => setSelectedTag(tag)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingBottom: 4,
  },
  headerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  viewToggle: {
    flexDirection: 'row',
    padding: 3,
  },
  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  viewToggleText: {
    fontWeight: '700',
  },
  tagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  tagBtnText: {
    fontWeight: '600',
  },
  filtersScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  filterChipText: {
    fontWeight: '600',
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearBtnText: {
    fontWeight: '600',
  },
  mainScroll: {
    paddingTop: 4,
  },
});

export default TasksScreen;
