/**
 * Life OS & Vault - Kanban Board View Component
 * Multi-lane Kanban workflow displaying To Do, In Progress, and Completed swimlanes
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Swimlane } from './Swimlane';
import { Task, TaskStatus } from '../../types/models';

export interface BoardViewProps {
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onSelectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDuplicateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  tasks,
  onAddTask,
  onSelectTask,
  onEditTask,
  onStatusChange,
  onDuplicateTask,
  onDeleteTask,
}) => {
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Swimlane
        status="todo"
        title="To Do"
        tasks={todoTasks}
        onAddTask={onAddTask}
        onSelectTask={onSelectTask}
        onEditTask={onEditTask}
        onStatusChange={onStatusChange}
        onDuplicateTask={onDuplicateTask}
        onDeleteTask={onDeleteTask}
      />

      <Swimlane
        status="in_progress"
        title="In Progress"
        tasks={inProgressTasks}
        onAddTask={onAddTask}
        onSelectTask={onSelectTask}
        onEditTask={onEditTask}
        onStatusChange={onStatusChange}
        onDuplicateTask={onDuplicateTask}
        onDeleteTask={onDeleteTask}
      />

      <Swimlane
        status="completed"
        title="Completed"
        tasks={completedTasks}
        onAddTask={onAddTask}
        onSelectTask={onSelectTask}
        onEditTask={onEditTask}
        onStatusChange={onStatusChange}
        onDuplicateTask={onDuplicateTask}
        onDeleteTask={onDeleteTask}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
});
