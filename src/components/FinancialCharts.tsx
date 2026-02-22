import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import type { Transaction } from '../hooks/useTransactions';

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7',
  '#eab308', '#64748b', '#78716c', '#3b82f6', '#22c55e',
];

function getCategoryName(txn: Transaction): string {
  if (typeof txn.category === 'object' && txn.category !== null && 'name' in txn.category) {
    return (txn.category as { name: string }).name;
  }
  return 'Sem categoria';
}

function groupByCategory(transactions: Transaction[]): [string, number][] {
  const map = new Map<string, number>();
  for (const tx of transactions) {
    const name = getCategoryName(tx);
    map.set(name, (map.get(name) || 0) + tx.amount);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function buildPieData(categories: [string, number][]): Array<{ value: number; color: string; text?: string }> {
  return categories.map(([name, amount], i) => ({
    value: amount,
    color: COLORS[i % COLORS.length],
    text: name,
  }));
}

function buildBarData(categories: [string, number][]): Array<{ value: number; label: string; frontColor: string }> {
  return categories.map(([name, amount], i) => ({
    value: amount,
    label: name,
    frontColor: COLORS[i % COLORS.length],
  }));
}

const chartWidth = Dimensions.get('window').width - 32;
const pieRadius = Math.min(90, (chartWidth / 2 - 24) / 2);

export interface FinancialChartsProps {
  transactions: Transaction[];
  incomeTotal: number;
  expenseTotal: number;
  theme: { colors: { textPrimary: string; textSecondary: string; surface: string; gray300: string } };
  t: {
    analytics: {
      income: string;
      expenses: string;
      expensesByCategory: string;
      noTransactions: string;
    };
  };
  formatCurrency: (amount: number, currencyCode: string, locale: string) => string;
  currencyCode: string;
  locale: string;
  selectedMonth: number;
  selectedYear: number;
}

export function FinancialCharts({
  transactions,
  incomeTotal,
  expenseTotal,
  theme,
  t,
  formatCurrency,
  currencyCode,
  locale,
  selectedMonth,
  selectedYear,
}: FinancialChartsProps) {
  const income = transactions.filter((tx) => tx.type === 'income');
  const expense = transactions.filter((tx) => tx.type === 'expense');
  const incomeByCategory = groupByCategory(income);
  const expenseByCategory = groupByCategory(expense);
  const allExpenseCategories = expenseByCategory;

  const monthLabel = new Date(selectedYear, selectedMonth - 1).toLocaleDateString(
    locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US',
    { month: 'long', year: 'numeric' }
  );

  if (transactions.length === 0) {
    return (
      <View style={[styles.emptyState, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {t.analytics.noTransactions} {monthLabel}
        </Text>
      </View>
    );
  }

  const incomePieData = buildPieData(incomeByCategory);
  const expensePieData = buildPieData(expenseByCategory);
  const barData = buildBarData(allExpenseCategories);

  return (
    <>
      <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
        <View style={styles.pieRow}>
          {incomeByCategory.length > 0 && (
            <View style={styles.pieBlock}>
              <Text style={[styles.pieLabel, { color: theme.colors.textPrimary }]}>{t.analytics.income}</Text>
              <View style={styles.pieContainer}>
                <PieChart
                  data={incomePieData}
                  radius={pieRadius}
                  showText={false}
                  focusOnPress
                  donut={false}
                />
              </View>
              <View style={styles.legendContainer}>
                {incomeByCategory.map(([name, amount], i) => (
                  <View key={name} style={styles.legendItem}>
                    <View style={[styles.colorBox, { backgroundColor: COLORS[i % COLORS.length] }]} />
                    <Text style={[styles.legendName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{name}</Text>
                    <Text style={[styles.legendValue, { color: theme.colors.textSecondary }]}>
                      {incomeTotal > 0 ? Math.round((amount / incomeTotal) * 100) : 0}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {expenseByCategory.length > 0 && (
            <View style={styles.pieBlock}>
              <Text style={[styles.pieLabel, { color: theme.colors.textPrimary }]}>{t.analytics.expenses}</Text>
              <View style={styles.pieContainer}>
                <PieChart
                  data={expensePieData}
                  radius={pieRadius}
                  showText={false}
                  focusOnPress
                  donut={false}
                />
              </View>
              <View style={styles.legendContainer}>
                {expenseByCategory.map(([name, amount], i) => (
                  <View key={name} style={styles.legendItem}>
                    <View style={[styles.colorBox, { backgroundColor: COLORS[i % COLORS.length] }]} />
                    <Text style={[styles.legendName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{name}</Text>
                    <Text style={[styles.legendValue, { color: theme.colors.textSecondary }]}>
                      {expenseTotal > 0 ? Math.round((amount / expenseTotal) * 100) : 0}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.totalsRow}>
          <View style={[styles.totalChip, styles.totalChipIncome]}>
            <Text style={styles.totalChipText}>
              {t.analytics.income}: {formatCurrency(incomeTotal, currencyCode, locale)}
            </Text>
          </View>
          <View style={[styles.totalChip, styles.totalChipExpense]}>
            <Text style={styles.totalChipText}>
              {t.analytics.expenses}: {formatCurrency(expenseTotal, currencyCode, locale)}
            </Text>
          </View>
        </View>
      </View>

      {allExpenseCategories.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
          <Text style={[styles.chartCardTitle, { color: theme.colors.textPrimary }]}>
            {t.analytics.expensesByCategory}
          </Text>
          <View style={styles.barContainer}>
            <BarChart
              data={barData}
              horizontal
              barWidth={22}
              spacing={12}
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              noOfSections={4}
              maxValue={Math.max(...barData.map((d) => d.value), 1) * 1.1}
              width={chartWidth}
              containerHeight={Math.max(120, barData.length * 36)}
              yAxisLabelWidth={60}
              showFractionalValues={false}
            />
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  chartCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  pieRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  pieBlock: {
    alignItems: 'center',
    marginBottom: 12,
  },
  pieLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    marginTop: 8,
    width: '100%',
    maxWidth: 140,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  colorBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 6,
  },
  legendName: {
    flex: 1,
    fontSize: 12,
  },
  legendValue: {
    fontSize: 12,
    marginLeft: 4,
  },
  totalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  totalChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  totalChipIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  totalChipExpense: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  totalChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chartCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  barContainer: {
    marginLeft: 0,
    overflow: 'hidden',
  },
});
