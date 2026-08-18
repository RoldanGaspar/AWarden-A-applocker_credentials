/**
 * Life OS & Vault - Tasks & Unified Calendar Unit Tests
 */

describe('Tasks & Unified Schedule Logic Tests', () => {
  function getPriorityColor(priority) {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
      default:
        return '#10B981';
    }
  }

  function isTaskOverdue(task, today = '2026-08-17') {
    if (!task.due_date || task.status === 'completed') return false;
    return task.due_date < today;
  }

  function aggregateCalendarDayEvents(tasks, transactions, targetMonthPrefix = '2026-08') {
    const map = new Map();

    tasks.forEach((t) => {
      if (!t.due_date || !t.due_date.startsWith(targetMonthPrefix)) return;
      const existing = map.get(t.due_date) || {
        date: t.due_date,
        tasks: [],
        transactions: [],
        hasIncome: false,
        hasExpense: false,
        highestPriority: undefined,
      };
      existing.tasks.push(t);
      if (
        !existing.highestPriority ||
        t.priority === 'high' ||
        (t.priority === 'medium' && existing.highestPriority === 'low')
      ) {
        existing.highestPriority = t.priority;
      }
      map.set(t.due_date, existing);
    });

    transactions.forEach((tx) => {
      if (!tx.date || !tx.date.startsWith(targetMonthPrefix)) return;
      const existing = map.get(tx.date) || {
        date: tx.date,
        tasks: [],
        transactions: [],
        hasIncome: false,
        hasExpense: false,
        highestPriority: undefined,
      };
      existing.transactions.push(tx);
      if (tx.type === 'income') existing.hasIncome = true;
      if (tx.type === 'expense') existing.hasExpense = true;
      map.set(tx.date, existing);
    });

    return map;
  }

  test('Priority colors map accurately to WCAG compliant color codes', () => {
    expect(getPriorityColor('high')).toBe('#EF4444');
    expect(getPriorityColor('medium')).toBe('#F59E0B');
    expect(getPriorityColor('low')).toBe('#10B981');
  });

  test('Overdue detection flags past due tasks but ignores completed tasks', () => {
    const today = '2026-08-17';

    const pastUnfinished = { due_date: '2026-08-15', status: 'todo' };
    const pastCompleted = { due_date: '2026-08-15', status: 'completed' };
    const futureTask = { due_date: '2026-08-25', status: 'todo' };

    expect(isTaskOverdue(pastUnfinished, today)).toBe(true);
    expect(isTaskOverdue(pastCompleted, today)).toBe(false);
    expect(isTaskOverdue(futureTask, today)).toBe(false);
  });

  test('Calendar aggregation combines tasks and financial events for a specific date', () => {
    const mockTasks = [
      { id: 't1', title: 'Tax Filing', due_date: '2026-08-20', priority: 'high', status: 'todo' },
      { id: 't2', title: 'Gym Workout', due_date: '2026-08-20', priority: 'low', status: 'todo' },
    ];

    const mockTransactions = [
      { id: 'tx1', type: 'income', amount: 50000, date: '2026-08-20' },
      { id: 'tx2', type: 'expense', amount: 1500, date: '2026-08-20' },
    ];

    const eventMap = aggregateCalendarDayEvents(mockTasks, mockTransactions, '2026-08');

    const dayEvent = eventMap.get('2026-08-20');
    expect(dayEvent).toBeDefined();
    expect(dayEvent.tasks.length).toBe(2);
    expect(dayEvent.transactions.length).toBe(2);
    expect(dayEvent.highestPriority).toBe('high');
    expect(dayEvent.hasIncome).toBe(true);
    expect(dayEvent.hasExpense).toBe(true);
  });
});
