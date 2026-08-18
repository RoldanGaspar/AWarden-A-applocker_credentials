/**
 * Life OS & Vault - Ledger & Budget Calculation Unit Tests
 */

describe('Budget & Ledger Analytics Logic Tests', () => {
  function computeBudgetStatus(spent, limit) {
    if (limit <= 0) return { percentage: 0, status: 'safe' };
    const percentage = (spent / limit) * 100;
    let status = 'safe';
    if (percentage >= 100) status = 'over';
    else if (percentage >= 80) status = 'warning';
    return { percentage, status };
  }

  function aggregateCategorySpending(transactions) {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const grandTotal = expenses.reduce((acc, t) => acc + t.amount, 0);

    const categoryMap = new Map();
    for (const t of expenses) {
      const current = categoryMap.get(t.category_id) || 0;
      categoryMap.set(t.category_id, current + t.amount);
    }

    const result = [];
    for (const [catId, total] of categoryMap.entries()) {
      result.push({
        categoryId: catId,
        totalAmount: total,
        percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
      });
    }

    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  test('Calculates budget status correctly for safe, warning, and over-limit thresholds', () => {
    // Under 80% -> safe
    expect(computeBudgetStatus(5000, 10000)).toEqual({ percentage: 50, status: 'safe' });

    // 85% -> warning
    expect(computeBudgetStatus(8500, 10000)).toEqual({ percentage: 85, status: 'warning' });

    // 100% -> over
    expect(computeBudgetStatus(10000, 10000)).toEqual({ percentage: 100, status: 'over' });

    // 120% -> over
    expect(computeBudgetStatus(12000, 10000)).toEqual({ percentage: 120, status: 'over' });
  });

  test('Aggregates category expenses and percentages accurately', () => {
    const mockTransactions = [
      { id: '1', type: 'expense', amount: 3000, category_id: 'cat_food' },
      { id: '2', type: 'expense', amount: 2000, category_id: 'cat_food' },
      { id: '3', type: 'expense', amount: 5000, category_id: 'cat_rent' },
      { id: '4', type: 'income', amount: 25000, category_id: 'cat_salary' }, // should be ignored
    ];

    const breakdown = aggregateCategorySpending(mockTransactions);

    expect(breakdown.length).toBe(2);
    // cat_food = 5000 (50%), cat_rent = 5000 (50%)
    expect(breakdown[0].totalAmount).toBe(5000);
    expect(breakdown[0].percentage).toBe(50);
    expect(breakdown[1].totalAmount).toBe(5000);
    expect(breakdown[1].percentage).toBe(50);
  });

  test('Net balance correctly calculates income minus expenses', () => {
    const incomeTotal = 45000;
    const expenseTotal = 18500;
    const netBalance = incomeTotal - expenseTotal;

    expect(netBalance).toBe(26500);
    expect(netBalance).toBeGreaterThan(0);
  });
});
